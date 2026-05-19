from flask_socketio import Namespace, emit, send
from flask import session, current_app
from app import game_room
from app.core.util import calculate_line_distance, calculate_score
from .util import join_game, authenticated_only, join_game_currently_in
import json
from flask_login import current_user

class GameNamespace(Namespace):
    @authenticated_only
    def on_connect(self):
        join_game_currently_in()

    def _emit_new_round(self, target: dict, teams: list, game_key: str) -> None:
        emit('new_round', {
            'target': target,
            'teams': teams,
        }, to=game_key, broadcast=True)

    @authenticated_only
    def on_fetch_game(self):
        game_key = game_room.get_current_game(current_user.id)
        if not game_key:
            return send('You have to be part of the ongoing game')
        session['guess_submitted'] = False
        game = game_room.get_game(game_key)
        game['teams'] = game_room.get_teams(game_key)
        game['round'] = int(game['round'])
        game['location'] = json.loads(game['location'])
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
        # TODO: store guess_submitted in redis
        if session.get('guess_submitted'):
            return send('You have already submitted the guess')
        game = game_room.get_game(game_key)
        guess = data['guess']
        game_room.submit_guess(game_key, current_user.id, guess)
        session['guess_submitted'] = True

        if game_room.all_players_submitted(game_key):
            target = json.loads(game['location'])
            team_scores = []
            winning_team = None
            # TODO: it would be nice to imporve this algorithm
            teams = game_room.get_teams(game_key)
            for team in teams:
                t_score = []
                team['players'] = json.loads(team['players'])
                for i, p in enumerate(team['players']):
                    player = game_room.get_player(game_key, p)
                    player['guess'] = json.loads(player['guess'])
                    player['id'] = json.loads(player['id'])
                    distance = calculate_line_distance(target, player['guess'])
                    score = calculate_score(distance)
                    t_score.append(score)
                    team['distance'] = distance
                    team['score'] = score
                    team['players'][i] = player

                avg_score = sum(t_score) // len(t_score)
                if avg_score > max(team_scores, default=0):
                    winning_team = team

                team_scores.append(avg_score)

            best_score = max(team_scores)
            for i, t in enumerate(teams):
                score_diff = best_score - team_scores[i]
                health = int(t['health'])
                if t['name'] != winning_team:
                    health -= round(score_diff * (int(game['round']) * current_app.config['ROUND_HEALTH_MULTIPLIER']))
                    health = max(0, health)
                    t['health'] = health
                    game_room.set_team_health(game_key, t['name'], health)
                    if health <= 0:
                        emit('game_end', {
                            'winner': game_room.get_team(game_key, winning_team),
                            'target': target,
                            'teams': teams,
                        }, to=game_key, broadcast=True)
                        return game_room.end_game(game_key)
            game_room.move_next_round(game_key)
            self._emit_new_round(target, teams, game_key)
        