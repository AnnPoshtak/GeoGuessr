import os


if os.environ.get('SOCKETIO_ASYNC_MODE') == 'eventlet':
    import eventlet
    eventlet.monkey_patch()

from app import create_app, socketio


app = create_app()


if __name__ == '__main__':
    socketio.run(
        app,
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', '5000')),
        debug=bool(os.environ.get('FLASK_DEBUG')),
    )
