var React = require('react')
var ReactDOM = require('react-dom')
var Modal = require('react-modal');
window.$ = window.jQuery = require('jquery')
// include bootstap js for tabs
var _ = require('bootstrap')

var UserTableRow = React.createClass({
    getInitialState: function () {
	return {
	    partially_delivered: false,
	    variety: this.props.data.variety,
	    type: this.props.data.type,
	    price: this.props.data.price,
	    quantity: this.props.data.quantity,
	    delivered_quantity: this.props.data.quantity
	}
    },
    getTotalPrice: function () {
	return Math.round(this.state.delivered_quantity * this.state.price * 10) / 10
    },
    setDeliveredQuantity: function (quantity, partial) {
	var self = this
	var new_state = {
	    delivered_quantity: quantity,
	    partially_delivered: partial
	}

	this.setState(new_state, function () {
	    self.props.parent.recomputeOrderTotal()
	})
    },
    onNotDeliveredClick: function () {
	this.setDeliveredQuantity(0, false)
    },
    onDeliveredClick: function () {
	this.setDeliveredQuantity(this.state.quantity, false)
    },
    onDeliveredPartiallyClick: function () {
	this.setDeliveredQuantity(this.state.quantity, true)
	this.setState({ waiting_input: true})
    },
    onPartialQuantityChange: function (ev) {
	var new_quantity = parseFloat(ev.target.value)
	if (isNaN(new_quantity)) {
	    new_quantity = 0
	}

	if (new_quantity > this.state.quantity) {
	    new_quantity = this.state.quantity
	}

	this.setDeliveredQuantity(new_quantity, true)
    },
    onPartialLoseFocus: function () {
	if (this.state.waiting_input) {
	    this.setState({waiting_input:false})
	    return
	}

	if (this.state.delivered_quantity === 0) {
	    this.setState({partially_delivered: false})
	}
	else if (this.state.delivered_quantity === this.state.quantity) {
	    this.onDeliveredClick()
	}
    },
    render: function () {
	var data = this.props.data
	var trClass = ''

	if (this.state.delivered_quantity === 0) {
	    trClass += ' strikeout'
	}
	var partial_delivery_input;
	if (this.state.partially_delivered) {
	    partial_delivery_input = (
		    <input className="col-md-4 pull-right" autoFocus onBlur={this.onPartialLoseFocus} type="number" min="0" step="any"
		max={this.state.quantity} ref="partial_amount"
		value={this.state.delivered_quantity} onChange={this.onPartialQuantityChange} />
	    )
	}

	is_zero_order = (this.state.quantity === 0)
	var radio_yes = (
		<div>
		<input type="radio" ref="radio_yes"
	    readOnly={is_zero_order}
	    onChange={this.onDeliveredClick} name={this.props.data.username + '_' +
						   this.props.data.product_id}
	    checked={(this.state.delivered_quantity === this.state.quantity)
		     && (!this.state.partially_delivered)}/>
		Ναι
	    </div>)

	var radio_no = (
		<div>
		<input type="radio" onChange={this.onNotDeliveredClick} ref="radio_no"
	    name={this.props.data.username + '_' + this.props.data.product_id}
	    readOnly={is_zero_order}
	    checked={(this.state.delivered_quantity === 0) && (!this.state.partially_delivered)}/> Οχι
	    </div>
	)

	var radio_partial = (
		<span>
		<input type="radio" ref="radio_partial"
	    readOnly={is_zero_order}
	    name={this.props.data.username + '_' +
		  this.props.data.product_id} onChange={this.onDeliveredPartiallyClick}
		/> Μερικώς
	    </span>
	)

	var delivery_col = (
		<td>
		<label className="radio-inline">{radio_yes}</label>
		<label className="radio-inline">{radio_no}</label>
		<label className="radio-inline">{radio_partial}</label> {partial_delivery_input}
	    </td>
	)

	return (
		<tr className={trClass}>
		<td>{data.type} {data.variety} ({data.producer})</td>
		<td className="monospace">{this.state.delivered_quantity} {this.props.data.unit}</td>
		<td className="monospace">{data.price.toFixed(2)}€</td>
		<td className="monospace">{this.getTotalPrice().toFixed(2)}€</td>
		{delivery_col}
	    </tr>
	)
    }
})

var UserTable = React.createClass({
    recomputeOrderTotal: function () {
	var orderTotal = 0
	for (var refName in this.refs) {
	    if (refName.startsWith('row')){
		var ref = this.refs[refName]
		orderTotal += ref.getTotalPrice()
	    }
	}
	orderTotal = Math.round(orderTotal * 10) / 10
	this.setState({
	    order_total: orderTotal,
	    extra_amount: this.getExtraAmount(orderTotal)
	})
    },
    getInitialState: function () {
	var orderTotal = 0
	this.props.data.orders.forEach(function (order) {
	    orderTotal += order.price * order.quantity
	})

	orderTotal = Math.round(orderTotal * 10) / 10

	return {
	    deposit_amount: 0,
	    wallet_amount: this.props.data.wallet_amount,
	    new_wallet_amount: this.props.data.wallet_amount,
	    order_total: orderTotal,
	    extra_amount: this.getExtraAmount(orderTotal)
	}
    },
    onDepositAmountChange: function (ev) {
	this.setState({
	    deposit_amount: parseInt(ev.target.value, 10)
	})
    },
    onDeposit: function (ev) {
	ev.preventDefault()
	this.setState({new_wallet_amount: this.state.new_wallet_amount + this.state.deposit_amount})
    },
    onExtraChange: function (ev) {
	var amount = parseFloat(ev.target.value)
	if (isNaN(amount)) {
	    amount = 0
	}

	amount = Math.round(amount * 10) / 10

	this.setState({
	    extra_amount: amount
	})
    },
    getExtraAmount: function (orderTotal) {
	return Math.round(orderTotal * 0.05 * 10) / 10
    },
    render: function () {
	var self = this
	this.rows = this.rows || []
	if (this.rows.length === 0) {
	    var i = 0
	    this.props.data.orders.forEach(function (order) {
		self.rows.push(
			<UserTableRow
		    ref={'row' + i}
		    data={order}
		    parent={self}
		    username={self.props.data.username}
		    key={'row' + i} />)
		i += 1
	    })
	}

	return (
		<div className="user-data">
		<div className="row">
		<div className="col-md-7 monospace">
		<h4 className="username"><strong>{this.props.data.user.name}</strong></h4>
		<p>Νέο Πορτοφόλι: {' '}
	    {this.state.new_wallet_amount.toFixed(2)}€ - {' '}
	    {this.state.order_total.toFixed(2)}€ - {this.state.extra_amount.toFixed(2)}€ =
		{' '} {(this.state.new_wallet_amount -
			this.state.order_total - this.state.extra_amount).toFixed(2)}€</p>
		</div>
		<div className="col-md-5">
		<div className="row">
		<input
	    ref="input_deposit_amount" className="col-md-3 col-md-push-2"
	    type="number" min="0" step="any" onChange={this.onExtraChange}
	    value={this.state.extra_amount.toFixed(2)} />
		<div className="col-md-4 col-md-push-3">
		Συνεισφορά (€)
	    </div>
		</div>
		<div className="row">
		<form action="#" onSubmit={this.onDeposit}>
		<input value={this.state.deposit_amount} ref="input_deposit_amount" className="col-md-3 col-md-push-2" type="number" min="0" onChange={this.onDepositAmountChange} />
		<input type="submit" className="btn btn-default
btn-sm col-md-4 col-md-push-3" value="Κατάθεση (€)"/>
		</form>
		</div>
		</div>
		</div>
		<table className="table table-striped table-condensed">
		<thead>
		<tr>
		<th className="col-md-5">Προϊόν</th>
		<th className="col-md-1">Ποσότ.</th>
		<th className="col-md-1">Τιμή</th>
		<th className="col-md-1">Σύνολο</th>
		<th className="col-md-4">Ήρθε;;</th>
		</tr>
		</thead>
		<tbody>
		{this.rows}
		<tr className="info">
		<td></td>
		<td></td>
		<td></td>
		<td className="monospace">
		{this.state.order_total.toFixed(2)}€
	    </td>
		<td className="monospace">+ {this.state.extra_amount.toFixed(2)}€ = {(this.state.order_total + this.state.extra_amount).toFixed(2)}€</td>
		</tr>
		</tbody>
		</table>
		</div>
	)
    }
})


var UserTables = React.createClass({
    getInitialState: function () {
	return {
	    modal_open: false,
	    done: false
	}
    },
    onDoneClick: function () {
	this.setState({modal_open: true})
    },
    closeModal: function () {
	this.setState({ modal_open: false })
    },
    getDeliveryReport: function () {
	var report = []
	for (var refName in this.refs) {
	    var table = this.refs[refName]
	    if (table.state.wallet_amount !== table.state.new_wallet_amount) {
		report.push(<li>Ο {table.props.data.user.name} κατέθεσε {' '}
			    {(table.state.new_wallet_amount -
			      table.state.wallet_amount).toFixed(2)}€</li>)
	    }

	    for (var refName in table.refs) {
		if (!refName.startsWith('row')) {
		    continue
		}

		var row = table.refs[refName]
		if (row.state.quantity !== row.state.delivered_quantity) {
		    if (row.state.delivered_quantity === 0) {
			report.push(<li>Το {row.state.type} του {' '}
				    {table.props.data.user.name} δεν ήρθε καθόλου.</li>)
		    }
		    else if (row.state.partially_delivered) {
			report.push(<li>Ήρθε {row.state.delivered_quantity} απο
				    τα {row.state.quantity} του προϊόντος{' '}
				    {row.state.type} για τον {table.props.data.user.name}</li>)
		    }
		}
	    }
	}
	return report
    },
    commit: function () {
	var request = {}
	var self = this
	request['!ΤΑΜΕΙΟ ΟΜΑΔΑΣ!'] = 0
	for (var refName in this.refs) {
	    var ref = this.refs[refName]
	    var user = ref.props.data.user
	    var wallet_amount = ref.state.wallet_amount
	    var new_wallet_amount = ref.state.new_wallet_amount - ref.state.order_total - ref.state.extra_amount
	    var diff = Math.round((new_wallet_amount - wallet_amount) * 10) / 10
	    if (diff !== 0) {
		request[user.username] = diff
		request['!ΤΑΜΕΙΟ ΟΜΑΔΑΣ!'] += ref.state.extra_amount
	    }
	}

	// calculate producers wallets also
	for (var refName in this.refs) {
	    var table = this.refs[refName]
	    for (var refName in table.refs) {
		if (!refName.startsWith('row')) {
		    continue
		}

		var row = table.refs[refName]
		if (request[row.props.data.producer] === undefined) {
		    request[row.props.data.producer] = 0
		}

		// take 5% from producers
		var five_percent = 0.05 * row.getTotalPrice()
		var amount_for_producer = Math.round((row.getTotalPrice() -
						      five_percent) * 10) / 10
		request['!ΤΑΜΕΙΟ ΟΜΑΔΑΣ!'] += five_percent
		request[row.props.data.producer] += amount_for_producer
	    }
	}

	$.ajax({
	    type: 'POST',
	    url: '/wallets/set_all',
	    data: JSON.stringify(request),
	    contentType: 'application/json',
	    dataType: 'json',
	    success: function (data, textStatus, jqXHR) {
		self.setState({done: true})
	    },
	    error: function (data, textStatus, jqXHR) {
		var error_message = data.responseJSON.error_message
		self.setState({error_message: error_message})
	    }
	})
    },
    render: function () {
	var tables = [];
	var self = this;
	Object.keys(this.props.data).forEach(function (username) {
	    user_data = self.props.data[username]
	    tables.push(
		    <UserTable
		data={user_data}
		ref={username + '_table'}
		key={username + '_table'} />
	    )
	})

	if (this.state.error_message) {
	    return (
		    <div id="no-results" className="row vertical-align">
		    <div className="col-xs-12">
		    <p className="bg-danger">
		    {this.state.error_message}
		</p>
		    </div>
		    </div>
	    )
	}

	if (this.state.done) {
	    return (
		    <div id="no-results" className="row vertical-align">
		    <div className="col-xs-12">
		    <p className="bg-success">
		    Συγχαρητήρια, η καταχώρηση για αυτή την εβδομάδα έχει ολοκληρωθεί!
		</p>
		    </div>
		    </div>
	    )
	}

	var delivery_report = this.getDeliveryReport()
	var customStyles = {
	    content: {
		display: 'inline-block',
		height: 'auto',
		outline: 'none',
		overflow: 'hidden',
		padding: '100px 80px',
		verticalAlign: 'middle',
		width: '100%',
		zIndex: '2000'
	    }
	}
	var error_message = null
	if (delivery_report.length === 0) {
	    error_message = (
		    <p className="bg-success" style={{padding: '50px'}}>Δεν έγινε καμία αλλαγή
		στις προεπιλεγμένες ρυθμίσεις. Εαν είστε σίγουροι, εντάξει!</p>
	    )
	}
	var modal = (
		<Modal
	    isOpen={this.state.modal_open}
	    style={customStyles}>
		{error_message}
		<div className="text-center">
		<ul className="text-left">{delivery_report}</ul>
		<button style={{marginRight: '50px'}}type="button"
	    className="btn btn-success btn-lg"
	    onClick={this.commit}>Σωστά</button>
		<button type="button"
	    className="btn btn-warning btn-lg"
	    onClick={this.closeModal}>Θα Διωρθώσω</button>
		</div>
		</Modal>
	)

	if (tables.length === 0) {
	    return (
		    <div id="no-results" className="row vertical-align">
		    <div className="col-xs-12">
		    <p className="bg-warning">
		    Δεν υπάρχουν ακόμα παραγγελείες για αυτή την εβδομάδα.
		    </p>
		    </div>
		    </div>
	    )
	}

	return (
		<div id="user-tables">
		{tables}
	    	<button type="button" className="btn btn-success btn-lg btn-block"
	    onClick={this.onDoneClick}>Χώστα!</button>
		{modal}
	    </div>
	)
    }
})

var UserWallet = React.createClass({
    getInitialState: function () {
	state = this.props.data
	state.input_amount = 0
	return state
    },
    onChangeAmount: function (ev) {
	var amount = parseFloat(ev.target.value)
	if (isNaN(amount)) {
	    this.setState({
		input_amount: ev.target.value,
		error_message: 'Αυτό δεν ειναι νούμερο!'
	    })
	}
	else {
	    this.setState({
		input_amount: amount,
		error_message: undefined
	    })
	}
    },
    onCommit: function () {
	if (this.state.error_message != null) {
	    alert(this.state.error_message)
	    return
	}

	var url = '/wallets/' + this.state.username + '/change_amount'
	var self = this
	var request = {
	    'amount': this.state.input_amount
	}

	$.ajax({
	    type: 'POST',
	    url: url,
	    data: JSON.stringify(request),
	    contentType: 'application/json',
	    dataType: 'json',
	    success: function (data, textStatus, jqXHR) {
		self.setState({
		    amount: data.amount
		})
	    },
	    error: function (data, textStatus, jqXHR) {
		var error_message = data.responseJSON.error_message
		alert(error_message)
	    }
	})
    },
    render: function () {
	var name = this.state.username
	if (this.state.is_producer) {
	    name += ' (Παραγωγός)'
	}
	return (
		<tr>
		<td><strong>{name}</strong></td>
		<td>{this.state.amount.toFixed(2)}€</td>
		<td className="text-right"><input className="col-md-5" value={this.state.input_amount} ref="input_amount"
	    type="number" step="any" onChange={this.onChangeAmount} /><span className="col-md-1">€</span></td>
		<td className="text-right"><input onClick={this.onCommit} type="button" className="btn btn-primary btn-sm" value="Αύξηση/Μείωση"/></td>
		</tr>
	)
    }
})

var UserWallets = React.createClass({
    getInitialState: function () {
	var rows = []
	this.props.data.forEach(function (wallet) {
	    rows.push(<UserWallet data={wallet} key={wallet.username} ref={wallet.username} />)
	})

	return {
	    wallets: this.props.data,
	    all_rows: rows,
	    rows: rows
	}
    },
    onFilter: function (ev) {
	var term = ev.target.value
	newRows = this.state.all_rows.filter(function (row) {
	    var username = row.props.data.username.toLowerCase()
	    if (username.indexOf(term) === -1) {
		return false
	    }

	    return true
	})
	this.setState({
	    rows: newRows
	})
    },
    render: function () {
	return (
		<table className="table table-striped">
		<thead>
		<tr>
		<th>Αναζήτηση με Όνομα <input type="text" onChange={this.onFilter}/></th>
		<th>Ποσό</th>
		<th></th>
		<th></th>
		</tr>
		</thead>
		<tbody>
		{this.state.rows}
	    </tbody>
		</table>
	)
    }
})

var DeliveryTable = React.createClass({
    getTotal: function () {
	var orderTotal = 0
	this.state.deliveries.forEach(function (delivery) {
	    orderTotal += delivery.price * delivery.quantity
	})

	return Math.round(orderTotal * 10) / 100
    },
    getInitialState: function () {
	var rows = []
	this.props.data.forEach(function (delivery, idx) {
	    rows.push(
		    <tr key={idx}>
		    <td>{delivery.type} {delivery.variety}</td>
		    <td>{delivery.quantity} {delivery.unit}</td>
		    <td>{delivery.username}</td>
		    </tr>
	    )
	})

	return {
	    deliveries: this.props.data,
	    producer: this.props.producer,
	    rows: rows
	}
    },
    render: function () {
	return (
		<div className="delivery-data">
		<div className="row">
		<div className="col-md-8 monospace">
		<h4 className="username"><strong>{this.state.producer}</strong></h4>
		</div>
		</div>
		<table className="table table-striped table-condensed">
		<thead>
		<tr>
		<th className="col-md-5">Προϊόν</th>
		<th className="col-md-1">Ποσότ.</th>
		<th className="col-md-3">Αγοραστής</th>
		</tr>
		</thead>
		<tbody>
		{this.state.rows}
		</tbody>
		</table>
		</div>
	)
    }
})

var DeliveryTables = React.createClass({
    getInitialState: function () {
	return {
	    deliveries: this.props.data
	}
    },
    render: function () {
	var tables = [];
	var self = this;
	Object.keys(this.props.data).forEach(function (producer) {
	    delivery_data = self.props.data[producer]
	    tables.push(
		    <DeliveryTable
		data={delivery_data}
		producer={producer}
		ref={producer + '_table'}
		key={producer + '_table'} />
	    )
	})

	if (this.state.error_message) {
	    return (
		    <div id="no-results" className="row vertical-align">
		    <div className="col-xs-12">
		    <p className="bg-danger">
		    {this.state.error_message}
		</p>
		    </div>
		    </div>
	    )
	}

	if (tables.length === 0) {
	    return (
		    <div id="no-results" className="row vertical-align">
		    <div className="col-xs-12">
		    <p className="bg-warning">
		    Δεν υπάρχουν ακόμα παραγγελείες για αυτή την εβδομάδα.
		    </p>
		    </div>
		    </div>
	    )
	}

	return (
		<div id="delivery-tables">
		{tables}
	    </div>
	)
    }
})

var orders_app = document.getElementById('orders-app')
if (orders_app != null) {
    ReactDOM.render(
	    <UserTables data={data.user_data}/>,
	orders_app
    )
}

var deliveries_app = document.getElementById('deliveries-app')
if (deliveries_app != null) {
    ReactDOM.render(
	    <DeliveryTables data={data.deliveries} />,
	deliveries_app
    )
}

ReactDOM.render(
	<UserWallets data={data.wallets}/>,
    document.getElementById('wallets-app')
)
