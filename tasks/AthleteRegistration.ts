import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import "hardhat-deploy";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the AthleteRegistration contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the AthleteRegistration contract
 *
 *   npx hardhat --network localhost task:register-athlete --name 12345 --age 16 --contact 67890 --category 1
 *   npx hardhat --network localhost task:get-athlete-info
 *   npx hardhat --network localhost task:check-age-requirement
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the AthleteRegistration contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the AthleteRegistration contract
 *
 *   npx hardhat --network sepolia task:register-athlete --name 12345 --age 16 --contact 67890 --category 1
 *   npx hardhat --network sepolia task:get-athlete-info
 *   npx hardhat --network sepolia task:check-age-requirement
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:athlete-address
 *   - npx hardhat --network sepolia task:athlete-address
 */
task("task:athlete-address", "Prints the AthleteRegistration address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const athleteRegistration = await deployments.get("AthleteRegistration");

  console.log("AthleteRegistration address is " + athleteRegistration.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:register-athlete --name 12345 --age 16 --contact 67890 --category 1
 *   - npx hardhat --network sepolia task:register-athlete --name 12345 --age 16 --contact 67890 --category 1
 */
task("task:register-athlete", "Calls the registerAthlete() function of AthleteRegistration Contract")
  .addOptionalParam("address", "Optionally specify the AthleteRegistration contract address")
  .addParam("name", "The athlete's name hash (numeric representation)")
  .addParam("age", "The athlete's age")
  .addParam("contact", "The athlete's contact hash (numeric representation)")
  .addParam("category", "The sport category (0-4)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const name = parseInt(taskArguments.name);
    const age = parseInt(taskArguments.age);
    const contact = parseInt(taskArguments.contact);
    const category = parseInt(taskArguments.category);

    if (!Number.isInteger(name) || !Number.isInteger(age) || !Number.isInteger(contact) || !Number.isInteger(category)) {
      throw new Error(`All arguments must be integers`);
    }

    if (category < 0 || category > 4) {
      throw new Error(`Category must be between 0 and 4`);
    }

    await fhevm.initializeCLIApi();

    const AthleteRegistrationDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("AthleteRegistration");
    console.log(`AthleteRegistration: ${AthleteRegistrationDeployment.address}`);

    const signers = await ethers.getSigners();

    const athleteRegistrationContract = await ethers.getContractAt("AthleteRegistration", AthleteRegistrationDeployment.address);

    // Encrypt all the values
    const encryptedInput = await fhevm
      .createEncryptedInput(AthleteRegistrationDeployment.address, signers[0].address)
      .add32(name)
      .add32(age)
      .add32(contact)
      .add32(category)
      .encrypt();

    const tx = await athleteRegistrationContract
      .connect(signers[0])
      .registerAthlete(
        encryptedInput.handles[0],
        encryptedInput.inputProof,
        encryptedInput.handles[1],
        encryptedInput.inputProof,
        encryptedInput.handles[2],
        encryptedInput.inputProof,
        encryptedInput.handles[3],
        encryptedInput.inputProof
      );
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`Athlete registration succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-athlete-info
 *   - npx hardhat --network sepolia task:get-athlete-info
 */
task("task:get-athlete-info", "Calls the getAllEncryptedAthleteInfo() function and decrypts the data")
  .addOptionalParam("address", "Optionally specify the AthleteRegistration contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const AthleteRegistrationDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("AthleteRegistration");
    console.log(`AthleteRegistration: ${AthleteRegistrationDeployment.address}`);

    const signers = await ethers.getSigners();

    const athleteRegistrationContract = await ethers.getContractAt("AthleteRegistration", AthleteRegistrationDeployment.address);

    // Check if athlete is registered
    const isRegistered = await athleteRegistrationContract.isAthleteRegistered();
    if (!isRegistered) {
      console.log("No athlete registered for this address");
      return;
    }

    console.log("Athlete is registered. Fetching encrypted data...");

    const encryptedInfo = await athleteRegistrationContract.getAllEncryptedAthleteInfo();
    console.log("Encrypted data retrieved");

    // Decrypt each field
    const decryptedName = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedInfo.encryptedName,
      AthleteRegistrationDeployment.address,
      signers[0],
    );

    const decryptedAge = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedInfo.encryptedAge,
      AthleteRegistrationDeployment.address,
      signers[0],
    );

    const decryptedContact = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedInfo.encryptedContact,
      AthleteRegistrationDeployment.address,
      signers[0],
    );

    const decryptedCategory = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedInfo.encryptedCategory,
      AthleteRegistrationDeployment.address,
      signers[0],
    );

    console.log(`Decrypted Name Hash: ${decryptedName}`);
    console.log(`Decrypted Age: ${decryptedAge}`);
    console.log(`Decrypted Contact Hash: ${decryptedContact}`);
    console.log(`Decrypted Category: ${decryptedCategory}`);
    console.log(`Registration Timestamp: ${encryptedInfo.timestamp}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:check-age-requirement
 *   - npx hardhat --network sepolia task:check-age-requirement
 */
task("task:check-age-requirement", "Calls the checkAgeRequirement() function and decrypts the result")
  .addOptionalParam("address", "Optionally specify the AthleteRegistration contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const AthleteRegistrationDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("AthleteRegistration");
    console.log(`AthleteRegistration: ${AthleteRegistrationDeployment.address}`);

    const signers = await ethers.getSigners();

    const athleteRegistrationContract = await ethers.getContractAt("AthleteRegistration", AthleteRegistrationDeployment.address);

    // Check if athlete is registered
    const isRegistered = await athleteRegistrationContract.isAthleteRegistered();
    if (!isRegistered) {
      console.log("No athlete registered for this address");
      return;
    }

    console.log("Checking age requirement (age >= 14 for most restrictive category)...");

    const encryptedResult = await athleteRegistrationContract.checkAgeRequirement();

    // Decrypt the boolean result
    const meetsRequirement = await fhevm.userDecryptEbool(
      encryptedResult,
      AthleteRegistrationDeployment.address,
      signers[0],
    );

    console.log(`Meets age requirement: ${meetsRequirement}`);
  });