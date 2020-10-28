pragma solidity ^0.5.0;


contract GreenContract {

     enum StateType {
        Active,
        PendingValidation,
        Validated,
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

    function getState() public view returns (StateType) {
        return State;
    }

    function buyTree(address inputvalidator) external {
        if (inputvalidator == address(0x000)) {
            revert("buyTree function need to have a validator address");
        }

        if (State != StateType.Active) {
            revert("buyTree function can only be called when in Active state");
        }

        if (owner == msg.sender) {
            revert("buyTree function cannot be called by the owner ");
        }

        buyer = msg.sender;
        validator = inputvalidator;
        State = StateType.PendingValidation;

        emit ContractUpdated(appName, workflowName, "buyTree", msg.sender);
    }

    function submitProofOfWork(string memory proofdata) public {

        if (owner != msg.sender) {
            revert("Only owner can submit proof of work");
        }

        if (State != StateType.InstallmentPaid) {
            revert("Proof of work can only be submitted after an installment is paid");
        }

        newData = proofdata;
        State = StateType.PendingValidation;

        emit ContractUpdated(appName, workflowName, "submitProofOfWork", msg.sender);
    }

    function markValidated() external {
        if (validator != msg.sender) {
            revert("markValidated function can only be called by the validator");
        }

        if (State == StateType.PendingValidation) {
            State = StateType.Validated;
        } else {
            revert("markValidated function can only be called if PendingValidation");
        }

        makePayment();

        emit ContractUpdated(appName, workflowName, "markValidated", msg.sender);
    }

    function makePayment() internal {
 
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
    }

    function markInvalidated() external {
        if (validator != msg.sender) {
            revert("markInvalidated function can only be called by the validator");
        }

        if (State == StateType.PendingValidation) {
            State = StateType.ContractCancelled;
        } else {
            revert("markInvalidated function can only be called if pendingValidation");
        }

        emit ContractUpdated(appName, workflowName, "markInvalidated", msg.sender);
    }

}