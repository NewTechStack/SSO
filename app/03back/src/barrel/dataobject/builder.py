from .objects import DictObject, ListObject, StrObject
from barrel.error import Error

class Builder:
    def run(data):
        if not isinstance(data, dict):
            return str(data)
        if not 'data' in data or not 'metadata' in data:
            raise Error.InternalLogic('DataObjectBuilder.run')
        property_name = list(data['metadata']['property'].keys())
        property_name = property_name[0] if len(property_name) == 1 else None
        property = data['metadata']['property'][property_name] if property_name is not None else None
        base_type = data['metadata']['type']['base']
        type = data['metadata']['type']['actual']
        if isinstance(data['data'], dict):
            for d in data['data']:
                data['data'][d] = Builder.run(data['data'][d])
            ret = DictObject(base_type, data['data'], type, property_name, property)
        elif isinstance(data['data'], list):
            n = 0
            while n < len(data["data"]):
                data['data'][n] = Builder.run(data['data'][n])
                n = n + 1
            ret = ListObject(base_type, data['data'], type, property_name, property)
        else:
            ret = StrObject(base_type, data['data'], type, property_name, property)
        return ret
