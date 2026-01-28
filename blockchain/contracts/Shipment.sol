// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Shipment {
    address public owner;
    mapping(uint256 => string) public documentHashes; 
    mapping(uint256 => bool) public isDelivered;      
    mapping(uint256 => bool) public isPaid;           

    event DocumentRegistered(uint256 indexed shipmentId, string hash);
    event DeliveryConfirmed(uint256 indexed shipmentId, uint256 timestamp);
    event PaymentApproved(uint256 indexed shipmentId);

    constructor() { owner = msg.sender; }

    function registerDocument(uint256 _shipmentId, string memory _hash) public {
        require(msg.sender == owner, "Unauthorized");
        require(bytes(documentHashes[_shipmentId]).length == 0, "Already registered");
        documentHashes[_shipmentId] = _hash;
        emit DocumentRegistered(_shipmentId, _hash);
        checkPaymentStatus(_shipmentId);
    }

    function confirmDelivery(uint256 _shipmentId) public {
        require(msg.sender == owner, "Unauthorized");
        isDelivered[_shipmentId] = true;
        emit DeliveryConfirmed(_shipmentId, block.timestamp);
        checkPaymentStatus(_shipmentId);
    }

    function checkPaymentStatus(uint256 _shipmentId) internal {
        if (isDelivered[_shipmentId] && bytes(documentHashes[_shipmentId]).length > 0) {
            isPaid[_shipmentId] = true;
            emit PaymentApproved(_shipmentId);
        }
    }
}
