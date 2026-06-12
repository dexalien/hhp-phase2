// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/HackerHouseFactory.sol";
import "../src/MockUSDC.sol";

/// @notice Deploy script for Arbitrum Sepolia testnet
/// Usage:
///   forge script script/Deploy.s.sol:DeployScript \
///     --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
///     --broadcast \
///     --private-key $DEPLOYER_PRIVATE_KEY \
///     --verify \
///     --verifier-url https://api-sepolia.arbiscan.io/api \
///     --etherscan-api-key $ARBISCAN_API_KEY
contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        // 1. Deploy MockUSDC (testnet only — mainnet uses real USDC)
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        // 2. Deploy Factory
        HackerHouseFactory factory = new HackerHouseFactory();
        console.log("HackerHouseFactory deployed at:", address(factory));

        // 3. Mint test USDC to deployer (1M USDC)
        usdc.mint(msg.sender, 1_000_000e6);
        console.log("Minted 1M USDC to deployer:", msg.sender);

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Set these in your .env.local:");
        console.log("  NEXT_PUBLIC_FACTORY_ADDRESS=", address(factory));
        console.log("  NEXT_PUBLIC_USDC_ADDRESS=", address(usdc));
    }
}
