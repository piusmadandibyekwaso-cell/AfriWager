import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load environment variables from the parent directory's .env.local file
dotenv.config({ path: "../.env.local" });

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            chainId: 1337,
        },
        amoy: {
            url: "https://polygon-amoy.drpc.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 80002
        },
        sepolia: {
            url: "https://1rpc.io/sepolia",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 11155111
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

export default config;
