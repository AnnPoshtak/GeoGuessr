import uuid
from flask import current_app
from .util import get_random_location
import json
from redis import Redis
from .redis_repository import RedisRepository

class GameRoomRepository(RedisRepository):
    '''
    A class used to interact with redis to create game rooms.
    It only handles setting/getting data from redis.
    GameRoomRepository can be created when at least two players are ready to start a game.
    It stores current round, location, player team and health.
    Scores and damage calculation have to be done externally.
    '''
    def __init__(self, redis: Redis):
        super().__init__(redis=redis, key='gameroom')

    def create_game(self, players: list[dict]) -> str: 
        '''
        Creates a game inside redis. It stores current round, location and players participating in it
        
        :param players: A list of dictionaries with 'id', a player primary key from db and 'team', which has to be a string keys
        :type players: list[dict]
        :return: A key to access the game in redis
        :rtype: str
        '''
        with current_app.app_context():
            EXPIRY_TIME = current_app.config.get('GAMEROOM_EXPIRY_TIME', 86400)
            MIN_PLAYERS = current_app.config.get('MIN_PLAYERS', 2)
            STARTING_HEALTH = current_app.config.get('STARTING_PLAYER_HEALTH', 5000)
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
            'player_ids': []
        }
        pipe = self.redis.pipeline()
        for p in players:
            pl_dict = {
                'id': p['id'],
                'health': STARTING_HEALTH,
                'submitted_guess': json.dumps(False),
                'team': p['team']
            }
            game_mapping['player_ids'].append(p['id'])
            player_key = f'{game_key}:players:{p["id"]}'
            pipe.hset(player_key, mapping=pl_dict)
            pipe.expire(player_key, EXPIRY_TIME)
        game_mapping['player_ids'] = json.dumps(game_mapping['player_ids'])
        pipe.hset(game_key, mapping=game_mapping)
        pipe.expire(game_key, EXPIRY_TIME)
        pipe.execute()
        return game_key
    
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
        :param expiry_time: expiry time. If not provided, `app.config['GAMEROOM_EXPIRY_TIME']` is used instead
        :type expiry_time: int
        '''
        with current_app.app_context():
            EXPIRY_TIME = expiry_time or current_app.config.get('GAMEROOM_EXPIRY_TIME', 86400)
        player_ids = self.get_player_ids(game_id)
        pipe = self.redis.pipeline()
        for p in player_ids:
            pipe.expire(f'{game_id}:players:{p}', EXPIRY_TIME)
        pipe.expire(game_id, time=EXPIRY_TIME)
        pipe.execute()
    
    def set_player_health(self, game_id: str, player_id: int, health: int) -> None:
        '''
        Sets health for player with id `player_id`
        
        :param game_id: redis game key
        :type game_id: str
        :param player_id: player's primary key from db
        :type player_id: int
        :param health: A new health amount
        :type health: int
        '''
        self.redis.hset(f'{game_id}:players:{player_id}', 'health', health)
        self.update_game_expiry(game_id)
    
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
            self.redis.hset(f'{game_id}:players:{p}', 'submitted_guess', json.dumps(False))
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
        players = [f'{game_id}:players:{p}' for p in player_ids]
        pipe.delete(*players)
        pipe.execute()
        self.redis.delete(game_id)