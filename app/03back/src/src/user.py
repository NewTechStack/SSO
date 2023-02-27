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
                "crypto": ListObject("protected", data=[]),
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
                "roles": ListObject("protected", data=[]),
                "encrypt": DictObject("public",
                    data = {
                        "salt": StrObject("private"),
                        "rsa_owner":  DictObject("private",
                            data = {
                            "public": StrObject("private"),
                            "private_encrypted": StrObject("private")
                            }
                        ),
                        "rsa_contact":  DictObject("public",
                            data = {
                            "public": StrObject("public"),
                            "private_encrypted": StrObject("private")
                            }
                        ),
                        "ecdsa":  DictObject("public",
                            data = {
                            "public": StrObject("public"),
                            "private_encrypted": StrObject("private")
                            }
                        ),
                    }
                )
            }
        )
        super().__init__(id = id)

    def register(self, pseudo, password, salt,
                 rsa_owner_pub, rsa_owner_private_encrypted,
                 rsa_contact_pub, rsa_contact_private_encrypted,
                 ecdsa, ecdsa_private_encrypted
                ):
        if Commons.Crypto.valid_pseudo(pseudo) is None:
            raise Error.InvalidArgument(
                "pseudo", "BODY", "6-30 char, num and _ only"
            )
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
        password = Commons.Crypto.hash(pseudo, password)
        if int(self.r.count().run(self.conn)) == 0:
            self.model.change_data(['roles'], [StrObject('public', 'creator', property_name="by", property="system")])
        self.model.change_data(['pseudo'], pseudo)
        self.model.change_data(['password', 'by_pseudo'], password)
        self.model.change_data(['encrypt', 'salt'], salt)
        self.model.change_data(['encrypt', 'rsa_owner', 'public'], rsa_owner_pub)
        self.model.change_data(['encrypt', 'rsa_owner', 'private_encrypted'], rsa_owner_private_encrypted)
        self.model.change_data(['encrypt', 'rsa_contact', 'public'], rsa_contact_pub)
        self.model.change_data(['encrypt', 'rsa_contact', 'private_encrypted'], rsa_contact_private_encrypted)
        self.model.change_data(['encrypt', 'ecdsa', 'public'], ecdsa)
        self.model.change_data(['encrypt', 'ecdsa', 'private_encrypted'], ecdsa_private_encrypted)
        self.data = self.model.formating()
        self.create()
        self.checkout()
        token = Token(self).issue()
        return token

    def login(self, pseudo, password):
        password = Commons.Crypto.hash(pseudo, password)
        user = list(
            self.r.filter(
                DictObject(None,
                    {
                        "pseudo": StrObject(None, pseudo),
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

    def add_crypto(self, address, private_key, name):
        self.checkout()
        self.data = Builder.run(self.data)
        data = DictObject("protected",
            data = {
                "name": StrObject("protected", data=name),
                "address": StrObject("protected", data=address),
                "private_key": StrObject("protected", data=private_key),
            }
        )
        self.data.add_data(["crypto"], data)
        self.data = self.data.formating()
        self.push()

    def del_crypto(self, address, private_key):
        self.checkout()
        self.data = Builder.run(self.data)
        data = DictObject("protected",
            data = {
                "address": StrObject("protected", data=address),
                "private_key": StrObject("protected", data=private_key),
            }
        )
        self.data.del_data(data)
        # self.data = self.data.formating()
        # self.push()

    def edit_salt(self, salt):
        update = self.model["salt"]
        self.checkout()
        Builder.run(self.data)
        self.data.change_data(['salt'], salt)
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
            mandatory = [
                "pseudo",
                "password",
                "salt",
                "rsa_owner_pub",
                "rsa_owner_private_encrypted",
                "rsa_contact_pub",
                "rsa_contact_private_encrypted",
                "ecdsa",
                "ecdsa_private_encrypted"
            ],
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
            mandatory = ["pseudo", "password"],
            optionnal = []
        )
    data = User().login(**data)
    return data

@Decorators.option
@app.route(f'/user/encrypt', ['OPTIONS', 'GET'])
@Decorators.response
def function():
    token = request.headers.get("Authorization", None)
    if token is None:
        raise Error.Forbidden('Missing Bearer token')
    user = User()
    Token(user).verify(token)
    data = user.get().formating(access = "private")["data"]["encrypt"]["data"]
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
@app.route(f'/user/crypto', ['OPTIONS', 'PUT'])
@Decorators.response
def function():
    token = request.headers.get("Authorization", None)
    if token is None:
        raise Error.Forbidden('Missing Bearer token')
    user = User()
    Token(user).verify(token)
    data = Commons.Arguments.check(
            source =    'body',
            mandatory = ["address", "private_key", "name"],
            optionnal = []
        )
    data = user.add_crypto(**data)
    return data

@Decorators.option
@app.route(f'/user/crypto', ['OPTIONS', 'DELETE'])
@Decorators.response
def function():
    token = request.headers.get("Authorization", None)
    if token is None:
        raise Error.Forbidden('Missing Bearer token')
    user = User()
    Token(user).verify(token)
    data = Commons.Arguments.check(
            source =    'body',
            mandatory = ["address", "private_key", "name"],
            optionnal = []
        )
    data = user.del_crypto(**data)
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
