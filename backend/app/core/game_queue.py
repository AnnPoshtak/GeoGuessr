from app.core.util import validate_player_count
from app.config import settings
import random
import numpy as np
from app.schemas import CreatePlayer

class GameQueueRepository():
    '''
    A class used to handle matchmaking logic. Used only to make redis interactions.
    Allows to join and leave queues. 
    Also handles room creation logic when queue has enough players to start a game
    '''
    def __init__(self, redis):
        if not redis:
            raise ValueError('Redis instance has to be provided!')
        self.redis = redis
        self.key = 'gamequeue'
        self.players_key = f'{self.key}:all_players'

    def get_queue_key(self, player_count: int) -> str:
        '''A helper function used to get a queue key for `player_count`'''
        validate_player_count(player_count)
        return f'{self.key}:{player_count}'
    
    def get_all_queue_keys(self) -> list[str]:
        '''Returns all queues'''
        res = []
        for p_c in settings.game_playercount:
            res.append(self.get_queue_key(p_c))
        return res

    async def get_queue(self, identifier: str | int) -> list:
        '''
        A helper function used to access the game queue
        
        :param identifier: can be either queue key or player count
        :type identifier: str | int
        :return: all players in the queue
        :rtype: list
        '''
        if isinstance(identifier, int):
            key = self.get_queue_key(identifier)
        else:
            key = identifier
        return await self.redis.lrange(key, 0, -1)
    
    async def get_all_players_in_queues(self) -> set:
        '''Returns all players currently waiting in any queue'''
        return await self.redis.smembers(self.players_key)

    async def is_player_in_queue(self, player_id: int) -> bool:
        '''Returns `True` if player is in a queue'''
        q = await self.get_all_players_in_queues()
        return str(player_id) in q or player_id in q
    
    async def get_player_queue(self, player_id: int) -> str | None:
        '''Returns the queue key the player is currently in'''
        for key in self.get_all_queue_keys():
            q = await self.get_queue(key)
            if str(player_id) in q or player_id in q:
                return key

    async def join_queue(self, user_id: int, player_count: int) -> None | str:
        '''
        Joins user `user_id` to `player_count`.
        If `queue length + 1` is equal to user_count of this queue, then remove the `player_count - 1` 
        members from the queue and create a new room.
        If user is already in a queue, nothing happens.
        It does not check if user is particapating in an active game, so it is required to handle this logic by yourself.
        
        :param user_id: user to join the queue
        :type user_id: int
        :param player_count: used to specify which queue to join. For example, 2 means join 1 vs 1 queue, 4 means 2 vs 2 and so on.
        Has to be in `settings.game_playercount`
        :type player_count: int
        '''
        validate_player_count(player_count)
        key = self.get_queue_key(player_count)
        if await self.is_player_in_queue(user_id):
            return
        q = await self.get_queue(key)
        if len(q) == player_count - 1:
            players = await self.redis.rpop(key, player_count - 1)
            await self.redis.srem(self.players_key, *players)
            players.append(user_id)
            game = await self.create_room(players)
            return game

        await self.redis.lpush(key, user_id)
        await self.redis.sadd(self.players_key, user_id)
    
    async def leave_queue(self, player_id: int, queue: str) -> None:
        '''Remove player `player_id` from queue `queue`'''
        await self.redis.lrem(queue, 1, player_id)
        await self.redis.srem(self.players_key, player_id)

    
    def form_teams(self, players: list, teams: dict) -> list[CreatePlayer]:
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
                CreatePlayer(
                    firebase_uid=str(pl),
                    team=teams[i],
                ) for pl in p
            ])
        return res

    
    async def create_room(self, players: list, teams: dict = None) -> str:
        from . import game_room
        '''Creates a GameRoomRepository and returns game key'''
        if len(set(players)) < 2:
            raise ValueError('At least two players are required to start a game!')
        if teams and len(set(teams)) < 2:
            raise ValueError('At least two teams have to be provided!')
        
        TEAMS = teams or settings.game_teams
        players = self.form_teams(players, TEAMS)
        game_key = await game_room.create_game(players)
        return game_key