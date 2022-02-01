import '../App.css';
import React from "react";
import { ethers } from "ethers";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Buyer } from './Buyer';
import { Seller } from './Seller';

import Escrow from "../contracts/escrow.json";

export class DApp extends React.Component {
    constructor(props) {
        super(props);

        this.initialState = {
            currentAddress: undefined,
            sellerAddress: undefined,
            balance: undefined,
            contractAddress: "0xe73d709355212E7CEe78eD141E9db96f8324a248",
            tokenData: undefined,
            oreders: undefined,
        };

        this.state = this.initialState;
    }

    render() {
        if(window.ethereum === undefined) {
            return <NoWalletDetected/>;
        }

        if(!this.state.currentAddress) {
            return (
              <ConnectWallet connectWallet={() => this._connectWallet()}/>
            );
        }

        if(this.state.currentAddress === this.state.sellerAddress) {
            return (
                <Buyer  currentAddress={this.state.currentAddress}
                        balance={this.state.balance}
                        seller={this.state.sellerAddress}
                        orders={this.state.oreders}
                        askRefund={(id) => this._askRefund(id)}
                />
            );
        } else {
            return (
                <Seller currentAddress={this.state.currentAddress}
                        balance={this.state.balance}
                        seller={this.state.sellerAddress}
                        orders={this.state.oreders}
                        deleteOrder={(id) => this._deleteOrder(id)}
                        confirmRefund={(id) => this._confirmRefund(id)}
                        createOrder={() => this._createOrder()}
                />
            );
        }
    }

    async _connectWallet() {
        const [currentAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this._initialize(currentAddress);
        window.ethereum.on("accountsChanged", ([newAddress]) => {
            if (newAddress === undefined) {
                return this._resetState();
            }
            this._initialize(newAddress);
        });
        
        window.ethereum.on("chainChanged", ([chainId]) => {
            this._resetState();
        });
    }

    _initialize(userAddress) {
        this.setState({
          currentAddress: userAddress,
        });

        this._intializeEthers();
        this._initializeSeller();
        this._updateBalance();
    }

    async _intializeEthers() {
        this._provider = new ethers.providers.Web3Provider(window.ethereum);
    
        this._contract = new ethers.Contract(
          this.state.contractAddress,
          Escrow.abi,
          this._provider.getSigner(0)
        );
    }

    async _initializeSeller() {
        const sellerAddress = await this._contract.getSeller();
        this.setState({ sellerAddress});
    }

    async _updateBalance() {
        const balance = (await this._provider.getBalance(this.state.currentAddress, "latest")).toString();
        this.setState({ balance });
    }

    async _initializeOrders() {
        const orders = await this._contract.getOreders();
        this.setState({ orders });
    }

    async _deleteOrder(id) {
        try {
            await this._contract.deleteOrder(id);
        } catch(err) {
            console.log(err);
        }
    }

    async _askRefund(id) {
        try {
            await this._contract.askRefund(id);
        } catch(err) {
            console.log(err);
        }
    }

    async _confirmRefund(id) {
        try {
            await this._contract.refundBuyer(id);
        } catch(err) {
            console.log(err);
        }
    }

    async _createOrder() {
        try {
            await this._contract.createOrder();
        } catch(err) {
            console.log(err);
        }
    }
}