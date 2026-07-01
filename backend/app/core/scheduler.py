import datetime
from flask_socketio import emit
from flask import current_app
from app.extensions import scheduler, db
from app.models import UserModel
import json

def record_technical_defeat(game_key: str, team: str) -> None:
    from app import game_room
    with scheduler.app.app_context():
        game = game_room.get_game(game_key)
        if not game or not 'teams' in game:
            return
        winning_team = game_room.get_winning_team(game_key)
        emit('game_end',
            {
                'winner': winning_team,
                'target': game['location'],
            }, 
            to=game_key, 
            broadcast=True,
            namespace='/game'
        )
        return game_room.end_game(game_key)

def send_disconnect_event(game_key: str, user_id: int):
    from app import game_room
    from app.schemas import user_public_schema
    with scheduler.app.app_context():
        user = db.session.query(UserModel).filter_by(id=user_id).first()
        if not user:
            return
        if game_key:
            game_room.set_player_key(game_key, user.id, 'is_connected', False)
            run_time = datetime.datetime.now() + datetime.timedelta(seconds=current_app.config['DEFEAT_TEAM_INTERVAL'])
            team = game_room.get_player(game_key, user.id)['team']
            record_defeat = True
            for p in json.loads(game_room.get_team(game_key, team)['players']):
                if json.loads(game_room.get_player(game_key, p)['is_connected']):
                    record_defeat = False
                    break
            if record_defeat:
                scheduler.add_job(
                    f'record_technical_defeat:{user.id}:{team}',
                    record_technical_defeat, 
                    args=(game_key, team),
                    next_run_time=run_time,
                    coalesce=True,
                    max_instances=1,
                    replace_existing=True
                )
                emit(
                    'record_defeat_started',
                    {'team': team},
                    broadcast=True,
                    to=game_key,
                    namespace='/game'
                )
            emit(
                'player_disconnected', 
                user_public_schema.dump(user),
                broadcast=True,
                to=game_key,
                namespace='/game'
            )
