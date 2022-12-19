import time
from datetime import datetime
from rethinkdb import RethinkDB

DATABASE = "SSO"
HOST = "database"
PASSWORD = ""
PORT = 28015

class Rethink():

    def date():
        return RethinkDB().expr(datetime.now(RethinkDB().make_timezone('+00:00')))

    def __init__(self, table = None, seed = None, database = DATABASE, host = HOST, password = PASSWORD, port = PORT):
        self.re = RethinkDB()
        self.r = RethinkDB()
        self.conn = None
        self.__connect(database, host, password, port)
        self.__init(database)
        self.table(table, seed, database)

    def __connect(self, database, host, password, port):
        succes = False
        for _ in range(10):
            try:
                self.conn = self.r.connect(HOST, PORT, PASSWORD)
                succes = True
                break
            except:
                time.sleep(1)
        if succes is False:
            raise self.RethinkError("Can't connect to database")
        self.__init(database)

    def __init(self, database):
        succes = False
        for _ in range(10):
            try:
                db_list = self.r.db_list().run(self.conn)
                succes = True
                break
            except:
                time.sleep(2)
        if succes is False:
            raise self.RethinkError("Can't read database")
        if "test" in db_list:
            self.r.db_drop("test").run(self.conn)
        if database not in db_list:
            self.r.db_create(database).run(self.conn)

    def table(self, table = None, seed = None, database = DATABASE):
        table_list = self.r.db(database).table_list().run(self.conn)
        if table not in table_list:
            self.r.db(database).table_create(table).run(self.conn)
        if table is not None:
            self.r = self.r.db(database).table(table)
            if seed is not None:
                for data in seed:
                    self.r.insert(data, conflict='replace').run(self.conn)


    class RethinkError(Exception):
        pass
