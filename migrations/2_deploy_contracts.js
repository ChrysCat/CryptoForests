const TheNFT = artifacts.require("TheNFT");
const TheToken = artifacts.require("TheToken");
const CryptoForest = artifacts.require("CryptoForest")

module.exports = async function (deployer, network, accounts) {
  console.log(accounts);
  
  await deployer.deploy(TheNFT);
  const nft = await TheNFT.deployed();
  console.log('nft.address: ' + nft.address);
  
  await deployer.deploy(TheToken);
  const token = await TheToken.deployed();
  console.log('token.address: ' + token.address);
  
  await token.setMinter(nft.address, true);
  await nft.setup(token.address, accounts[0]);


  await deployer.deploy(CryptoForest);
  const cryptoforest = await CryptoForest.deployed();
  console.log('cryptoforest.address: ' + cryptoforest.address);

  await token.setMinter(cryptoforest.address, true);
  await cryptoforest.setup(token.address);
};
