import React from "react";
import { ethers } from "ethers";
import avaxLogo from "../assets/avaxLogoMin.png";

export function Orders({orders, isBuyer}) {

  let content, view, i, amount, totalHeldForSeller=0;

  let n = 6;

  if (isBuyer) {
    i = 2;
    view = "Seller";
  }
  else {
    i = 1;
    view = "Buyer"
  }

  const State = ['Created', 'Confirmed', 'Deleted', 'Asked Refund', 'Refunded'];

  if (orders.length) {
    content = orders.map((element) => (
      <tr key={element[0].toString()}>
        <td>{element[0].toString()}</td>
        <td>
          {
            element[i].toString().substring(0,n)
            +"..."+
            element[i].toString().substring(
              element[i].toString().length-n,
              element[i].toString().length
            )
          }
        </td>
        {(() => {
          amount = ethers.utils.formatEther(element[3].toString());
        })()}
        <td>{amount}</td>
        <td>{State[element[4]]}</td>
        {(() => {
          if(State[element[4]] == "Created" || State[element[4]] == "Asked Refund") {
            totalHeldForSeller += parseFloat(amount)
          }
        })()}
      </tr>
    ))
  }

  return (
    <div className="box">
        <div className="tableLabel">
          <h2>Order List</h2>
          <p className="TVL">Your TVL: {totalHeldForSeller.toFixed(4)}<img src={avaxLogo} className="avaxLogoMin" alt="avax logo"/></p>
        </div>
      <table className="orderTable blur">
        <thead>
          <tr>
            <th>OrderID</th>
            <th>{view} Address</th>
            <th>Amount <img src={avaxLogo} className="avaxLogoMin" alt="avax logo"/></th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {content}
        </tbody>
      </table>
    </div>
  );

}