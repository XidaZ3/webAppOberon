import '../App.css';
import React from "react";

import { ethers } from "ethers";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Buyer } from './Buyer';
import { Seller } from './Seller';
import { Loading } from './Loading';

import Escrow from "../contracts/escrow.json";

const orderAmount = "0.03";
const ourNetwork = "fuji";
const selectedSeller = 0;
const State = ['Created', 'Confirmed', 'Deleted', 'Asked Refund', 'Refunded'];

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
            contractAddress: "0x1648471B1b56bd703de37216Aa298077628Dcf27",
            orders: undefined,
            totalOrders: undefined,
            getQRCode: undefined,
            userIsBuyer: false,
        };

        this.state = this.initialState;
    }

    componentDidMount() {
        this._setListenerMetamaksAccount();
    }

    componentWillUnmount() {
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

        if(this.state.userIsBuyer) {
            return (
                <Buyer  currentAddress={this.state.currentAddress}
                        balance={this.state.balance}
                        seller={this.state.sellerAddress}
                        orders={this.state.orders}
                        askRefund={(id) => this._askRefund(id)}
                        createOrder={() => this._createOrder()}
                        confirmOrder={(id) => this._confirmOrder(id)}
                        orderAmount={orderAmount}
                        getQRCode={(id) => this._getQRCode(id)}
                        State={State}
                />
            );
        } else {
            return (
                <Seller currentAddress={this.state.currentAddress}
                        balance={this.state.balance}
                        orders={this.state.orders}
                        deleteOrder={(id) => this._deleteOrder(id)}
                        refundBuyer={(id, orderAmount) => this._refundBuyer(id, orderAmount)}
                        getQRCode={(id) => this._getQRCode(id)}
                        State={State}
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

    _setListenerMetamaksAccount() {
        window.ethereum.on('accountsChanged', async () => {
            this._connectWallet();
        })
    }

    _setListenerMetamaksAccount() {
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
        }
        await this._setAddress();
    }

    _initialize(userAddress) {
        this._initializeEthers();
        this.setState({
            currentAddress: userAddress,
        });
        this._initializeSeller();
        this._getContractBalance();
        this._getTotalOrders();
        this._initializeOrders();
        this._updateBalance();
        this._removeQRCode();
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
        const sellerAddresses = await this._getSellers();
        let sellerAddress = sellerAddresses[selectedSeller];
        this.setState({ sellerAddress });
        this._userIsBuyer();
    }

    async _updateBalance() {
        const balanceInWei = await this._provider.getBalance(this.state.currentAddress, "latest");
        const balanceInAvax = ethers.utils.formatEther(balanceInWei);
        const balance = balanceInAvax.toString();
        this.setState({ balance });
    }

    async _userIsBuyer() {
        const userIsBuyer = this.state.currentAddress.toLowerCase() !== this.state.sellerAddress.toLowerCase();
        this.setState({ userIsBuyer });
    }

    async _getSellers() {
        const sellerAddresses = await this._contract.getSellers();
        return sellerAddresses;
    }

    async _refreshInfo(tx) {
        const receipt = await tx.wait();
        if (receipt.status) {
            this._initializeOrders();
            this._updateBalance();
        }
    }

    async _initializeOrders() {
        let orders = [];
        try {
            orders = await this._contract.getOrdersOfUser(this.state.currentAddress);
        } catch (error) {
            console.log(error);
        }
        this.setState({ orders });
    }
    
    async _createOrder() {
        try {
            const overrides = {
                value: ethers.utils.parseEther(orderAmount),
            }
            const tx = await this._contract.createOrder(this.state.sellerAddress, overrides);
            const receipt = await tx.wait();
            if (receipt.status) {
                this._initializeOrders();
                this._updateBalance();
                this._getQRCode(-1);
            }
        } catch(err) {
            console.log(err);
        }
    }

    async _confirmOrder(id) {
        try {
            const tx = await this._contract.confirmOrder(id);
            this._refreshInfo(tx);
        } catch(err) {
            console.log(err);
        }
    }

    async _deleteOrder(id) {
        try {
            const tx = await this._contract.deleteOrder(id);
            this._refreshInfo(tx);
        } catch(err) {
            console.log(err);
        }
    }

    async _askRefund(id) {
        try {
            const tx = await this._contract.askRefund(id);
            this._refreshInfo(tx);
        } catch(err) {
            console.log(err);
        }
    }

    async _refundBuyer(id, orderAmount) {
        try {
            const overrides = {
                value: orderAmount,
            }
            const tx = await this._contract.refundBuyer(id, overrides);
            this._refreshInfo(tx);
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

    async _getQRCode(index) {
        const orders = await this._contract.getOrdersOfUser(this.state.currentAddress);
        const lastOrder = orders.at(parseInt(index));
        const lastOrder_id = lastOrder.id;
        const orderQRCode = "localhost:3000/confirm-order?id="+lastOrder_id;
        var QRCode = require('qrcode')
        var canvas = document.getElementById('qrcode')
        var opts = {
            margin: 1,
            color: {
                dark:"#131313",
                light:"#e7e7e7"
            }
        }
        QRCode.toCanvas(canvas, orderQRCode, opts, function (error) {
            if (error) console.error(error)
        })
    }

    async _removeQRCode() {
        let qrcode = document.getElementById('qrcode');
        try {
            var context = qrcode.getContext('2d');
            context.clearRect(0, 0, qrcode.width, qrcode.height);
        } catch (error) {
            console.log(error);
        }
    }
}