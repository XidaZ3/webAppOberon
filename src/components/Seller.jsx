import React from "react";
import { Header } from './Header';
import { Orders } from "./Orders";

export function Seller({currentAddress, balance, orders, deleteOrder, refundBuyer, getQRCode, State}) {

  let options;

  return (
    <div>
      <Header currentAddress={currentAddress}
              balance={balance}
      />
      <div className="container">
        <div className="content-and-qrcode">
          <div className="box top">
            <h2>Seller View</h2>
            <form onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.target);
                const id = formData.get("orderIDs");
                if(id)
                  deleteOrder(id);
              }}>
              <div className="button-label-select">
                <input className="cta-button basic-button blur" type="submit" value="Delete Order" />
                <label className="label-selectBox">Order to delete:</label>
                <select id="orderIDs" name="orderIDs" className="blur">
                  {(() => {
                    if (orders.length) {
                      options = orders.map((element) => (
                        (() => {
                          if (State[element[4]] == "Created") {
                            return  <option key={element[0].toString()} value={element[0].toString()}>
                                      {element[0].toString()}
                                    </option>
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
                const element = formData.get("orderIDs").split(',');
                let orderAmount = element[3];
                let id = element[0];
                if(id)
                  refundBuyer(id, orderAmount);
              }}>
              <div className="button-label-select">
                {(() => {
                  if (orders.length) {
                    options = orders.map((element) => (
                      (() => {
                        if (State[element[4]] == "Asked Refund") {
                          return <option key={element[0].toString()} value={element}>{element[0].toString()}</option>
                        }
                      })()
                    ))
                  }
                })()}
                <input className="cta-button basic-button blur" type="submit" value="Refund Order"/>
                <label className="label-selectBox">Order to refund:</label>
                <select id="orderIDs" name="orderIDs" className="blur">
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

        <Orders orders={orders} isBuyer={false} State={State}/>
      </div>
    </div>
    
  );
}