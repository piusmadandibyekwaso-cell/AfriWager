import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying AMM with account:", deployer.address);

    const ctAddress = "0xC51fC2e7702e59F55257371efE34796Dd5194995";
    const usdcAddress = "0xDb534D89D1FDeEaFb4Ce92993F92F4A9a9F6B50D";

    // Re-calculate Condition ID just to be sure (or hardcode if known, but calc is safer)
    const questionId = ethers.keccak256(ethers.toUtf8Bytes("Will Nigeria win AFCON?"));
    const outcomeSlotCount = 2;
    const packed = ethers.solidityPacked(
        ["address", "bytes32", "uint256"],
        [deployer.address, questionId, outcomeSlotCount]
    );
    const conditionId = ethers.keccak256(packed);
    console.log("Condition ID:", conditionId);

    // Manual Nonce to allow retry/fix
    const nonce = await deployer.getNonce("latest");
    console.log("Current Nonce:", nonce);

    const overrides = {
        maxFeePerGas: ethers.parseUnits("30", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        gasLimit: 3000000, // Increased limit, lower price (3M * 30gwei = 0.09 ETH)
        nonce: nonce
    };

    console.log("Deploying...");
    const FixedProductMarketMaker = await ethers.getContractFactory("FixedProductMarketMaker");
    const amm = await FixedProductMarketMaker.deploy(ctAddress, usdcAddress, conditionId, overrides);
    console.log("Tx Hash:", amm.deploymentTransaction()?.hash);

    await amm.waitForDeployment();
    console.log("FixedProductMarketMaker deployed to:", await amm.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
