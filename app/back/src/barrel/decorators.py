from barrel import Commons, request, response

class Decorators:
    def option(func):
        def decorator(*args, **kwargs):
            if request.method == 'OPTIONS':
                return {}
            return func
        return decorator

    def response(func):
        def decorator(*args, **kwargs):
            data = func(**kwargs)
            response.content_type = "application/json"
            return {
                "success": True,
                "status":  200,
                "data": Commons.JSON.json(data)
            }
        return decorator
