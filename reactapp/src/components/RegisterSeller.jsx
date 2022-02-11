import React, { useEffect } from "react";
import { Header } from './Header';

import { ethers } from "ethers";
import Escrow from "../contracts/escrow.json";

const ourNetwork = "fuji";

const networks = {
  "fuji": {
      chainId: "0xa869",
      chainName: "Avalanche Fuji Testnet",
      nativeCurrency: {
          name: "AVAX",
          symbol: "AVAX",
          decimals: 18
      },
      rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
      blockExplorerUrls: ["https://testnet.snowtrace.io/"]
  }
};

export class RegisterSeller extends React.Component {
  constructor(props) {
    super(props);
    
    this.initialState = {
        currentAddress: undefined,
        balance: undefined,
        contractAddress: "0x1648471B1b56bd703de37216Aa298077628Dcf27",
    };

    this.state = this.initialState;
  }

  render() {
    return (
      <div>
        <Header currentAddress={this.state.currentAddress}
                balance={this.state.balance}
        />
        <div className="container">
          <div className="box register-seller">
            <h2>Register to our platform as a Seller</h2>
            <button onClick={() => this._registerSeller()} className="cta-button basic-button register-button blur">Register</button>
          </div>
        </div>
      </div>
    );
  }

  async _refreshInfo(tx) {
    const receipt = await tx.wait();
    if (receipt.status) {
        this._initializeOrders();
        this._updateBalance();
    }
  }

  async _registerSeller() {
    try {
        const tx = await this._contract.registerAsSeller();
        this._refreshInfo(tx);
    } catch(err) {
        console.log(err);
    }
  }

  componentDidMount() {
    this._connectWallet();
    this._setListenerMetamaksAccount();
  }

  _initialize(userAddress) {
    this._initializeEthers();
    this.setState({
      currentAddress: userAddress,
    });
    this._updateBalance();
    return userAddress;
  }

  async _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    this._contract = new ethers.Contract(
      this.state.contractAddress,
      Escrow.abi,
      this._provider.getSigner(0)
    );
  }

  async _setAddress() {
    const [currentAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    this._initialize(currentAddress);
  }

  async _changeNetwork(networkName) {
    try {
      if (!window.ethereum) throw new Error("No crypto wallet found");
      await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
              {
                  ...networks[networkName]
              }
          ]
      });
      await this._setAddress();
    } catch (err) {
      console.log(err.message);
    }
  };

  async _setListenerMetamaksAccount() {
    window.ethereum.on('accountsChanged', async () => {
      this._connectWallet();
    })
  }

  async _connectWallet() {
    window.ethereum.on('chainChanged', async (chainId) => {
      if (chainId !== networks[ourNetwork].chainId) {
          await this._changeNetwork(ourNetwork);
      } else {
          await this._setAddress();
      }
    });
    if (window.ethereum.chainId !== ourNetwork) {
      await this._changeNetwork(ourNetwork);
    } else {
      window.ethereum.on('accountsChanged', function (accounts) {
        this._getAccount();
      })
    }
    await this._setAddress();
  }

  async _updateBalance() {
    const balanceInWei = await this._provider.getBalance(this.state.currentAddress, "latest");
    const balanceInAvax = ethers.utils.formatEther(balanceInWei);
    const balance = balanceInAvax.toString()+" AVAX";
    this.setState({ balance });
  }
}
