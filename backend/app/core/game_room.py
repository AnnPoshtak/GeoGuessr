from app.config import settings
from .util import get_random_location, calculate_line_distance, calculate_score
from redis import Redis
from typing import Any
from app.models import GameRoom, Player, Team
from app.schemas import CreatePlayer, MapLocation, MapLocation
from aredis_om import NotFoundError

class GameRoomRepository():
    '''
    A class used to interact with redis to create game rooms.
    It only handles setting/getting data from redis.
    GameRoomRepository can be created when at least two players are ready to start a game.
    It stores current round, location and players.
    Scores and damage calculation have to be done externally.
    '''
    def __init__(self):
        pass

    async def get_current_game(self, player_id: int) -> str | None:
        try:
            player: Player = await Player.find(Player.firebase_uid==player_id).first()
        except NotFoundError:
            return
        return player.current_game
    
    async def join_game(self, player_id: int, game_key: str) -> None:
        try:
            player: Player = await Player.find(Player.firebase_uid==player_id).first()
        except NotFoundError:
            return
        await player.update(current_game=game_key)
        await player.expire(settings.gameroom_expiry_time)

    async def create_game(self, players: list[CreatePlayer]) -> str: 
        '''
        Creates a game inside redis. It stores current round, location and players participating in it
        
        :param players: A list of CreatePlayer pydantic schemas
        :type players: list[CreatePlayer]
        :return: A key to access the game in redis
        :rtype: str
        '''
        EXPIRY_TIME = settings.gameroom_expiry_time
        MIN_PLAYERS = settings.min_players
        STARTING_HEALTH = settings.starting_player_health
        if len(set([p.team for p in players])) < 2:
            raise ValueError('At least 2 teams must have at least one player!')
        if len(players) < MIN_PLAYERS:
            raise ValueError(f'players length must be at least {MIN_PLAYERS}!')
        
        location = get_random_location()
        redis_players = []
        teams = []
        game_room = GameRoom(
            round=1,
            temp_target=None,
            target=location,
            multiplier=1,
            players=[],
            teams=[],
        )
        game_room = await game_room.save()
        for p in players:
            try:
                player: Player = await Player.find(Player.firebase_uid==p.firebase_uid).first()
                continue
            except NotFoundError:
                pass
            player = Player(
                firebase_uid=p.firebase_uid,
                team=p.team,
                guess=None,
                current_game=game_room.pk,
                is_connected=False
            )
            player = await player.save()
            await self.join_game(p.firebase_uid, game_room.pk)
            try:
                team = await Team.find(Team.name==p.team).first()
            except NotFoundError:
                team = Team(
                    players=[],
                    game=game_room.pk,
                    name=p.team,
                    health=STARTING_HEALTH,
                    score=0,
                    distance=0.0,
                )
                team = await team.save()
                teams.append(team)
                
            redis_players.append(player)
            team.players.append(player)
            await team.update(health=team.health * len(team.players))
            await team.save()
            await team.expire(EXPIRY_TIME)
            await player.expire(EXPIRY_TIME)

        await game_room.update(teams=teams, players=redis_players)
        await game_room.expire(EXPIRY_TIME)
        await game_room.save()
        return game_room.pk
    
    async def get_game(self, game_key: str) -> GameRoom | None:
        try:
            game = await GameRoom.get(game_key)
            game.players = await Player.find(Player.current_game==game.pk).all()
            game.teams = await self.get_teams(game_key)
        except NotFoundError:
            return 
        return game

    async def get_players(self, game_key: str, team: str) -> list[Player] | None:
        players = await Player.find(
            (Player.team == team) & (Player.current_game == game_key)
        ).all()
        return players

    async def get_teams(self, game_key: str) -> list[Team] | None:
        try:
            game = await GameRoom.get(game_key)
            teams = []
            for t in game.teams:
                t = await self.get_team(game_key, t.name)
                teams.append(t)
            return teams
        except NotFoundError:
            return 

    async def get_player(self, key: str, player_id: str) -> Player | None:
        if not key or not player_id:
            return
        try:
            player = await Player.find(
                (Player.current_game == key) & (Player.firebase_uid == player_id)
            ).first()
        except NotFoundError:
            return None
        return player
    
    async def set_is_connected(self, game_key: str, player_id: int, value: bool) -> Any:
        player = await self.get_player(game_key, player_id)
        await player.update(is_connected=value)
        await self.update_game_expiry(game_key)
        return value
    
    async def get_player_score(self, game_key: str, player_id: int) -> int:
        game: GameRoom = await self.get_game(game_key)
        if not game:
            return
        player: Player = await self.get_player(game_key, player_id)
        if not player or not player.guess:
            return 0
        distance = calculate_line_distance(game.target, player.guess)
        score = calculate_score(distance)
        return score
    
    async def get_scores(self, game_key: str) -> dict[str, int]:
        result = {}
        game = await self.get_game(game_key)
        if not game:
            return
        for p in game.players:
            score = await self.get_player_score(game_key, p.firebase_uid)
            result[p.firebase_uid] = score
        return result
    
    async def get_team_average_score(self, game_key: str, team_name: str) -> int:
        scores = []
        team: Team = await self.get_team(game_key, team_name)
        if not team:
            return 0
        for p in team.players:
            if not p.guess:
                continue
            score = await self.get_player_score(game_key, p.firebase_uid)
            scores.append(score)
        avg_score = sum(scores) // (len(scores) or 1)
        return avg_score

    async def get_winning_team(self, game_key: str, teams: list[Team] = []) -> Team | None:
        '''
        :args:
        game_key: game id
        teams: list of teams from which to choose. Used to exclude the team that is technically defeated
        '''
        game = await self.get_game(game_key)
        if not game:
            return
        if not teams:
            teams = game.teams
        
        winning_team = None
        highest_score = float('-inf')

        for team in teams:
            avg_score = await self.get_team_average_score(game_key, team.name)
            if avg_score > highest_score:
                highest_score = avg_score
                winning_team = team
                
        return winning_team
    
    async def get_team(self, game_key: str, name: str) -> Team | None:
        try:
            team: Team = await Team.find((Team.game==game_key) & (Team.name==name)).first()
            team.players = await self.get_players(game_key, team.name)
        except NotFoundError:
            return
        return team
    
    async def team_submitted(self, game_key: str, team_name: str) -> bool:
        team = await self.get_team(game_key, team_name)
        for p in team.players:
            if not p.guess:
                return False
        return True

    async def all_players_submitted(self, game_key: str) -> bool:
        game = await self.get_game(game_key)
        for t in game.teams:
            if not await self.team_submitted(game_key, t.name):
                return False
        return True
    
    async def set_guess(self, game_key: str, player_id: int, guess: MapLocation) -> None:
        player = await self.get_player(game_key, player_id)
        if not player:
            return 
        guess = MapLocation.model_validate(guess)
        await player.update(guess=guess)
        await player.save()
        await self.update_game_expiry(game_key)
    
    async def update_game_expiry(self, game_key: str, expiry_time: int = None) -> None:
        '''
        Updates game and all game-related data, i.e. gameroom:players, expiry time
        
        :param game_key: redis game key
        :type game_key: str
        :param expiry_time: expiry time. If not provided, `settings.gameroom_expiry_time` is used instead
        :type expiry_time: int
        '''
        EXPIRY_TIME = expiry_time or settings.gameroom_expiry_time
        game = await self.get_game(game_key)
        if not game:
            return
        for p in game.players:
            await p.expire(EXPIRY_TIME)
        for t in game.teams:
            await t.expire(EXPIRY_TIME)
        await game.expire(EXPIRY_TIME)
    
    async def set_team_health(self, game_key: str, name: str, health: int) -> int:
        '''
        Sets health for team with id `team_name`
        
        :param game_key: redis game key
        :type game_key: str
        :param team_name: team name
        :type team_name: str
        :param health: A new health amount
        :type health: int
        '''
        team = await self.get_team(game_key, name)
        await team.update(health=health)
        await team.save()
        await self.update_game_expiry(game_key)
        return health
    
    async def move_next_round(self, game_key: str) -> int:
        '''
        Increments current round and selects a new location.
        Also, it resets all guesses values to `False`
        
        :param game_key: redis game key
        :type game_key: str
        :return: new game round
        :rtype: int
        '''
        game = await self.get_game(game_key)
        new_round = game.round + 1
        new_location = get_random_location()
        new_multiplier = round(int(new_round) * settings.round_health_multiplier, 1)
        await game.update(round=new_round, target=new_location, multiplier=new_multiplier)
        for p in game.players:
            await p.update(guess=None)
        await self.update_game_expiry(game_key)
        return new_round
    
    async def get_temp_target_ttl(self, game_key: str) -> float | None:
        game = await self.get_game(game_key)
        ttl = await game.db().ttl(f'{game.key()}:temp_target')
        return ttl if ttl >= 0 else None
    
    async def set_temp_target(self, game_key: str) -> MapLocation:
        '''Sets a temprorary target which is returned between the round callbacks'''
        game = await self.get_game(game_key)
        await game.update(temp_target=game.target)
        await game.db().expire(f'{game.key()}:temp_target', settings.round_automove_cooldown)
        return game.target

    async def end_game(self, game_key: str) -> None:
        game = await self.get_game(game_key)
        if not game:
            return
        await Player.find(Player.current_game==game_key).delete()
        await Team.find(Team.game==game_key).delete()
        await game.delete(game.pk)
