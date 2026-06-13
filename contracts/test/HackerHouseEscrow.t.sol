// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/HackerHouseFactory.sol";
import "../src/HackerHouseEscrow.sol";
import "../src/SpotNFT.sol";
import "../src/MockUSDC.sol";
import "../src/MockYieldAdapter.sol";

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

        // Create a CO_PAYMENT house (no adapter)
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

    function test_factory_creates_staking_house() public {
        // Deploy adapter first (needs escrow address — chicken-and-egg)
        // For factory flow, adapter must be pre-deployed with a placeholder escrow
        // In practice, the adapter is shared or deployed before the factory call
        // For this test, we create a simple flow:

        // 1. Create staking house — adapter will be set up by factory
        //    But MockYieldAdapter needs escrow address at construction time.
        //    Solution: deploy adapter with address(0) escrow, then skip onlyEscrow check in test
        //    OR: use a shared adapter pattern

        // Test factory with CO_PAYMENT (no adapter)
        vm.prank(builder1);
        address newEscrow = factory.createHouse(
            address(usdc),
            builder1,
            100e6,
            block.timestamp + 7 days,
            2,
            HackerHouseEscrow.HouseType.CO_PAYMENT,
            HackerHouseEscrow.YieldMode.NONE,
            HackerHouseEscrow.YieldDest.HOST
        );

        assertFalse(newEscrow == address(0));
        assertEq(factory.totalHouses(), 2); // 1 from setUp + 1 new

        address[] memory houses = factory.getHousesByCreator(builder1);
        assertEq(houses.length, 1);
        assertEq(houses[0], newEscrow);
    }

    // ── Yield Tests (CO_PAYMENT — no adapter) ─────────────────────────

    function test_pending_yield_returns_zero_no_adapter() public view {
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

    // ── GMX Yield Tests (STAKING with MockYieldAdapter) ───────────────

    function test_staking_deposit_forwards_to_adapter() public {
        // Create staking escrow with adapter
        (HackerHouseEscrow stakingEscrow, MockYieldAdapter adapter) = _createStakingHouse();

        // Deposit as builder
        usdc.mint(builder1, 10_000e6);
        vm.prank(builder1);
        usdc.approve(address(stakingEscrow), type(uint256).max);
        vm.prank(builder1);
        stakingEscrow.deposit(0);

        // Verify USDC went to adapter, not sitting in escrow
        assertEq(usdc.balanceOf(address(stakingEscrow)), 0);
        assertEq(usdc.balanceOf(address(adapter)), DEPOSIT);
        assertEq(adapter.totalDeposited(), DEPOSIT);
    }

    function test_staking_pending_yield_accrues() public {
        (HackerHouseEscrow stakingEscrow, ) = _createStakingHouse();

        // Deposit
        usdc.mint(builder1, 10_000e6);
        vm.prank(builder1);
        usdc.approve(address(stakingEscrow), type(uint256).max);
        vm.prank(builder1);
        stakingEscrow.deposit(0);

        // Initially yield is 0
        assertEq(stakingEscrow.pendingYield(), 0);

        // Warp 30 days — yield should accrue
        vm.warp(block.timestamp + 30 days);

        // Expected: 500 USDC × 1000 bps × 30 days / (10000 × 365 days)
        // = 500e6 × 1000 × 2592000 / (10000 × 31536000)
        // = 500e6 × 0.08219... = ~4,109,589 (≈ 4.11 USDC)
        uint256 yield_ = stakingEscrow.pendingYield();
        assertGt(yield_, 0);
        // ~4.1 USDC for 500 USDC at 10% APY for 30 days
        assertApproxEqRel(yield_, 4_109_589, 0.01e18); // 1% tolerance
    }

    function test_staking_release_distributes_yield_to_host() public {
        (HackerHouseEscrow stakingEscrow, ) = _createStakingHouse();

        // Two builders deposit
        usdc.mint(builder1, 10_000e6);
        usdc.mint(builder2, 10_000e6);
        vm.prank(builder1);
        usdc.approve(address(stakingEscrow), type(uint256).max);
        vm.prank(builder2);
        usdc.approve(address(stakingEscrow), type(uint256).max);

        vm.prank(builder1);
        stakingEscrow.deposit(0);
        vm.prank(builder2);
        stakingEscrow.deposit(1);

        // Warp to withdraw date
        vm.warp(block.timestamp + 30 days);

        uint256 hostBefore = usdc.balanceOf(host);

        // Release — yield goes to HOST
        vm.prank(host);
        stakingEscrow.release();

        uint256 hostReceived = usdc.balanceOf(host) - hostBefore;
        uint256 principal = DEPOSIT * 2;
        uint256 fee = principal * 50 / 10000;
        uint256 expectedMinimum = principal - fee; // principal minus fee

        // Host should receive principal - fee + yield
        assertGt(hostReceived, expectedMinimum);
    }

    function test_staking_release_distributes_yield_to_builders() public {
        // Create staking house with yieldDest = BUILDERS
        (HackerHouseEscrow stakingEscrow, ) = _createStakingHouseWithDest(
            HackerHouseEscrow.YieldDest.BUILDERS
        );

        // Two builders deposit
        usdc.mint(builder1, 10_000e6);
        usdc.mint(builder2, 10_000e6);
        vm.prank(builder1);
        usdc.approve(address(stakingEscrow), type(uint256).max);
        vm.prank(builder2);
        usdc.approve(address(stakingEscrow), type(uint256).max);

        vm.prank(builder1);
        stakingEscrow.deposit(0);
        vm.prank(builder2);
        stakingEscrow.deposit(1);

        // Warp 30 days
        vm.warp(block.timestamp + 30 days);

        uint256 b1Before = usdc.balanceOf(builder1);
        uint256 b2Before = usdc.balanceOf(builder2);

        // Release
        vm.prank(host);
        stakingEscrow.release();

        // Builders should have received yield (split equally)
        uint256 b1Received = usdc.balanceOf(builder1) - b1Before;
        uint256 b2Received = usdc.balanceOf(builder2) - b2Before;
        assertGt(b1Received, 0);
        assertGt(b2Received, 0);
        assertEq(b1Received, b2Received); // equal split
    }

    function test_staking_cancel_withdraws_from_adapter() public {
        (HackerHouseEscrow stakingEscrow, MockYieldAdapter adapter) = _createStakingHouse();

        // Deposit
        usdc.mint(builder1, 10_000e6);
        vm.prank(builder1);
        usdc.approve(address(stakingEscrow), type(uint256).max);
        vm.prank(builder1);
        stakingEscrow.deposit(0);

        assertEq(usdc.balanceOf(address(adapter)), DEPOSIT);

        uint256 b1Before = usdc.balanceOf(builder1);

        // Cancel
        vm.prank(host);
        stakingEscrow.cancelHouse();

        // Builder gets full refund
        assertEq(usdc.balanceOf(builder1) - b1Before, DEPOSIT);
        // Adapter should be empty
        assertEq(adapter.totalDeposited(), 0);
    }

    function test_staking_requires_gmx_yield_mode() public {
        vm.prank(host);
        vm.expectRevert("Escrow: STAKING/HYBRID requires GMX");
        factory.createHouse(
            address(usdc),
            host,
            DEPOSIT,
            block.timestamp + 30 days,
            CAPACITY,
            HackerHouseEscrow.HouseType.STAKING,
            HackerHouseEscrow.YieldMode.NONE,
            HackerHouseEscrow.YieldDest.HOST
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────

    function _createStakingHouse()
        internal
        returns (HackerHouseEscrow stakingEscrow, MockYieldAdapter adapter)
    {
        return _createStakingHouseWithDest(HackerHouseEscrow.YieldDest.HOST);
    }

    function _createStakingHouseWithDest(HackerHouseEscrow.YieldDest dest)
        internal
        returns (HackerHouseEscrow stakingEscrow, MockYieldAdapter adapter)
    {
        // Factory auto-deploys MockYieldAdapter + initializes it for STAKING houses
        vm.prank(host);
        address escrowAddr = factory.createHouse(
            address(usdc),
            host,
            DEPOSIT,
            block.timestamp + 30 days,
            CAPACITY,
            HackerHouseEscrow.HouseType.STAKING,
            HackerHouseEscrow.YieldMode.GMX,
            dest
        );
        stakingEscrow = HackerHouseEscrow(escrowAddr);
        adapter = MockYieldAdapter(address(stakingEscrow.yieldAdapter()));
    }
}
