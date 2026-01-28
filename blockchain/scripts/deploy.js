const hre = require("hardhat");

async function main() {
  const Shipment = await hre.ethers.getContractFactory("Shipment");
  const shipment = await Shipment.deploy();
  await shipment.waitForDeployment();
  console.log("Shipment Contract deployed to:", await shipment.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
