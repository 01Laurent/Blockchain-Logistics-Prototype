const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const Shipment = await hre.ethers.getContractFactory("Shipment");
  const shipment = await Shipment.deploy(deployer.address);
  await shipment.waitForDeployment();

  console.log("Deployer:", deployer.address);
  console.log("Shipment Contract deployed to:", await shipment.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});