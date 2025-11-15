const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Lock-In Responsible smart contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy ValidatorRegistry first
  console.log("📝 Deploying ValidatorRegistry...");
  const ValidatorRegistry = await hre.ethers.getContractFactory("ValidatorRegistry");
  const validatorRegistry = await ValidatorRegistry.deploy();
  await validatorRegistry.waitForDeployment();
  const validatorRegistryAddress = await validatorRegistry.getAddress();
  console.log("✅ ValidatorRegistry deployed to:", validatorRegistryAddress, "\n");

  // Set addresses for protocol treasury and charity
  const protocolTreasury = deployer.address; // Change this in production
  const charityAddress = "0x0000000000000000000000000000000000000001"; // Change to real charity

  // Deploy GoalRegistry
  console.log("📝 Deploying GoalRegistry...");
  const GoalRegistry = await hre.ethers.getContractFactory("GoalRegistry");
  const goalRegistry = await GoalRegistry.deploy(
    validatorRegistryAddress,
    protocolTreasury,
    charityAddress
  );
  await goalRegistry.waitForDeployment();
  const goalRegistryAddress = await goalRegistry.getAddress();
  console.log("✅ GoalRegistry deployed to:", goalRegistryAddress, "\n");

  // Display deployment summary
  console.log("=" .repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("  ValidatorRegistry:", validatorRegistryAddress);
  console.log("  GoalRegistry:", goalRegistryAddress);
  console.log("\nConfiguration:");
  console.log("  Protocol Treasury:", protocolTreasury);
  console.log("  Charity Address:", charityAddress);
  console.log("=" .repeat(60));

  // Save deployment info to file
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ValidatorRegistry: validatorRegistryAddress,
      GoalRegistry: goalRegistryAddress,
    },
    config: {
      protocolTreasury,
      charityAddress,
    },
  };

  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment info saved to deployments/" + hre.network.name + ".json");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n📌 To verify contracts on block explorer, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${validatorRegistryAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${goalRegistryAddress} "${validatorRegistryAddress}" "${protocolTreasury}" "${charityAddress}"`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
