pragma solidity ^0.5.0;


contract GreenContract {

     enum StateType {
        Active,
        OfferPlaced,
        PendingValidation,
        PendingProofValidation,
        Validated,
        Invalidated,
        BuyerAccepted,
        ContractCancelled,
        InstallmentPaid,
        ContractEnded
    }

    event ContractCreated(string applicationName, string workflowName, address originatingAddress);
    event ContractUpdated(string applicationName, string workflowName, string action, address originatingAddress);

    string internal appName = "CryptoForests";
    string internal workflowName = "GreenContract";

    address public owner;
    string public data;
    string public newData;
    uint256 public listPrice;
    uint256 public installments;
    StateType public State;

    address public buyer;
    address public validator;

    constructor () public {
        owner = msg.sender;
    }

    function setTree(string memory inputdata, uint256 price, uint256 inputInstallments) public {
        
        if (owner != msg.sender) {
            revert("setTree function can only be called by the owner");
        }

        if (State != StateType.Active) {
            revert("setTree function can be called only in active state");
        }
        listPrice = price;
        // XXX Need tree object instead of data
        data = inputdata;
        State = StateType.Active;
        installments = inputInstallments;

        emit ContractCreated(appName, workflowName, msg.sender);
    }

    function getPrice() public view returns (uint256) {
        return listPrice;
    }

    function getInstallments() public view returns (uint256) {
        return installments;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function makeOffer(address inputvalidator) external {
        if (inputvalidator == address(0x000)) {
            revert("makeOffer function need to have a validator address");
        }

        if (State != StateType.Active) {
            revert("makeOffer function can only be called when in Active state");
        }

        if (owner == msg.sender) {
            revert("makeOffer function cannot be called by the owner ");
        }

        buyer = msg.sender;
        validator = inputvalidator;
        State = StateType.OfferPlaced;

        emit ContractUpdated(appName, workflowName, "makeOffer", msg.sender);
    }

    function rejectOffer() public {
 
        if (State != StateType.OfferPlaced && owner != msg.sender) {
            revert("The contract can only be rejected by the owner");
        }
        State = StateType.ContractCancelled;
        emit ContractUpdated(appName, workflowName, "rejectOffer", msg.sender);
    }

    function acceptOffer() public {
        if (State != StateType.OfferPlaced) {
            revert("acceptOffer function can only be called when an offer placed.");
        }

        if (owner != msg.sender) {
            revert("acceptOffer function can only be called by the owner");
        }

        State = StateType.PendingValidation;
        emit ContractUpdated(appName, workflowName, "acceptOffer", msg.sender);
    }

    function accept() external {
        if (msg.sender != buyer && State != StateType.Validated) {
            revert("accept function can only be called by the Buyer when contract is validated");
        }

        if (State == StateType.Validated) {
            State = StateType.BuyerAccepted;
        }

        emit ContractUpdated(appName, workflowName, "accept", msg.sender);
    }

    function reject() external {
        if (msg.sender != buyer && State != StateType.Invalidated) {
            revert("rejept function can only be called by the Buyer when contract is invalidated");
        }

        if (State == StateType.Invalidated) {
            State = StateType.ContractCancelled;
        }

        emit ContractUpdated(appName, workflowName, "reject", msg.sender);
    }

    function submitProofOfWork(string memory proofdata) public {

        if (owner != msg.sender) {
            revert("Only owner can submit proof of work");
        }

        if (State != StateType.BuyerAccepted && State != StateType.InstallmentPaid) {
            revert("Proof of work can only be submitted after buyer accepts or an installment is paid");
        }

        newData = proofdata;
        State = StateType.PendingProofValidation;

        emit ContractUpdated(appName, workflowName, "submitProofOfWork", msg.sender);
    }

    function markValidated() external {
        if (validator != msg.sender) {
            revert("markValidated function can only be called by the validator");
        }

        if (State == StateType.PendingValidation || State == StateType.PendingProofValidation) {
            State = StateType.Validated;
        } else {
            revert("markValidated function can only be called if PendingValidation or PendingProofValidation");
        }

        emit ContractUpdated(appName, workflowName, "markValidated", msg.sender);
    }

    function acceptProof() external {
        if (msg.sender != buyer && State != StateType.Validated) {
            revert("accept function can only be called by the Buyer when contract is validated");
        }

        uint256 payment = listPrice / installments;
        // XXX Make payment
        
        installments--;
        listPrice = listPrice - payment;

        if (installments == 0x00) {
            // No more pending payments
            State = StateType.ContractEnded;
        } else {
            State = StateType.InstallmentPaid;
        }

        emit ContractUpdated(appName, workflowName, "acceptProof", msg.sender);
    }

    function markInvalidated() external {
        if (validator != msg.sender) {
            revert("markInvalidated function can only be called by the validator");
        }

        if (State == StateType.PendingValidation || State == StateType.PendingProofValidation) {
            State = StateType.Invalidated;
        } else {
            revert("markInvalidated function can only be called if pendingValidation");
        }

        emit ContractUpdated(appName, workflowName, "markInvalidated", msg.sender);
    }
}