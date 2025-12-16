const ethers = require("ethers");
const fs = require('fs');
const path = require('path');

// AthleteRegistration contract ABI (simplified for deployment)
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "externalEuint32", "name": "_nameHash", "type": "uint256"},
      {"internalType": "bytes", "name": "_nameProof", "type": "bytes"},
      {"internalType": "externalEuint32", "name": "_age", "type": "uint256"},
      {"internalType": "bytes", "name": "_ageProof", "type": "bytes"},
      {"internalType": "externalEuint32", "name": "_contactHash", "type": "uint256"},
      {"internalType": "bytes", "name": "_contactProof", "type": "bytes"},
      {"internalType": "externalEuint32", "name": "_sportCategory", "type": "uint256"},
      {"internalType": "bytes", "name": "_sportProof", "type": "bytes"}
    ],
    "name": "registerAthlete",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNameHash",
    "outputs": [{"internalType": "euint32", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAge",
    "outputs": [{"internalType": "euint32", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContactHash",
    "outputs": [{"internalType": "euint32", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSportCategory",
    "outputs": [{"internalType": "euint32", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRegistrationTimestamp",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isAthleteRegistered",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  console.log("🚀 Direct deployment starting...");

  try {
    // Connect to local hardhat node
    console.log("📡 Connecting to local hardhat node...");
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);

    // Get signer
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    console.log(`✅ Signer: ${address}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    // Read compiled contract bytecode
    console.log("📖 Reading contract bytecode...");
    const artifactsPath = path.join(__dirname, 'artifacts', 'contracts', 'AthleteRegistration.sol', 'AthleteRegistration.json');

    if (!fs.existsSync(artifactsPath)) {
      throw new Error(`Artifact not found at: ${artifactsPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
    console.log("✅ Artifact loaded");

    // Create contract factory
    console.log("🏭 Creating contract factory...");
    const factory = new ethers.ContractFactory(CONTRACT_ABI, artifact.bytecode, signer);
    console.log("✅ Factory created");

    // Deploy contract
    console.log("⚙️ Deploying AthleteRegistration contract...");
    const contract = await factory.deploy();
    console.log("📤 Deployment transaction sent");

    // Wait for deployment
    console.log("⏳ Waiting for deployment confirmation...");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`🎉 Contract deployed successfully!`);
    console.log(`📍 Address: ${contractAddress}`);

    // Save deployment info
    const deploymentDir = path.join(__dirname, 'deployments', 'localhost');
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentInfo = {
      address: contractAddress,
      abi: CONTRACT_ABI,
      bytecode: artifact.bytecode,
      deployedAt: new Date().toISOString(),
      network: 'localhost',
      chainId: network.chainId
    };

    const filePath = path.join(deploymentDir, 'AthleteRegistration.json');
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${filePath}`);

    return contractAddress;

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}

main()
  .then((address) => {
    console.log(`\n🎯 Deployment completed! Contract address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Deployment failed with error:", error);
    process.exit(1);
  });
