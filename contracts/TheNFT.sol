pragma solidity ^0.5.0;

import "./ITheToken.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import '@openzeppelin/contracts/token/ERC721/ERC721Full.sol';

contract TheNFT is Ownable, ERC721Full {
  using SafeMath for uint256;

  address payable public tokenAddress;

  enum StateType {
      Active,
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
    uint256 installments;     // number of installments to pay the list price
    StateType State;          // green contract state
    address payable validator;
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
  // track paid amount of every green contract
  mapping(uint256 => uint256) public greenContractPaid;
  // track start date of every green contract
  mapping(uint256 => uint256) public greenContractStartDate;
  // default validator
  address payable validator;

  constructor() ERC721Full("Crypto Forests", "Tree") public {
    greenContractList.push(
      GreenContract(
        0,
        address(0), // Vendor undefined
        "",
        0,
        0,
        StateType.Active,
        address(0) // Validator undefined
      )
    );
    validator = msg.sender;
  }

  function connectToToken(address payable addr) public onlyOwner {
    tokenAddress = addr;
  }

  function setValidator(address payable addr) public onlyOwner {
    validator = addr;
  }

  function setTree(string memory inputdata, uint256 price, uint256 inputInstallments) public {
    // everyone can be a vendor to list a tree
    uint256 newId = greenContractList.length;
    greenContractList.push(
      GreenContract(
        newId,
        msg.sender,
        inputdata,
        price,
        inputInstallments,
        StateType.PendingValidation,
        validator
      )
    );

    emit ContractCreated(appName, workflowName, msg.sender);
  }

  function getTreeCount() public view returns (uint256) {
    return greenContractList.length;
  }

  function getTreeData(uint256 index) public view returns (
    uint256,       // id
    address,       // vendor
    string memory, // data
    uint256,       // listPrice
    uint256,       // installments
    StateType,     // State
    address        // validator
  ) {
    //require(index > 0 && index < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[index];
    return (
      g.id, g.vendor, g.data, g.listPrice, g.installments, g.State, g.validator
    );
  }

  function buyTree(uint256 index) public payable { // payable means user must pay to call this function
    require(index > 0 && index < greenContractList.length, "!index");
    // anyone can buy tree
    GreenContract memory g = greenContractList[index];

    uint256 listPrice = g.listPrice;
    uint256 installments = g.installments;
    uint256 totalPayment = listPrice.mul(installments); // list  price X number of installments
    require(msg.value >= totalPayment, "Not enough payment");

    // on listprice 70% will be sent to vendor, 10% to validator & 20% will be used to mint reward coin
    uint256 toVendor = listPrice.mul(70).div(100);
    uint256 toValidator = listPrice.mul(10).div(100);
    uint256 toCoin = listPrice.sub(toVendor).sub(toValidator);

    ITheToken(tokenAddress).mint.value(toCoin)(msg.sender); // buyer receives coin
    _mint(msg.sender, g.id);                                // buyer receives nft attached to greencontract id

    // send vendor money
    address payable vendor = g.vendor;
    vendor.transfer(toVendor);

    // send validator money
    address payable _validator = g.validator;
    _validator.transfer(toValidator);
  }

  function submitProofOfWork(uint256 index, string memory proofdata) public {
    require(index > 0 && index < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[index];
    //require(g.vendor == msg.sender, "only vendor can submit proof of work");
    //require(g.State == StateType.InstallmentPaid, "Proof of work can be submitted only after initial payment");
    //require(g.State != StateType.ContractEnded, "All instalments are paid");
    //require(g.State != StateType.ContractCancelled, "Contract is cancelled");
    g.State = StateType.PendingValidation;
    greenContractProofs[g.id].push(ProofOfPhoto(g.id, now, proofdata, false));
  }

  function getProofOfWorkCount(uint256 index) public view returns (uint256) {
    require(index > 0 && index < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[index];
    return greenContractProofs[g.id].length;
  }

  function getProofOfWorkData(uint256 index, uint256 proofIndex) public view returns (
    uint256,       // greenContractId
    uint256,       // uploadTime
    string memory, // newData
    bool           // validated
  ) {
    require(index > 0 && index < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[index];
    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");

    ProofOfPhoto memory p = greenContractProofs[g.id][proofIndex];
    return (
      p.greenContractId,
      p.uploadTime,
      p.newData,
      p.validated
    );
  }

  function validateProofOfWork(uint256 index, uint256 proofIndex) public payable {
    require(index > 0 && index < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[index];
    //require(msg.sender == g.validator, "Only validator allowed to validate");

    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");
    ProofOfPhoto memory p = greenContractProofs[g.id][proofIndex];
    p.validated = true;

    // if photo validated, vendor will receive 90% money 10% to validator
    uint256 listPrice = g.listPrice;
    require(msg.value >= listPrice, "Not enough payment");

    uint256 toVendor = listPrice.mul(90).div(100);
    uint256 toValidator = listPrice.mul(10).div(100);
 
    // send vendor money
    address payable vendor = g.vendor;
    vendor.transfer(toVendor);

    // send validator money
    address payable _validator = g.validator;
    _validator.transfer(toValidator);

    g.State = StateType.InstallmentPaid;
    g.installments--;
    if (g.installments == 0) {
      g.State = StateType.ContractEnded;
    }
    emit ContractUpdated(appName, workflowName, "validateProofOfWork", msg.sender);
  }

  function invalidateProofOfWork(uint256 index, uint256 proofIndex) public payable {
    require(index > 0 && index < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[index];
    //require(msg.sender == g.validator, "Only validator allowed to invalidate");

    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");
    ProofOfPhoto memory p = greenContractProofs[g.id][proofIndex];
    p.validated = false;

    g.State = StateType.ContractCancelled;
    g.installments = 0;
    emit ContractUpdated(appName, workflowName, "inValidateProofOfWork", msg.sender);
  }
}
