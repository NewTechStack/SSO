from barrel.error import Error
from barrel.db import Rethink

class Base():
    def __init__(self, base_type, type= None, property_name=None, property = False, last_update = None):
        self.base_type = base_type
        self.type = type if type is not None else base_type
        self.property_name = property_name
        self.property = property
        self.last_update = last_update

    def change_type(self, new_type):
        types = ["public", "protected", "private", "system"]
        for type in types:
            if new_type == type:
                self.type = new_type
                return
            if self.base_type == type:
                raise Error.Forbidden(f"change type '{self.type}' to '{new_type}'")
        raise Error.InvalidArgument(type, "BODY", types)

    def change_property(self, new_property):
        self.property = new_property
        return

    def updated(self):
        self.last_update = Rethink.date()
        return

    def get_data(self, query = False, access = "public"):
        return None

    def formating(self, query = False, access = "system"):
        access_types = ["public", "private", "system"]
        if access not in access_types:
            raise Error.InternalLogic("DataObjectformating")
        rules = {
            "system": ["public", "protected", "private", "system"],
            "private": ["public", "protected", "private"],
            "public": ["public"]
        }
        content = None
        if self.type in rules[access] or query is True:
            content = self.get_data(query=query, access=access)
        data = {
            "data": content,
            "metadata": {
                "type": {
                    "actual": self.type,
                    "base": self.base_type
                },
                "property" : {},
                "last_update": self.last_update
            }
        }
        if self.property_name is not None:
            data['metadata']['property'][f"{self.property_name}"] = self.property
        if query is True:
            del data['metadata']['type']['base']
            del data['metadata']['last_update']
            if self.type is None:
                del data['metadata']['type']
        elif access == "public":
            del data["metadata"]["type"]
            del data["metadata"]["last_update"]
        return data

    def __str__(self):
        return str(self.formating(access = "public"))
