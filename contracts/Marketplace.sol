// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Marketplace {
    struct Listing {
        uint256 id;
        address seller;
        string title;
        string description;
        uint256 price; // store price as integer (e.g., paise or smallest unit)
        bool sold;
    }

    uint256 public nextId;
    mapping(uint256 => Listing) public listings;

    event ListingCreated(uint256 id, address indexed seller, uint256 price);
    event ListingMarkedSold(uint256 id);

    function createListing(string calldata title, string calldata description, uint256 price) external {
        listings[nextId] = Listing(nextId, msg.sender, title, description, price, false);
        emit ListingCreated(nextId, msg.sender, price);
        nextId++;
    }

    // Seller marks sold after receiving off-chain payment
    function markSold(uint256 id) external {
        Listing storage l = listings[id];
        require(!l.sold, "Already sold");
        require(msg.sender == l.seller, "Only seller");
        l.sold = true;
        emit ListingMarkedSold(id);
    }

    function getListing(uint256 id) external view returns (
        uint256, address, string memory, string memory, uint256, bool
    ) {
        Listing storage l = listings[id];
        return (l.id, l.seller, l.title, l.description, l.price, l.sold);
    }
}
