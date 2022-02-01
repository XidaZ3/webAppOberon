import React from "react";
import { Header } from './Header';
import { Orders } from "./Orders";

export function Buyer({currentAddress, balance, seller, orders, askRefund}) {
  console.log("Buyer");
  return (
    <div>
        <Header currentAddress={currentAddress}
                balance={balance}
                seller={seller}
        />
        <Orders orders={orders}/>
        <div className="container">
          <h2>Refund Ordine</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const id = formData.get("id");
            if(id)
              askRefund(id);
          }}>
          <label>Id ordine che si vuole chiedere il reso: </label>
          <input type="text" name="id" required /> <br/>
          <input className="cta-button ask-refund-button" type="submit" value="Chiedi reso" />
          </form>
        </div>
    </div>
  );
}