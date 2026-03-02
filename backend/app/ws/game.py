from flask_socketio import Namespace, emit, join_room
from flask import session
from app import game_room
from app.core.util import calculate_line_distance, calculate_score
import json
from flask_login import current_user

class GameNamespace(Namespace):
    def on_fetch_game(self):
        if not 'game_key' in session:
            return
        game_key = session['game_key']
        session['guess_submitted'] = False
        game = game_room.get_game(game_key)
        game['teams'] = game_room.get_teams(game_key)
        game['round'] = int(game['round'])
        game['location'] = json.loads(game['location'])
        return {
            'game': game
        }
    
    def on_join(self, data):
        if not 'game_key' in data or not isinstance(data['game_key'], str):
            return
        game_key = data['game_key']
        join_room(game_key)
        session['game_key'] = game_key
        emit('game_joined', {
            'game_key': game_key
        }, to=game_key)

    def on_submit(self, data):
        if not 'game_key' in session:
            return
        if session.get('guess_submitted'):
            return
        game_key = session['game_key']
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
                    health -= score_diff * int(game['round']) // 2
                    t['health'] = health
                    game_room.set_team_health(game_key, t['name'], health)
            game_room.move_next_round(game_key)
            return emit('new_round', {
                'target': target,
                'teams': teams,
            }, to=game_key, broadcast=True)
        