// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SpotNFT.sol";
import "./interfaces/IYieldAdapter.sol";

/// @title HackerHouseEscrow — Trustless co-living coordination on Arbitrum
/// @notice One contract per Hacker House. Builders deposit USDC, get a SpotNFT.
///         Host collects after withdrawDate. Auto-refund on cancellation.
contract HackerHouseEscrow {
    using SafeERC20 for IERC20;

    // ── Enums ──────────────────────────────────────────────────────────
    enum HouseType { CO_PAYMENT, STAKING, HYBRID }
    enum YieldMode { NONE, GMX }
    enum YieldDest { HOST, BUILDERS }

    // ── Immutables ─────────────────────────────────────────────────────
    IERC20 public immutable usdcToken;
    address public immutable hostSafe;
    address public immutable creator;
    uint256 public immutable depositAmount;
    uint256 public immutable withdrawDate;
    uint256 public immutable capacity;
    HouseType public immutable houseType;
    YieldMode public immutable yieldMode;
    YieldDest public immutable yieldDest;
    IYieldAdapter public immutable yieldAdapter; // address(0) wrapper if yieldMode == NONE
    SpotNFT public spotNFT;
    address public factory;

    /// @notice HHP protocol treasury — receives 0.5% fee on release
    address public constant HHP_TREASURY = 0xd7ed1a1FC1295A0e7Ac16b5834F152F7B6306C0e;

    // ── State ──────────────────────────────────────────────────────────
    bool public cancelled;
    bool public released;
    uint256 public totalDeposited;
    uint256 public nextBookingId;

    mapping(address => uint256) public deposits;
    mapping(address => bool) public hasDeposited;
    mapping(uint256 => address) public spotOwner;
    mapping(address => uint256) public builderBooking;

    // Track depositors for cancellation refunds
    address[] private _depositors;

    // ── Events ─────────────────────────────────────────────────────────
    event Deposited(address indexed builder, uint256 indexed bookingId, uint256 amount);
    event SpotTransferred(uint256 indexed bookingId, address indexed from, address indexed to);
    event Released(address indexed hostSafe, uint256 hostAmount, uint256 fee);
    event Cancelled(uint256 timestamp);
    event Refunded(address indexed builder, uint256 amount);

    // ── Constructor ────────────────────────────────────────────────────
    constructor(
        address _usdcToken,
        address _hostSafe,
        address _creator,
        uint256 _depositAmount,
        uint256 _withdrawDate,
        uint256 _capacity,
        HouseType _houseType,
        YieldMode _yieldMode,
        YieldDest _yieldDest,
        address _yieldAdapter
    ) {
        require(_usdcToken != address(0), "Escrow: zero USDC address");
        require(_hostSafe != address(0), "Escrow: zero hostSafe");
        require(_creator != address(0), "Escrow: zero creator");
        require(_depositAmount > 0, "Escrow: zero deposit");
        require(_withdrawDate > block.timestamp, "Escrow: withdrawDate in past");
        require(_capacity > 0, "Escrow: zero capacity");
        if (_houseType == HouseType.STAKING || _houseType == HouseType.HYBRID) {
            require(_yieldMode == YieldMode.GMX, "Escrow: STAKING/HYBRID requires GMX");
        }
        if (_yieldMode == YieldMode.GMX) {
            require(_yieldAdapter != address(0), "Escrow: GMX requires adapter");
        }

        usdcToken = IERC20(_usdcToken);
        hostSafe = _hostSafe;
        creator = _creator;
        depositAmount = _depositAmount;
        withdrawDate = _withdrawDate;
        capacity = _capacity;
        houseType = _houseType;
        yieldMode = _yieldMode;
        yieldDest = _yieldDest;
        yieldAdapter = IYieldAdapter(_yieldAdapter);
        factory = msg.sender;
    }

    /// @notice Set the SpotNFT address. Can only be called once, by the factory.
    function initialize(address _spotNFT) external {
        require(msg.sender == factory, "Escrow: not factory");
        require(address(spotNFT) == address(0), "Escrow: already initialized");
        require(_spotNFT != address(0), "Escrow: zero spotNFT");
        spotNFT = SpotNFT(_spotNFT);
    }

    // ── Deposit ────────────────────────────────────────────────────────

    /// @notice Builder deposits USDC and claims a spot. Requires prior ERC-20 approval.
    /// @param bookingId Must equal nextBookingId (sequential, prevents gaps)
    function deposit(uint256 bookingId) external {
        require(!cancelled, "Escrow: house cancelled");
        require(!released, "Escrow: funds already released");
        require(block.timestamp < withdrawDate, "Escrow: deposit window closed");
        require(!hasDeposited[msg.sender], "Escrow: already deposited");
        require(nextBookingId < capacity, "Escrow: house full");
        require(bookingId == nextBookingId, "Escrow: invalid bookingId");

        usdcToken.safeTransferFrom(msg.sender, address(this), depositAmount);

        // Forward deposit to yield adapter if GMX mode
        if (yieldMode == YieldMode.GMX) {
            usdcToken.approve(address(yieldAdapter), depositAmount);
            yieldAdapter.deposit(depositAmount);
        }

        deposits[msg.sender] = depositAmount;
        hasDeposited[msg.sender] = true;
        spotOwner[bookingId] = msg.sender;
        builderBooking[msg.sender] = bookingId;
        _depositors.push(msg.sender);
        nextBookingId++;
        totalDeposited += depositAmount;

        spotNFT.mint(msg.sender, bookingId);

        emit Deposited(msg.sender, bookingId, depositAmount);
    }

    // ── Release ────────────────────────────────────────────────────────

    /// @notice Host collects funds after withdrawDate. 0.5% fee to HHP treasury.
    function release() external {
        require(msg.sender == hostSafe, "Escrow: not hostSafe");
        require(block.timestamp >= withdrawDate, "Escrow: too early");
        require(!cancelled, "Escrow: house cancelled");
        require(!released, "Escrow: already released");
        require(totalDeposited > 0, "Escrow: nothing to release");

        released = true;

        // Withdraw principal + yield from adapter
        uint256 yield_ = 0;
        if (yieldMode == YieldMode.GMX) {
            uint256 received = yieldAdapter.withdraw(totalDeposited);
            yield_ = received > totalDeposited ? received - totalDeposited : 0;
        }

        uint256 fee = totalDeposited * 50 / 10000; // 0.5% on principal only
        uint256 hostAmount = totalDeposited - fee;

        // Yield distribution
        if (yield_ > 0) {
            if (yieldDest == YieldDest.HOST) {
                hostAmount += yield_;
            } else {
                // BUILDERS: distribute yield equally to all depositors
                uint256 perBuilder = yield_ / nextBookingId;
                for (uint256 i = 0; i < _depositors.length; i++) {
                    address builder = _depositors[i];
                    if (deposits[builder] > 0 && perBuilder > 0) {
                        usdcToken.safeTransfer(builder, perBuilder);
                    }
                }
            }
        }

        usdcToken.safeTransfer(hostSafe, hostAmount);
        usdcToken.safeTransfer(HHP_TREASURY, fee);

        emit Released(hostSafe, hostAmount, fee);
    }

    // ── Cancel ─────────────────────────────────────────────────────────

    /// @notice Creator cancels the house. All builders get 100% refund. No fee.
    function cancelHouse() external {
        require(msg.sender == creator, "Escrow: not creator");
        require(!cancelled, "Escrow: already cancelled");
        require(!released, "Escrow: already released");

        cancelled = true;

        // Withdraw all from adapter before refunding
        if (yieldMode == YieldMode.GMX && totalDeposited > 0) {
            yieldAdapter.withdraw(totalDeposited);
            // Any yield returned goes back to builders as part of their refund
        }

        for (uint256 i = 0; i < _depositors.length; i++) {
            address builder = _depositors[i];
            uint256 amount = deposits[builder];
            if (amount > 0) {
                deposits[builder] = 0;
                usdcToken.safeTransfer(builder, amount);

                // Burn SpotNFT
                uint256 bookingId = builderBooking[builder];
                spotNFT.burn(bookingId);

                emit Refunded(builder, amount);
            }
        }

        totalDeposited = 0;
        emit Cancelled(block.timestamp);
    }

    // ── Transfer Spot ──────────────────────────────────────────────────

    /// @notice Current spot holder transfers their spot (and deposit) to a new builder.
    function transferSpot(uint256 bookingId, address newBuilder) external {
        require(spotOwner[bookingId] == msg.sender, "Escrow: not spot owner");
        require(!cancelled, "Escrow: house cancelled");
        require(!released, "Escrow: already released");
        require(newBuilder != address(0), "Escrow: zero address");
        require(!hasDeposited[newBuilder], "Escrow: new builder already has spot");

        address oldBuilder = msg.sender;

        // Transfer deposit record
        deposits[newBuilder] = deposits[oldBuilder];
        deposits[oldBuilder] = 0;
        hasDeposited[newBuilder] = true;
        hasDeposited[oldBuilder] = false;

        // Transfer spot ownership
        spotOwner[bookingId] = newBuilder;
        builderBooking[newBuilder] = bookingId;
        delete builderBooking[oldBuilder];

        // Update depositors array
        for (uint256 i = 0; i < _depositors.length; i++) {
            if (_depositors[i] == oldBuilder) {
                _depositors[i] = newBuilder;
                break;
            }
        }

        // Transfer SpotNFT
        spotNFT.transferFrom(oldBuilder, newBuilder, bookingId);

        emit SpotTransferred(bookingId, oldBuilder, newBuilder);
    }

    // ── GMX Yield ───────────────────────────────────────────────────────

    /// @notice Pending yield from yield adapter (time-based on testnet, GMX on mainnet)
    function pendingYield() external view returns (uint256) {
        if (yieldMode == YieldMode.NONE) return 0;
        return yieldAdapter.pendingYield();
    }
}
