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
    
    def join_game(self, player_id: int, game_id: str) -> None:
        EXPIRY_TIME = settings.gameroom_expiry_time
        self.redis.set(player_id, game_id)
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
            'round': 1,
            'location': json.dumps(location),
            'player_ids': [],
            'teams': []
        }
        pipe = self.redis.pipeline()
        for p in players:
            self.join_game(p['id'], game_id)
            team_key = f"{game_id}:teams:{p['team']}"
            if not p['team'] in game_mapping['teams']:
                game_mapping['teams'].append(p['team'])
            game_mapping['player_ids'].append(p['id'])
            player_key = f'{game_id}:players:{p["id"]}'
            t_players = self.redis.hget(team_key, 'players')
            if t_players:
                t_players = json.loads(t_players)
            else:
                t_players = []
            t_players.append(p['id'])
            t_health = STARTING_HEALTH // len(t_players)
            pipe.hset(team_key, mapping={
                'players': json.dumps(t_players),
                'name': p['team'],
                'health': t_health,
                'score': 0,
                'distance': 0
            })
            pipe.hset(player_key, mapping={
                'id': p['id'],
                'guess': json.dumps(None),
                'team': p['team'],
                'is_connected': json.dumps(True),
            })
            pipe.expire(player_key, EXPIRY_TIME)
            pipe.expire(team_key, EXPIRY_TIME)

        game_mapping['player_ids'] = json.dumps(game_mapping['player_ids'])
        game_mapping['teams'] = json.dumps(game_mapping['teams'])
        pipe.hset(game_id, mapping=game_mapping)
        pipe.expire(game_id, EXPIRY_TIME)
        pipe.execute()
        return game_id
    
    def get_game(self, game_id: str) -> dict:
        return self.redis.hgetall(game_id)

    def get_player(self, game_id: str, player_id: int) -> dict:
        return self.redis.hgetall(f'{game_id}:players:{player_id}')
    
    def set_player_key(self, game_id: str, player_id: int, key: str, value: Any) -> Any:
        self.redis.hset(f'{game_id}:players:{player_id}', key, json.dumps(value))
        self.update_game_expiry(game_id)
        return value
    
    def set_team_key(self, game_id: str, team_name: str, key: str, value: Any) -> Any:
        self.redis.hset(f'{game_id}:teams:{team_name}', key, json.dumps(value))
        self.update_game_expiry(game_id)
        return value
    
    def get_team_average_score(self, game_id: str, team_name: str):
        scores = []
        team = self.get_team(game_id, team_name)
        team['players'] = json.loads(team['players'])
        game = self.get_game(game_id)
        for p in team['players']:
            player = self.get_player(game_id, p)
            player['guess'] = json.loads(player['guess'])
            if not player['guess']:
                continue
            player['id'] = json.loads(player['id'])
            distance = calculate_line_distance(json.loads(game['location']), player['guess'])
            score = calculate_score(distance)
            scores.append(score)
        avg_score = sum(scores) // (len(scores) or 1)
        return avg_score

    def get_winning_team(self, game_id: str) -> dict:
        teams = self.get_teams(game_id)
        
        winning_team = None
        highest_score = float('-inf')

        for team in teams:
            avg_score = self.get_team_average_score(game_id, team['name'])
            if avg_score > highest_score:
                highest_score = avg_score
                winning_team = team
                
        return winning_team
    
    def get_team(self, game_id: str, team_name: str) -> dict:
        return self.redis.hgetall(f'{game_id}:teams:{team_name}')
    
    def get_teams(self, game_id: str) -> dict[str, list]:
        game = self.get_game(game_id)
        teams = []
        for t in json.loads(game['teams']):
            t = self.get_team(game_id, t)
            t['players'] = json.loads(t['players'])
            for i in range(len(t['players'])):
                t['players'][i] = self.get_player(game_id, t['players'][i])
                t['players'][i]['guess'] = json.loads(t['players'][i]['guess'])
                if not t['players'][i]['guess']:
                    continue
                t['players'][i]['id'] = json.loads(t['players'][i]['id'])
            t['health'] = json.loads(t['health'])
            t['score'] = json.loads(t['score'])
            t['distance'] = json.loads(t['distance'])
            teams.append(t)
        return teams
    
    def all_players_submitted(self, game_id: str) -> bool:
        players = self.get_player_ids(game_id)
        for p in players:
            if not json.loads(self.redis.hget(f'{game_id}:players:{p}', 'guess')):
                return False
        return True
    
    def submit_guess(self, game_id: str, player_id: int, guess: dict):
        if not player_id in self.get_player_ids(game_id):
            raise ValueError(f'Player with id {player_id} does not belong to this game!')
        
        self.redis.hset(f'{game_id}:players:{player_id}', 'guess', json.dumps(guess))
        self.update_game_expiry(game_id)
    
    def get_player_ids(self, game_id: str) -> list[int]:
        '''
        A helper function used to get player ids to get all player hashes
        
        :param game_id: redis game key
        :type game_id: str
        :return: A list of player ids(db primary keys)
        :rtype: list[int]
        '''
        player_ids = self.redis.hget(game_id, 'player_ids')
        return json.loads(player_ids)
    
    def update_game_expiry(self, game_id: str, expiry_time: int = None) -> None:
        '''
        Updates game and all game-related data, i.e. gameroom:players, expiry time
        
        :param game_id: redis game key
        :type game_id: str
        :param expiry_time: expiry time. If not provided, `settings.gameroom_expiry_time` is used instead
        :type expiry_time: int
        '''
        EXPIRY_TIME = expiry_time or settings.gameroom_expiry_time
        player_ids = self.get_player_ids(game_id)
        pipe = self.redis.pipeline()
        teams = json.loads(self.get_game(game_id)['teams'])
        for p in player_ids:
            pipe.expire(f'{game_id}:players:{p}', EXPIRY_TIME)
            pipe.expire(p, EXPIRY_TIME)
        for t in teams:
            pipe.expire(t, EXPIRY_TIME)
        pipe.expire(game_id, EXPIRY_TIME)
        pipe.execute()
    
    def set_team_health(self, game_id: str, team_name: str, health: int) -> None:
        '''
        Sets health for team with id `team_name`
        
        :param game_id: redis game key
        :type game_id: str
        :param team_name: team name
        :type team_name: str
        :param health: A new health amount
        :type health: int
        '''
        self.redis.hset(f'{game_id}:teams:{team_name}', 'health', health)
        self.update_game_expiry(game_id)
        return health
    
    def move_next_round(self, game_id: str) -> int:
        '''
        Increments current round and selects a new location.
        Also, it resets all submitted_guess values to `False`
        
        :param game_id: redis game key
        :type game_id: str
        :return: new game round
        :rtype: int
        '''
        curr_round = int(self.redis.hget(game_id, 'round'))
        curr_round += 1
        new_location = json.dumps(get_random_location())
        self.redis.hset(game_id, 'round', curr_round)
        self.redis.hset(game_id, 'location', new_location)
        players = self.get_player_ids(game_id)
        for p in players:
            self.redis.hset(f'{game_id}:players:{p}', 'guess', json.dumps(None))
        self.update_game_expiry(game_id)
        return curr_round

    def end_game(self, game_id: str) -> None:
        '''
        Delets gameroom:`game_id` and all related data, i.e. gameroom:`game_id`:players:*
        
        :param game_id: redis game key
        :type game_id: str
        '''
        player_ids = self.get_player_ids(game_id)
        pipe = self.redis.pipeline()
        game = self.get_game(game_id)
        players = [f'{game_id}:players:{p}' for p in player_ids]
        player_games = [p for p in player_ids]
        teams = [f'{game_id}:teams:{t}' for t in json.loads(game['teams'])]
        pipe.delete(*players, *teams, *player_games)
        pipe.delete(game_id)
        pipe.execute()