from .rethink import Rethink
from barrel.error import Error

class DB(Rethink):
    def __init__(self, id = None, seed = None):
        self.id = id
        self.seed = seed
        self.data = None
        super().__init__(table = type(self).__name__, seed = self.seed)

    def create(self):
        if self.id is not None:
            self.data["id"] = self.id
        res = dict(self.r.insert([self.data]).run(self.conn))
        if len(res["generated_keys"]) != 1:
            raise Error.InternalLogic("DBcreate")
        self.id = res["generated_keys"][0]
        print(res)
        return self

    def push(self):
        if not self._exist():
            raise Error.CantFind(type(self).__name__, id)
        if self.data is not None:
            if self.id is not None:
                self.data["id"] = self.id
            self.r.get(id).update(self.data).run(self.conn)
        return self

    def checkout(self):
        if not self._exist():
            raise Error.CantFind(type(self).__name__, id)
        self.data = self.r.get(self.id).run(self.conn)
        return self

    def _exist(self, id = None):
        id = id if id is not None else self.id
        return self.r.get(id).run(self.conn) is not None
