from app import socketio

@socketio.on('message')
def handle_message(data):
    print(f'Message recieved: {data}')