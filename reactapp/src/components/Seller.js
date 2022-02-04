import React from "react";
import { Header } from './Header';
import { Orders } from "./Orders";

export function Seller({currentAddress, balance, contractBalance, orders, deleteOrder, confirmRefund, totalOrders}) {
  return (
    <div>
        <Header currentAddress={currentAddress}
                balance={balance}
        />

        <div>
          <p>Smart Contract balance: {contractBalance}</p>
        </div>

        <div className="box">
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
        
        {/* <div className="box">
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
        </div> */}
        
        <div className="box">
          <h2>Orders</h2>
          <p>Total orders: {totalOrders}</p>
        </div>

        {/* AL POSTO DEL PULSANTE IMPLEMENTARE LISTA */}
        <Orders orders={orders}/>
    </div>
  );
}