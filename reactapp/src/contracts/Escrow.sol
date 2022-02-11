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

	address contractAddress = address(this);
	address public owner;

	Counters.Counter totalSellers;
	Counters.Counter totalOrders;

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

	event OrderCreated(Order order);
	event OrderConfirmed(Order order);
	event OrderDeleted(Order order);
	event RefundAsked(Order order);
	event OrderRefunded(Order order);
	event SellerRegistered(address seller);

	constructor() {
		owner = msg.sender;
	}

	// The buyer makes an order and sends his funds to the smart contract (inside the object Order)
	function createOrder(address payable seller) 
		external 
		payable 
	{
		require(
			sellers[seller], 
			"ERROR: This seller isn't registered in our platform."
		);
		require(
			msg.value > 0, 
			"ERROR: The order amount can't be null."
		);

		address payable buyer = payable(msg.sender);
		uint amount = msg.value;
		
		if (!buyers[buyer]) {
			buyers[buyer] = true;
		}

		uint id = totalOrders.current();

		Order memory newOrder = Order(id, buyer, seller, amount, State.created);
		orders[id] = newOrder;

		ordersBuyers[buyer].push(id);
		ordersSellers[seller].push(id);

		totalOrders.increment();

		emit OrderCreated(newOrder);
	}

	/*
	 *	The buyer confirms the specified order, and the smart contract 
	 *  sends the funds (from the object orderToConfirm) to the seller.
	 */
	function confirmOrder(uint orderId) 
		external
		onlyBuyer
		orderExists(orderId)
		buyerIsOwner(orderId)
	{
		Order memory orderToConfirm = orders[orderId];
		require(
			orderToConfirm.state == State.created, 
			"ERROR: You can't confirm this order."
		);

		uint amount = orderToConfirm.amount;
		address payable seller = orderToConfirm.seller;
		orderToConfirm.state = State.confirmed;
		orders[orderId] = orderToConfirm;
		emit OrderConfirmed(orderToConfirm);

		seller.transfer(amount);
	}

	/*
	 *	The seller can delete the order if it's not been already confirmed
	 *	Money goes from contract to buyer
	 */
	function deleteOrder(uint orderId) 
		external
		onlySeller
		orderExists(orderId)
		sellerIsOwner(orderId)
	{
		Order memory orderToDelete = orders[orderId];
		require(
			orderToDelete.state == State.created,
			"ERROR: You can't delete this order."
		);
		
		uint amount = orderToDelete.amount;
		orderToDelete.state = State.deleted;
		orders[orderId] = orderToDelete;
		emit OrderDeleted(orderToDelete);

		orderToDelete.buyer.transfer(amount);
	}

	/*
	 *	The buyer can ask for a refund. IF:
	 *	- confirmed: money from the seller to the buyer;
	 *	- not confirmed: money from the smart contract to the buyer, immediately;
	 */
	function askRefund(uint orderId) 
		external
		onlyBuyer
		orderExists(orderId)
		buyerIsOwner(orderId)
	{
		Order memory orderToAskRefund = orders[orderId];
		require(
			orderToAskRefund.state == State.created || orderToAskRefund.state == State.confirmed,
			"ERROR: You can't ask refund for this order."
		);

		// if order has just been created and user wants a refund, he gets it instantly
		if (orderToAskRefund.state == State.created) {
			orderToAskRefund.state = State.refunded;
			orders[orderId] = orderToAskRefund;
			emit OrderRefunded(orderToAskRefund);
			orderToAskRefund.buyer.transfer(orderToAskRefund.amount);
		} 
		// else, it can only be a confirmed order so seller has to refund the buyer later with refundBuyer(_orderID)
		else {
			orderToAskRefund.state = State.refundAsked;
			orders[orderId] = orderToAskRefund;
			emit RefundAsked(orderToAskRefund);
		}
	}
	
	/**
	 * 	The seller can refund the buyer if he asked a refund
	 *  and the order has already been confirmed.
	 * 	- Money from buyer to seller
	 */ 
	function refundBuyer(uint orderId)
		external
		payable
		onlySeller
		orderExists(orderId)
		sellerIsOwner(orderId)
	{
		Order memory orderToRefund = orders[orderId];
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
		orders[orderId] = orderToRefund;
		emit OrderRefunded(orderToRefund);

		orderToRefund.buyer.transfer(msg.value);
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

		emit SellerRegistered(msg.sender);
	}

	/**
	 * 	GETTERS
	 */ 

	function getBalance() 
		external
		view
		returns(uint) 
	{
		return contractAddress.balance;
	}

	function getOrders()
		external 
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
		external
		view
		returns(address[] memory)
	{
		address[] memory result = new address[](totalSellers.current());
		for (uint i = 0; i<totalSellers.current(); ++i) {
        	result[i] = sellersIterable[i];
    	}
    	return result;
	}

	function getOrdersOfUser(address user)
		external
		view
		returns(Order[] memory)
	{
		Order[] memory result = new Order[](0);

		if (buyers[user]) {
			result = new Order[](ordersBuyers[user].length);
			for (uint i = 0; i<ordersBuyers[user].length; ++i) {
				result[i] = orders[ordersBuyers[user][i]];
			}
		} else {
			if (sellers[user]) {
				result = new Order[](ordersSellers[user].length);
				for (uint i = 0; i<ordersSellers[user].length; ++i) {
					result[i] = orders[ordersSellers[user][i]];
				}
			} else {
				revert('This user is not registered in our platform.');
			}
		}
		return result;
	}

	function getTotalOrders()
		external
		view
		returns(uint)
	{
		return totalOrders.current();
	}

	function getTotalSellers()
		external
		view 
		returns(uint)
	{
		return totalSellers.current();
	}
}