import React from "react";
import { Header } from './Header';
import { Orders } from "./Orders";
import avaxLogo from "../assets/avaxLogoMin.png";

export function Buyer({currentAddress, balance, seller, orders, askRefund, createOrder, confirmOrder, orderAmount, getQRCode, State}) {

  let options = "";

  let n = 6;
  let sellerAddress = seller.substring(0,n) + "..." + seller.substring(seller.length-n, seller.length);

  return (
    <div>
      <Header currentAddress={currentAddress}
              balance={balance}
      />
      <div className="container">
        <div className="content-and-qrcode">
          <div className="box top">
            <h2>Buyer view</h2>
            <p>Seller address: &nbsp; {sellerAddress}</p>
            <button onClick={createOrder} className="cta-button basic-button blur">Create order ({orderAmount}<img src={avaxLogo} className="avaxLogoMin" alt="avax logo"/>)</button>
            <form onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.target);
                const id = formData.get("orderIDs");
                if(id)
                  askRefund(id);
              }}>
              <div className="button-label-select">
                <input className="cta-button basic-button blur" type="submit" value="Ask refund" />
                <label className="label-selectBox">Order to ask for refund:</label>
                <select id="orderIDs" name="orderIDs" className="blur">
                  {(() => {
                    if (orders.length) {
                      options = orders.map((element) => (
                        (() => {
                          if (State[element[4]] == "Created" || State[element[4]] == "Confirmed") {
                            return <option key={element[0].toString()} value={element[0].toString()}>{element[0].toString()}</option>
                          }
                        })()
                      ))
                    }
                  })()}
                  {options}
                </select>
              </div>
            </form>
            <form onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.target);
                const id = formData.get("orderIDs");
                if(id)
                  confirmOrder(id);
              }}>
              <div className="button-label-select">
                <input className="cta-button basic-button blur" type="submit" value="Confirm order" />
                <label className="label-selectBox">Order to confirm:</label>
                <select id="orderIDs" name="orderIDs" className="blur">
                  {(() => {
                    if (orders.length) {
                      options = orders.map((element) => (
                        (() => {
                          if (State[element[4]] == "Created") {
                            return <option key={element[0].toString()} value={element[0].toString()}>{element[0].toString()}</option>
                          }
                        })()
                      ))
                    }
                  })()}
                  {options}
                </select>
              </div>
            </form>
            <form onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.target);
                const id = formData.get("orderIDs");
                if(id)
                  getQRCode(id);
              }}>
              <div className="button-label-select">
                <input className="cta-button basic-button blur" type="submit" value="Get QRCode" />
                <label className="label-selectBox">Order to get QRCode:</label>
                <select id="orderIDs" name="orderIDs" className="blur">
                  {(() => {
                    if (orders.length) {
                      options = orders.map((element, index) => (
                        <option key={element[0].toString()} value={index}>{element[0].toString()}</option>
                      ))
                    }
                  })()}
                  {options}
                </select>
              </div>
            </form>
          </div>
          <div id="qrcode-container" className="blur">
            <h2>QRCode</h2>
            <canvas id="qrcode"></canvas>
          </div>
        </div>

        <Orders orders={orders} isBuyer={true} State={State}/>
      </div>
    </div>
  );

}