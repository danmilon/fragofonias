from sqlalchemy import (
    Integer, String, Float, orm, DateTime, ForeignKey, Date, Boolean)
from sqlalchemy.dialects.mysql import TEXT, TINYTEXT

from app import db


class User(db.Model):
    __tablename__ = 'csa_users'
    id = db.Column('id', Integer, primary_key=True)
    username = db.Column('user_login', String, nullable=False)
    password = db.Column('user_pass', String, nullable=False)
    name = db.Column('user_nicename', String, nullable=False)
    email = db.Column('user_email', String, nullable=False)

    def as_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'email': self.email
        }


class Order(db.Model):
    __tablename__ = 'csa_preorders'
    id = db.Column('id', Integer, primary_key=True)
    username = db.Column('user_login',
                         String,
                         ForeignKey('csa_users.user_login'),
                         nullable=False)

    product_id = db.Column(Integer,
                           ForeignKey('csa_product.id'),
                           nullable=False)
    type = db.Column(TEXT)
    variety = db.Column(String)
    price = db.Column(Float)
    unit = db.Column(TEXT)
    date = db.Column(DateTime)
    quantity = db.Column(Float)

    user = orm.relationship('User', backref='orders')
    product = orm.relationship('Product', backref='orders')

    def as_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'product_id': self.product_id,
            'type': self.type,
            'variety': self.variety,
            'price': self.price,
            'unit': self.unit,
            'date': self.date,
            'quantity': self.quantity,
            'producer': self.product.producer
        }


class Product(db.Model):
    __tablename__ = 'csa_product'
    id = db.Column('id', Integer, primary_key=True)
    type = db.Column(String, nullable=False)
    variety = db.Column(TEXT)
    price = db.Column(Float)
    unit = db.Column(TEXT)
    producer = db.Column(TEXT)
    category = db.Column(TINYTEXT)
    details = db.Column(TEXT)
    available = db.Column(TINYTEXT)

    def as_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'variety': self.variety,
            'price': self.price,
            'unit': self.unit,
            'producer': self.producer,
            'category': self.category,
            'details': self.details,
            'available': self.available
        }


class Wallet(db.Model):
    __bind_key__ = 'wallet'
    __tablename__ = 'wallet'

    username = db.Column(String, primary_key=True)
    amount = db.Column(Integer, nullable=False)
    is_producer = db.Column(Boolean, nullable=False)

    __mapper_args__ = {
        'order_by': username
    }

    def as_dict(self):
        return {
            'username': self.username,
            'amount': self.amount,
            'is_producer': self.is_producer
        }


class WeeksDone(db.Model):
    __bind_key__ = 'wallet'
    __tablename__ = 'weeks_done'

    start = db.Column(Date, primary_key=True)

    def as_dict(self):
        return {
            'week': self.week
        }


class Log(db.Model):
    __bind_key__ = 'wallet'
    __tablename__ = 'log'

    id = db.Column(Integer, primary_key=True)
    username = db.Column(String, nullable=False)
    action = db.Column(String, nullable=False)
    action_data = db.Column(String, nullable=False, default='{}')
    is_reverted = db.Column(Boolean, nullable=False, default=False)
