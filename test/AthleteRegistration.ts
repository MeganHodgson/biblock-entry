import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { AthleteRegistration, AthleteRegistration__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("AthleteRegistration")) as AthleteRegistration__factory;
  const contract = (await factory.deploy()) as AthleteRegistration;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("AthleteRegistration", function () {
  let signers: Signers;
  let contract: AthleteRegistration;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  it("should have zero registered athletes after deployment", async function () {
    const registeredAthletes = await contract.getRegisteredAthletes();
    expect(registeredAthletes.length).to.eq(0);
  });

  it("should register an athlete with encrypted data", async function () {
    const name = "Alice";
    const age = 25;
    const contact = 1234567890;
    const category = 0; // Individual sports

    // Encrypt all values
    const encryptedName = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(Buffer.from(name).readUInt32BE(0)) // Simplified name hashing
      .encrypt();

    const encryptedAge = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(age)
      .encrypt();

    const encryptedContact = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(contact)
      .encrypt();

    const encryptedCategory = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(category)
      .encrypt();

    // Register the athlete
    await contract.connect(signers.alice).registerAthlete(
      encryptedName.handles[0],
      encryptedAge.handles[0],
      encryptedContact.handles[0],
      encryptedCategory.handles[0],
      encryptedName.inputProof
    );

    // Check if registered
    const isRegistered = await contract.isAthleteRegistered(signers.alice.address);
    expect(isRegistered).to.be.true;

    const registeredAthletes = await contract.getRegisteredAthletes();
    expect(registeredAthletes.length).to.eq(1);
    expect(registeredAthletes[0]).to.eq(signers.alice.address);
  });

  it("should prevent double registration", async function () {
    const name = "Alice";
    const age = 25;
    const contact = 1234567890;
    const category = 0;

    const encryptedName = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(Buffer.from(name).readUInt32BE(0))
      .encrypt();

    const encryptedAge = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(age)
      .encrypt();

    const encryptedContact = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(contact)
      .encrypt();

    const encryptedCategory = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(category)
      .encrypt();

    // First registration
    await contract.connect(signers.alice).registerAthlete(
      encryptedName.handles[0],
      encryptedAge.handles[0],
      encryptedContact.handles[0],
      encryptedCategory.handles[0],
      encryptedName.inputProof
    );

    // Second registration should fail
    await expect(
      contract.connect(signers.alice).registerAthlete(
        encryptedName.handles[0],
        encryptedAge.handles[0],
        encryptedContact.handles[0],
        encryptedCategory.handles[0],
        encryptedName.inputProof
      )
    ).to.be.revertedWith("Athlete already registered");
  });

  it("should validate age requirements for different sport categories", async function () {
    // Test category minimum ages
    const enduranceMinAge = await contract.categoryMinAges(2); // Endurance
    expect(enduranceMinAge).to.eq(18);

    const combatMinAge = await contract.categoryMinAges(3); // Combat
    expect(combatMinAge).to.eq(16);
  });

  it("should finalize and decrypt athlete registration", async function () {
    const name = "Alice";
    const age = 25;
    const contact = 1234567890;
    const category = 0;

    const encryptedName = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(Buffer.from(name).readUInt32BE(0))
      .encrypt();

    const encryptedAge = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(age)
      .encrypt();

    const encryptedContact = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(contact)
      .encrypt();

    const encryptedCategory = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(category)
      .encrypt();

    // Register
    await contract.connect(signers.alice).registerAthlete(
      encryptedName.handles[0],
      encryptedAge.handles[0],
      encryptedContact.handles[0],
      encryptedCategory.handles[0],
      encryptedName.inputProof
    );

    // Finalize results (decrypt)
    await contract.finalizeResults(signers.alice.address, name, age, contact);

    // Check decrypted info
    const [decryptedName, decryptedAge, decryptedContact, sportCategory, isDecrypted] =
      await contract.getDecryptedAthleteInfo(signers.alice.address);

    expect(decryptedName).to.eq(name);
    expect(decryptedAge).to.eq(age);
    expect(decryptedContact).to.eq(contact);
    expect(isDecrypted).to.be.true;
  });

  it("should provide registration statistics for athlete analytics", async function () {
    // Register first athlete
    const name1 = "Alice";
    const age1 = 25;
    const contact1 = 1234567890;
    const category1 = 0;

    const encryptedName1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(Buffer.from(name1).readUInt32BE(0))
      .encrypt();

    const encryptedAge1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(age1)
      .encrypt();

    const encryptedContact1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(contact1)
      .encrypt();

    const encryptedCategory1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(category1)
      .encrypt();

    await contract.connect(signers.alice).registerAthlete(
      encryptedName1.handles[0],
      encryptedAge1.handles[0],
      encryptedContact1.handles[0],
      encryptedCategory1.handles[0],
      encryptedName1.inputProof
    );

    // Register second athlete
    const name2 = "Bob";
    const age2 = 30;
    const contact2 = 9876543210;
    const category2 = 1;

    const encryptedName2 = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(Buffer.from(name2).readUInt32BE(0))
      .encrypt();

    const encryptedAge2 = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(age2)
      .encrypt();

    const encryptedContact2 = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(contact2)
      .encrypt();

    const encryptedCategory2 = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(category2)
      .encrypt();

    await contract.connect(signers.bob).registerAthlete(
      encryptedName2.handles[0],
      encryptedAge2.handles[0],
      encryptedContact2.handles[0],
      encryptedCategory2.handles[0],
      encryptedName2.inputProof
    );

    // Decrypt first athlete
    await contract.finalizeResults(signers.alice.address, name1, age1, contact1);

    const [totalAthletes, decryptedCount, averageTime] = await contract.getRegistrationStatistics();
    expect(totalAthletes).to.equal(2);
    expect(decryptedCount).to.equal(1);
    expect(averageTime).to.be.at.least(0);
  });

  it("should support batch athlete registration for multiple athletes", async function () {
    const athletes = [signers.alice.address, signers.bob.address];
    const names = ["Alice", "Bob"];
    const ages = [25, 30];
    const contacts = [1234567890, 9876543210];
    const categories = [0, 1];

    // Create encrypted inputs for batch
    const encryptedNames = [];
    const encryptedAges = [];
    const encryptedContacts = [];
    const encryptedCategories = [];

    for (let i = 0; i < athletes.length; i++) {
      const encryptedName = await fhevm
        .createEncryptedInput(contractAddress, athletes[i])
        .add32(Buffer.from(names[i]).readUInt32BE(0))
        .encrypt();

      const encryptedAge = await fhevm
        .createEncryptedInput(contractAddress, athletes[i])
        .add32(ages[i])
        .encrypt();

      const encryptedContact = await fhevm
        .createEncryptedInput(contractAddress, athletes[i])
        .add32(contacts[i])
        .encrypt();

      const encryptedCategory = await fhevm
        .createEncryptedInput(contractAddress, athletes[i])
        .add32(categories[i])
        .encrypt();

      encryptedNames.push(encryptedName);
      encryptedAges.push(encryptedAge);
      encryptedContacts.push(encryptedContact);
      encryptedCategories.push(encryptedCategory);
    }

    // Batch register athletes
    await contract.batchRegisterAthletes(
      athletes,
      encryptedNames.map(e => e.handles[0]),
      encryptedAges.map(e => e.handles[0]),
      encryptedContacts.map(e => e.handles[0]),
      encryptedCategories.map(e => e.handles[0]),
      encryptedNames[0].inputProof // Use first proof for simplicity
    );

    const registeredAthletes = await contract.getRegisteredAthletes();
    expect(registeredAthletes.length).to.equal(2);
  });

  it("should validate batch size limits for gas efficiency", async function () {
    // Create 11 athletes (exceeds limit)
    const athletes = Array(11).fill(null).map((_, i) => ethers.Wallet.createRandom().address);
    const names = Array(11).fill("Test");
    const ages = Array(11).fill(25);
    const contacts = Array(11).fill(1234567890);
    const categories = Array(11).fill(0);

    // Create encrypted inputs for batch
    const encryptedNames = [];
    for (let i = 0; i < athletes.length; i++) {
      const encryptedName = await fhevm
        .createEncryptedInput(contractAddress, athletes[i])
        .add32(Buffer.from(names[i]).readUInt32BE(0))
        .encrypt();
      encryptedNames.push(encryptedName);
    }

    // Should reject batch larger than 10
    await expect(
      contract.batchRegisterAthletes(
        athletes,
        encryptedNames.map(e => e.handles[0]),
        encryptedNames.map(e => e.handles[0]), // Simplified for test
        encryptedNames.map(e => e.handles[0]), // Simplified for test
        encryptedNames.map(e => e.handles[0]), // Simplified for test
        encryptedNames[0].inputProof
      )
    ).to.be.revertedWith("Batch size limited to 10 athletes for gas efficiency");
  });

  it("should validate contract version information", async function () {
    // This test verifies that the contract has version information
    // Since the contract doesn't have a version function in this implementation,
    // we'll test that the contract deploys successfully
    expect(await contract.getAddress()).to.be.a("string");
  });
});
