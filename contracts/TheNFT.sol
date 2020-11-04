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
      ContractRunning,
      ContractCancelled,    
      ContractEnded
  }

  enum ProofStateType {
      Pending, 
      Valid, 
      Invalid
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
    uint256 price;               // 80%(listPrice*installments) + 20%(mintCoin)
    uint256 lastProofUploadTime; // last upload photo
  }

  GreenContract[] public greenContractList;

  struct ProofOfPhoto {
    uint256 greenContractId;
    uint256 uploadTime; // when the photo saved to blockchain
    string newData;     // ipfs hash to the photo
    ProofStateType State;
  }

  // track contract ID to proofs
  mapping(uint256 => ProofOfPhoto[]) public greenContractProofs;
  // default validator
  address payable validator;

  constructor() ERC721Full("Crypto Forests", "TREE") public {
  }

  function setup(address payable addr1, address payable addr2) public onlyOwner {
    tokenAddress = addr1;
    validator = addr2;
  }

  function setTree(string memory inputdata, uint256 listPrice, uint8 inputInstallments) public {
    // everyone can be a vendor to list a tree
    uint256 newId = greenContractList.length;
    uint256 price = listPrice.mul(inputInstallments).mul(100).div(80);
    greenContractList.push(
      GreenContract(
        newId,
        msg.sender,
        inputdata,
        listPrice,
        inputInstallments,
        StateType.ForSale,
        price,
        now
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
    StateType,     // State
    uint256,       // price
    uint256        // lastProofUploadTime
  ) {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    return (
      g.id, g.vendor, g.data, g.listPrice, g.installments, g.State, g.price, g.lastProofUploadTime
    );
  }

  function buyTree(uint256 greenContractIndex) public payable { // payable means user must pay to call this function
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    // anyone can buy tree
    GreenContract memory g = greenContractList[greenContractIndex];
    uint256 price = g.price;
    uint256 amountSent = msg.value;
    require(amountSent >= price, "Not enough payment");

    uint256 listPrice = g.listPrice;
    uint8 installments = g.installments;

    // on price 80% will be used for installments & 20% will be used to mint reward coin
    // mint coin do up
    uint256 toInstallments = listPrice.mul(installments);
    uint256 toMint = amountSent.sub(toInstallments);

    ITheToken(tokenAddress).mint.value(toMint)(msg.sender); // buyer receives coin
    _mint(msg.sender, g.id); // buyer receives nft attached to greencontract id

    // on bought, set state to not for sale and not on pending validation
    greenContractList[greenContractIndex].State = StateType.ContractRunning;

    // send vendor & validator money later after proof validation
  }

  function submitProofOfWork(uint256 greenContractIndex, string memory proofdata) public {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    require(g.vendor == msg.sender, "only vendor can submit proof of work");
    require(g.State == StateType.ContractRunning, "Proof of work can be submitted only after initial payment");

    // must be after one month from latest submit
    // uint256 delta = now.sub(g.lastProofUploadTime);
    // uint256 diff = 30 days;
    // require(delta >= diff,"there should be 30 days difference between proof upload time");

    greenContractList[greenContractIndex].State = StateType.PendingValidation;
    greenContractList[greenContractIndex].lastProofUploadTime = now;
    greenContractProofs[g.id].push(ProofOfPhoto(g.id, now, proofdata, ProofStateType.Pending));
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
    ProofStateType // State
  ) {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");

    ProofOfPhoto memory p = greenContractProofs[g.id][proofIndex];
    return (
      p.greenContractId,
      p.uploadTime,
      p.newData,
      p.State
    );
  }

  function validateProofOfWork(uint256 greenContractIndex, uint256 proofIndex) public {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];

    // requirement below cant be commented, because vendor may try to cheat by call this function
    // require(msg.sender == validator, "Only validator allowed to validate");

    require(g.State == StateType.PendingValidation,"must be on pending validation");
    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");
    require(greenContractProofs[g.id][proofIndex].State == ProofStateType.Pending,"!ProofStateType.Pending");
    greenContractProofs[g.id][proofIndex].State = ProofStateType.Valid;

    // if photo validated, vendor will receive 90% money, validator 10%
    uint256 listPrice = g.listPrice;
    uint256 toVendor = listPrice.mul(90).div(100);
    uint256 toValidator = listPrice.sub(toVendor);
 
    // send vendor money
    address payable vendor = g.vendor;
    vendor.transfer(toVendor);

    // send validator money
    validator.transfer(toValidator);

    uint8 newInstallments = g.installments - 1;
    greenContractList[greenContractIndex].installments = newInstallments;

    if (newInstallments == 0) {
      greenContractList[greenContractIndex].State = StateType.ContractEnded;
    } else {
      greenContractList[greenContractIndex].State = StateType.ContractRunning;
    }
    emit ContractUpdated(appName, workflowName, "validateProofOfWork", msg.sender);
  }

  function invalidateProofOfWork(uint256 greenContractIndex, uint256 proofIndex) public {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];

    // requirement below cant be commented, because vendor may try to cheat by call this function
    // require(msg.sender == validator, "Only validator allowed to validate");

    require(g.State == StateType.PendingValidation,"must be on pending validation");
    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");
    require(greenContractProofs[g.id][proofIndex].State == ProofStateType.Pending,"!ProofStateType.Pending");
    greenContractProofs[g.id][proofIndex].State = ProofStateType.Invalid;

    // on cancel installment, remaining money will be donate
    uint256 listPrice = g.listPrice;
    uint8 installments = g.installments;
    uint256 toDonate = listPrice.mul(installments);
    ITheToken(tokenAddress).donate.value(toDonate)();

    greenContractList[greenContractIndex].State = StateType.ContractCancelled;
    greenContractList[greenContractIndex].installments = 0;
    emit ContractUpdated(appName, workflowName, "inValidateProofOfWork", msg.sender);
  }
}
