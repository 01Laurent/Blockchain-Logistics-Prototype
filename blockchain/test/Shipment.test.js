const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Shipment (AccessControl + bytes32)", function () {
  async function deployFixture() {
    const [admin, logisticsUser, accountsUser, stranger] = await ethers.getSigners();

    const Shipment = await ethers.getContractFactory("Shipment");
    const shipment = await Shipment.deploy(admin.address);
    await shipment.waitForDeployment();

    const LOGISTICS_ROLE = await shipment.LOGISTICS_ROLE();
    const ACCOUNTS_ROLE = await shipment.ACCOUNTS_ROLE();

    return { shipment, admin, logisticsUser, accountsUser, stranger, LOGISTICS_ROLE, ACCOUNTS_ROLE };
  }

  it("admin has DEFAULT_ADMIN_ROLE and can grant roles", async () => {
    const { shipment, admin, LOGISTICS_ROLE, logisticsUser } = await deployFixture();

    // grant logistics role
    await shipment.grantRole(LOGISTICS_ROLE, logisticsUser.address);

    expect(await shipment.hasRole(LOGISTICS_ROLE, logisticsUser.address)).to.equal(true);
  });

  it("only ACCOUNTS_ROLE can registerDocument", async () => {
    const { shipment, accountsUser, stranger, ACCOUNTS_ROLE } = await deployFixture();

    // grant accounts role
    await shipment.grantRole(ACCOUNTS_ROLE, accountsUser.address);

    const shipmentId = 1;
    const hash = ethers.keccak256(ethers.toUtf8Bytes("invoice.pdf")); // bytes32

    await expect(shipment.connect(stranger).registerDocument(shipmentId, hash))
      .to.be.reverted; // AccessControl revert

    await expect(shipment.connect(accountsUser).registerDocument(shipmentId, hash))
      .to.emit(shipment, "DocumentRegistered")
      .withArgs(shipmentId, hash);
  });

  it("only LOGISTICS_ROLE can confirmDelivery", async () => {
    const { shipment, logisticsUser, stranger, LOGISTICS_ROLE } = await deployFixture();

    await shipment.grantRole(LOGISTICS_ROLE, logisticsUser.address);

    const shipmentId = 77;

    await expect(shipment.connect(stranger).confirmDelivery(shipmentId))
      .to.be.reverted;

    await expect(shipment.connect(logisticsUser).confirmDelivery(shipmentId))
      .to.emit(shipment, "DeliveryConfirmed");
  });

  it("isPaid becomes true only when BOTH delivered and document hash exist", async () => {
    const { shipment, logisticsUser, accountsUser, LOGISTICS_ROLE, ACCOUNTS_ROLE } = await deployFixture();

    await shipment.grantRole(LOGISTICS_ROLE, logisticsUser.address);
    await shipment.grantRole(ACCOUNTS_ROLE, accountsUser.address);

    const shipmentId = 42;
    const hash = ethers.keccak256(ethers.toUtf8Bytes("final.pdf"));

    expect(await shipment.isPaid(shipmentId)).to.equal(false);

    // Register document only -> not paid
    await shipment.connect(accountsUser).registerDocument(shipmentId, hash);
    expect(await shipment.isPaid(shipmentId)).to.equal(false);

    // Confirm delivery -> now paid
    await shipment.connect(logisticsUser).confirmDelivery(shipmentId);
    expect(await shipment.isPaid(shipmentId)).to.equal(true);
  });

  it("cannot registerDocument twice for same shipmentId", async () => {
    const { shipment, accountsUser, ACCOUNTS_ROLE } = await deployFixture();

    await shipment.grantRole(ACCOUNTS_ROLE, accountsUser.address);

    const shipmentId = 5;
    const hash1 = ethers.keccak256(ethers.toUtf8Bytes("a.pdf"));
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("b.pdf"));

    await shipment.connect(accountsUser).registerDocument(shipmentId, hash1);

    await expect(shipment.connect(accountsUser).registerDocument(shipmentId, hash2))
      .to.be.revertedWith("Already registered");
  });

  it("rejects zero hash", async () => {
    const { shipment, accountsUser, ACCOUNTS_ROLE } = await deployFixture();
    await shipment.grantRole(ACCOUNTS_ROLE, accountsUser.address);

    await expect(
      shipment.connect(accountsUser).registerDocument(1, ethers.ZeroHash)
    ).to.be.revertedWith("Invalid hash");
  });
});