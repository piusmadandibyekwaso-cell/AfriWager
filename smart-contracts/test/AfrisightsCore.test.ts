import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Afrisights Core", function () {
    async function deployFixture() {
        const [owner, otherAccount] = await ethers.getSigners();

        // 1. Deploy Mock USDC
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const usdc = await MockERC20.deploy("USD Coin", "USDC");
        const usdcAddress = await usdc.getAddress();

        // 2. Deploy Conditional Tokens
        const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
        const conditionalTokens = await ConditionalTokens.deploy();
        const ctAddress = await conditionalTokens.getAddress();

        // 3. Prepare Condition Logic (Mocking IDs)
        const oracle = owner.address;
        const questionId = ethers.keccak256(ethers.toUtf8Bytes("Will Nigeria win AFCON?"));
        const outcomeSlotCount = 2;

        await conditionalTokens.prepareCondition(oracle, questionId, outcomeSlotCount);

        // Calculate Condition ID off-chain to match contract logic
        // keccak256(abi.encodePacked(oracle, questionId, outcomeSlotCount))
        const packed = ethers.solidityPacked(
            ["address", "bytes32", "uint256"],
            [oracle, questionId, outcomeSlotCount]
        );
        const conditionId = ethers.keccak256(packed);

        // 4. Deploy AMM
        const FixedProductMarketMaker = await ethers.getContractFactory("FixedProductMarketMaker");
        const amm = await FixedProductMarketMaker.deploy(ctAddress, usdcAddress, conditionId);

        return { usdc, conditionalTokens, amm, owner, otherAccount, conditionId };
    }

    it("Should allow adding liquidity to AMM", async function () {
        const { usdc, conditionalTokens, amm, owner, conditionId } = await loadFixture(deployFixture);
        const amount = ethers.parseUnits("100", 18);

        // Approve AMM to spend USDC
        await usdc.approve(await amm.getAddress(), amount);

        // Initial check: Liquidity shares should be 0
        expect(await amm.totalLiquidityShares()).to.equal(0);

        // Add Funding
        await amm.addFunding(amount);

        // Check Liquidity
        expect(await amm.totalLiquidityShares()).to.equal(amount);

        // AMM should hold split tokens now. 
        // We need to calculate PositionIDs to verify balances, but implicitly if addFunding worked, it's splitting.
    });

    it("Should allow a user to buy YES tokens", async function () {
        const { usdc, conditionalTokens, amm, owner, otherAccount, conditionId } = await loadFixture(deployFixture);

        // 1. Owner provides Liquidity
        const liquidityAmount = ethers.parseUnits("1000", 18);
        await usdc.approve(await amm.getAddress(), liquidityAmount);
        await amm.addFunding(liquidityAmount);

        // 2. User gets USDC
        const userInvestment = ethers.parseUnits("10", 18);
        await usdc.transfer(otherAccount.address, userInvestment);

        // 3. User Buys YES (Outcome 0)
        await usdc.connect(otherAccount).approve(await amm.getAddress(), userInvestment);

        // Expect the trade to succeed
        await expect(amm.connect(otherAccount).buy(0, userInvestment, 0))
            .to.emit(amm, "AMMTrade");

        // Verify User has YES tokens
        // We need helper to calc position ID
        // Outcome 0 -> IndexSet 1
        // ParentCollectionId = 0
        const parentCollectionId = ethers.ZeroHash;
        const indexSet = 1;

        const collectionId = await conditionalTokens.getCollectionId(parentCollectionId, conditionId, indexSet);
        const positionId = await conditionalTokens.getPositionId(await usdc.getAddress(), collectionId);

        const balance = await conditionalTokens.balanceOf(otherAccount.address, positionId);
        expect(balance).to.be.gt(0);
        console.log("User YES Token Balance:", ethers.formatUnits(balance, 18));
    });
});
