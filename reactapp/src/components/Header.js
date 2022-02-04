import React from "react";
import logo from "../assets/logo.jpg";

export function Header({currentAddress, balance, seller}) {
  return (
    <header>
        <div className='main-app'>
            {/* <img id="logo" alt="Logo Team Oberon" src={logo}></img> */}
            <h1>ShopChain</h1>
            <p>Current Address: {currentAddress} <br/>
            Current balance: {balance} <br/>
            Seller Address: {seller}</p>
        </div>
    </header>
  );
}