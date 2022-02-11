const assert = require('assert');
const { expect } = require('chai');
const { ethers } = require("hardhat");

function weiToEther(_wei) {
  return ethers.utils.formatEther(_wei);
}

async function getGas(_response) {
  let gasPrice = _response.gasPrice;
  _response = await _response.wait();
  return _response.gasUsed.mul(gasPrice);
}

describe('Escrow contract', () => {
  let Escrow, escrow, owner, seller1, seller2, seller3, buyer1, buyer2, buyer3;
  let orders;
  let amountOrder1 = '0.1';
  let amountOrder2 = '0.2';
  let amountOrder3 = '0.3';

  // Contract Enum
  const created = 0;
	const	confirmed = 1;
	const	deleted = 2;
	const	refundAsked = 3;
	const	refunded = 4;
  
  beforeEach(async () => {
    Escrow = await ethers.getContractFactory('Escrow');
    escrow = await Escrow.deploy();
    [owner, seller1, seller2, seller3, buyer1, buyer2, buyer3, _] = await ethers.getSigners();
    await escrow.connect(seller1).registerAsSeller();    
    await escrow.connect(seller2).registerAsSeller();    
    await escrow.connect(buyer1).createOrder(seller1.address, {value: ethers.utils.parseEther(amountOrder1)});
    await escrow.connect(buyer2).createOrder(seller1.address, {value: ethers.utils.parseEther(amountOrder2)});
    await escrow.connect(buyer2).createOrder(seller1.address, {value: ethers.utils.parseEther(amountOrder3)});
    orders = await escrow.getOrders();
  });

  let ordersCreated = 3;
  let registeredSellers = 2;
  
  describe('Deployment', () => {
    it("Sets the right owner", async () => {
      expect(await escrow.owner()).to.equal(owner.address);
    })
  });
  
  describe('Seller registration', () => {
    it("Registers a seller", async () => {
      let sellers = await escrow.getSellers();
      expect(sellers[0]).to.equal(seller1.address);
    })
    it("Doesn't allow a seller to register more than one time", async () => {
      expect(escrow.connect(seller1).registerAsSeller()).to.be.reverted;
    })
  });
  
  describe('Orders management | States flow', () => {
    it("Lets create correctly an order to everyone", async () => {
      assert.equal(orders[0].buyer, buyer1.address);
      assert.equal(orders[0].seller, seller1.address);
      assert.equal(weiToEther(orders[0].amount), '0.1');
      assert.equal(orders[0].state, created);
      let nOrders = await escrow.getTotalOrders();
      expect(nOrders.toNumber()).to.equal(ordersCreated);
      expect(escrow.connect(buyer2).createOrder(seller3.address, {value: ethers.utils.parseEther("0.5")})).to.be.reverted;
      expect(escrow.connect(buyer2).createOrder(seller2.address, {value: ethers.utils.parseEther("0")})).to.be.reverted;
    })

    it("Lets the seller delete an unconfirmed order", async () => {
      await escrow.connect(seller1).deleteOrder(orders[0].id);
      orders = await escrow.getOrders();
      assert.equal(orders[0].state, deleted);
      expect(escrow.connect(buyer1).confirmOrder(orders[0].id)).to.be.reverted;
    })
    
    it("Lets a buyer ask for refund for an order", async () => {
      await escrow.connect(buyer1).askRefund(orders[0].id);
      orders = await escrow.getOrders();
      assert.equal(orders[0].state, refunded);
      expect(escrow.connect(seller1).refundBuyer(orders[0].id)).to.be.reverted;
      expect(escrow.connect(buyer1).askRefund(orders[0].id)).to.be.reverted;
    })

    it("Doesn't let confirm buyer2 an order made by buyer1", async () => {
      expect(escrow.connect(buyer2).confirmOrder(orders[0].id)).to.be.reverted;
    })

    it("Doesn't let confirm an order by a seller", async () => {
      expect(escrow.connect(seller1).confirmOrder(orders[0].id)).to.be.reverted;
    })

    it("Doesn't let delete an order by a buyer", async () => {
      expect(escrow.connect(buyer1).deleteOrder(orders[0].id)).to.be.reverted;
    })

    it("Doesn't let buyer confirm a non-existent order", async () => {
      expect(escrow.connect(buyer1).confirmOrder(5)).to.be.reverted;
    })

    it("Doesn't let a seller perform actions to an order he doesn't own", async () => {
      expect(escrow.connect(seller2).deleteOrder(orders[0].id)).to.be.reverted;
    })
  })

  describe('Orders management | Money flow', async () => {
    it("Lets a buyer confirm an order and sends the right amount to the right seller", async () => {
      let rightAmount = weiToEther(orders[0].amount);

      let preSellerBalance = await ethers.provider.getBalance(seller1.address);
      let preContractBalance = await escrow.getBalance();

      await escrow.connect(buyer1).confirmOrder(orders[0].id);
      orders = await escrow.getOrders();
      assert.equal(orders[0].state, confirmed);

      let postSellerBalance = await ethers.provider.getBalance(seller1.address);
      let postContractBalance = await escrow.getBalance();

      // Check if sellers receives the right amount
      let expectedAmountSent = weiToEther(postSellerBalance.sub(preSellerBalance));
      expect(expectedAmountSent.toString()).to.equal(rightAmount);

      // Check if smart contract sends the right amount
      expectedAmountSent = weiToEther(preContractBalance.sub(postContractBalance));
      expect(expectedAmountSent.toString()).to.equal(rightAmount);
    })

    it("Lets a seller delete a non-confirmed order and sends the right amount to the right buyer", async () => {
      let rightAmount = weiToEther(orders[1].amount);

      let preBuyerBalance = await ethers.provider.getBalance(buyer2.address);
      let preContractBalance = await escrow.getBalance();

      await escrow.connect(seller1).deleteOrder(orders[1].id);
      orders = await escrow.getOrders();
      assert.equal(orders[1].state, deleted);

      let postBuyerBalance = await ethers.provider.getBalance(buyer2.address);
      let postContractBalance = await escrow.getBalance();

      // Check if buyer receives the right amount
      let expectedAmountReceived = weiToEther(postBuyerBalance.sub(preBuyerBalance));
      expect(expectedAmountReceived.toString()).to.equal(rightAmount);

      // Check if smart contract sends the right amount
      let expectedAmountSent = weiToEther(preContractBalance.sub(postContractBalance));
      expect(expectedAmountSent.toString()).to.equal(rightAmount);
    })

    let gasSpent;
    let orderId0 = 0;
    let orderId1 = 1;
    let lowerAmountOrderId0 = '0.01';
    let higherAmountOrderId1 = '0.5';
    let acceptable_Eth_Lost_On_RevertedTx = 0.0001;

    async function performRefund(_buyer, _seller, _order, _amount) {
      // _buyer calls the function and spends something in fees;
      // We must calculate the fee or the final result will be wrong.
      let response = await escrow.connect(_buyer).askRefund(_order.id);
      let gasSpentBuyer = await getGas(response);
      let balancePreRevertedTx, balancePostRevertedTx, revertedGas;
      orders = await escrow.getOrders();
      assert.equal(orders[_order.id].state, refundAsked);
      
      if (_amount == weiToEther(orders[_order.id].amount)) {
        response = await escrow.connect(_seller).refundBuyer(_order.id, {value: ethers.utils.parseEther(_amount)});
        orders = await escrow.getOrders();
        assert.equal(orders[_order.id].state, refunded);
      } else {
        balancePreRevertedTx = await ethers.provider.getBalance(_seller.address);
        response = escrow.connect(_seller).refundBuyer(_order.id, {value: ethers.utils.parseEther(_amount)});
        expect(response).to.be.reverted;
        orders = await escrow.getOrders();
        assert.equal(orders[_order.id].state, refundAsked);
        balancePostRevertedTx = await ethers.provider.getBalance(_seller.address);
      }
      
      if (balancePreRevertedTx) {
        revertedGas = balancePreRevertedTx.sub(balancePostRevertedTx);
      }

      return [gasSpentBuyer,revertedGas];
    }

    it("Lets a seller refund a buyer who asked the refund AFTER confirmation, sending him the right amount", async () => {
      let rightAmount = weiToEther(orders[orderId1].amount);
      // buyer confirms the order before asking the refund
      await escrow.connect(buyer2).confirmOrder(orderId1);
      expect(escrow.connect(seller1).deleteOrder(orderId1)).to.be.reverted;

      let preBuyerBalance = await ethers.provider.getBalance(buyer2.address);
      let preContractBalance = await escrow.getBalance();

      gasSpent = await performRefund(buyer2, seller1, orders[orderId1], rightAmount);

      let postBuyerBalance = await ethers.provider.getBalance(buyer2.address);
      let postContractBalance = await escrow.getBalance();

      // Check if buyer receives the right amount (we subtract the fees too).
      let expectedAmountReceived = weiToEther(postBuyerBalance.sub(preBuyerBalance.sub(gasSpent[0])));
      expect(expectedAmountReceived.toString()).to.equal(rightAmount);

      // Check if smart contract balance stays untouched
      let expectedAmountContract = weiToEther(preContractBalance.sub(postContractBalance));
      expect(expectedAmountContract.toString()).to.be.equal('0.0');
    })

    it("Reverts a refund call if buyer doesn't send money / sends the wrong amount, and the amount (if sent) is sent back", async () => {
      // ORDER ID == 1
      // buyer confirms the order before asking the refund
      await escrow.connect(buyer1).confirmOrder(orderId0);
      let preSellerBalance = await ethers.provider.getBalance(seller1.address);
      // Seller sends more than the right amount
      gasSpent = await performRefund(buyer1, seller1, orders[orderId0], higherAmountOrderId1);
      let postSellerBalance = await ethers.provider.getBalance(seller1.address);

      let revertedGas = weiToEther(gasSpent[1]);
      // string to float conversion
      revertedGas = parseFloat(revertedGas);
      
      // Here we demonstate revertedGas is a really small amount of ETH
      assert(revertedGas < acceptable_Eth_Lost_On_RevertedTx);

      expect(postSellerBalance).to.equal(preSellerBalance.sub(gasSpent[1]));

      // ORDER ID == 0
      // buyer confirms the order before asking the refund
      await escrow.connect(buyer2).confirmOrder(orderId1);
      preSellerBalance = await ethers.provider.getBalance(seller1.address);
      // Seller sends less than the right amount
      gasSpent = await performRefund(buyer2, seller1, orders[orderId1], lowerAmountOrderId0);
      postSellerBalance = await ethers.provider.getBalance(seller1.address);

      revertedGas = weiToEther(gasSpent[1]);
      // string to float conversion
      revertedGas = parseFloat(revertedGas);
      
      // Here we demonstate revertedGas is a really small amount of ETH
      assert(revertedGas < acceptable_Eth_Lost_On_RevertedTx);

      expect(postSellerBalance).to.equal(preSellerBalance.sub(gasSpent[1]));
    })
  })

  describe('Getters', async () => {
    it("Returns all orders of a buyer given his address", async () => {
      let ordersBuyer1 = await escrow.getOrdersOfUser(buyer1.address);
      assert(ordersBuyer1.length > 0);
      expect(ordersBuyer1[0].buyer).to.equal(buyer1.address);
    })

    it("Returns all orders of a seller given his address", async () => {
      let ordersSeller1 = await escrow.getOrdersOfUser(seller1.address);
      assert(ordersSeller1.length > 0);
      expect(ordersSeller1[0].seller).to.equal(seller1.address);
    })

    it("Reverts if asking orders of unregistered user", async () => {
      expect(escrow.getOrdersOfUser(buyer3.address)).to.be.revertedWith("This user is not registered in our platform.");
    })

    it("Returns the right number of sellers", async () => {
      let nSellers = await escrow.getTotalSellers();
      expect(nSellers).to.equal(registeredSellers);
    })
  })
})