from barrel import request, response, DictObject, StrObject, ListObject
from .error import Error
import json
import re
import hashlib

class Commons:
    class JSON(json.JSONEncoder):
        def default(self, obj):
            list = [
                DictObject,
                StrObject,
                ListObject
                ]
            if any([isinstance(obj, type) for type in list]):
                return obj.formating()
            try:
                return json.JSONEncoder.default(self, obj)
            except:
                return str(obj)

        def json(data):
            return json.loads(json.dumps(data, cls=Commons.JSON))

    class Web:
        def redirect(url):
            """
            redirect the client to `url`
            """
            status = 303 if request.get('SERVER_PROTOCOL') == "HTTP/1.1" else 302
            response.set_header('Location', url)
            response.status = status
            return ''

    class Arguments:
        def retrieve_args():
            """
            retrieve request query arguments
            """
            args = dict(request.query.decode())
            for param in args:
                v = args[param]
                args[param] = True if v == 'true' else False if v == 'false' else v
            return args

        def retrieve_body():
            try:
                args = request.json if request.json is not None else {}
            except:
                args = {}
            return args

        def check(source, mandatory, optionnal  ):
            """
            depending off `source`,
            check if the requeest contains the proper arguments
            """
            data = {
                'query': Commons.Arguments.retrieve_args,
                'body': Commons.Arguments.retrieve_body
            }.get(source, lambda : {})()
            args = [arg for arg in mandatory if arg not in data]
            if len(args) > 0:
                raise Error.MissingArgument(args, source)
            return data

    class Crypto:
        def strong_pass(password):
            reg = "(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
            return re.match(reg, password)

        def hash(identifier, password):
            if identifier is None or password is None:
                raise Error.InternalLogic("Commons.Crypto.hash")
            s = len(identifier)
            n = s % (len(password) - 1 if len(password) > 1 else 1)
            salted = password[:n] + str(s) + password[n:]
            hashed = hashlib.sha512(salted.encode('utf-8')).hexdigest()
            return hashed
