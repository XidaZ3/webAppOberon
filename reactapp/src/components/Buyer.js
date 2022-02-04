import React from "react";
import { Header } from './Header';
import { Orders } from "./Orders";

export function Buyer({currentAddress, balance, seller, orders, askRefund, createOrder, orderAmount, getQRCode}) {
  return (
    <div>
        <Header currentAddress={currentAddress}
                balance={balance}
        />
        {/* <div className="box">
          <h2>Refund Order</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const id = formData.get("id");
            if(id)
              askRefund(id);
          }}>
          <label>Order ID to ask refund: </label>
          <input type="text" name="id" required /><br/>
          <input className="cta-button basic-button" type="submit" value="Chiedi reso" />
          </form>
        </div> */}

        <div>
          <p>Seller address: {seller}</p>
        </div>

        <div>
          <h2>Orders</h2>
          <button onClick={createOrder} className="cta-button basic-button">Create order ({orderAmount} AVAX)</button>
          <button onClick={getQRCode} className="cta-button basic-button">QRCode last order</button>
        </div>

        <canvas id="qrcode"></canvas>

        {/* <div className="box">
          <h2>Get QRCode</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const id = formData.get("id");
            if(id)
            getQRCode(id);
          }}>
          <label>Order ID you want to get the QRCode: </label>
          <input type="text" name="id" required /> <br/>
          <input className="cta-button basic-button" type="submit" value="Get QRCode" />
          </form>
          <canvas id="qrcode"></canvas>
        </div> */}

        {/* AL POSTO DEL PULSANTE IMPLEMENTARE LISTA */}
        <Orders orders={orders}/>
    </div>
  );
}