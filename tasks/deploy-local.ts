import { task } from "hardhat/config.js";
import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

task("deploy-local", "Deploy AthleteRegistration contract to local network")
  .setAction(async (taskArgs, hre) => {
    console.log("🚀 Deploying AthleteRegistration contract to local Hardhat network...");

    try {
      // Deploy the contract
      console.log("🏗️ Deploying contract...");
      const AthleteRegistration = await ethers.getContractFactory("AthleteRegistration");
      const athleteRegistration = await AthleteRegistration.deploy();

      console.log("⏳ Waiting for deployment confirmation...");
      await athleteRegistration.waitForDeployment();

      const contractAddress = await athleteRegistration.getAddress();
      console.log(`🎉 Contract deployed successfully at: ${contractAddress}`);

      // Save deployment info
      const deploymentDir = path.join(process.cwd(), 'deployments', 'localhost');
      if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
      }

      const deploymentInfo = {
        address: contractAddress,
        abi: AthleteRegistration.interface.format('json'),
        deployedAt: new Date().toISOString(),
        network: 'localhost',
        chainId: 31337
      };

      const deploymentFile = path.join(deploymentDir, 'AthleteRegistration.json');
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
      console.log(`💾 Deployment info saved to: ${deploymentFile}`);

      // Update frontend ABI files
      const frontendAbiDir = path.join(process.cwd(), 'frontend', 'abi');
      if (!fs.existsSync(frontendAbiDir)) {
        fs.mkdirSync(frontendAbiDir, { recursive: true });
      }

      // Update ABI file
      const frontendAbiFile = path.join(frontendAbiDir, 'AthleteRegistrationABI.ts');
      const abiContent = `export const AthleteRegistrationABI = ${JSON.stringify({ abi: AthleteRegistration.interface.format('json') }, null, 2)} as const;\n`;
      fs.writeFileSync(frontendAbiFile, abiContent);

      // Update addresses file
      const frontendAddressesFile = path.join(frontendAbiDir, 'AthleteRegistrationAddresses.ts');
      const addressesContent = `export const AthleteRegistrationAddresses = {
  "31337": { address: "${contractAddress}", chainId: 31337, chainName: "hardhat" },
  "11155111": { address: "0x0000000000000000000000000000000000000000", chainId: 11155111, chainName: "sepolia" }
};
`;
      fs.writeFileSync(frontendAddressesFile, addressesContent);

      console.log(`✅ Frontend ABI files updated`);
      console.log(`📋 ABI: ${frontendAbiFile}`);
      console.log(`📋 Addresses: ${frontendAddressesFile}`);

    } catch (error) {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    }
  });
