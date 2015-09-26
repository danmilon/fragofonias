from collections import OrderedDict
from datetime import timedelta, date

from sqlalchemy.orm import joinedload
import flask.json as json
from flask import render_template, jsonify, request

from app import app, db
import models

# Monday = 0
# Tuesday = 1
# Wednesday = 2
START_DAY = 2
TEAM_WALLET_NAME = '!ΤΑΜΕΙΟ ΟΜΑΔΑΣ!'


def create_all_wallets():
    users = db.session.query(models.User)
    for user in users:
        get_or_create_wallet(user.username)


def get_or_create_team_wallet():
    return get_or_create_wallet(TEAM_WALLET_NAME)


def get_or_create_wallet(username):
    user_wallet = db.session.query(models.Wallet).get(username)
    if not user_wallet:
        user_wallet = models.Wallet(username=username,
                                    amount=0)

        db.session.add(user_wallet)
        db.session.commit()
    return user_wallet


def get_current_week_start():
    today = date.today()
    # TODO: REMOVE THIS (ITS DEBUG CRAP)
    # today = today - timedelta(weeks=7)
    offset = (today.weekday() - START_DAY) % 7
    return (today - timedelta(days=offset))


def error_response(error_message, status=400):
    resp = jsonify({'error_message': error_message})
    resp.status_code = status
    return resp


@app.route('/wallets/<username>/change_amount', methods=['POST'])
def change_amount(username):
    wallet = get_or_create_wallet(username)
    wallet.amount = models.Wallet.amount + request.json['amount']
    db.session.commit()
    return jsonify(**wallet.as_dict())


@app.route('/wallets/set_all', methods=['POST'])
def change_wallets():
    # if week exists, we cant do this
    current_week_start = get_current_week_start()
    week = db.session.query(models.WeeksDone).get(current_week_start)
    if week is not None:
        return error_response('Αυτή η εβδομάδα έχει ήδη καταχωρηθεί.')
    for username, diff_amount in request.json.items():
        wallet = get_or_create_wallet(username)
        wallet.amount = models.Wallet.amount + diff_amount
    db.session.add(models.WeeksDone(start=current_week_start))
    db.session.commit()
    return ('', 204)


@app.route('/')
def index():
    current_week_start = get_current_week_start()
    current_week_end = current_week_start + timedelta(days=7)
    week = db.session.query(models.WeeksDone).get(current_week_start)
    # force creation of team wallet if it doesnt exist
    get_or_create_team_wallet()
    create_all_wallets()
    wallets = db.session.query(models.Wallet).all()
    wallets = [w.as_dict() for w in wallets]
    if week:
        error_message = (
            'Η εβδομάδα %s με %s έχει ήδη καταχωρηθεί.' % (
                current_week_start, current_week_end
            )
        )
        return render_template(
            'index.html',
            error_message=error_message,
            data_json=json.dumps(({
                'wallets': wallets,
                'user_data': {}
            })))

    orders = (
        db.session.query(models.Order)
        .options(joinedload('user'))
        .filter(models.Order.date >= current_week_start)
        .filter(models.Order.date <= current_week_end))

    # inverse to user --> orders
    data_by_user = OrderedDict()
    for order in orders:
        if order.user.username not in data_by_user:
            user_wallet = get_or_create_wallet(order.user.username)
            data_by_user[order.user.username] = {
                'user': order.user,
                'orders': [],
                'wallet_amount': user_wallet.amount
            }

        data_by_user[order.username]['orders'].append(order)

    for wallet in wallets:
        if wallet['username'] in data_by_user:
            data_by_user[wallet['username']]['wallet_amount'] = wallet['amount']

    # serialize
    for username, data in data_by_user.items():
        data['user'] = data['user'].as_dict()
        data['orders'] = [order.as_dict() for order in data['orders']]

    data = {
        'user_data': data_by_user,
        'wallets': wallets
    }

    return render_template(
        'index.html',
        data_json=json.dumps(data))


if __name__ == '__main__':
    app.run(debug=True)
