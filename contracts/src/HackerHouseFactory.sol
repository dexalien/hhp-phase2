// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./HackerHouseEscrow.sol";
import "./SpotNFT.sol";
import "./MockYieldAdapter.sol";

/// @title HackerHouseFactory — Deploys HackerHouseEscrow + SpotNFT per house
/// @notice For STAKING/HYBRID houses, also deploys a MockYieldAdapter (testnet).
///         On mainnet, this would be replaced with a GMXStrategy deployment.
contract HackerHouseFactory {
    // ── Events ─────────────────────────────────────────────────────────
    event HouseCreated(
        address indexed creator,
        address escrowAddress,
        address spotNFTAddress,
        address yieldAdapterAddress
    );

    // ── Storage ────────────────────────────────────────────────────────
    mapping(address => address[]) public housesByCreator;
    address[] public allHouses;

    // ── Create ─────────────────────────────────────────────────────────

    /// @notice Deploy a new HackerHouseEscrow + SpotNFT pair.
    ///         For STAKING/HYBRID houses, a MockYieldAdapter is auto-deployed.
    /// @return escrowAddress The deployed escrow contract address.
    function createHouse(
        address usdcToken,
        address hostSafe,
        uint256 depositAmount,
        uint256 withdrawDate,
        uint256 capacity,
        HackerHouseEscrow.HouseType houseType,
        HackerHouseEscrow.YieldMode yieldMode,
        HackerHouseEscrow.YieldDest yieldDest,
        string calldata houseName
    ) external returns (address escrowAddress) {
        // 1. Deploy MockYieldAdapter if needed (STAKING/HYBRID)
        address adapterAddr = address(0);
        if (yieldMode == HackerHouseEscrow.YieldMode.GMX) {
            MockYieldAdapter adapter = new MockYieldAdapter(usdcToken);
            adapterAddr = address(adapter);
        }

        // 2. Deploy escrow (without SpotNFT — will be set via initialize)
        HackerHouseEscrow escrow = new HackerHouseEscrow(
            usdcToken,
            hostSafe,
            msg.sender, // creator
            depositAmount,
            withdrawDate,
            capacity,
            houseType,
            yieldMode,
            yieldDest,
            adapterAddr
        );

        // 3. Deploy SpotNFT with escrow address and house name
        SpotNFT spotNFT = new SpotNFT(address(escrow), houseName);

        // 4. Initialize escrow with SpotNFT address
        escrow.initialize(address(spotNFT));

        // 5. Initialize adapter with escrow address (if deployed)
        if (adapterAddr != address(0)) {
            MockYieldAdapter(adapterAddr).initialize(address(escrow));
        }

        escrowAddress = address(escrow);
        housesByCreator[msg.sender].push(escrowAddress);
        allHouses.push(escrowAddress);

        emit HouseCreated(msg.sender, escrowAddress, address(spotNFT), adapterAddr);
    }

    /// @notice Get all houses created by a specific creator.
    function getHousesByCreator(address _creator) external view returns (address[] memory) {
        return housesByCreator[_creator];
    }

    /// @notice Total number of houses deployed.
    function totalHouses() external view returns (uint256) {
        return allHouses.length;
    }
}
