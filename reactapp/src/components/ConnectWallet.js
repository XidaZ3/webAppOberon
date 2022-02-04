import React from "react";

export function ConnectWallet({ connectWallet }) {
  return (
    <div>
      <p>Please connect your wallet.</p>
      <button
        className="cta-button connect-wallet-button"
        type="button"
        onClick={connectWallet}
      >
      Connect Wallet
      </button>
    </div>
  );
}