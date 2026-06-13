// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IYieldAdapter.sol";
import "./MockUSDC.sol";

/// @title MockYieldAdapter — Time-based yield simulator for testnet
/// @notice Simulates yield accrual using a configurable APY and elapsed time.
///         Used on Arbitrum Sepolia where GMX V2 contracts don't exist.
///
/// How it works:
///   1. Escrow calls deposit(amount) → adapter receives real USDC from the escrow
///   2. Yield accrues based on: principal × APY × elapsed_time / year
///   3. Escrow calls pendingYield() → returns calculated yield amount
///   4. Escrow calls withdraw(amount) → adapter returns USDC + mints yield as new USDC
///
/// The "minting" is only possible because MockUSDC has a public mint() function.
/// On mainnet, the GMXStrategy would earn real yield from GMX V2 Earn vaults instead.
///
/// Architecture:
///   - This contract is a drop-in replacement for a future GMXStrategy
///   - Both implement IYieldAdapter with the same interface
///   - The escrow doesn't know or care which adapter it's using
///   - Swapping MockYieldAdapter → GMXStrategy requires zero frontend changes
contract MockYieldAdapter is IYieldAdapter {
    using SafeERC20 for IERC20;

    /// @notice The USDC token (MockUSDC on testnet)
    MockUSDC public immutable usdc;

    /// @notice Annual percentage yield in basis points (1000 = 10% APY)
    uint256 public constant APY_BPS = 1000;

    /// @notice Total principal currently deposited
    uint256 public override totalDeposited;

    /// @notice Timestamp of last yield accrual
    uint256 public lastAccrualTime;

    /// @notice Accumulated yield that has been minted but not yet withdrawn
    uint256 public accruedYield;

    /// @notice Only the escrow that owns this adapter can call deposit/withdraw
    address public escrow;

    modifier onlyEscrow() {
        require(msg.sender == escrow, "MockYieldAdapter: not escrow");
        _;
    }

    constructor(address _usdc) {
        require(_usdc != address(0), "MockYieldAdapter: zero USDC");
        usdc = MockUSDC(_usdc);
        lastAccrualTime = block.timestamp;
    }

    /// @notice Set the escrow address. Can only be called once.
    function initialize(address _escrow) external {
        require(escrow == address(0), "MockYieldAdapter: already initialized");
        require(_escrow != address(0), "MockYieldAdapter: zero escrow");
        escrow = _escrow;
    }

    /// @notice Deposit USDC into the adapter. Called by escrow after builder deposits.
    function deposit(uint256 amount) external override onlyEscrow {
        _accrue();
        IERC20(address(usdc)).safeTransferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;
    }

    /// @notice Withdraw USDC from the adapter. Called by escrow on release/cancel.
    /// @param amount Amount of principal to withdraw
    /// @return received Total USDC returned (principal + any accrued yield)
    function withdraw(uint256 amount) external override onlyEscrow returns (uint256 received) {
        _accrue();

        uint256 principalToReturn = amount > totalDeposited ? totalDeposited : amount;
        totalDeposited -= principalToReturn;

        // Include accrued yield in the withdrawal
        uint256 yieldToReturn = accruedYield;
        accruedYield = 0;

        received = principalToReturn + yieldToReturn;
        IERC20(address(usdc)).safeTransfer(msg.sender, received);
    }

    /// @notice Returns total yield accrued since last withdrawal
    /// @dev Includes both already-minted yield and pending time-based yield
    function pendingYield() external view override returns (uint256) {
        return accruedYield + _calculatePendingYield();
    }

    /// @dev Calculate yield based on elapsed time since last accrual
    ///      Formula: principal × APY_BPS × elapsed / (10000 × 365 days)
    ///      Example: 500 USDC × 1000 bps × 3600s / (10000 × 31536000s) = ~0.0057 USDC/hour
    function _calculatePendingYield() internal view returns (uint256) {
        if (totalDeposited == 0) return 0;
        uint256 elapsed = block.timestamp - lastAccrualTime;
        if (elapsed == 0) return 0;
        return totalDeposited * APY_BPS * elapsed / (10000 * 365 days);
    }

    /// @dev Accrue pending yield by minting new MockUSDC to this contract.
    ///      On mainnet, this step wouldn't exist — yield comes from GMX positions.
    function _accrue() internal {
        uint256 yield_ = _calculatePendingYield();
        if (yield_ > 0) {
            usdc.mint(address(this), yield_);
            accruedYield += yield_;
        }
        lastAccrualTime = block.timestamp;
    }
}
