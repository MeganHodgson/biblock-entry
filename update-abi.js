const fs = require('fs');

const deployment = JSON.parse(fs.readFileSync('deployments/sepolia/AthleteRegistration.json', 'utf8'));
const abiContent = `export const AthleteRegistrationABI = ${JSON.stringify({ abi: deployment.abi }, null, 2)} as const;\n`;
fs.writeFileSync('frontend/abi/AthleteRegistrationABI.ts', abiContent);

console.log('Updated ABI file with deployed contract ABI');
