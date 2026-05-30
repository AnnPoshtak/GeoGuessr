import os


if os.environ.get('SOCKETIO_ASYNC_MODE') == 'eventlet':
    import eventlet
    eventlet.monkey_patch()

from app import create_app, socketio


app = create_app()


if __name__ == '__main__':
    is_debug = os.environ.get('FLASK_DEBUG', 'False').lower() in ['true', '1', 'yes']

    socketio.run(
        app,
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', '5000')),
        debug=is_debug,
        allow_unsafe_werkzeug=True 
    )