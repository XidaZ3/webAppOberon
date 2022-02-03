import React from "react";
import { Header } from './Header';
import { Orders } from "./Orders";

export function Seller({currentAddress, balance, seller, orders, deleteOrder, confirmRefund, createOrder, totalOrders, getQRCode}) {
  console.log("Seller");
  return (
    <div>
        <Header currentAddress={currentAddress}
                balance={balance}
                seller={seller}
        />
        <div className="container">
          <h2>Cancella Ordine</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const id = formData.get("id");
            if(id)
              deleteOrder(id);
          }}>
          <label>ID ordine che si vuole cancellare: </label>
          <input type="text" name="id" required /> <br/>
          <input className="cta-button delete-button" type="submit" value="Cancella ordine" />
          </form>

          <h2>Conferma richiesta di reso</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const id = formData.get("id");
            if(id)
              confirmRefund(id);
          }}>
          <label>Id ordine che di cui si vuole confermare il reso: </label>
          <input type="text" name="id" required /> <br/>
          <input className="cta-button confirm-refund-button" type="submit" value="Conferma reso" />
          </form>

          <button onClick={createOrder} className="cta-button create-button">Crea nuovo ordine</button>
          <button onClick={totalOrders} className="cta-button create-button">Total orders</button>
          <button onClick={orders} className="cta-button create-button">Orders List</button>
          <button onClick={getQRCode} className="cta-button create-button">QRCode ultimo ordine effettuato</button>
          <canvas id="canvas"></canvas>

        </div>
    </div>
  );
}