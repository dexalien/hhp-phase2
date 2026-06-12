// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./HackerHouseEscrow.sol";
import "./SpotNFT.sol";

/// @title HackerHouseFactory — Deploys HackerHouseEscrow + SpotNFT per house
contract HackerHouseFactory {
    // ── Events ─────────────────────────────────────────────────────────
    event HouseCreated(address indexed creator, address escrowAddress, address spotNFTAddress);

    // ── Storage ────────────────────────────────────────────────────────
    mapping(address => address[]) public housesByCreator;
    address[] public allHouses;

    // ── Create ─────────────────────────────────────────────────────────

    /// @notice Deploy a new HackerHouseEscrow + SpotNFT pair.
    /// @return escrowAddress The deployed escrow contract address.
    function createHouse(
        address usdcToken,
        address hostSafe,
        uint256 depositAmount,
        uint256 withdrawDate,
        uint256 capacity,
        HackerHouseEscrow.HouseType houseType,
        HackerHouseEscrow.YieldMode yieldMode,
        HackerHouseEscrow.YieldDest yieldDest
    ) external returns (address escrowAddress) {
        // 1. Deploy escrow (without SpotNFT — will be set via initialize)
        HackerHouseEscrow escrow = new HackerHouseEscrow(
            usdcToken,
            hostSafe,
            msg.sender, // creator
            depositAmount,
            withdrawDate,
            capacity,
            houseType,
            yieldMode,
            yieldDest
        );

        // 2. Deploy SpotNFT with escrow address (so only escrow can mint/burn)
        SpotNFT spotNFT = new SpotNFT(address(escrow));

        // 3. Initialize escrow with SpotNFT address
        escrow.initialize(address(spotNFT));

        escrowAddress = address(escrow);
        housesByCreator[msg.sender].push(escrowAddress);
        allHouses.push(escrowAddress);

        emit HouseCreated(msg.sender, escrowAddress, address(spotNFT));
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
