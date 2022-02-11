import React from "react";

export function ConnectWallet({ connectWallet }) {
  return (
    <div id="connectWallet">
      <p>Please connect your wallet.</p>
      <button
        className="cta-button basic-button blur"
        type="button"
        onClick={connectWallet}
      >
      Connect Wallet
      </button>
    </div>
  );
}