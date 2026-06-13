// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @title SpotNFT — Booking confirmation NFT for Hacker House spots
/// @dev One SpotNFT contract per HackerHouseEscrow. Only the escrow can mint/burn.
contract SpotNFT is ERC721 {
    using Strings for uint256;

    address public immutable escrow;
    string public houseName;

    modifier onlyEscrow() {
        require(msg.sender == escrow, "SpotNFT: caller is not the escrow");
        _;
    }

    constructor(address _escrow, string memory _houseName) ERC721("HHP Spot", "SPOT") {
        require(_escrow != address(0), "SpotNFT: zero escrow address");
        escrow = _escrow;
        houseName = _houseName;
    }

    /// @notice Mint a spot NFT to a builder. tokenId = bookingId.
    function mint(address to, uint256 tokenId) external onlyEscrow {
        _mint(to, tokenId);
    }

    /// @notice Burn a spot NFT (on cancellation).
    function burn(uint256 tokenId) external onlyEscrow {
        _burn(tokenId);
    }

    /// @notice Returns on-chain metadata with house name and the HHP key image.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        // Display as "House Name - Spot #1" (1-indexed for humans)
        string memory spotNumber = (tokenId + 1).toString();

        string memory json = string.concat(
            '{"name":"',
            houseName,
            ' - Spot #',
            spotNumber,
            '","description":"Hacker House Protocol - Your key to ',
            houseName,
            '. This NFT confirms your spot in a Hacker House on Arbitrum.","image":"https://hackerhouse.app/assets/nft-key.png","attributes":[{"trait_type":"House","value":"',
            houseName,
            '"},{"trait_type":"Spot","value":"#',
            spotNumber,
            '"},{"trait_type":"Protocol","value":"Hacker House Protocol"}]}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}
