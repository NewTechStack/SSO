from gevent import monkey; monkey.patch_all()
from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from werkzeug.debug import DebuggedApplication
from bottle import Bottle, response, request, HTTPError, HTTPResponse, BaseRequest, run
import json
from .dataobject import *
from .db import *
from .commons import Commons
from .decorators import Decorators
from .error import Error

BaseRequest.MEMFILE_MAX = 1024 * 1024 * 256

def serve(host, port):
    server = WSGIServer((host, port), app, handler_class=WebSocketHandler)
    print(f"\nRunning @ http://{host}:{port}")
    server.serve_forever()

class App(Bottle):
    def default_error_handler(self, error):
        response.content_type = 'application/json'
        data = {
            "success": False,
            "status":  error.status_code,
            "data": error.body
        }
        return json.dumps(data)

app = App()

@app.hook('after_request')
def enable_cors():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = '*'
