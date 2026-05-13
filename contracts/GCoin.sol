// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract GCoin is ERC20, Ownable, Pausable {

    address public treasury;

    constructor() ERC20("GCoin", "GCN") {
        treasury = msg.sender;
    }

    mapping(address => bool) public blacklisted;

    event Minted(address indexed user, uint256 amount);
    event Burned(address indexed user, uint256 amount);
    event Blacklisted(address indexed user);
    event UnBlacklisted(address indexed user);
    event TreasuryUpdated(address indexed newTreasury);

    function decimals() public pure override returns (uint8) {
        return 2;
    }

    uint256 public maxSupply = 1_000_000 * 10**2;

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        _requireNotPaused();   // fix: call internal function instead of using modifier
        if (from != address(0)) require(!blacklisted[from], "Sender blacklisted");
        if (to != address(0)) require(!blacklisted[to], "Receiver blacklisted");
        super._beforeTokenTransfer(from, to, amount);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");
        require(totalSupply() + amount <= maxSupply, "Max supply exceeded");
        require(!blacklisted[to], "Recipient blacklisted");
        _mint(to, amount);
        emit Minted(to, amount);
    }

    function burnFrom(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");
        require(!blacklisted[user], "User blacklisted");
        _burn(user, amount);
        emit Burned(user, amount);
    }

    function remainingSupply() public view returns (uint256) {
        return maxSupply - totalSupply();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function blacklist(address user) external onlyOwner {
        blacklisted[user] = true;
        emit Blacklisted(user);
    }

    function unBlacklist(address user) external onlyOwner {
        blacklisted[user] = false;
        emit UnBlacklisted(user);
    }
}