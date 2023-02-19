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
        if self.id is not None:
            if res["inserted"] != 1:
                raise Error.InternalLogic("DBcreate")
        else:
            if len(res["generated_keys"]) != 1:
                raise Error.InternalLogic("DBcreate")
            self.id = res["generated_keys"][0]
        return self

    def push(self):
        if not self._exist():
            raise Error.CantFind(type(self).__name__, self.id)
        if self.data is not None:
            if self.id is not None:
                self.data["id"] = self.id
            self.r.get(self.id).update(self.data).run(self.conn)
        return self

    def checkout(self):
        if not self._exist():
            raise Error.CantFind(type(self).__name__, self.id)
        self.data = self.r.get(self.id).run(self.conn)
        return self

    def _exist(self, id = None):
        id = id if id is not None else self.id
        if id is None:
            return False
        return self.r.get(id).run(self.conn) is not None
