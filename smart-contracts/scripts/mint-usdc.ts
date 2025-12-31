import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("💰 Creating Magic Money with account:", deployer.address);

    // The deployed MockUSDC address from your previous deploy
    const usdcAddress = "0xDb534D89D1FDeEaFb4Ce92993F92F4A9a9F6B50D";

    // Connect to the contract
    // We use a minimal ABI so we don't need the full artifact if it's acting up
    const minimalABI = [
        "function mint(address to, uint256 amount) public",
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() external view returns (uint8)"
    ];

    const usdc = new ethers.Contract(usdcAddress, minimalABI, deployer);

    // Amount to mint: 10,000 USDC
    const decimals = await usdc.decimals();
    const amountToMint = ethers.parseUnits("10000", decimals);

    console.log(`... Minting 10,000 USDC to ${deployer.address}`);

    const tx = await usdc.mint(deployer.address, amountToMint);
    console.log("✈️  Transaction sent:", tx.hash);

    console.log("⏳ Waiting for confirmation...");
    await tx.wait();

    const newBalance = await usdc.balanceOf(deployer.address);
    console.log("✅ Success! New Balance:", ethers.formatUnits(newBalance, decimals), "USDC");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
