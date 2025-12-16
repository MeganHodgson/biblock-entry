// Use hardhat runtime environment
const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying AthleteRegistration contract to local Hardhat network...");
  console.log("Current working directory:", process.cwd());

  try {
    // Connect to local hardhat network
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = await provider.getSigner();

    console.log("📡 Connected to local Hardhat network");
    const network = await provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

    const signerAddress = await signer.getAddress();
    const balance = await provider.getBalance(signerAddress);
    console.log(`💰 Deployer: ${signerAddress}`);
    console.log(`💵 Balance: ${ethers.formatEther(balance)} ETH`);

    // Deploy the contract using hardhat
    console.log("🏗️ Deploying AthleteRegistration contract...");
    const AthleteRegistration = await hre.ethers.getContractFactory("AthleteRegistration");
    const athleteRegistration = await AthleteRegistration.deploy();

    console.log("⏳ Waiting for deployment confirmation...");
    await athleteRegistration.waitForDeployment();

    const contractAddress = await athleteRegistration.getAddress();
    console.log(`🎉 Contract deployed successfully!`);
    console.log(`📍 Contract address: ${contractAddress}`);

    // Save deployment info
    const deploymentDir = path.join(__dirname, 'deployments', 'localhost');
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentInfo = {
      address: contractAddress,
      abi: AthleteRegistration.interface.format('json'),
      deployedAt: new Date().toISOString(),
      network: network.name,
      chainId: network.chainId,
      deployer: signerAddress
    };

    // Custom JSON serializer to handle BigInt
    const jsonReplacer = (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    };

    const deploymentFile = path.join(deploymentDir, 'AthleteRegistration.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, jsonReplacer, 2));
    console.log(`💾 Deployment info saved to: ${deploymentFile}`);

    // Update frontend ABI files
    const frontendAbiDir = path.join(__dirname, 'frontend', 'abi');
    if (!fs.existsSync(frontendAbiDir)) {
      fs.mkdirSync(frontendAbiDir, { recursive: true });
    }


    console.log(`\n🎯 Deployment Summary:`);
    console.log(`   Contract: AthleteRegistration`);
    console.log(`   Address: ${contractAddress}`);
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`   Deployer: ${signerAddress}`);
    console.log(`   Deployed at: ${deploymentInfo.deployedAt}`);

    return contractAddress;

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the deployment
if (require.main === module) {
  main()
    .then((address) => {
      console.log(`\n✅ Deployment completed successfully! Contract address: ${address}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { main };
