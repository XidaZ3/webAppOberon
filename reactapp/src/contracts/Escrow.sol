pragma solidity 0.8.0;
import "@openzeppelin/contracts/utils/Counters.sol";

contract Escrow {

	using Counters for Counters.Counter;

	struct Order {
		uint id;
		address payable buyer;
		uint amount;
		bool confirmed;
		bool deleted;
		bool refundAsked;
		bool refunded;
	}

	Counters.Counter totalOrders;
	address payable seller = payable(0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2);
	address contractAddress = address(this);
	mapping(address => bool) buyers;
	mapping(uint => Order) orders;

	modifier onlyBuyer() {
		require(buyers[msg.sender]);
		_;
	}

	modifier onlySeller() {
		require(msg.sender == seller);
		_;
	}

	event orderCreated(Order order);
	event orderConfirmed(Order order);
	event orderDeleted(Order order);
	event refundAsked(Order order);
	event orderRefunded(Order order);

	/*
	 * 
	 *	The buyer makes an order and sends its funds to the smart contract (inside the object newOrder)
	 *
	 */
	function createOrder() public payable {
		address payable buyer = payable(msg.sender);
		uint amount = msg.value;
		
		if (!buyers[buyer]) {
			buyers[buyer] = true;
		}

		Order memory newOrder = Order(totalOrders.current(), buyer, amount, false, false, false, false);
		orders[totalOrders.current()] = newOrder;
		totalOrders.increment();

		emit orderCreated(newOrder);
	}

	/*
	 * 
	 *	The buyer confirms the specified order and the smart contract 
	 *  sends the funds (from the object orderToConfirm) to the seller.
	 *	He can confirm if it's not already confirmed or deleted.
	 *  - Money from SC to seller
	 *
	 */
	function confirmOrder(uint _orderID) public onlyBuyer {
		require(_orderID <= totalOrders.current(), "ERROR: This order doesn't exist.");

		Order memory orderToConfirm = orders[_orderID];
		uint amount = orderToConfirm.amount;

		require(orderToConfirm.buyer == msg.sender, "ERROR: You never created this order.");
		require(!orderToConfirm.confirmed, "ERROR: This order is already confirmed.");
		require(!orderToConfirm.deleted, "ERROR: This order has been deleted from the seller.");
		require(!orderToConfirm.refundAsked, "ERROR: You asked the refund for this order.");
		require(!orderToConfirm.refunded, "ERROR: This order has been refunded.");
		require(contractAddress.balance >= amount, "ERROR: Insufficient funds inside smart contract.");

		seller.transfer(amount);
		orderToConfirm.confirmed = true;

		orders[_orderID] = orderToConfirm;

		emit orderConfirmed(orderToConfirm);
	}

	/*
	 * 
	 *	The seller can delete the order if it's not been already confirmed
	 *	- Money from SC to buyer
	 *
	 */
	function deleteOrder(uint _orderID) public onlySeller {
		require(_orderID <= totalOrders.current(), "ERROR: This order doesn't exist.");

		Order memory orderToDelete = orders[_orderID];
		uint amount = orderToDelete.amount;

		require(!orderToDelete.confirmed, "ERROR: This order has already been confirmed by the buyer.");
		require(!orderToDelete.deleted, "ERROR: You have already deleted this order.");
		require(!orderToDelete.refunded, "ERROR: You have already refunded this order to the buyer.");
		require(contractAddress.balance >= amount, "ERROR: Insufficient funds inside smart contract.");

		orderToDelete.buyer.transfer(amount);
		orderToDelete.deleted = true;
		// as buyer has just received his money back:
		orderToDelete.refunded = true;

		orders[_orderID] = orderToDelete;

		emit orderDeleted(orderToDelete);
	}

	/*
	 * 
	 *	The buyer can ask for a refund. IF:
	 *	- confirmed: money from the seller to the buyer;
	 *				 seller will have to call refundBuyer(_orderID) in order to send him back the right amount of money
	 *	- not confirmed: money from the smart contract to the buyer;
	 * 				  	 seller has to call deleteOrder(_orderID) in order to send him back the money
	 *	- already deleted/askedRefund/refunded: nothing happens (error)
	 *
	 */
	function askRefund(uint _orderID) public onlyBuyer {
		require(_orderID <= totalOrders.current(), "ERROR: This order doesn't exist.");

		Order memory orderToAskRefund = orders[_orderID];

		require(orderToAskRefund.buyer == msg.sender, "ERROR: You never created this order.");
		require(!orderToAskRefund.deleted, "ERROR: This order has been deleted from the seller, you should have already received the money.");
		require(!orderToAskRefund.refundAsked, "ERROR: You already asked the refund for this order.");
		require(!orderToAskRefund.refunded, "ERROR: This order has already been refunded.");

		orderToAskRefund.refundAsked = true;
		orders[_orderID] = orderToAskRefund;

		emit refundAsked(orderToAskRefund);
	}
	
	/**
	 * 
	 * 	The seller can refund the buyer if he asked a refund
	 *  and the order has already been confirmed.
	 * 	- Money from buyer to seller
	 * 
	 */ 
	function refundBuyer(uint _orderID) public onlySeller payable {
		require(_orderID <= totalOrders.current(), "ERROR: This order doesn't exist.");

		Order memory orderToRefund = orders[_orderID];
		uint amount = orderToRefund.amount;

		require(orderToRefund.refundAsked, "ERROR: The buyer didn't ask a refund for this order.");
		require(orderToRefund.confirmed, "ERROR: This order has never been confirmed by the buyer.");
		require(!orderToRefund.refunded, "ERROR: This order has already been refunded.");
		require(!orderToRefund.deleted, "ERROR: This order has already been deleted.");
		require(msg.value == amount, "ERROR: The amount you sent is not equal to the order's price.");

		orderToRefund.buyer.transfer(msg.value);
		orderToRefund.refunded = true;
		orders[_orderID] = orderToRefund;

		emit orderRefunded(orderToRefund);
	}

	/**
	 * 
	 * 	Getters methods
	 * 
	 */ 

	function getBalance() public view returns(uint) {
		return contractAddress.balance;
	}

	function getOrders() public view returns(Order[] memory) {
		Order[] memory result = new Order[](totalOrders.current());
		for (uint i = 0; i<totalOrders.current(); ++i) {
        	result[i] = orders[i];
    	}
    	return result;
	}

	function getSeller() public view returns(address) {
		return seller;
	}

	function getTotalOrders() public view returns(uint) {
		return totalOrders.current();
	}
}