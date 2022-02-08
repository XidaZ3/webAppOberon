pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Counters.sol";

contract Escrow {

	using Counters for Counters.Counter;

	/**
	 *  STATES FLOW:
	 *  - created
	 *  - confirmed IFF created
	 *  - deleted IFF created
	 *  - refundAsked IFF created || confirmed
	 *  - refunded IFF refundAsked
	 */
	enum State { 
		created,
		confirmed,
		deleted,
		refundAsked,
		refunded
	}

	struct Order {
		uint id;
		address payable buyer;
		address payable seller;
		uint amount;
		State state;
	}

	Counters.Counter totalOrders;
	Counters.Counter totalSellers;
	address contractAddress = address(this);
	address public owner;

	mapping(uint => Order) orders;
	mapping(address => bool) buyers;
	mapping(address => bool) sellers;
	mapping(uint => address) sellersIterable;
	mapping(address => uint[]) ordersBuyers;
	mapping(address => uint[]) ordersSellers;

	modifier onlyBuyer() {
		require(buyers[msg.sender]);
		_;
	}

	modifier onlySeller() {
		require(sellers[msg.sender]);
		_;
	}

	modifier orderExists(uint _orderID) {
		require(_orderID <= totalOrders.current());
		_;
	}

	modifier sellerIsOwner(uint _orderID) {
		require(orders[_orderID].seller == msg.sender);
		_;
	}

	modifier buyerIsOwner(uint _orderID) {
		require(orders[_orderID].buyer == msg.sender);
		_;
	}

	event orderCreated(Order order);
	event orderConfirmed(Order order);
	event orderDeleted(Order order);
	event refundAsked(Order order);
	event orderRefunded(Order order);
	event sellerRegistered(address seller);

	constructor() {
		owner = msg.sender;
	}

	// The buyer makes an order and sends his funds to the smart contract (inside the object Order)
	function createOrder(address payable _seller) 
		external 
		payable 
	{
		require(
			sellers[_seller], 
			"ERROR: This seller isn't registered in our platform."
		);
		address payable buyer = payable(msg.sender);
		uint amount = msg.value;
		
		if (!buyers[buyer]) {
			buyers[buyer] = true;
		}

		uint id = totalOrders.current();

		Order memory newOrder = Order(id, buyer, _seller, amount, State.created);
		orders[id] = newOrder;

		ordersBuyers[buyer].push(id);
		ordersSellers[_seller].push(id);

		totalOrders.increment();

		emit orderCreated(newOrder);
	}

	/*
	 *	The buyer confirms the specified order, and the smart contract 
	 *  sends the funds (from the object orderToConfirm) to the seller.
	 */
	function confirmOrder(uint _orderID) 
		external
		onlyBuyer
		orderExists(_orderID)
		buyerIsOwner(_orderID)
	{
		Order memory orderToConfirm = orders[_orderID];
		require(
			orderToConfirm.state == State.created, 
			"ERROR: You can't confirm this order."
		);

		uint amount = orderToConfirm.amount;
		address payable seller = orderToConfirm.seller;
		orderToConfirm.state = State.confirmed;
		seller.transfer(amount);

		orders[_orderID] = orderToConfirm;

		emit orderConfirmed(orderToConfirm);
	}

	/*
	 *	The seller can delete the order if it's not been already confirmed
	 *	Money goes from contract to buyer
	 */
	function deleteOrder(uint _orderID) 
		external
		onlySeller
		orderExists(_orderID)
		sellerIsOwner(_orderID)
	{
		Order memory orderToDelete = orders[_orderID];
		require(
			orderToDelete.state == State.created,
			"ERROR: You can't delete this order."
		);
		
		uint amount = orderToDelete.amount;
		orderToDelete.state = State.deleted;
		orderToDelete.buyer.transfer(amount);

		orders[_orderID] = orderToDelete;

		emit orderDeleted(orderToDelete);
	}

	/*
	 *	The buyer can ask for a refund. IF:
	 *	- confirmed: money from the seller to the buyer;
	 *	- not confirmed: money from the smart contract to the buyer, immediately;
	 */
	function askRefund(uint _orderID) 
		external
		onlyBuyer
		orderExists(_orderID)
		buyerIsOwner(_orderID)
	{
		Order memory orderToAskRefund = orders[_orderID];
		require(
			orderToAskRefund.state == State.created || orderToAskRefund.state == State.confirmed,
			"ERROR: You can't ask refund for this order."
		);

		// if order has just been created and user wants a refund, he gets it instantly
		if (orderToAskRefund.state == State.created) {
			orderToAskRefund.state = State.refunded;
			orderToAskRefund.buyer.transfer(orderToAskRefund.amount);
			emit orderRefunded(orderToAskRefund);
		} 
		// else, it can only be a confirmed order so seller has to refund the buyer later with refundBuyer(_orderID)
		else {
			orderToAskRefund.state = State.refundAsked;
			emit refundAsked(orderToAskRefund);
		}

		orders[_orderID] = orderToAskRefund;
	}
	
	/**
	 * 	The seller can refund the buyer if he asked a refund
	 *  and the order has already been confirmed.
	 * 	- Money from buyer to seller
	 */ 
	function refundBuyer(uint _orderID)
		external
		payable
		onlySeller
		orderExists(_orderID)
		sellerIsOwner(_orderID)
	{
		Order memory orderToRefund = orders[_orderID];
		require(
			orderToRefund.state == State.refundAsked, 
			"ERROR: You can't perform a refund for this order."
		);
		uint amount = orderToRefund.amount;
		require(
			msg.value == amount, 
			"ERROR: The amount you wanted to send is not equal to the order's price."
		);

		orderToRefund.state = State.refunded;
		orderToRefund.buyer.transfer(msg.value);

		orders[_orderID] = orderToRefund;

		emit orderRefunded(orderToRefund);
	}

	/**
	 *
	 *  In order to use the platform, sellers must register
	 *	to this smart contract using this function
	 *
	 */
	function registerAsSeller() 
		external
	{
		require(
			!sellers[msg.sender],
			"ERROR: You are already a seller."
		);
		sellers[msg.sender] = true;
		sellersIterable[totalSellers.current()] = msg.sender;

		totalSellers.increment();

		emit sellerRegistered(msg.sender);
	}

	/**
	 * 	GETTERS
	 */ 

	function getBalance() 
		public
		view
		returns(uint) 
	{
		return contractAddress.balance;
	}

	function getOrders()
		public 
		view 
		returns(Order[] memory) 
	{
		Order[] memory result = new Order[](totalOrders.current());
		for (uint i = 0; i<totalOrders.current(); ++i) {
        	result[i] = orders[i];
    	}
    	return result;
	}

	function getSellers()
		public
		view
		returns(address[] memory)
	{
		address[] memory result = new address[](totalSellers.current());
		for (uint i = 0; i<totalSellers.current(); ++i) {
        	result[i] = sellersIterable[i];
    	}
    	return result;
	}

	function getOrdersOfUser(address _user)
		public
		view
		returns(Order[] memory)
	{
		Order[] memory result;

		if (buyers[_user]) {
			result = new Order[](ordersBuyers[_user].length);
			for (uint i = 0; i<ordersBuyers[_user].length; ++i) {
				result[i] = orders[ordersBuyers[_user][i]];
			}
		} else {
			if (sellers[_user]) {
				result = new Order[](ordersSellers[_user].length);
				for (uint i = 0; i<ordersSellers[_user].length; ++i) {
					result[i] = orders[ordersSellers[_user][i]];
				}
			} else {
				revert('This user is not registered in our platform.');
			}
		}
		return result;
	}

	function getTotalOrders()
		public
		view
		returns(uint)
	{
		return totalOrders.current();
	}

	function getTotalSellers()
		public
		view 
		returns(uint)
	{
		return totalSellers.current();
	}
}