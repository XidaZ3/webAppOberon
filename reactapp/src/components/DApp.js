import '../App.css';
import React from "react";
import { ethers } from "ethers";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Buyer } from './Buyer';
import { Seller } from './Seller';
import { Loading } from './Loading';

import Escrow from "../contracts/escrow.json";

const orderAmount = "0.02";
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

export class DApp extends React.Component {
    constructor(props) {
        super(props);
        
        this.initialState = {
            currentAddress: undefined,
            sellerAddress: undefined,
            balance: undefined,
            contractBalance: undefined,
            contractAddress: "0xacC2170f9e3D2C0AE40d9FD39256fAa33801A9f6",
            tokenData: undefined,
            orders: undefined,
            totalOrders: undefined,
            getQRCode: undefined,
            userIsBuyer: false,
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

        if(!this.state.orders || !this.state.balance) {
            return (
                <Loading/>
            );
        }

        /*PROVVISORIO
        return (
            <Seller currentAddress={this.state.currentAddress}
                    balance={this.state.balance}
                    contractBalance={this.state.contractBalance}
                    orders={this.state.orders}
                    deleteOrder={(id) => this._deleteOrder(id)}
                    confirmRefund={(id) => this._confirmRefund(id)}
                    totalOrders={this.state.totalOrders}
            />
        );*/

        if(this.state.userIsBuyer) {
            return (
                <Buyer  currentAddress={this.state.currentAddress}
                        balance={this.state.balance}
                        seller={this.state.sellerAddress}
                        orders={this.state.orders}
                        askRefund={(id) => this._askRefund(id)}
                        createOrder={() => this._createOrder()}
                        orderAmount={orderAmount}
                        getQRCode={() => this._getQRCode()}
                />
            );
        } else {
            return (
                <Seller currentAddress={this.state.currentAddress}
                        balance={this.state.balance}
                        contractBalance={this.state.contractBalance}
                        orders={() => this._initializeOrders()}
                        deleteOrder={(id) => this._deleteOrder(id)}
                        confirmRefund={(id) => this._confirmRefund(id)}
                        totalOrders={this.state.totalOrders}
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
            if (chainId !== networks[ourNetwork].chainId) {
                await this._changeNetwork(ourNetwork);
            } else {
                await this._setAddress();
            }
        });
        if (window.ethereum.chainId !== ourNetwork) {
            await this._changeNetwork(ourNetwork);
        } else {
            window.ethereum.on("accountsChanged", async ([newAddress]) => {
                if (newAddress === undefined) {
                    console.log("ERROR");
                } else {
                    await this._setAddress();
                }
            });
        }
        await this._setAddress();
    }

    _initialize(userAddress) {
        this._initializeEthers();
        this._initializeOrders();
        this._userIsBuyer();
        if (!this.state.userIsBuyer) {
            this._getContractBalance();
            this._getTotalOrders();
        }
        this.setState({
          currentAddress: userAddress,
        });
        this._initializeSeller();
        this._updateBalance();
    }

    async _initializeEthers() {
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

    async _userIsBuyer() {
        const userIsBuyer = this.state.currentAddress !== this.state.sellerAddress;
        this.setState({ userIsBuyer });
    }

    async _initializeOrders() {
        // TODO (first inside smart contract)
        // if is buyer --> take buyer orders
        // else --> take all seller orders
        const orders = await this._contract.getOrders();
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
            const overrides = {
                value: ethers.utils.parseEther(orderAmount),
            }
            await this._contract.createOrder(overrides);
        } catch(err) {
            console.log(err);
        }
    }

    async _getTotalOrders() {
        var totalOrders = await this._contract.getTotalOrders();
        totalOrders = totalOrders.toNumber();
        this.setState({ totalOrders });
    }

    async _getContractBalance() {
        var contractBalance = await this._contract.getBalance();
        const contractBalanceInAvax = ethers.utils.formatEther(contractBalance);
        contractBalance = contractBalanceInAvax.toString()+" AVAX";
        this.setState({ contractBalance });
    }

    async _getQRCode() {
        // TODO: QRCode with id given
        const orders = await this._contract.getOrders();
        const lastOrder = orders.at(-1);
        const lastOrder_id = lastOrder.id;
        const orderQRCode = "localhost:3000/confirm-order?id="+lastOrder_id;
        var QRCode = require('qrcode')
        var canvas = document.getElementById('qrcode')
        QRCode.toCanvas(canvas, orderQRCode, function (error) {
            if (error) console.error(error)
        })
    }
}