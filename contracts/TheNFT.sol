pragma solidity ^0.5.0;

import "./ITheToken.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import '@openzeppelin/contracts/token/ERC721/ERC721Full.sol';

contract TheNFT is Ownable, ERC721Full {
  using SafeMath for uint256;

  address payable public tokenAddress;

  enum StateType {
      ForSale,
      PendingValidation,
      InstallmentPaid,
      ContractCancelled,    
      ContractEnded
  }

  event ContractCreated(string applicationName, string workflowName, address originatingAddress);
  event ContractUpdated(string applicationName, string workflowName, string action, address originatingAddress);

  string internal appName = "CryptoForests";
  string internal workflowName = "GreenContract";

  struct GreenContract {
    uint256 id;
    address payable vendor;   // vendor
    string data;              // initial data species, gps, ipfs hash for initial photo
    uint256 listPrice;        // price listing
    uint8 installments;       // number of installments to pay the list price
    StateType State;          // green contract state
  }

  GreenContract[] public greenContractList;

  struct ProofOfPhoto {
    uint256 greenContractId;
    uint256 uploadTime; // when the photo saved to blockchain
    string newData;     // ipfs hash to the photo
    bool validated;
  }

  // track contract ID to proofs
  mapping(uint256 => ProofOfPhoto[]) public greenContractProofs;
  // default validator
  address payable validator;

  constructor() ERC721Full("Crypto Forests", "TREE") public {
    validator = msg.sender;
  }

  function connectToToken(address payable addr) public onlyOwner {
    tokenAddress = addr;
  }

  function setValidator(address payable addr) public onlyOwner {
    validator = addr;
  }

  function setTree(string memory inputdata, uint256 price, uint8 inputInstallments) public {
    // everyone can be a vendor to list a tree
    uint256 newId = greenContractList.length;
    greenContractList.push(
      GreenContract(
        newId,
        msg.sender,
        inputdata,
        price,
        inputInstallments,
        StateType.ForSale
      )
    );

    emit ContractCreated(appName, workflowName, msg.sender);
  }

  function getTreeCount() public view returns (uint256) {
    return greenContractList.length;
  }

  function getTreeData(uint256 greenContractIndex) public view returns (
    uint256,       // id
    address,       // vendor
    string memory, // data
    uint256,       // listPrice
    uint8,         // installments
    StateType      // State
  ) {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    return (
      g.id, g.vendor, g.data, g.listPrice, g.installments, g.State
    );
  }

  function buyTree(uint256 greenContractIndex) public payable { // payable means user must pay to call this function
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    // anyone can buy tree
    GreenContract memory g = greenContractList[greenContractIndex];

    uint256 listPrice = g.listPrice;
    uint8 installments = g.installments;
    uint256 totalPayment = listPrice.mul(installments); // list  price X number of installments
    require(msg.value >= totalPayment, "Not enough payment");

    // on listprice 70% will be sent to vendor, 10% to validator & 20% will be used to mint reward coin
    // mint coin do up front
    uint256 toCoin = totalPayment.mul(20).div(100);

    ITheToken(tokenAddress).mint.value(toCoin)(msg.sender); // buyer receives coin
    _mint(msg.sender, g.id);                                // buyer receives nft attached to greencontract id

    // on bought, set state to not for sale and not on pending validation
    greenContractList[greenContractIndex].State = StateType.InstallmentPaid;

    // send vendor money later after proof validation
    // send validator money later after proof validation
  }

  function submitProofOfWork(uint256 greenContractIndex, string memory proofdata) public {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    //require(g.vendor == msg.sender, "only vendor can submit proof of work");
    //require(g.State == StateType.InstallmentPaid, "Proof of work can be submitted only after initial payment");
    //require(g.State != StateType.ContractEnded, "All instalments are paid");
    //require(g.State != StateType.ContractCancelled, "Contract is cancelled");
    g.State = StateType.PendingValidation;
    greenContractProofs[g.id].push(ProofOfPhoto(g.id, now, proofdata, false));
  }

  function getProofOfWorkCount(uint256 greenContractIndex) public view returns (uint256) {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    return greenContractProofs[g.id].length;
  }

  function getProofOfWorkData(uint256 greenContractIndex, uint256 proofIndex) public view returns (
    uint256,       // greenContractId
    uint256,       // uploadTime
    string memory, // newData
    bool           // validated
  ) {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");

    ProofOfPhoto memory p = greenContractProofs[g.id][proofIndex];
    return (
      p.greenContractId,
      p.uploadTime,
      p.newData,
      p.validated
    );
  }

  function validateProofOfWork(uint256 greenContractIndex, uint256 proofIndex) public payable {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];

    // requirement below cant be commented, because vendor may try to cheat by call this function
    // require(msg.sender == validator, "Only validator allowed to validate");

    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");
    greenContractProofs[g.id][proofIndex].validated = true;

    // if photo validated, vendor will receive 70% money, validator 10%
    // remember 20% already sent up front to mint coin
    uint256 listPrice = g.listPrice;
    uint256 toVendor = listPrice.mul(70).div(100);
    uint256 toValidator = listPrice.mul(10).div(100);
    // no need to set amount to mint coin because already sent, up front on buy tree
 
    // send vendor money
    address payable vendor = g.vendor;
    vendor.transfer(toVendor);

    // send validator money
    validator.transfer(toValidator);

    g.State = StateType.InstallmentPaid;
    g.installments = g.installments - 1;
    if (g.installments == 0) {
      g.State = StateType.ContractEnded;
    }
    emit ContractUpdated(appName, workflowName, "validateProofOfWork", msg.sender);
  }

  function invalidateProofOfWork(uint256 greenContractIndex, uint256 proofIndex) public payable {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];

    // requirement below cant be commented, because vendor may try to cheat by call this function
    // require(msg.sender == validator, "Only validator allowed to validate");

    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");
    ProofOfPhoto memory p = greenContractProofs[g.id][proofIndex];
    p.validated = false;

    // on cancel installment, validator will receive current fee and remaining money sent to TheToken contract
    uint256 listPrice = g.listPrice;
    uint256 toValidator = listPrice.mul(10).div(100);

    uint256 remainingMoney = listPrice.mul(g.installments);
    remainingMoney = remainingMoney.mul(80).div(100); // remember 20% already used to mint coin
    remainingMoney = remainingMoney.sub(toValidator);
    validator.transfer(toValidator);
    tokenAddress.transfer(remainingMoney);

    g.State = StateType.ContractCancelled;
    g.installments = 0;
    emit ContractUpdated(appName, workflowName, "inValidateProofOfWork", msg.sender);
  }
}
