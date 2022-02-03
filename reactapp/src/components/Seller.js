import React from "react";
import { Header } from './Header';
import { Orders } from "./Orders";

export function Seller({currentAddress, balance, seller, orders, deleteOrder, confirmRefund, createOrder, totalOrders, getQRCode, orderAmount}) {
  console.log("Seller");
  return (
    <div>
        <Header currentAddress={currentAddress}
                balance={balance}
                seller={seller}
        />

        <div class="box">
          <h2>Delete Order</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const id = formData.get("id");
            if(id)
              deleteOrder(id);
          }}>
          <label>Order ID to delete: </label>
          <input type="text" name="id" required /> <br/>
          <input className="cta-button delete-button" type="submit" value="Delete order" />
          </form>
        </div>
        
        <div class="box">
          <h2>Confirm refund</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const id = formData.get("id");
            if(id)
              confirmRefund(id);
          }}>
          <label>Order ID to confirm refund: </label>
          <input type="text" name="id" required /> <br/>
          <input className="cta-button confirm-refund-button" type="submit" value="Confirm refund" />
          </form>
        </div>
        
        <div class="box">
          <h2>Order Management</h2>
          <button onClick={createOrder} className="cta-button create-button">Create order ({orderAmount} AVAX)</button>
          <button onClick={totalOrders} className="cta-button create-button">Total orders</button>
          <button onClick={orders} className="cta-button create-button">Orders List</button>
          <button onClick={getQRCode} className="cta-button create-button">QRCode last order</button>
        </div>
        
        <canvas id="qrcode"></canvas>

    </div>
  );
}