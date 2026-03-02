const hre = require("hardhat");

async function main() {
  const [admin, logisticsUser, accountsUser] = await hre.ethers.getSigners();

  const Shipment = await hre.ethers.getContractFactory("Shipment");
  const shipment = await Shipment.deploy(admin.address);
  await shipment.waitForDeployment();

  const LOGISTICS_ROLE = await shipment.LOGISTICS_ROLE();
  const ACCOUNTS_ROLE = await shipment.ACCOUNTS_ROLE();

  await shipment.grantRole(LOGISTICS_ROLE, logisticsUser.address);
  await shipment.grantRole(ACCOUNTS_ROLE, accountsUser.address);

  const shipmentId = 1;
  const hash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("invoice.pdf"));

  const tx1 = await shipment.connect(accountsUser).registerDocument(shipmentId, hash);
  const r1 = await tx1.wait();
  console.log("Gas registerDocument:", r1.gasUsed.toString());

  const tx2 = await shipment.connect(logisticsUser).confirmDelivery(shipmentId);
  const r2 = await tx2.wait();
  console.log("Gas confirmDelivery:", r2.gasUsed.toString());

  const paid = await shipment.isPaid(shipmentId);
  console.log("isPaid:", paid);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});