from flask_socketio import Namespace, emit, send
from app import game_room
from app.config import settings
from .util import join_game, authenticated_only, join_game_currently_in, get_full_player_data, \
get_full_teams_data
from flask_login import current_user
from app.core.scheduler import scheduler, send_disconnect_event
import datetime

def move_next_round(game_key: str):
    with scheduler.app.app_context():
        game = game_room.get_game(game_key)
        target = game['target']
        team_scores = []
        winning_team = game_room.get_winning_team(game_key)
        teams = get_full_teams_data(game_key)
        for team in teams:
            avg_score = game_room.get_team_average_score(game_key, team['name'])
            team_scores.append(avg_score)

        best_score = max(team_scores)
        scores = game_room.get_scores(game_key)
        for i, t in enumerate(teams):
            score_diff = best_score - team_scores[i]
            health = t['health']
            if t['name'] != winning_team:
                health -= round(score_diff * (int(game['round']) * settings.round_health_multiplier))
                health = max(0, health)
                game_room.set_team_health(game_key, t['name'], health)
                t['health'] = health
                if health <= 0:
                    emit('game_end', {
                        'winner': winning_team,
                        'target': target,
                        'teams': teams,
                        'scores': scores,
                    }, to=game_key,  namespace='/game')
                    return game_room.end_game(game_key)
        game_room.move_next_round(game_key)
        emit('new_round', {
            'target': target,
            'teams': teams,
            'scores': scores,
        }, to=game_key,  namespace='/game')

class GameNamespace(Namespace):
    @authenticated_only
    def on_connect(self):
        join_game_currently_in()

    def on_disconnect(self, reason):
        if not current_user.is_authenticated:
            return
        run_time = datetime.datetime.now() + datetime.timedelta(seconds=3)
        game_key = game_room.get_current_game(current_user.id)
        scheduler.add_job(
            f'send_disconnect_event:{current_user.id}',
            send_disconnect_event, 
            args=(game_key, current_user.id),
            next_run_time=run_time,
            coalesce=True,
            max_instances=1,
            replace_existing=True
        )

    @authenticated_only
    def on_fetch_game(self):
        game_key = game_room.get_current_game(current_user.id)
        if not game_key:
            return send('You have to be part of the ongoing game')
        game = game_room.get_game(game_key)
        game['teams'] = get_full_teams_data(game_key)
        teams = []
        for t in game['teams']:
            players = []
            for p in t['players']:
                players.append(get_full_player_data(game_key, p['id']))
            t['players'] = players
            teams.append(t)
        game['multiplier'] = round(int(game['round']) * settings.round_health_multiplier, 1)
        autosubmit_job = scheduler.get_job(f'team_submitted:{game_key}')
        seconds = -1
        if autosubmit_job:
            run_time = autosubmit_job.next_run_time.replace(tzinfo=datetime.timezone.utc)
            seconds = round((run_time - datetime.datetime.now(tz=datetime.timezone.utc)).total_seconds())
        game['autosubmit_seconds'] = seconds
        player = game_room.get_player(game_key, current_user.id)
        game['guess'] = player['guess']
        return {
            'game': game
        }

    @authenticated_only
    def on_join(self, data: dict = {}):
        if not 'game_key' in data or not isinstance(data['game_key'], str):
            return send('Please, select a game you wish to join')
        game_key = data['game_key']
        join_game(current_user.id, game_key)

    @authenticated_only
    def on_submit(self, data: dict = {}):
        game_key = game_room.get_current_game(current_user.id)
        if not game_key:
            return send('You have to be part of the ongoing game')
        player = game_room.get_player(game_key, current_user.id)
        if player['guess'] and player['guess'] != 'null':
            return send('You have already submitted the guess')
        guess = data['guess']
        game_room.set_guess(game_key, current_user.id, guess)
        if game_room.team_submitted(game_key, player['team']) and not game_room.all_players_submitted(game_key):
            run_time = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=settings.autosubmit_interval)
            scheduler.add_job(
                f"team_submitted:{game_key}",
                move_next_round, 
                args=(game_key,),
                next_run_time=run_time,
                coalesce=True,
                max_instances=1,
                replace_existing=True
            )
            emit('team_submitted', {
                    'seconds': settings.autosubmit_interval,
                },
                to=game_key,
            )
        if game_room.all_players_submitted(game_key):
            if scheduler.get_job(f"team_submitted:{game_key}"):
                scheduler.remove_job(f"team_submitted:{game_key}")
            move_next_round(game_key)
        