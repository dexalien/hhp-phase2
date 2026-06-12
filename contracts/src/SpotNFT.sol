// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title SpotNFT — Booking confirmation NFT for Hacker House spots
/// @dev One SpotNFT contract per HackerHouseEscrow. Only the escrow can mint/burn.
contract SpotNFT is ERC721 {
    address public immutable escrow;

    modifier onlyEscrow() {
        require(msg.sender == escrow, "SpotNFT: caller is not the escrow");
        _;
    }

    constructor(address _escrow) ERC721("HHP Spot", "SPOT") {
        require(_escrow != address(0), "SpotNFT: zero escrow address");
        escrow = _escrow;
    }

    /// @notice Mint a spot NFT to a builder. tokenId = bookingId.
    function mint(address to, uint256 tokenId) external onlyEscrow {
        _mint(to, tokenId);
    }

    /// @notice Burn a spot NFT (on cancellation).
    function burn(uint256 tokenId) external onlyEscrow {
        _burn(tokenId);
    }
}
