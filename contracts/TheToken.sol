pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "./ITheToken.sol";

contract TheToken is IERC20, ERC20Detailed, Ownable, ITheToken {
    using SafeMath for uint256;

    mapping(address => bool) public minterList;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 public realSupply;
    uint256 public t0;
    uint256 public t1;
    uint256 public age = 3600; // 3600*24*100;

    constructor() public ERC20Detailed("Leaf Coin", "LEAF", 18) {
        t0 = now;
        t1 = now.add(age);
    }

    // calculation helper:

    function toVirtualAmount(uint256 amount) public view returns (uint256) {
        if (realSupply == 0) return amount;
        uint256 mod = getCurrentMultiplier();
        return amount.mul(mod).div(1e18);
    }

    function toRealAmount(uint256 amount) public view returns (uint256) {
        if (realSupply == 0) return amount;
        uint256 mod = getCurrentMultiplier();
        return amount.mul(1e18).div(mod);
    }

    function getCurrentMultiplier() public view returns (uint256) {
        uint256 y0 = 1e18;
        uint256 y1 = getEndMultiplier();
        if (y0 == y1) return y1;

        uint256 tc = now;
        if (tc < t0) tc = t0;
        if (tc > t1) tc = t1;

        uint256 progress = tc.sub(t0);
        uint256 fullProgress = t1.sub(t0);
        uint256 dy = y1.sub(y0).mul(progress).div(fullProgress);
        uint256 yc = y0.add(dy);
        if (yc > y1) yc = getEndMultiplier();
        return yc;
    }

    function getEndMultiplier() public view returns (uint256) {
        if (realSupply == 0) return 1e18;
        uint256 gasBalance = address(this).balance;
        return gasBalance.mul(1e18).div(realSupply);
    }

    // mint & redeem:

    function setMinter(address minter, bool ok) public onlyOwner {
        minterList[minter] = ok;
    }

    function mint(address receiver) public payable {
        require(minterList[msg.sender] == true, "only minter allowed");
        uint256 payment = msg.value;

        uint256 minted = payment.div(2);
        uint256 realAmount = toRealAmount(minted);
        _mint(receiver, realAmount, minted);
        t1 = now.add(age);
    }

    function donate() public payable {
        uint256 payment = msg.value;
        if(payment > 0) t1 = now.add(age);
    }

    function redeem(uint256 amount) public {
        uint256 realAmount = toRealAmount(amount);
        _burn(msg.sender, realAmount, amount);
        // address payable receiver = address(uint160(msg.sender));
        // receiver.transfer(amount);
        msg.sender.transfer(amount);
    }

    function() external payable {
        if (msg.value > 0) t1 = now.add(age);
    }

    // ERC20 implementations:

    function totalSupply() public view returns (uint256) {
        return toVirtualAmount(realSupply);
    }

    function realTotalSupply() public view returns (uint256) {
        return realSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return toVirtualAmount(_balances[account]);
    }

    function realBalanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender)
        public
        view
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(
            sender,
            msg.sender,
            _allowances[sender][msg.sender].sub(
                amount,
                "ERC20: transfer amount exceeds allowance"
            )
        );
        return true;
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 virtualAmount
    ) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        uint256 amount = toRealAmount(virtualAmount);
        _balances[sender] = _balances[sender].sub(
            amount,
            "ERC20: transfer amount exceeds balance"
        );
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, virtualAmount);
    }

    function _mint(
        address account,
        uint256 amount,
        uint256 eventAmount
    ) internal {
        require(account != address(0), "ERC20: mint to the zero address");
        realSupply = realSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, eventAmount);
    }

    function _burn(
        address account,
        uint256 amount,
        uint256 eventAmount
    ) internal {
        require(account != address(0), "ERC20: burn from the zero address");
        _balances[account] = _balances[account].sub(
            amount,
            "ERC20: burn amount exceeds balance"
        );
        realSupply = realSupply.sub(amount);
        emit Transfer(account, address(0), eventAmount);
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
