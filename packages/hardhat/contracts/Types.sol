// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.4; 

library Types {
    enum UserRole {
        Supplier,
        Crafter,
        Distributor,
        Retailer,
        Customer
    }

    struct User {
        address id;
        string name;
        string email;
        UserRole role;
    }

    struct UserHistory {
        address user_id; // account Id of the user
        uint256 date; // from block.timestamp
        string image_url; //IPFS url
        string extra_data;
    }

    struct ProductHistory {
        UserHistory supplier;
        UserHistory crafter;
        UserHistory distributor;
        UserHistory retailer;        
        UserHistory[] customers;

        bool approved_by_supplier;
        bool approved_by_crafter;
        bool approved_by_distributor;
        bool approved_by_retailer;
    }
    

    struct Product {
        string id;
        string name;
        uint256 created_at;
        address current_owner;
        address previous_owner;
    }

    // // Certification struct
    // struct Certification {
    //     string certifyingOrg;
    //     string certificationType;
    //     string criteria;
    // }

    // struct Product {
    //     string name;
    //     string manufacturerName;
    //     address manufacturer;
    //     bool isInBatch; // few products will be packed & sold in batches
    //     uint256 batchCount; // QTY that were packed in single batch
    //     string barcodeId;
    //     string productImage;
    //     string scientificName;
    //     string usage;
    //     string[] composition;
    //     string[] sideEffects;
    // }
}


// User Struct:

// The user struct contains all the necessary information for identifying and categorizing a user in the supply chain network, including their Ethereum address, name, email, and role. It is essential to have a user struct defined to maintain the integrity and security of the system.

// UserHistory Struct:

// The user history struct stores the historical data of a user's activity in the system, including the date of activity, user's IPFS image URL, and their account ID. It will be useful in tracking and maintaining the audit trail of a user's activity in the blockchain system.

// ProductHistory Struct:

// The product history struct stores the historical data of a product's movement across the supply chain, including the manufacturer, supplier, vendor, and customers who have interacted with the product. This struct helps to maintain a transparent and immutable record of a product's journey across the supply chain network.

// Product Struct:

// The product struct defines the essential details of a product in the system, including the product ID, name, producer name, location, and timestamps for creation and modification. It also contains the product history struct, which stores the product's journey across the supply chain network.