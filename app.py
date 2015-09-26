from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.json import JSONEncoder
from datetime import date, datetime
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://%s:%s@localhost/csa?charset=utf8' % (
    os.environ['CSA_DB_USERNAME'], os.environ['CSA_DB_PASSWORD']
)

sqlite_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           'db.sqlite')
app.config['SQLALCHEMY_BINDS'] = {
    'wallet': 'sqlite:///' + sqlite_path
}
app.config['SQLALCHEMY_ECHO'] = False
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True

db = SQLAlchemy(app)


class CustomJSONEncoder(JSONEncoder):
    def default(self, obj):
        try:
            if isinstance(obj, date):
                return JSONEncoder.default(
                    self,
                    datetime(obj.year, obj.month, obj.day))
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return JSONEncoder.default(self, obj)

app.json_encoder = CustomJSONEncoder
