
const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
        console.error("No PRIVATE_KEY found");
        return;
    }
    const wallet = new ethers.Wallet(pk);
    console.log("Admin Address:", wallet.address);
}

main();
