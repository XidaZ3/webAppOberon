import React from "react";
import { NavLink } from "react-router-dom";
import avaxLogo from "../assets/avaxLogoMin.png";

export function Header({currentAddress, balance}) {

  currentAddress = String(currentAddress)

  let n = 6;
  let address = currentAddress.substring(0,n)+ "..." +currentAddress.substring(currentAddress.length-n, currentAddress.length);

  return (
    <header>
      <div className="navigation">
        <nav className="navbar navbar-expand navbar-dark blur">
            <NavLink className="navbar-brand" to="/">
              ShopChain
            </NavLink>
            <NavLink className="nav-link" to="/register-seller">
              Register as a Seller
            </NavLink>
            <div className="user-data nav-item">
              <p>Address: &nbsp; {address}</p>
              <p>Balance: &nbsp; {parseFloat(balance).toFixed(4)}<img src={avaxLogo} className="avaxLogoMin" alt="avax logo"/></p>
            </div>
        </nav>
      </div>
    </header>
  );
}