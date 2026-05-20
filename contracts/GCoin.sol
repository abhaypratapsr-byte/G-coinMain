// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// ── OZ v5 users: swap imports above with:
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/Pausable.sol";
// AND change constructor to: constructor() ERC20("GCoin","GCN") Ownable(msg.sender) {
// AND replace _beforeTokenTransfer with _update (see comment below)

contract GCoin is ERC20, Ownable, Pausable {

    // ─────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────

    address public treasury;

    // 100,000,000 GCN = ₹1 Crore default cap
    uint256 public maxSupply = 100_000_000 * 10**2;

    // Absolute hard ceiling — owner can never exceed ₹10 Cr
    uint256 public constant ABSOLUTE_MAX_SUPPLY = 1_000_000_000 * 10**2;

    // Minimum redeem = ₹10 (1000 units)
    uint256 public minRedeemAmount = 1000;

    // KYC gate — off by default for MVP
    bool public kycRequired = false;

    mapping(address => bool) public blacklisted;
    mapping(address => bool) public kycVerified;

    // ISSUE 6 FIX: On-chain duplicate order prevention
    mapping(string => bool) public processedOrders;

    // ISSUE 7 FIX: On-chain duplicate redeem prevention
    mapping(bytes32 => bool) public processedRedeems;

    // ─────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────

    event Minted(address indexed to, uint256 amount, string orderId);

    // ISSUE 1 FIX: redeemId (bytes32) replaces utrRef — UTR stored off-chain in backend
    event Redeemed(address indexed user, uint256 amount, bytes32 redeemId);

    event Blacklisted(address indexed user, string reason);
    event UnBlacklisted(address indexed user);
    event KYCVerified(address indexed user);
    event KYCRevoked(address indexed user);
    event TreasuryUpdated(address indexed newTreasury);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    event MinRedeemUpdated(uint256 newMin);
    event KYCGateToggled(bool required);

    // ─────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────

    // OZ v4: Ownable() sets owner = msg.sender automatically
    // OZ v5: change to constructor() ERC20("GCoin","GCN") Ownable(msg.sender) {
    constructor() ERC20("GCoin", "GCN") {
        treasury = msg.sender;
    }

    // ─────────────────────────────────────────────
    // ERC20 OVERRIDES
    // ─────────────────────────────────────────────

    // 2 decimals: 1 GCN = 100 units = ₹1.00
    function decimals() public pure override returns (uint8) {
        return 2;
    }

    // ─────────────────────────────────────────────
    // TRANSFER HOOK — OZ v4
    // OZ v5: replace with:
    // function _update(address from, address to, uint256 amount) internal override {
    //     _requireNotPaused();
    //     if (from != address(0)) require(!blacklisted[from], "GCoin: sender blacklisted");
    //     if (to != address(0)) require(!blacklisted[to], "GCoin: receiver blacklisted");
    //     super._update(from, to, amount);
    // }
    // ─────────────────────────────────────────────

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        _requireNotPaused();
        if (from != address(0)) require(!blacklisted[from], "GCoin: sender blacklisted");
        if (to   != address(0)) require(!blacklisted[to],   "GCoin: receiver blacklisted");
        super._beforeTokenTransfer(from, to, amount);
    }

    // ─────────────────────────────────────────────
    // MINT
    // ─────────────────────────────────────────────

    function mint(
        address to,
        uint256 amount,
        string calldata orderId
    ) external onlyOwner {
        require(to != address(0),                     "GCoin: invalid address");
        require(amount > 0,                           "GCoin: amount must be > 0");
        require(!blacklisted[to],                     "GCoin: recipient blacklisted");
        require(totalSupply() + amount <= maxSupply,  "GCoin: max supply exceeded");

        // ISSUE 6 FIX: Prevent duplicate order minting
        require(!processedOrders[orderId],            "GCoin: order already processed");

        // ISSUE 2 FIX: KYC gate on mint (when enabled)
        if (kycRequired) {
            require(kycVerified[to],                  "GCoin: recipient KYC not verified");
        }

        processedOrders[orderId] = true;
        _mint(to, amount);
        emit Minted(to, amount, orderId);
    }

    function mintBatch(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata orderIds
    ) external onlyOwner {
        uint256 len = recipients.length;
        require(len == amounts.length && len == orderIds.length, "GCoin: array length mismatch");
        require(len <= 100, "GCoin: max 100 per batch");

        uint256 totalAmount;
        for (uint256 i = 0; i < len; i++) {
            totalAmount += amounts[i];
        }
        require(totalSupply() + totalAmount <= maxSupply, "GCoin: max supply exceeded");

        for (uint256 i = 0; i < len; i++) {
            require(recipients[i] != address(0),          "GCoin: invalid address");
            require(amounts[i] > 0,                       "GCoin: amount must be > 0");
            require(!blacklisted[recipients[i]],          "GCoin: recipient blacklisted");
            require(!processedOrders[orderIds[i]],        "GCoin: order already processed");

            if (kycRequired) {
                require(kycVerified[recipients[i]],       "GCoin: recipient KYC not verified");
            }

            processedOrders[orderIds[i]] = true;
            _mint(recipients[i], amounts[i]);
            emit Minted(recipients[i], amounts[i], orderIds[i]);
        }
    }

    // ─────────────────────────────────────────────
    // REDEEM
    // ─────────────────────────────────────────────

    // ISSUE 1 + 7 FIX:
    // - redeemId (bytes32) replaces utrRef — UTR/bank details stored OFF-CHAIN in backend
    // - processedRedeems mapping prevents double-processing
    // Backend: generate redeemId = keccak256(wallet + timestamp + amount) before calling
    function redeem(uint256 amount, bytes32 redeemId) external {
        require(amount >= minRedeemAmount,               "GCoin: below minimum redeem");
        require(!blacklisted[msg.sender],                "GCoin: user blacklisted");
        require(balanceOf(msg.sender) >= amount,         "GCoin: insufficient balance");
        require(!processedRedeems[redeemId],             "GCoin: redeem already processed");

        if (kycRequired) {
            require(kycVerified[msg.sender],             "GCoin: KYC not verified");
        }

        processedRedeems[redeemId] = true;
        _burn(msg.sender, amount);
        emit Redeemed(msg.sender, amount, redeemId);
    }

    // ─────────────────────────────────────────────
    // VIEW HELPERS
    // ─────────────────────────────────────────────

    function remainingSupply() public view returns (uint256) {
        return maxSupply - totalSupply();
    }

    function toRupees(uint256 units) public pure returns (uint256) {
        return units / 100;
    }

    function isOrderProcessed(string calldata orderId) public view returns (bool) {
        return processedOrders[orderId];
    }

    function isRedeemProcessed(bytes32 redeemId) public view returns (bool) {
        return processedRedeems[redeemId];
    }

    // ─────────────────────────────────────────────
    // ADMIN — PAUSE
    // ─────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─────────────────────────────────────────────
    // ADMIN — BLACKLIST / KYC
    // ─────────────────────────────────────────────

    function blacklist(address user, string calldata reason) external onlyOwner {
        blacklisted[user] = true;
        emit Blacklisted(user, reason);
    }

    function unBlacklist(address user) external onlyOwner {
        blacklisted[user] = false;
        emit UnBlacklisted(user);
    }

    function verifyKYC(address user) external onlyOwner {
        kycVerified[user] = true;
        emit KYCVerified(user);
    }

    function revokeKYC(address user) external onlyOwner {
        kycVerified[user] = false;
        emit KYCRevoked(user);
    }

    function setKYCRequired(bool required) external onlyOwner {
        kycRequired = required;
        emit KYCGateToggled(required);
    }

    // ─────────────────────────────────────────────
    // ADMIN — CONFIG
    // ─────────────────────────────────────────────

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "GCoin: invalid address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    // Can only increase cap, never reduce, never exceed absolute max
    function setMaxSupply(uint256 newMax) external onlyOwner {
        require(newMax > maxSupply,            "GCoin: can only increase supply cap");
        require(newMax <= ABSOLUTE_MAX_SUPPLY, "GCoin: exceeds absolute cap");
        maxSupply = newMax;
        emit MaxSupplyUpdated(newMax);
    }

    function setMinRedeemAmount(uint256 newMin) external onlyOwner {
        require(newMin > 0, "GCoin: min must be > 0");
        minRedeemAmount = newMin;
        emit MinRedeemUpdated(newMin);
    }

    function adminBurn(address account, uint256 amount) external onlyOwner {
        require(account != address(0), "GCoin: burn from zero address");
        require(balanceOf(account) >= amount, "GCoin: burn amount exceeds balance");
        _burn(account, amount);
    }
}