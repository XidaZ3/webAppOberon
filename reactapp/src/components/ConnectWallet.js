import React from "react";

export function ConnectWallet({ connectWallet }) {
  return (
    <div className="container">
      <p>Per favore collega il tuo wallet.</p>
      <button
        className="cta-button connect-wallet-button"
        type="button"
        onClick={connectWallet}
      >
      Connetti Wallet
      </button>
    </div>
  );
}