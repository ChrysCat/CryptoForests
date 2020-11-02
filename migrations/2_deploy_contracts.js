const TheNFT = artifacts.require("TheNFT");
const TheToken = artifacts.require("TheToken");
const GreenContract = artifacts.require("GreenContract")

module.exports = async function (deployer) {
  await deployer.deploy(TheNFT);
  const nft = await TheNFT.deployed();
  console.log('nft.address: ' + nft.address);

  await deployer.deploy(TheToken);
  const token = await TheToken.deployed();
  console.log('token.address: ' + token.address);

  // await deployer.deploy(GreenContract);
  // const greencontract = await GreenContract.deployed();
  // console.log('greencontract.address: ' + greencontract.address);

  await token.setMinter(nft.address, true);
  await nft.connectToToken(token.address);
};
