from app.core.util import validate_player_count
from flask import current_app
import random
import numpy as np
from redis import Redis
from .redis_repository import RedisRepository

class GameQueueRepository(RedisRepository):
    '''
    A class used to handle matchmaking logic. Used only to make redis interactions.
    Allows to join and leave queues. 
    Also handles room creation logic when queue has enough players to start a game
    '''
    def __init__(self, redis: Redis):
        super().__init__(redis=redis, key='gamequeue')
        self.players_key = f'{self.key}:all_players'

    def get_queue(self, identifier: str | int) -> list:
        '''
        A helper function used to acces the game queue
        
        :param identifier: can be either queue key or player count
        :type identifier: str | int
        :return: all players in the queue
        :rtype: list
        '''
        if isinstance(identifier, int):
            key = self.get_queue_key(identifier)
        else:
            key = identifier
        return self.redis.lrange(key, 0, -1)
    
    
    def is_player_in_queue(self, player_id: int) -> bool:
        '''Returns `True` if player is in a queue'''
        q = self.get_all_players_in_queues()
        return str(player_id) in q or player_id in q
    
    def get_all_players_in_queues(self) -> list:
        return self.redis.smembers(self.players_key)
    
    def get_queue_key(self, player_count: int) -> str:
        '''A helper function used to get a queue key for `player_count`'''
        validate_player_count(player_count)
        return f'{self.key}:{player_count}'
    
    def get_all_queue_keys(self, ) -> list[str]:
        '''Returns all queues'''
        res = []
        with current_app.app_context():
            player_count = current_app.config['GAME_PLAYERCOUNT']
        for p_c in player_count:
            res.append(self.get_queue_key(p_c))
        
        return res

    def join_queue(self, player_id: int, player_count: int) -> None | str:
        '''
        Joins player `player_id` to `player_count`.
        If `queue length + 1` is equal to player_count of this queue, then remove the `player_count - 1` 
        members from the queue and create a new room.
        If user is already in a queue, nothing happens.
        It does not check if user is particapating in an active game, so it is required to handle this logic by yourself.
        
        :param player_id: player to join the queue
        :type player_id: int
        :param player_count: used to specify which queue to join. For example, 2 means join 1 vs 1 queue, 4 means 2 vs 2 and so on.
        Has to be in `app.config['GAME_PLAYERCOUNT']`
        :type player_count: int
        '''
        validate_player_count(player_count)
        q = self.get_queue(player_count)
        key = self.get_queue_key(player_count)
        if self.is_player_in_queue(player_id):
            return
        if len(q) == player_count - 1:
            players = self.redis.rpop(key, player_count - 1)
            players.append(player_id)
            game = self.create_room(players)
            return game

        self.redis.lpush(key, player_id)
        self.redis.sadd(self.players_key, player_id)
    
    def leave_queue(self, player_id: int, queue: str) -> None:
        '''Remove player `player_id` from queue `queue`'''
        self.redis.lrem(queue, 1, player_id)
        self.redis.srem(self.players_key, player_id)

    
    def form_teams(self, players: list, teams: dict) -> list[dict]:
        '''
        A helper function used to create valid team list which can be passed to
        `GameRoomRepository.create_game` function
        
        :param players: list of player ids. Can be a str, int list or mix of two
        :type players: list
        :param teams: a dictionary representins possible teams. 
        Key(starting from 0) is used to assign players to a team,
        whereas value is used as the name of the team

        :type teams: dict
        :return: list of dicts containing player id and team.
        :rtype: list[dict]
        '''
        if len(players) < 2:
            raise ValueError('At least two players are required to form teams!')
        if len(teams) < 2:
            raise ValueError('At least two teams have to be provided!')
        
        res = []
        random.shuffle(players)
        player_array = np.array_split(players, len(teams))
        for i, p in enumerate(player_array):
            res.extend([
                {
                    'id': int(pl),
                    'team': teams[i]
                } for pl in p
            ])
        return res

    
    def create_room(self, players: list, teams: dict = None) -> str:
        '''Creates a GameRoomRepository and returns game key'''
        if len(players) < 2:
            raise ValueError('At least two players are required to start a game!')
        if teams and len(teams) < 2:
            raise ValueError('At least two teams have to be provided!')
        
        with current_app.app_context():
            TEAMS = teams or current_app.config['GAME_TEAMS']
        players = self.form_teams(players, TEAMS)
        from app import game_room
        game_id = game_room.create_game(players)
        return game_id