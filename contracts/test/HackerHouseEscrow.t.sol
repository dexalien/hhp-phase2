// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/HackerHouseFactory.sol";
import "../src/HackerHouseEscrow.sol";
import "../src/SpotNFT.sol";
import "../src/MockUSDC.sol";

contract HackerHouseEscrowTest is Test {
    HackerHouseFactory public factory;
    MockUSDC public usdc;

    address public host = makeAddr("host");
    address public builder1 = makeAddr("builder1");
    address public builder2 = makeAddr("builder2");
    address public builder3 = makeAddr("builder3");
    address public newBuilder = makeAddr("newBuilder");

    uint256 public constant DEPOSIT = 500e6; // 500 USDC
    uint256 public constant CAPACITY = 4;
    uint256 public withdrawDate;

    HackerHouseEscrow public escrow;
    SpotNFT public spotNFT;

    function setUp() public {
        usdc = new MockUSDC();
        factory = new HackerHouseFactory();
        withdrawDate = block.timestamp + 30 days;

        // Create a house
        vm.prank(host);
        address escrowAddr = factory.createHouse(
            address(usdc),
            host,
            DEPOSIT,
            withdrawDate,
            CAPACITY,
            HackerHouseEscrow.HouseType.CO_PAYMENT,
            HackerHouseEscrow.YieldMode.NONE,
            HackerHouseEscrow.YieldDest.HOST
        );
        escrow = HackerHouseEscrow(escrowAddr);
        spotNFT = escrow.spotNFT();

        // Mint USDC to builders
        usdc.mint(builder1, 10_000e6);
        usdc.mint(builder2, 10_000e6);
        usdc.mint(builder3, 10_000e6);
        usdc.mint(newBuilder, 10_000e6);

        // Approve escrow
        vm.prank(builder1);
        usdc.approve(address(escrow), type(uint256).max);
        vm.prank(builder2);
        usdc.approve(address(escrow), type(uint256).max);
        vm.prank(builder3);
        usdc.approve(address(escrow), type(uint256).max);
        vm.prank(newBuilder);
        usdc.approve(address(escrow), type(uint256).max);
    }

    // ── Deposit Tests ──────────────────────────────────────────────────

    function test_deposit_success() public {
        vm.prank(builder1);
        escrow.deposit(0);

        assertEq(escrow.hasDeposited(builder1), true);
        assertEq(escrow.deposits(builder1), DEPOSIT);
        assertEq(escrow.spotOwner(0), builder1);
        assertEq(escrow.builderBooking(builder1), 0);
        assertEq(escrow.nextBookingId(), 1);
        assertEq(escrow.totalDeposited(), DEPOSIT);
        assertEq(spotNFT.ownerOf(0), builder1);
    }

    function test_deposit_multiple_builders() public {
        vm.prank(builder1);
        escrow.deposit(0);
        vm.prank(builder2);
        escrow.deposit(1);
        vm.prank(builder3);
        escrow.deposit(2);

        assertEq(escrow.nextBookingId(), 3);
        assertEq(escrow.totalDeposited(), DEPOSIT * 3);
    }

    function test_deposit_full_house() public {
        vm.prank(builder1);
        escrow.deposit(0);
        vm.prank(builder2);
        escrow.deposit(1);
        vm.prank(builder3);
        escrow.deposit(2);

        // 4th builder fills the house
        address builder4 = makeAddr("builder4");
        usdc.mint(builder4, 10_000e6);
        vm.prank(builder4);
        usdc.approve(address(escrow), type(uint256).max);
        vm.prank(builder4);
        escrow.deposit(3);

        // 5th builder should fail
        address builder5 = makeAddr("builder5");
        usdc.mint(builder5, 10_000e6);
        vm.prank(builder5);
        usdc.approve(address(escrow), type(uint256).max);
        vm.prank(builder5);
        vm.expectRevert("Escrow: house full");
        escrow.deposit(4);
    }

    function test_deposit_after_withdraw_date() public {
        vm.warp(withdrawDate + 1);
        vm.prank(builder1);
        vm.expectRevert("Escrow: deposit window closed");
        escrow.deposit(0);
    }

    function test_deposit_twice_reverts() public {
        vm.prank(builder1);
        escrow.deposit(0);

        vm.prank(builder1);
        vm.expectRevert("Escrow: already deposited");
        escrow.deposit(1);
    }

    function test_deposit_wrong_booking_id() public {
        vm.prank(builder1);
        vm.expectRevert("Escrow: invalid bookingId");
        escrow.deposit(5);
    }

    // ── Release Tests ──────────────────────────────────────────────────

    function test_release_by_host() public {
        // Fill some spots
        vm.prank(builder1);
        escrow.deposit(0);
        vm.prank(builder2);
        escrow.deposit(1);

        uint256 total = DEPOSIT * 2;
        uint256 expectedFee = total * 50 / 10000;
        uint256 expectedHost = total - expectedFee;

        uint256 hostBefore = usdc.balanceOf(host);
        uint256 treasuryBefore = usdc.balanceOf(escrow.HHP_TREASURY());

        // Warp past withdraw date
        vm.warp(withdrawDate);
        vm.prank(host);
        escrow.release();

        assertEq(escrow.released(), true);
        assertEq(usdc.balanceOf(host) - hostBefore, expectedHost);
        assertEq(usdc.balanceOf(escrow.HHP_TREASURY()) - treasuryBefore, expectedFee);
    }

    function test_release_before_withdraw_date() public {
        vm.prank(builder1);
        escrow.deposit(0);

        vm.prank(host);
        vm.expectRevert("Escrow: too early");
        escrow.release();
    }

    function test_release_by_non_host() public {
        vm.prank(builder1);
        escrow.deposit(0);

        vm.warp(withdrawDate);
        vm.prank(builder1);
        vm.expectRevert("Escrow: not hostSafe");
        escrow.release();
    }

    function test_release_twice_reverts() public {
        vm.prank(builder1);
        escrow.deposit(0);

        vm.warp(withdrawDate);
        vm.prank(host);
        escrow.release();

        vm.prank(host);
        vm.expectRevert("Escrow: already released");
        escrow.release();
    }

    // ── Cancel Tests ───────────────────────────────────────────────────

    function test_cancel_refunds_all() public {
        vm.prank(builder1);
        escrow.deposit(0);
        vm.prank(builder2);
        escrow.deposit(1);

        uint256 b1Before = usdc.balanceOf(builder1);
        uint256 b2Before = usdc.balanceOf(builder2);

        vm.prank(host); // host is the creator in setUp
        escrow.cancelHouse();

        assertEq(escrow.cancelled(), true);
        assertEq(usdc.balanceOf(builder1) - b1Before, DEPOSIT);
        assertEq(usdc.balanceOf(builder2) - b2Before, DEPOSIT);
        assertEq(escrow.totalDeposited(), 0);

        // SpotNFTs should be burned
        vm.expectRevert();
        spotNFT.ownerOf(0);
        vm.expectRevert();
        spotNFT.ownerOf(1);
    }

    function test_cancel_by_non_creator() public {
        vm.prank(builder1);
        vm.expectRevert("Escrow: not creator");
        escrow.cancelHouse();
    }

    function test_cancel_after_release_reverts() public {
        vm.prank(builder1);
        escrow.deposit(0);

        vm.warp(withdrawDate);
        vm.prank(host);
        escrow.release();

        vm.prank(host);
        vm.expectRevert("Escrow: already released");
        escrow.cancelHouse();
    }

    // ── Transfer Spot Tests ────────────────────────────────────────────

    function test_transfer_spot() public {
        vm.prank(builder1);
        escrow.deposit(0);

        // builder1 needs to approve SpotNFT transfer
        vm.prank(builder1);
        spotNFT.approve(address(escrow), 0);

        vm.prank(builder1);
        escrow.transferSpot(0, newBuilder);

        assertEq(escrow.spotOwner(0), newBuilder);
        assertEq(escrow.hasDeposited(newBuilder), true);
        assertEq(escrow.hasDeposited(builder1), false);
        assertEq(escrow.deposits(newBuilder), DEPOSIT);
        assertEq(escrow.deposits(builder1), 0);
        assertEq(spotNFT.ownerOf(0), newBuilder);
    }

    function test_transfer_spot_wrong_owner() public {
        vm.prank(builder1);
        escrow.deposit(0);

        vm.prank(builder2);
        vm.expectRevert("Escrow: not spot owner");
        escrow.transferSpot(0, newBuilder);
    }

    function test_transfer_spot_to_existing_depositor() public {
        vm.prank(builder1);
        escrow.deposit(0);
        vm.prank(builder2);
        escrow.deposit(1);

        vm.prank(builder1);
        spotNFT.approve(address(escrow), 0);

        vm.prank(builder1);
        vm.expectRevert("Escrow: new builder already has spot");
        escrow.transferSpot(0, builder2);
    }

    // ── Factory Tests ──────────────────────────────────────────────────

    function test_factory_creates_house() public {
        vm.prank(builder1);
        address newEscrow = factory.createHouse(
            address(usdc),
            builder1,
            100e6,
            block.timestamp + 7 days,
            2,
            HackerHouseEscrow.HouseType.STAKING,
            HackerHouseEscrow.YieldMode.GMX,
            HackerHouseEscrow.YieldDest.BUILDERS
        );

        assertFalse(newEscrow == address(0));
        assertEq(factory.totalHouses(), 2); // 1 from setUp + 1 new

        address[] memory houses = factory.getHousesByCreator(builder1);
        assertEq(houses.length, 1);
        assertEq(houses[0], newEscrow);
    }

    // ── Yield Stub Test ────────────────────────────────────────────────

    function test_pending_yield_returns_zero() public view {
        assertEq(escrow.pendingYield(), 0);
    }

    function test_yield_dest_readable() public view {
        assertEq(uint8(escrow.yieldDest()), uint8(HackerHouseEscrow.YieldDest.HOST));
    }

    // ── Deposit after cancel reverts ───────────────────────────────────

    function test_deposit_after_cancel_reverts() public {
        vm.prank(host);
        escrow.cancelHouse();

        vm.prank(builder1);
        vm.expectRevert("Escrow: house cancelled");
        escrow.deposit(0);
    }
}
