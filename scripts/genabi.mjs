import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "AthleteRegistration";

// Read ABI from Hardhat artifacts (contains full JSON ABI)
function getABIFromArtifacts() {
  const artifactPath = path.join(process.cwd(), '..', 'artifacts', 'contracts', CONTRACT_NAME + '.sol', CONTRACT_NAME + '.json');

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact file not found: ${artifactPath}`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  if (!artifact.abi || !Array.isArray(artifact.abi)) {
    throw new Error('Invalid artifact file: missing or invalid ABI');
  }

  console.log('Using ABI from Hardhat artifacts');
  return artifact.abi;
}

// Read contract addresses from deployment files
function readAddressesFromDeployments() {
  const addresses = {};
  const networks = ['localhost', 'sepolia'];

  for (const network of networks) {
    try {
      const deploymentPath = path.join(process.cwd(), '..', 'deployments', network, `${CONTRACT_NAME}.json`);
      if (fs.existsSync(deploymentPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        if (deployment.address && deployment.chainId) {
          addresses[deployment.chainId] = {
            address: deployment.address,
            chainId: deployment.chainId,
            chainName: network === 'localhost' ? 'hardhat' : network
          };
          console.log(`Found deployment for ${network}: ${deployment.address}`);
        }
      }
    } catch (error) {
      console.warn(`Could not read ${network} deployment:`, error.message);
    }
  }

  return addresses;
}

// Main execution
try {
  console.log("Generating ABI and addresses...");

  let ABI = getABIFromArtifacts();

  // Filter out FHE-related functions that use non-standard types
  const fheTypes = ['euint32', 'ebool', 'externalEuint32'];
  ABI = ABI.filter(item => {
    if (item.type !== 'function') return true;

    // Check inputs
    if (item.inputs && item.inputs.some(input => fheTypes.includes(input.internalType))) {
      console.log(`Filtering out function ${item.name} due to FHE input types`);
      return false;
    }

    // Check outputs
    if (item.outputs && item.outputs.some(output => fheTypes.includes(output.internalType))) {
      console.log(`Filtering out function ${item.name} due to FHE output types`);
      return false;
    }

    return true;
  });
  const addresses = readAddressesFromDeployments();

  // Create output directory
  const outdir = path.resolve("./abi");
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir);
  }

  // Generate ABI file
  const abiPath = path.join(outdir, "AthleteRegistrationABI.ts");
  const abiContent = `/*
  This file contains the ABI for the deployed AthleteRegistration contract
*/
export const AthleteRegistrationABI = ${JSON.stringify(ABI, null, 2)};
`;
  fs.writeFileSync(abiPath, abiContent, 'utf8');
  console.log(`Generated ${abiPath}`);

  // Generate addresses file
  const addressesPath = path.join(outdir, "AthleteRegistrationAddresses.ts");
  const addressesContent = `/*
  This file contains contract addresses for AthleteRegistration
*/
export const AthleteRegistrationAddresses = ${JSON.stringify(addresses, null, 2)};
`;
  fs.writeFileSync(addressesPath, addressesContent, 'utf8');
  console.log(`Generated ${addressesPath}`);

  console.log("ABI generation completed successfully!");
} catch (error) {
  console.error("ABI generation failed:", error);
  process.exit(1);
}