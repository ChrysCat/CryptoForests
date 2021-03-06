import { decorate, observable, action } from "mobx";
import Config from './Config';
import moment from 'moment';
import Lib from './Lib';

const ethers = require('ethers');
const utils = ethers.utils;
const BigNumber = ethers.BigNumber;
const URL_EXPLORER = 'https://explorer.testnet.rsk.co/tx/';
const URL_EXPLORER_TOKEN = 'https://explorer.testnet.rsk.co/address/';
const URL_EXPLORER_NFT = 'https://explorer.testnet.rsk.co/address/';
const CHAIN_ID = 31; // 4:RINKEBY 31:RSK TESTNET
const THETOKEN_JSON = require("./json/TheToken.json");
const THETOKEN_ABI = THETOKEN_JSON.abi;
const THETOKEN_ADDRESS = THETOKEN_JSON.networks[CHAIN_ID].address;
const THENFT_JSON = require("./json/TheNFT.json");
const THENFT_ABI = THENFT_JSON.abi;
const THENFT_ADDRESS = THENFT_JSON.networks[CHAIN_ID].address;

class TheManager {

  busy = false;
  coinAddress = false;
  coinSymbol = 'COIN';
  gasSymbol = 'RBTC';
  address = false;
  coinBalance = '0.0';
  realCoinBalance = '0.0';
  gasBalance = '0.0';
  gasLockedInPool = '0.0';
  totalSupply = '0.0';
  realTotalSupply = '0.0';
  startMultiplier = '0.0';
  endMultiplier = '0.0';
  currentMultiplier = '0.0';
  tickerBusy = false;
  blockTimestamp = 0;

  nftMintCost = '0.0';
  nftMintTokenCost = '0.0';
  nftCoinReward = '0.0';
  nftCoinAddress = '0.0';
  nftAddress = false;
  nftSymbol = 'NFT';
  nftBalance = '0';

  vendorTrees = [];
  ownedTrees = [];
  saleTrees = [];
  validatorTrees = [];

  constructor() {
    this.interval = setInterval(() => this.ticker(), 5000);
  }

  async ticker() {
    if (this.tickerBusy) return;
    this.tickerBusy = true;
    try {
      if (this.provider) {
        await this.refresh();
      }
    } catch (err) {
      console.error(err);
      console.error('ticker error!');
    }
    this.tickerBusy = false;
  }

  getPortis() {
    return portis;
  }

  async initWallet() {
    let provider;

    if (window.ethereum) {
      await window.ethereum.enable();
      provider = new ethers.providers.Web3Provider(window.ethereum);
    } else {
      throw new Error('metamask/nifty not installed');
    }

    const signer = provider.getSigner();
    const address = await signer.getAddress();

    let scAbi = THETOKEN_ABI;
    let scAddress = THETOKEN_ADDRESS;

    const scCoin = new ethers.Contract(scAddress, scAbi, signer);
    const coinSymbol = await scCoin.symbol();

    scAbi = THENFT_ABI;
    scAddress = THENFT_ADDRESS;

    const scNft = new ethers.Contract(scAddress, scAbi, signer);
    // const mintCost = await scNft.mintCost();
    // const mintTokenCost = await scNft.mintTokenCost();
    const nftCoinAddress = await scNft.tokenAddress();
    // const nftCoinReward = mintTokenCost.div(2);
    const nftSymbol = await scNft.symbol();

    this.address = address;
    this.coinAddress = scCoin.address;
    this.provider = provider;
    this.signer = signer;
    this.scCoin = scCoin;
    this.coinSymbol = coinSymbol;

    this.scNft = scNft;
    // this.nftMintCost = utils.formatEther(mintCost.toString());
    // this.nftMintTokenCost = utils.formatEther(mintTokenCost.toString());
    this.nftCoinAddress = nftCoinAddress;
    this.nftAddress = scNft.address;
    // this.nftCoinReward = utils.formatEther(nftCoinReward.toString());
    this.nftSymbol = nftSymbol;

    await this.refresh();
  }

  async refresh() {
    const address = this.address;
    const scCoin = this.scCoin;
    const scNft = this.scNft;
    const signer = this.signer;
    const provider = this.provider;

    const balanceGas = await signer.getBalance();
    const totalSupply = await scCoin.totalSupply();
    const realTotalSupply = await scCoin.realTotalSupply();
    const balanceCoin = await scCoin.balanceOf(address);
    const realBalanceCoin = await scCoin.realBalanceOf(address);
    const gasLocked = await provider.getBalance(this.coinAddress);
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const endMultiplier = await scCoin.getEndMultiplier();
    const currentMultiplier = await scCoin.getCurrentMultiplier();

    const nftBalance = await scNft.balanceOf(address);

    await this.getTrees();

    this.coinBalance = utils.formatEther(balanceCoin);
    this.realCoinBalance = utils.formatEther(realBalanceCoin);
    this.gasBalance = utils.formatEther(balanceGas);
    this.gasLockedInPool = utils.formatEther(gasLocked.toString());
    this.totalSupply = utils.formatEther(totalSupply.toString());
    this.realTotalSupply = utils.formatEther(realTotalSupply.toString());
    this.blockTimestamp = block.timestamp;
    this.currentMultiplier = utils.formatEther(currentMultiplier);
    this.endMultiplier = utils.formatEther(endMultiplier);
    this.nftBalance = nftBalance.toString();

  }

  async swapRequirement(amount) {
    if (!this.address) return 1;
    const balanceCoin = await this.scCoin.balanceOf(this.address);
    const wei = utils.parseEther(amount);
    if (balanceCoin.lt(wei)) return 2;
    return 0;
  }

  async swap(amount) {
    const wei = utils.parseEther(amount);
    const tx = await this.scCoin.redeem(wei);
    try {
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
    return tx.hash;
  }

  openTx(txHash) {
    const url = URL_EXPLORER + txHash;
    Lib.openUrl(url);
  }

  openToken() {
    const url = URL_EXPLORER_TOKEN + THETOKEN_ADDRESS;
    Lib.openUrl(url);
  }

  openNft() {
    const url = URL_EXPLORER_NFT + THENFT_ADDRESS;
    Lib.openUrl(url);
  }

  async nftSetTree(data, listPrice, installments) {
    const tx = await this.scNft.setTree(data, utils.parseEther(listPrice), installments);
    try {
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
    return tx.hash;
  }

  async getTrees() {
    let numTrees = await this.scNft.getTreeCount();
    const address = this.address.toLowerCase();
    numTrees = numTrees.toNumber();
    const vendorTrees = [];
    const ownedTrees = [];
    const saleTrees = [];
    const validatorTrees = [];

    for (let i = 0; i < numTrees; i++) {
      const data = await this.scNft.getTreeData(i);
      if (data[1].toLowerCase() === address) {
        vendorTrees.push(data);
      }

      const state = data[5];
      if (state === 0) {
        saleTrees.push(data);
      } else if (state === 1) {
        validatorTrees.push(data);
      }

      if (state !== 0) { // state not for sale
        const owner = await this.scNft.ownerOf('' + i);
        if (owner.toLowerCase() === address) {
          ownedTrees.push(data);
        }
      }
    }

    this.vendorTrees = vendorTrees;
    this.saleTrees = saleTrees;
    this.ownedTrees = ownedTrees;
    this.validatorTrees = validatorTrees;
  }

  async nftBuyTreeRequirement(id) {
    if (!this.address) return 1;
    const balanceGas = await this.signer.getBalance();

    const item = await this.scNft.getTreeData(id);
    const price = item[6];

    if (balanceGas.lte(price)) return 2;
    return 0;
  }

  async nftBuyTree(id) {
    const item = await this.scNft.getTreeData(id);
    const price = item[6].toString();
    console.log({ id, price });
    const tx = await this.scNft.buyTree(id, { value: price });
    try {
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
    return tx.hash;
  }

  async nftGetTreeData(id) {
    const item = await this.scNft.getTreeData(id);
    return item;
  }

  async nftSubmitProofOfWork(id, hash) {
    const tx = await this.scNft.submitProofOfWork(id, hash);
    try {
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
    return tx.hash;
  }

  async nftGetProofOfWorks(id) {
    const num = await this.scNft.getProofOfWorkCount(id);
    const ret = [];
    for (let i = 0; i < num.toNumber(); i++) {
      const data = await this.scNft.getProofOfWorkData(id, i);

      const ts = data[1].toNumber();
      const uploadTime = moment.unix(ts).format('DD-MM-YYYY HH:mm:ss');
      const hash = data[2];
      const statusList = ['Pending', 'Valid', 'Invalid'];
      const state = statusList[data[3]]
      ret.push({ ts, uploadTime, hash, state });
    }
    return ret;
  }

  async nftValidateProofOfWork(id, proofId) {
    const tx = await this.scNft.validateProofOfWork(id, proofId);
    try {
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
    return tx.hash;
  }

  async nftInvalidateProofOfWork(id, proofId) {
    const tx = await this.scNft.invalidateProofOfWork(id, proofId);
    try {
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
    return tx.hash;
  }
}

decorate(TheManager, {
  busy: observable,
  coinAddress: observable,
  coinSymbol: observable,
  gasSymbol: observable,
  address: observable,
  coinBalance: observable,
  realCoinBalance: observable,
  gasBalance: observable,
  gasLockedInPool: observable,
  totalSupply: observable,
  realTotalSupply: observable,
  startMultiplier: observable,
  endMultiplier: observable,
  currentMultiplier: observable,
  tickerBusy: observable,
  blockTimestamp: observable,
  nftMintCost: observable,
  nftMintTokenCost: observable,
  nftAddress: observable,
  nftCoinAddress: observable,
  nftCoinReward: observable,
  nftSymbol: observable,
  nftBalance: observable,
  vendorTrees: observable,
  saleTrees: observable,
  ownedTrees: observable,
  validatorTrees: observable
});

const instance = new TheManager();
export default instance;
