// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC — testnet-only ERC-20 with public mint
/// @dev 6 decimals to match real USDC. Anyone can mint (testnet only).
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin (Mock)", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint tokens to any address (testnet only — no access control)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
