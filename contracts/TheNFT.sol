pragma solidity ^0.5.0;

import "./ITheToken.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import '@openzeppelin/contracts/token/ERC721/ERC721Full.sol';

contract TheNFT is Ownable, ERC721Full {
  using SafeMath for uint256;

  uint256 public mintCost = 10e15;     // 0.01 BTC ~100 USD
  uint256 public mintTokenCost = 2e15; // 0.002 BTC ~20 USD
  address payable public tokenAddress;

  struct TreeData {
    uint256 id;
    string infoIpfsHash;

    // add another params for tree
  }

  TreeData[] treeDataList;

  constructor() ERC721Full("Crypto Trees", "TREE") public {
    treeDataList.push(TreeData(0,""));
  }

  function connectToToken(address payable addr) public onlyOwner {
    tokenAddress = addr;
  }

  function createTree(string memory infoIpfsHash) public payable {
    address receiver = msg.sender;
    uint256 payment = msg.value;
    require(payment == mintCost,"insufficient payment");

    uint256 newId = treeDataList.length;
    treeDataList.push(TreeData(newId,infoIpfsHash));
    _mint(receiver, newId);

    ITheToken(tokenAddress).mint.value(mintTokenCost)(receiver);
  }

  function countTree() public view returns (uint256 count) {
    return (treeDataList.length);
  }

  function readTree(uint256 treeId) public view returns (string memory infoIpfsHash) {
    require(treeId > 0 && treeId < treeDataList.length,"invalid treeId");
    TreeData memory td = treeDataList[treeId];
    return (td.infoIpfsHash);
  }
}
