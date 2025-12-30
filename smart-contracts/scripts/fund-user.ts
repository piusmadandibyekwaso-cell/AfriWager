import { ethers } from "hardhat";

async function main() {
    const targetAddress = "0x9f717cF22EBB3ab8Fb95b68ec845AE79be434a13";
    const amount = ethers.parseEther("0.05"); // Sending 0.05 ETH for gas

    console.log(`Preparing to send 0.05 ETH to ${targetAddress}...`);

    const [sender] = await ethers.getSigners();
    console.log(`Sender: ${sender.address}`);

    const tx = await sender.sendTransaction({
        to: targetAddress,
        value: amount,
    });

    console.log(`Transaction sent! Hash: ${tx.hash}`);
    await tx.wait();
    console.log(`Transfer complete. ${targetAddress} is now funded.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
