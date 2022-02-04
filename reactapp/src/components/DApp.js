import '../App.css';
import React from "react";
import { ethers } from "ethers";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Buyer } from './Buyer';
import { Seller } from './Seller';

import Escrow from "../contracts/escrow.json";

// Set the order price (msg.value)
const orderAmount = "0.02";
// Fuji ID

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

const ourNetwork = "fuji";

export class DApp extends React.Component {
    constructor(props) {
        super(props);
        
        this.initialState = {
            currentAddress: undefined,
            sellerAddress: undefined,
            balance: undefined,
            contractAddress: "0xacC2170f9e3D2C0AE40d9FD39256fAa33801A9f6",
            tokenData: undefined,
            orders: undefined,
            totalOrders: undefined,
            getQRCode: undefined,
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
                        orders={this.state.orders}
                        askRefund={(id) => this._askRefund(id)}
                />
            );
        } else {
            return (
                <Seller currentAddress={this.state.currentAddress}
                        balance={this.state.balance}
                        seller={this.state.sellerAddress}
                        orders={() => this._initializeOrders()}
                        deleteOrder={(id) => this._deleteOrder(id)}
                        confirmRefund={(id) => this._confirmRefund(id)}
                        createOrder={() => this._createOrder()}
                        totalOrders={() => this._getTotalOrders()}
                        getQRCode={() => this._getQRCode()}
                        orderAmount={orderAmount}
                />
            );
        }
    };

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

    async _connectWallet() {
        window.ethereum.on('chainChanged', async (chainId) => {
            if (chainId != networks[ourNetwork].chainId) {
                await this._changeNetwork(ourNetwork);
            } else {
                await this._setAddress();
            }
        });
        if (window.ethereum.chainId != ourNetwork) {
            await this._changeNetwork(ourNetwork);
        } else {
            window.ethereum.on("accountsChanged", ([newAddress]) => {
                if (newAddress === undefined) {
                    return this._resetState();
                }
            });
        }
        await this._setAddress();
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
        this.setState({ sellerAddress });
    }

    async _updateBalance() {
        const balanceInWei = await this._provider.getBalance(this.state.currentAddress, "latest");
        const balanceInAvax = ethers.utils.formatEther(balanceInWei);
        const balance = balanceInAvax.toString()+" AVAX";
        this.setState({ balance });
    }

    async _initializeOrders() {
        const orders = await this._contract.getOrders();
        this.setState({ orders });
        console.log(orders);
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
            const overrides = {
                value: ethers.utils.parseEther(orderAmount),
            }
            await this._contract.createOrder(overrides);
        } catch(err) {
            console.log(err);
        }
    }

    async _getTotalOrders() {
        const totalOrders = await this._contract.getTotalOrders();
        this.setState({ totalOrders });
        console.log(totalOrders);
    }

    async _getQRCode() {
        const orders = await this._contract.getOrders();
        const lastOrder = orders.at(-1);
        const lastOrder_id = lastOrder.id;
        const orderQRCode = "localhost:3000/confirm-order?id="+lastOrder_id;
        var QRCode = require('qrcode')
        var canvas = document.getElementById('qrcode')
        QRCode.toCanvas(canvas, orderQRCode, function (error) {
            if (error) console.error(error)
            console.log('QRCode created: '+orderQRCode);
        })
    }
}