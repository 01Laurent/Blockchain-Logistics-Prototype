// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Shipment is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LOGISTICS_ROLE = keccak256("LOGISTICS_ROLE");
    bytes32 public constant ACCOUNTS_ROLE = keccak256("ACCOUNTS_ROLE");

    mapping(uint256 => bytes32) public documentHashes;
    mapping(uint256 => bool) public isDelivered;
    mapping(uint256 => bool) public isPaid;

    event DocumentRegistered(uint256 indexed shipmentId, bytes32 hash);
    event DeliveryConfirmed(uint256 indexed shipmentId, uint256 timestamp);
    event PaymentApproved(uint256 indexed shipmentId);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        // For MVP, admin can perform ops.
        // Later you can grant LOGISTICS_ROLE and ACCOUNTS_ROLE to other wallets.
        _grantRole(LOGISTICS_ROLE, admin);
        _grantRole(ACCOUNTS_ROLE, admin);
    }

    function registerDocument(uint256 shipmentId, bytes32 hash)
        external
        onlyRole(ACCOUNTS_ROLE)
    {
        require(documentHashes[shipmentId] == bytes32(0), "Already registered");
        require(hash != bytes32(0), "Invalid hash");

        documentHashes[shipmentId] = hash;
        emit DocumentRegistered(shipmentId, hash);

        _checkPaymentStatus(shipmentId);
    }

    function confirmDelivery(uint256 shipmentId)
        external
        onlyRole(LOGISTICS_ROLE)
    {
        isDelivered[shipmentId] = true;
        emit DeliveryConfirmed(shipmentId, block.timestamp);

        _checkPaymentStatus(shipmentId);
    }

    function _checkPaymentStatus(uint256 shipmentId) internal {
        if (isDelivered[shipmentId] && documentHashes[shipmentId] != bytes32(0)) {
            if (!isPaid[shipmentId]) {
                isPaid[shipmentId] = true;
                emit PaymentApproved(shipmentId);
            }
        }
    }

    function grantLogisticsRole(address account)
        external
        onlyRole(ADMIN_ROLE)
    {
        grantRole(LOGISTICS_ROLE, account);
    }

    function grantAccountsRole(address account)
        external
        onlyRole(ADMIN_ROLE)
    {
        grantRole(ACCOUNTS_ROLE, account);
    }
}