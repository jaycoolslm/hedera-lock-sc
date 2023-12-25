import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  defaultNetwork: "testnet",
  networks: {
    testnet: {
      url: "https://pool.arkhia.io/hedera/testnet/json-rpc/v1/03Gef8mb4aY1622ac34C3mW7cW6Y2G29",
      chainId: 296,
      accounts: [process.env.OWNER_KEY!],
      timeout: 60000,
    },
  },
};

export default config;
