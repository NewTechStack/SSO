from barrel import app, request, Commons, Error, DB, DictObject, StrObject, ListObject, Builder, Decorators
from src.security import Token

class User(DB):
    def __init__(self, id = None):
        self.model = DictObject("public", {
                "pseudo": StrObject("public"),
                "password": DictObject("private",
                    data = {
                        "by_pseudo": StrObject("system"),
                        "by_email": StrObject("system", property_name="disabled", property=True),
                        "by_phone": StrObject("system", property_name="disabled", property=True),
                    }
                ),
                "contact": DictObject("protected",
                    data = {
                        "email": StrObject("protected"),
                        "phone": StrObject("protected", property_name="verified", property=False)
                    }
                , property_name="verified", property=False),
                "crypto": DictObject("protected",
                    data = {
                        "encryption_password": StrObject("system"),
                        "salt": StrObject("system"),
                        "public_key": StrObject("private"),
                        "address": StrObject("protected")
                    }
                ),
                "identity": DictObject("protected",
                    data = {
                        "last_name": StrObject("protected", property_name="verified", property=False),
                        "first_name": StrObject("protected", property_name="verified", property=False),
                        "birth_date": StrObject("protected", property_name="verified", property=False),
                        "address": DictObject("protected", data = {
                            "house_number": StrObject("protected", property_name="verified", property=False),
                            "street_prefix":  StrObject("protected", property_name="verified", property=False),
                            "street": StrObject("protected", property_name="verified", property=False),
                            "street_suffix": StrObject("protected", property_name="verified", property=False),
                            "apartment": StrObject("protected", property_name="verified", property=False),
                            "buiding": StrObject("protected", property_name="verified", property=False),
                            "city": StrObject("protected", property_name="verified", property=False),
                            "state": StrObject("protected", property_name="verified", property=False),
                            "zip": StrObject("protected", property_name="verified", property=False)
                        }, property_name="verified", property=False),
                        "nationality": StrObject("protected", property_name="verified", property=False),
                    }
                , property_name="verified", property=False),
                "roles": ListObject("protected", data=[])
            }
        )
        super().__init__(id = id)

    def register(self, pseudo, password):
        same_pseudo = list(
            self.r.filter(
                DictObject(None,
                    {
                        "pseudo": StrObject(None, pseudo),
                    }
                ).formating(query = True)
            ).run(self.conn)
        )
        if len(same_pseudo) > 0:
            raise Error.Forbidden(
                "Pseudo already exist"
            )
        if Commons.Crypto.strong_pass(password) is None:
            raise Error.InvalidArgument(
                "password", "BODY", "8 char and contain maj, min, number and special char"
            )
        password = Commons.Crypto.hash(pseudo, password)
        if int(self.r.count.run(self.conn)) == 0:
            self.model.change_data(['roles'], ['creator'])
        self.model.change_data(['pseudo'], pseudo)
        self.model.change_data(['password', 'by_pseudo'], password)
        self.data = self.model.formating()
        self.create()
        self.checkout()
        token = Token(self).issue()
        return token

    def login(self, identifier, password):
        password = Commons.Crypto.hash(identifier, password)
        user = list(
            self.r.filter(
                DictObject(None,
                    {
                        "pseudo": StrObject(None, identifier),
                        "password": DictObject(None, data={"by_pseudo": StrObject(None, password)})
                    }
                ).formating(query = True)
            ).run(self.conn)
        )
        if len(user) == 0:
            raise Error.Forbidden(
                "Invalid identifier/password"
            )
        if len(user) > 1:
            raise Error.InternalLogic(
                "User.login more than 1 user matching"
            )
        self.id = user[0]["id"]
        token = Token(self).issue()
        return token

    def edit_identity(self, identity):
        update = self.model["identity"]
        self.checkout()
        Builder.run(self.data)
        self.data.change_data(['identity'], identity)
        self.data = self.data.formating()
        self.push()

    def get(self):
        self.checkout()
        return Builder.run(self.data)

@Decorators.option
@app.route(f'/register', ['OPTIONS', 'POST'])
@Decorators.response
def function():
    data = Commons.Arguments.check(
            source =    'body',
            mandatory = ["pseudo", "password"],
            optionnal = []
        )
    data = User().register(**data)
    return data

@Decorators.option
@app.route(f'/login', ['OPTIONS', 'POST'])
@Decorators.response
def function():
    data = Commons.Arguments.check(
            source =    'body',
            mandatory = ["identifier", "password"],
            optionnal = []
        )
    data = User().login(**data)
    return data

@Decorators.option
@app.route(f'/user', ['OPTIONS', 'GET'])
@Decorators.response
def function():
    token = request.headers.get("Authorization", None)
    if token is None:
        raise Error.Forbidden('Missing Bearer token')
    user = User()
    Token(user).verify(token)
    data = user.get().formating(access = "private")
    return data

@Decorators.option
@app.route(f'/user/identity', ['OPTIONS', 'PUT'])
@Decorators.response
def function():
    token = request.headers.get("Authorization", None)
    if token is None:
        raise Error.Forbidden('Missing Bearer token')
    user = User()
    Token(user).verify(token)

    data = Commons.Arguments.check(
            source =    'body',
            mandatory = [],
            optionnal = ["last_name", "first_name", "birth_date", "address", "nationality"]
        )

    data = user.edit_identity(data)
    return data

@Decorators.option
@app.route(f'/user/identity', ['OPTIONS', 'PUT'])
@Decorators.response
def function():
    token = request.headers.get("Authorization", None)
    if token is None:
        raise Error.Forbidden('Missing Bearer token')
    user = User()
    Token(user).verify(token)

    data = Commons.Arguments.check(
            source =    'body',
            mandatory = [],
            optionnal = ["last_name", "first_name", "birth_date", "address", "nationality"]
        )

    data = user.edit_identity(data)
    return data

# @Decorators.option
# @app.route(f'/user/<id>', ['OPTIONS', 'GET'])
# @Decorators.response
# def function(id):
#     token = request.headers.get("Authorization", None)
#     user = User()
#     access = "public"
#     if token is not None:
#         Token(user).verify(token)
#         access = "private" if user.id == id else access
#     data = User(id).checkout().get().formating(access = access)
#     return data
