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
        return {
            'game': game_room.get_game(game_key)
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
        game_key = session['game_key']
        game = game_room.get_game(game_key)
        guess = data['guess']
        game_room.submit_guess(game_key, current_user.id, guess)

        if game_room.all_players_submitted(game_key):
            target = json.loads(game['location'])
            team_scores = []
            winning_team = None
            # TODO: it would be nice to imporve this algorithm
            player_data = {}
            teams = game_room.get_players_by_teams(game_key)
            for team, players in teams.items():
                t_score = []
                for p in players:
                    player = game_room.get_player(game_key, int(p))
                    distance = calculate_line_distance(target, json.loads(player['guess']))
                    score = calculate_score(distance)
                    t_score.append(score)
                    p_data = player_data.setdefault(p, {})
                    p_data['guess'] = json.loads(player['guess'])
                    p_data['distance'] = distance
                    p_data['score'] = score

                    player_data[p] = p_data

                avg_score = sum(t_score) // len(t_score)
                if avg_score > max(team_scores, default=0):
                    winning_team = team

                team_scores.append(avg_score)

            best_score = max(team_scores)

            for i, t in enumerate(teams):
                score_diff = best_score - team_scores[i]
                for p in teams[t]:
                    health = int(game_room.get_player(game_key, int(p))['health'])
                    if t != winning_team:
                        health -= score_diff
                        game_room.set_player_health(game_key, p, health)
                    player_data[p]['health'] = health
            
            game_room.move_next_round(game_key)
            return emit('new_round', {
                'target': target,
                'player_data': player_data,
            }, to=game_key, broadcast=True)
        