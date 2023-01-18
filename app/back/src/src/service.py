from barrel import app, request, Commons, Error, DB, DictObject, StrObject, ListObject, Builder, Decorators
from src.security import Token
from src.user import User


DEFAULT_ACTIONS = []

class Service(DB):
    def __init__(self, id = None):
        self.model = DictObject("protected", {
                "name": StrObject("public"),
                "creator_id": StrObject("public"),
                "description": StrObject("public"),
                "actions": DictObject("system", data = {
                        "internal": DictObject("system", data = {
                            "default": ListObject("system", []),
                            "list": ListObject("system", []),
                        }),
                        "external": DictObject("system", data = {
                            "default": ListObject("system", []),
                            "list": ListObject("system", []),
                        }),
                    }
                )
            }
        )
        super().__init__(id = id)

    def new(self, name, creator_id):
        same_name = list(
            self.r.filter(
                DictObject(None,
                    {
                        "name": StrObject(None, name),
                        "creator_id": StrObject(None, creator_id)
                    }
                ).formating(query = True)
            ).run(self.conn)
        )
        if len(same_name) > 0:
            raise Error.Forbidden(
                f"Name '{name}' already exist "
            )
        self.model.change_data(['name'], name)
        self.model.change_data(['actions', 'internal', 'list'], DEFAULT_ACTIONS)
        self.data = self.model.formating()
        return self.create()

    def get(self):
        self.checkout()
        return Builder.run(self.data)

@Decorators.option
@app.route(f'/service', ['OPTIONS', 'POST'])
@Decorators.response
def function():
    token = request.headers.get("Authorization", None)
    if token is None:
        raise Error.Forbidden(
            "Invalid Authorization"
        )
    user = User()
    Token(user).verify(token)
    data = Commons.Arguments.check(
            source =    'body',
            mandatory = ["name"],
            optionnal = []
        )
    data = Service().new(**{**data, **{"creator_id": user.id}}).get()
    return data



# @Decorators.option
# @app.route(f'/service/<id>', ['OPTIONS', 'GET'])
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
