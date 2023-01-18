from barrel import HTTPError

class Error:
    class InternalLogic(HTTPError):
        """
        Return an error an internal check missing
        """
        def __init__(self, function_name):
            self.function_name = function_name
            super().__init__(500, str(self))

        def __str__(self):
            """
            format message
            """
            message = "Internal logic"
            return f"{message}: '{self.function_name}'"

    class MissingArgument(HTTPError):
        """
        Return an error for (a) missing argument(s)
        specifying the source and the missing arguments(s)
        """
        def __init__(self, arguments, source):
            self.source = source
            self.arguments = arguments
            super().__init__(400, str(self))

        def __str__(self):
            """
            format message
            """
            message = "Missing argument"
            if len(self.arguments) > 1:
                message += 's '
                last_arg = self.arguments[::-1][0]
                args = "', '".join(self.arguments[:-1]) + f"' & '{last_arg}"
            else:
                args = self.arguments[0]
            return f"[{self.source.upper()}] {message}: '{args}'"

    class InvalidArgument(HTTPError):
        """
        Return an error for (a) false argument(s)
        specifying source and the correct format
        """
        def __init__(self, arguments, source, format):
            self.source = source
            self.arguments = arguments
            self.format = format
            super().__init__(400, str(self))

        def __str__(self):
            """
            format message
            """
            message = "Invalid argument"
            args = None
            phrase = "should be"
            if not isinstance(self.format, list):
                args = self.arguments
            elif len(self.arguments) == 1:
                args = self.arguments[0]
            elif len(self.arguments) > 1:
                message += 's'
                last_arg = self.arguments[::-1][0]
                args = ', '.join(self.arguments[:-1]) + f' & {last_arg}'
            if isinstance(self.format, list):
                phrase += "in"
            return f"[{self.source.upper()}] {message}: '{args}' {phrase} '{self.format}'"

    class Forbidden(HTTPError):
        """
        Return an error an action that cannot be performed by current user
        """
        def __init__(self, text):
            self.text = text
            super().__init__(403, str(self))

        def __str__(self):
            """
            format message
            """
            message = "Cannot perform action"
            return f"{message}: '{self.text}'"

    class CantFind(HTTPError):
        """
        Return an error for object that doesn't exist
        """
        def __init__(self, object, object_id):
            self.object = object
            self.object_id = object_id
            super().__init__(404, str(self))

        def __str__(self):
            """
            format message
            """
            message = "Cannot find"
            return f"{message}: '{self.object}' n°'{self.object_id}'"
