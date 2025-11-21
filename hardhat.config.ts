import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";
import { vars } from "hardhat/config.js";
import type { HardhatUserConfig } from "hardhat/config.js";

const INFURA_API_KEY: string = vars.get("INFURA_API_KEY", "b18fb7e6ca7045ac83c41157ab93f990");
const PRIVATE_KEY: string = vars.get("PRIVATE_KEY", "079d46175e36992cc4ea3650fb2a24b04f30a5907d26022a664aca8221304283");

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.26",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
  },
          viaIR: true,
    },
  },
      {
        version: "0.8.27",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  fhevm: {
    // FHEVM configuration - Enable FHEVM support
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545"
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      // Enable persistent storage to save contract state and deployment information
      saveDeployments: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      // Enable persistence for localhost network as well
      saveDeployments: true,
    },
    sepolia: {
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },

  typechain: {
    outDir: "types",
    target: "ethers-v6",
    // FHE-specific typechain optimizations
  },

  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    // FHE-specific gas reporting optimizations
  },
};

export default config;
