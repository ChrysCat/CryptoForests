pragma solidity ^0.5.0;

import "./ITheToken.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import '@openzeppelin/contracts/token/ERC721/ERC721Full.sol';

contract CryptoForest is Ownable, ERC721Full {
  using SafeMath for uint256;

  address payable public tokenAddress;

  enum StateType {
      Listed,
      Running,
      Pending,
      Cancelled,    
      Ended
  }

  enum ProofStateType {
      Submitted, 
      Valid, 
      Invalid
  }

  event ContractCreated(address seller, uint256 id, uint256 sellerCount, uint256 totalCount);
  event ContractUpdated(address buyer, address seller, uint256 id, string info);
  event ContractBought(address buyer, address seller, uint256 id, uint256 buyerCount);
  event ContractProofSubmitted(address seller, uint256 id);

  string internal appName = "CryptoForest";

  struct GreenContract {
    uint256 id;
    address payable seller;      // seller
    string data;                 // initial data species, gps, ipfs hash for initial photo
    uint256 listPrice;           // cost of one instalment
    uint8 installments;          // number of installments to pay the list totalPrice
    StateType State;             // green contract state
    uint256 totalPrice;          // 80% (listPrice*installments) + 20% (mintCoin)
    uint256 lastProofUploadTime; // last upload photo
    address payable buyer;       // buyer
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

  // Track seller to contracts they hold
  mapping(address => uint256[]) public sellerContracts;

  // Track buyer to contracts they bought
  mapping(address => uint256[]) public buyerContracts;
 
  constructor() ERC721Full("Crypto Forest", "Tree") public {
  }

  function setup(address payable addr1) public onlyOwner {
    tokenAddress = addr1;
  }

  function setTree(string memory inputdata, uint256 listPrice, uint8 inputInstallments) public {
    
    uint256 newId = greenContractList.length;
    uint256 totalPrice = listPrice.mul(inputInstallments).mul(100).div(80);
    GreenContract memory newContract =  GreenContract(
        newId,
        msg.sender,
        inputdata,
        listPrice,
        inputInstallments,
        StateType.Listed,
        totalPrice,
        now,
        address(0)
      );

    greenContractList.push(newContract);
    sellerContracts[msg.sender].push(newId);
    emit ContractCreated(msg.sender, newId, sellerContracts[msg.sender].length, greenContractList.length);
  }

  function getTreeCount() public view returns (uint256) {
    return greenContractList.length;
  }

  function getTreeData(uint256 greenContractIndex) public view returns (
    uint256,       // id
    address,       // seller
    string memory, // data
    uint256,       // listPrice
    uint8,         // installments
    StateType,     // State
    uint256,       // totalPrice
    uint256,       // lastProofUploadTime
    address        // buyer, if bought
  ) {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    return (
      g.id, g.seller, g.data, g.listPrice, g.installments, g.State, g.totalPrice, g.lastProofUploadTime, g.buyer
    );
  }

  function getTreesOfSeller(address seller) public view returns (uint256) {
      return sellerContracts[seller].length; 
  }
  
  function getTreeIndexOfSeller(address seller, uint256 index) public view returns (uint256) {
      return sellerContracts[seller][index];
  }

  function buyTree(uint256 greenContractIndex) public payable { 
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");

    // Check if greenContractIndex is in sellerTrees. If so, seller is trying to buy their own tree
    uint256[] memory sellerTrees = sellerContracts[msg.sender];    

    for (uint i = 0; i < sellerTrees.length; i++) {
      if (sellerTrees[i] == greenContractIndex) {
        revert("Buyer can't buy their own trees");
      }
    }
   
    GreenContract storage g = greenContractList[greenContractIndex];
    // Set the seller
    g.buyer = msg.sender;

    uint256 totalPrice = g.totalPrice;
    uint256 listPrice = g.listPrice;
    uint8 installments = g.installments;

    uint256 mintValue = totalPrice - listPrice.mul(installments);
    uint256 initialPrice = listPrice + mintValue;

    // We need first payment + value to be minted in this payment
    uint256 amountSent = msg.value;
    require(amountSent >= initialPrice, "Not enough payment");

    address payable seller = g.seller;
    seller.transfer(listPrice); 

    ITheToken(tokenAddress).mint.value(mintValue)(msg.sender); // buyer receives coin
    _mint(msg.sender, g.id); // buyer receives nft attached to greencontract id
 
    // Set this as running
    greenContractList[greenContractIndex].State = StateType.Running;
    
    // Store the id with buyers contracts
    buyerContracts[msg.sender].push(g.id);

    emit ContractBought(g.buyer, seller, g.id, buyerContracts[msg.sender].length);
  }

  function submitProofForPayment(uint256 greenContractIndex, string memory proofdata) public {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    require(g.seller == msg.sender, "Only seller can submit proof of work");
    require(g.State == StateType.Running, "Proof for instalment can be submitted only when contract is running");

    // must be after one month from latest submit
    uint256 delta = now.sub(g.lastProofUploadTime);
    uint256 diff = 1 seconds; //30 days; XXX  For now lets make it 1 second
    require(delta >= diff,"There should be 30 days difference between proof upload time");

    greenContractList[greenContractIndex].State = StateType.Pending;
    greenContractList[greenContractIndex].lastProofUploadTime = now;
    greenContractProofs[g.id].push(ProofOfPhoto(g.id, now, proofdata, ProofStateType.Submitted));
    emit ContractProofSubmitted(msg.sender, g.id);
  }

  function getCountOfTreeProofs(uint256 greenContractIndex) public view returns (uint256) {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    return greenContractProofs[g.id].length;
  }

  function getTreeProofData(uint256 greenContractIndex, uint256 proofIndex) public view returns (
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

  function markProofAsValid(uint256 greenContractIndex, uint256 proofIndex) public payable{

    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];

    // Check who's calling this method
    require(msg.sender == g.buyer, "Only buyers can mark the proof as valid!");

    require(g.State == StateType.Pending, "State must be pending validation");
    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");
    require(greenContractProofs[g.id][proofIndex].State == ProofStateType.Submitted,"!ProofStateType.Submitted");
    greenContractProofs[g.id][proofIndex].State = ProofStateType.Valid;

    // if photo validated, seller gets paid an installment
    address payable seller = g.seller;
    seller.transfer(g.listPrice);

    uint8 newInstallments = g.installments - 1;
    greenContractList[greenContractIndex].installments = newInstallments;

    if (newInstallments == 0) {
      greenContractList[greenContractIndex].State = StateType.Ended;
    } else {
      greenContractList[greenContractIndex].State = StateType.Running;
    }
    emit ContractUpdated(msg.sender, seller, g.id, "Proof marked as valid");
  }

  function markProofAsInvalid(uint256 greenContractIndex, uint256 proofIndex) public {
    require(greenContractIndex >= 0 && greenContractIndex < greenContractList.length, "!index");
    GreenContract memory g = greenContractList[greenContractIndex];
    
    // Check who's calling this method
    require(msg.sender == g.buyer, "Only buyers can mark the proof as invalid!");
    require(g.State == StateType.Pending, "State must be pending validation");
    require(proofIndex >= 0 && proofIndex < greenContractProofs[g.id].length, "!proofIndex");
    require(greenContractProofs[g.id][proofIndex].State == ProofStateType.Submitted,"!ProofStateType.Submitted");
    greenContractProofs[g.id][proofIndex].State = ProofStateType.Invalid;
    greenContractList[greenContractIndex].State = StateType.Cancelled;
    greenContractList[greenContractIndex].installments = 0;
    emit ContractUpdated(msg.sender, g.seller, g.id, "Proof marked as invalid. Contract Cancelled.");
  }
}