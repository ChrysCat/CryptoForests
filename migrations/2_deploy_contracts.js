const TheNFT = artifacts.require("TheNFT");
const TheToken = artifacts.require("TheToken");

module.exports = async function (deployer) {
  await deployer.deploy(TheToken);
  const token = await TheToken.deployed();
  console.log('token.address: ' + token.address);

  await deployer.deploy(TheNFT);
  const nft = await TheNFT.deployed();
  console.log('nft.address: ' + nft.address);

  await token.setMinter(nft.address, true);
  await nft.connectToToken(token.address);
};
