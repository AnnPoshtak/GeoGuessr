import uuid
from app.config import settings
from .util import get_random_location, calculate_line_distance, calculate_score
import json
from redis import Redis
from .redis_repository import RedisRepository
from typing import Any

class GameRoomRepository(RedisRepository):
    '''
    A class used to interact with redis to create game rooms.
    It only handles setting/getting data from redis.
    GameRoomRepository can be created when at least two players are ready to start a game.
    It stores current round, location and players.
    Scores and damage calculation have to be done externally.
    '''
    def __init__(self, redis: Redis):
        super().__init__(redis=redis, key='gameroom')

    def get_current_game(self, player_id: int) -> str | None:
        return self.redis.get(player_id)
    
    def join_game(self, player_id: int, game_key: str) -> None:
        EXPIRY_TIME = settings.gameroom_expiry_time
        self.redis.set(player_id, game_key)
        self.redis.delete(f'{player_id}:queue')
        self.redis.expire(player_id, EXPIRY_TIME)

    def create_game(self, players: list[dict]) -> str: 
        '''
        Creates a game inside redis. It stores current round, location and players participating in it
        
        :param players: A list of dictionaries with 'id', a player primary key from db and 'team', which has to be a string keys
        :type players: list[dict]
        :return: A key to access the game in redis
        :rtype: str
        '''
        EXPIRY_TIME = settings.gameroom_expiry_time
        MIN_PLAYERS = settings.min_players
        STARTING_HEALTH = settings.starting_player_health
        if len(set([p['team'] for p in players])) < 2:
            raise ValueError('At least 2 teams must have at least one player!')
        if len(players) < MIN_PLAYERS:
            raise ValueError(f'players length must be at least {MIN_PLAYERS}!')
        game_id = uuid.uuid4().hex
        game_key = f'{self.key}:{game_id}'
        
        location = get_random_location()
        game_mapping = {
            'id': game_id,
            'key': game_key,
            'round': 1,
            'target': location,
            'player_ids': [],
            'teams': []
        }
        pipe = self.redis.pipeline()
        for p in players:
            self.join_game(p['id'], game_key)
            team_key = f"{game_key}:teams:{p['team']}"
            if not p['team'] in game_mapping['teams']:
                game_mapping['teams'].append(p['team'])
            game_mapping['player_ids'].append(p['id'])
            player_key = f'{game_key}:players:{p["id"]}'
            t_players = self.redis.json().get(team_key, 'players')
            if t_players is None:
                t_players = []
            t_players.append(p['id'])
            t_health = STARTING_HEALTH // len(t_players)
            pipe.json().set(team_key, '$', {
                'players': t_players,
                'name': p['team'],
                'health': t_health,
                'score': 0,
                'distance': 0,
            })
            pipe.json().set(player_key, '$', {
                'id': p['id'],
                'guess': None,
                'team': p['team'],
                'is_connected': True,
            })
            pipe.expire(player_key, EXPIRY_TIME)
            pipe.expire(team_key, EXPIRY_TIME)

        pipe.json().set(game_key, '$', game_mapping)
        pipe.expire(game_key, EXPIRY_TIME)
        pipe.execute()
        return game_key
    
    def get_game(self, game_key: str) -> dict:
        return self.redis.json().get(game_key)

    def get_player(self, game_key: str, player_id: int) -> dict:
        return self.redis.json().get(f'{game_key}:players:{player_id}')
    
    def set_player_key(self, game_key: str, player_id: int, key: str, value: Any) -> Any:
        self.redis.json().set(f'{game_key}:players:{player_id}', f'{key}', value)
        self.update_game_expiry(game_key)
        return value
    
    def set_team_key(self, game_key: str, team_name: str, key: str, value: Any) -> Any:
        self.redis.json().set(f'{game_key}:teams:{team_name}', key, value)
        self.update_game_expiry(game_key)
        return value
    
    def get_player_score(self, game_key: str, player_id: int):
        game = self.get_game(game_key)
        player = self.get_player(game_key, player_id)
        if self._is_null(player['guess']):
            return 0
        distance = calculate_line_distance(game['target'], player['guess'])
        score = calculate_score(distance)
        return score
    
    def get_scores(self, game_key: str) -> dict:
        result = {}
        for i in self.get_player_ids(game_key):
            score = self.get_player_score(game_key, i)
            result[i] = score
        return result
    
    def get_team_average_score(self, game_key: str, team_name: str):
        scores = []
        team = self.get_team(game_key, team_name)
        # players = list of player ids
        for p in team['players']:
            player = self.get_player(game_key, p)
            if self._is_null(player['guess']):
                continue
            score = self.get_player_score(game_key, p)
            scores.append(score)
        avg_score = sum(scores) // (len(scores) or 1)
        return avg_score

    def get_winning_team(self, game_key: str, teams: list[dict] = []) -> dict:
        '''
        :args:
        game_key: game id
        teams: list of teams from which to choose. Used to exclude the team that is technically defeated
        '''
        if not teams:
            teams = self.get_teams(game_key)
        
        winning_team = None
        highest_score = float('-inf')

        for team in teams:
            avg_score = self.get_team_average_score(game_key, team['name'])
            if avg_score > highest_score:
                highest_score = avg_score
                winning_team = team
                
        return winning_team
    
    def get_team(self, game_key: str, team_name: str) -> dict:
        return self.redis.json().get(f'{game_key}:teams:{team_name}')
    
    def get_teams(self, game_key: str) -> dict[str, list]:
        game = self.get_game(game_key)
        teams = []
        for t in game['teams']:
            t = self.get_team(game_key, t)
            for i in range(len(t['players'])):
                t['players'][i] = self.get_player(game_key, t['players'][i])
                if self._is_null(t['players'][i]['guess']):
                    continue
            teams.append(t)
        return teams
    
    def player_submitted(self, game_key: str, player_id: int) -> bool:
        return not self._is_null(self.redis.json().get(f'{game_key}:players:{player_id}', 'guess'))
    
    def team_submitted(self, game_key: str, team_name: str) -> bool:
        team = self.get_team(game_key, team_name)
        for p in team['players']:
            if not self.player_submitted(game_key, p):
                return False
        return True

    def all_players_submitted(self, game_key: str) -> bool:
        players = self.get_player_ids(game_key)
        for p in players:
            if not self.player_submitted(game_key, p):
                return False
        return True
    
    def set_guess(self, game_key: str, player_id: int, guess: dict):
        if not player_id in self.get_player_ids(game_key):
            raise ValueError(f'Player with id {player_id} does not belong to this game!')
        
        self.redis.json().set(f'{game_key}:players:{player_id}', 'guess', guess)
        self.update_game_expiry(game_key)
    
    def get_player_ids(self, game_key: str) -> list[int]:
        '''
        A helper function used to get player ids to get all player hashes
        
        :param game_key: redis game key
        :type game_key: str
        :return: A list of player ids(db primary keys)
        :rtype: list[int]
        '''
        player_ids = self.redis.json().get(game_key, 'player_ids')
        return player_ids
    
    def update_game_expiry(self, game_key: str, expiry_time: int = None) -> None:
        '''
        Updates game and all game-related data, i.e. gameroom:players, expiry time
        
        :param game_key: redis game key
        :type game_key: str
        :param expiry_time: expiry time. If not provided, `settings.gameroom_expiry_time` is used instead
        :type expiry_time: int
        '''
        EXPIRY_TIME = expiry_time or settings.gameroom_expiry_time
        player_ids = self.get_player_ids(game_key)
        pipe = self.redis.pipeline()
        teams = self.get_game(game_key)['teams']
        for p in player_ids:
            pipe.expire(f'{game_key}:players:{p}', EXPIRY_TIME)
            pipe.expire(p, EXPIRY_TIME)
        for t in teams:
            pipe.expire(t, EXPIRY_TIME)
        pipe.expire(game_key, EXPIRY_TIME)
        pipe.execute()
    
    def set_team_health(self, game_key: str, team_name: str, health: int) -> None:
        '''
        Sets health for team with id `team_name`
        
        :param game_key: redis game key
        :type game_key: str
        :param team_name: team name
        :type team_name: str
        :param health: A new health amount
        :type health: int
        '''
        self.redis.json().set(f'{game_key}:teams:{team_name}', 'health', health)
        self.update_game_expiry(game_key)
        return health
    
    def move_next_round(self, game_key: str) -> int:
        '''
        Increments current round and selects a new location.
        Also, it resets all guesses values to `False`
        
        :param game_key: redis game key
        :type game_key: str
        :return: new game round
        :rtype: int
        '''
        curr_round = self.redis.json().get(game_key, 'round')
        curr_round += 1
        new_location = get_random_location()
        self.redis.json().set(game_key, 'round', curr_round)
        self.redis.json().set(game_key, 'target', new_location)
        players = self.get_player_ids(game_key)
        for p in players:
            self.redis.json().set(f'{game_key}:players:{p}', 'guess', None)
        self.update_game_expiry(game_key)
        return curr_round
    
    def get_temp_target(self, game_key: str) -> dict | None:
        return self.redis.json().get(f'{game_key}:temp_target')
    
    def get_temp_target_ttl(self, game_key: str) -> float | None:
        ttl = self.redis.ttl(f'{game_key}:temp_target')
        return ttl if ttl >= 0 else None
    
    def set_temp_target(self, game_key: str) -> dict:
        '''Sets a temprorary target which is returned between the round callbacks'''
        target = self.get_game(game_key)['target']
        self.redis.json().set(f'{game_key}:temp_target', '$', target)
        self.redis.expire(f'{game_key}:temp_target', settings.round_automove_cooldown)
        return target

    def end_game(self, game_key: str) -> None:
        player_ids = self.get_player_ids(game_key)
        pipe = self.redis.pipeline()
        game = self.get_game(game_key)
        [pipe.json().delete(f'{game_key}:players:{p}', '$') for p in player_ids]
        [pipe.delete(p) for p in player_ids]
        [pipe.json().delete(f'{game_key}:teams:{t}', '$') for t in game['teams']]
        pipe.delete(game_key)
        pipe.execute()