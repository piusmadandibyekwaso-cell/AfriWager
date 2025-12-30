import { ethers } from "hardhat";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const overrides = {
        maxFeePerGas: ethers.parseUnits("2000", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("100", "gwei"),
    };

    // 1. Use existing Conditional Tokens
    // const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
    // const conditionalTokens = await ConditionalTokens.deploy(overrides);
    // await conditionalTokens.waitForDeployment();
    // const ctAddress = await conditionalTokens.getAddress();
    const ctAddress = "0xC51fC2e7702e59F55257371efE34796Dd5194995";
    const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
    const conditionalTokens = ConditionalTokens.attach(ctAddress) as any;
    console.log("Using ConditionalTokens at:", ctAddress);

    // 2. Use existing Mock USDC
    // const MockERC20 = await ethers.getContractFactory("MockERC20");
    // const usdc = await MockERC20.deploy("USD Coin", "USDC", overrides);
    // await usdc.waitForDeployment();
    // const usdcAddress = await usdc.getAddress();
    const usdcAddress = "0xDb534D89D1FDeEaFb4Ce92993F92F4A9a9F6B50D";
    console.log("Using MockUSDC at:", usdcAddress);

    // 3. Prepare a test condition
    const questionId = ethers.keccak256(ethers.toUtf8Bytes("Will Nigeria win AFCON?"));
    const outcomeSlotCount = 2;

    console.log("Preparing condition...");
    try {
        const tx = await conditionalTokens.prepareCondition(deployer.address, questionId, outcomeSlotCount, overrides);
        console.log("Waiting for condition preparation tx:", tx.hash);
        await tx.wait();
        console.log("Prepared Condition for question:", questionId);
    } catch (e) {
        console.log("Condition likely already prepared or failed:", e);
    }

    await sleep(10000); // Wait 10 seconds

    // Calculate Condition ID
    const packed = ethers.solidityPacked(
        ["address", "bytes32", "uint256"],
        [deployer.address, questionId, outcomeSlotCount]
    );
    const conditionId = ethers.keccak256(packed);

    // Clear stuck nonce
    console.log("Clearing stuck nonce...");
    const nonce = await deployer.getNonce("latest");
    console.log("Current nonce:", nonce);
    // Send dummy tx to self to ensure nonce is moved or cleared
    const txClear = await deployer.sendTransaction({
        to: deployer.address,
        value: 0,
        ...overrides
    });
    console.log("Clear tx sent:", txClear.hash);
    await txClear.wait();
    console.log("Nonce cleared.");

    // 4. Deploy AMM
    console.log("Deploying AMM...");
    const currentNonce = await deployer.getNonce("latest");
    console.log("Using manual nonce for AMM:", currentNonce);

    // Add nonce to overrides
    const newOverrides = { ...overrides, nonce: currentNonce };

    const FixedProductMarketMaker = await ethers.getContractFactory("FixedProductMarketMaker");
    const amm = await FixedProductMarketMaker.deploy(ctAddress, usdcAddress, conditionId, newOverrides);
    await amm.waitForDeployment();
    console.log("FixedProductMarketMaker deployed to:", await amm.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
