// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity 0.8.4; 

import "./Types.sol";


contract Products {
    mapping(string => Types.Product) internal products;
    mapping(address => string[]) internal userLinkedProducts;
    mapping(string => Types.ProductHistory) internal productHistory;
    string[] internal product_ids;

    // Events

    event NewProduct(string name);
    event ProductOwnershipTransfer(string name,string product_id,string buyerName,string buyerEmail);

    // Contract Methods

    function getUserProducts() internal view returns (Types.Product[] memory) {

        string[] memory ids_ = userLinkedProducts[msg.sender];
        Types.Product[] memory products_ = new Types.Product[](ids_.length);

        for (uint256 i = 0; i < ids_.length; i++) {
            products_[i] = products[ids_[i]];
        }

        return products_;
    }

    function getSpecificProduct(string memory id) internal view returns (Types.Product memory, Types.ProductHistory memory){
        return (products[id], productHistory[id]);
    }

    function createProduct(string memory id, string memory name)internal {

        Types.Product memory product_ = Types.Product(id,name,block.timestamp,msg.sender,address(0));

        products[product_.id] = product_;
        product_ids.push(product_.id);

        userLinkedProducts[msg.sender].push(product_.id);
        emit NewProduct(
            product_.name
        );
    }


    function sell(address buyer_id,string memory product_id,Types.User memory buyer_) internal productExists(product_id) {
    
        Types.Product memory product_ = products[product_id];

        transferOwnership(msg.sender, buyer_id, product_id); // To transfer ownership from seller to buyer

        emit ProductOwnershipTransfer(product_.name, product_.id,buyer_.name,buyer_.email);
        
    }

    function createUserHistory(string memory product_id, Types.UserRole role, uint256 currentTime_, string memory image_url, string memory extra_data) internal{

        
        Types.UserHistory memory userHistory_ = Types.UserHistory({
            user_id: msg.sender,
            date: currentTime_,
            image_url: image_url,
            extra_data: extra_data
        });

        if (role == Types.UserRole.Supplier && productHistory[product_id].supplier.user_id == address(0)) productHistory[product_id].supplier = userHistory_; 
        else if (role == Types.UserRole.Crafter && productHistory[product_id].crafter.user_id == address(0)) productHistory[product_id].crafter = userHistory_;
        else if (role == Types.UserRole.Distributor && productHistory[product_id].distributor.user_id == address(0)) productHistory[product_id].distributor = userHistory_;
        else if (role == Types.UserRole.Retailer && productHistory[product_id].retailer.user_id == address(0)) productHistory[product_id].retailer = userHistory_;
        else if (role == Types.UserRole.Customer) productHistory[product_id].customers.push(userHistory_);
        else revert("Not valid operation");
    }

    // Internal functions

    function transferOwnership(address sellerId_,address buyerId_,string memory productId_) internal {
        userLinkedProducts[buyerId_].push(productId_);
        string[] memory sellerProducts_ = userLinkedProducts[sellerId_];
        uint256 matchIndex_ = (sellerProducts_.length + 1);

        for (uint256 i = 0; i < sellerProducts_.length; i++) {
            if (compareStrings(sellerProducts_[i], productId_)) {
                matchIndex_ = i;
                break;
            }
        }
        
        assert(matchIndex_ < sellerProducts_.length); // Match found

        if (sellerProducts_.length == 1) delete userLinkedProducts[sellerId_];
        
        else {
            //Swap the matched product index with the last product index and delete the last product index
            userLinkedProducts[sellerId_][matchIndex_] = userLinkedProducts[sellerId_][sellerProducts_.length - 1];
            delete userLinkedProducts[sellerId_][sellerProducts_.length - 1];
            // userLinkedProducts[sellerId_].pop();
        }

        
        products[productId_].previous_owner = msg.sender; //Assign previous owner
        products[productId_].current_owner = buyerId_; //Assign current owner
        
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool){
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }


    // Modifiers


    modifier productExists(string memory id_) {
        require(!compareStrings(products[id_].id, ""));
        _;
    }


    modifier productNotExists(string memory id_) {
        require(compareStrings(products[id_].id, ""));
        _;
    }
}
