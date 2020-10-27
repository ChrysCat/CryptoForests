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

    string internal ApplicationName = "CryptoForests";
    string internal WorkflowName = "GreenContract";

    address public InstanceOwner;
    string public Description;
    string public NewDescription;
    uint public ListPrice;
    uint public PaymentInstallments;
    StateType public State;

    address public InstanceBuyer;
    address public InstanceValidator;

    constructor (string memory description, uint256 price, uint256 installments) public {
        InstanceOwner = msg.sender;
        ListPrice = price;
        // XXX Need tree object instead of description
        Description = description;
        State = StateType.Active;
        PaymentInstallments = installments;

        emit ContractCreated(ApplicationName, WorkflowName, msg.sender);
    }

     function MakeOffer(address validator) external {
        if (validator == address(0x000) || validator == address(0x000)) {
            revert("MakeOffer function need to have a validator address");
        }

        if (State != StateType.Active) {
            revert("MakeOffer function can only be called when in Active state");
        }

        if (InstanceOwner == msg.sender) {
            revert("MakeOffer function cannot be called by the owner");
        }

        InstanceBuyer = msg.sender;
        InstanceValidator = validator;
        State = StateType.OfferPlaced;

        emit ContractUpdated(ApplicationName, WorkflowName, "MakeOffer", msg.sender);
    }

    function RejectOffer() public {
 
        if (State != StateType.OfferPlaced && InstanceOwner != msg.sender) {
            revert("The contract can only be rejected by the owner");
        }
        State = StateType.ContractCancelled;
        emit ContractUpdated(ApplicationName, WorkflowName, "RejectOffer", msg.sender);
    }

    function AcceptOffer() public {
        if (State != StateType.OfferPlaced) {
            revert("AcceptOffer function can only be called when an offer placed.");
        }

        if (InstanceOwner != msg.sender) {
            revert("AcceptOffer function can only be called by the owner");
        }

        State = StateType.PendingValidation;
        emit ContractUpdated(ApplicationName, WorkflowName, "AcceptOffer", msg.sender);
    }

    function Accept() external {
        if (msg.sender != InstanceBuyer && State != StateType.Validated) {
            revert("Accept function can only be called by the Buyer when contract is validated");
        }

        if (State == StateType.Validated) {
            State = StateType.BuyerAccepted;
        }

        emit ContractUpdated(ApplicationName, WorkflowName, "Accept", msg.sender);
    }

    function Reject() external {
        if (msg.sender != InstanceBuyer && State != StateType.Invalidated) {
            revert("Accept function can only be called by the Buyer when contract is invalidated");
        }

        if (State == StateType.Invalidated) {
            State = StateType.ContractCancelled;
        }

        emit ContractUpdated(ApplicationName, WorkflowName, "Reject", msg.sender);
    }

    function SubmitProofOfWork(string memory description) public {

        if (InstanceOwner != msg.sender) {
            revert("Only owner can submit proof of work");
        }

        if (State != StateType.BuyerAccepted || State != StateType.InstallmentPaid) {
            revert("Proof of work can only be submitted after buyer accepts or an installment is paid");
        }

        NewDescription = description;
        State = StateType.PendingProofValidation;

        emit ContractUpdated(ApplicationName, WorkflowName, "SubmitProofOfWork", msg.sender);
    }

    function MarkValidated() external {
        if (InstanceValidator != msg.sender) {
            revert("MarkValidated function can only be called by the validator");
        }

        if (State == StateType.PendingValidation || State == StateType.PendingProofValidation) {
            State = StateType.Validated;
        } else {
            revert("MarkValidated function can only be called if PendingValidation or PendingProofValidation");
        }

        emit ContractUpdated(ApplicationName, WorkflowName, "MarkValidated", msg.sender);
    }

    function AcceptProof() external {
        if (msg.sender != InstanceBuyer && State != StateType.Validated) {
            revert("Accept function can only be called by the Buyer when contract is validated");
        }

        uint256 payment = ListPrice / PaymentInstallments;
        // XXX Make payment
        PaymentInstallments--;

        if (PaymentInstallments == 0x00) {
            // No more pending payments
            State = StateType.ContractEnded;
        } else {
            State = StateType.InstallmentPaid;
        }

        emit ContractUpdated(ApplicationName, WorkflowName, "AcceptProof", msg.sender);
    }

    function MarkInvalidated() external {
        if (InstanceValidator != msg.sender) {
            revert("MarkInvalidated function can only be called by the validator");
        }

        if (State == StateType.PendingValidation || State == StateType.PendingProofValidation) {
            State = StateType.Invalidated;
        } else {
            revert("MarkInvalidated function can only be called if PendingValidation");
        }

        emit ContractUpdated(ApplicationName, WorkflowName, "MarkInvalidated", msg.sender);
    }
}