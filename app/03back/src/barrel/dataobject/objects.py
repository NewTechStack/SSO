from .base import Base
from barrel.error import Error

class DictObject(Base):
    def __init__(self, base_type, data, type=None, property_name=None, property = False, last_update=None):
        self.data = data
        super().__init__(base_type, type, property_name, property, last_update)

    def add_data(self, keys, new_data):
        key = keys[0]
        if key not in self.data:
            raise Error.InternalLogic('Dictchange_data')
        if isinstance(self.data[key], ListObject):
            if len(keys) > 1:
                raise Error.InternalLogic("Dictchange_data")
            self.data[key].add_data(new_data)
        else:
            if len(keys) == 0:
                raise Error.InternalLogic("Dictadd_data")
            self.data[key].change_data(keys[1:], new_data)
        self.updated()

    def change_data(self, keys, new_data):
        key = keys[0]
        if key not in self.data:
            raise Error.InternalLogic('Dictchange_data')
        if isinstance(self.data[key], StrObject) or isinstance(self.data[key], ListObject):
            if len(keys) > 1:
                raise Error.InternalLogic("Dictchange_data")
            self.data[key].change_data(new_data)
        else:
            self.data[key].change_data(keys[1:], new_data)
        self.updated()

    def del_key(self, key):
        if key not in self.data:
            raise Error.InternalLogic('Dictchange_data')
        del self.data["key"]
        self.updated()

    def get_data(self, query = False, access = "public"):
        return {key: self.data[key].formating(query = query, access = access) for key in self.data}

class StrObject(Base):
    def __init__(self, base_type, data = None, type=None, property_name=None, property = False, last_update=None):
        self.data = data
        super().__init__(base_type, type, property_name, property, last_update)

    def change_data(self, new_data):
        if not isinstance(new_data, str):
            raise Error.InternalLogic("StrObject.change_data")
        self.data = new_data
        self.updated()
        return

    def get_data(self, query = False,  access = "public"):
        return str(self.data)

class ListObject(Base):
    def __init__(self, base_type, data = [], type=None, property_name=None, property = False, last_update=None):
        self.data = data
        super().__init__(base_type, type, property_name, property, last_update)

    def change_data(self, new_data):
        self.data = new_data
        self.updated()
        return

    def add_data(self, new_data):
        self.data.append(new_data)
        self.updated()
        return

    def del_data(self, old_data):
        i = 0
        while i < len(self.data):
            print(self.data[i], old_data)
            if self.data[i] == old_data:
                break
            i = i + 1

    def get_data(self, query = False,  access = "public"):
        return [d.formating(query = query, access = access) for d in self.data]
