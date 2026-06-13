// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IYieldAdapter — Interface for pluggable yield strategies
/// @notice Each escrow with YieldMode.GMX holds a reference to an adapter.
///         The adapter receives USDC on deposit and returns it (+ yield) on withdraw.
///         Swapping the adapter implementation (MockYieldAdapter → GMXStrategy)
///         requires no changes to the escrow or frontend.
interface IYieldAdapter {
    /// @notice Deposit USDC into the yield strategy
    /// @param amount Raw USDC units (6 decimals)
    function deposit(uint256 amount) external;

    /// @notice Withdraw USDC from the yield strategy
    /// @param amount Requested amount in raw USDC units
    /// @return received Actual amount of USDC returned (may include yield)
    function withdraw(uint256 amount) external returns (uint256 received);

    /// @notice Total yield accrued but not yet withdrawn, in raw USDC units (6 decimals)
    /// @dev On testnet (MockYieldAdapter) this is time-based math.
    ///      On mainnet (GMXStrategy) this reads from GMX V2 vaults.
    function pendingYield() external view returns (uint256);

    /// @notice Total principal currently held by the adapter
    function totalDeposited() external view returns (uint256);
}
