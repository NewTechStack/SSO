from barrel import app, response, request, Commons, Decorators

@Decorators.option
@app.route(f'/', ['OPTIONS', 'GET'])
@Decorators.response
def function():
    return {}

@Decorators.option
@app.route(f'/authorize', ['OPTIONS', 'GET'])
@Decorators.response
def function():
    data = Commons.Arguments.check(
            source =    'query',
            mandatory = ["client_id", "redirect_uri", "scope", "response_type", "response_mode", "state"],
            optionnal = ["nonce"]
        )
    return data

@Decorators.option
@app.route(f'/oauth/token', ['OPTIONS', 'POST'])
@Decorators.response
def function():
    data = Commons.Arguments.check(
            source =    'query',
            mandatory = ["client_id", "client_secret", "grant_type", "code", "redirect_uri", "state"],
            optionnal = ["nonce"]
        )
    return Commons.redirect("https://eliotctl.fr")
