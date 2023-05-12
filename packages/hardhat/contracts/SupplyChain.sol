// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity 0.8.4; 

import "./Products.sol";
import "./Users.sol";


contract SupplyChain is Users, Products {

    constructor() {

    }

    
    function getAllProducts() public view returns (Types.Product[] memory) {
        
        Types.Product[] memory x = new Types.Product[](product_ids.length);

        for(uint256 i = 0; i < product_ids.length; i++){
            x[i] = (products[product_ids[i]]);

        }
        return x;
    }

    function getProductHistoryByProductId(string memory id) public view returns(Types.ProductHistory memory){
        return productHistory[id];
    }

   
    function getMyProducts() public view returns (Types.Product[] memory) {
        return getUserProducts();
    }

    
    function getProductById(string memory id) public view returns (Types.Product memory, Types.ProductHistory memory)
    {
        return getSpecificProduct(id);
    }


    
    function addProduct(string memory id, string memory name)public onlySupplier productNotExists(id)
    {
        createProduct(id, name);
    }

    function addUserHistory(string memory product_id, string memory image_url, string memory extra_data)public
    {
        Types.Product memory product = products[product_id];
        require(product.current_owner == msg.sender, "Product is not owned by seller");

        Types.User memory user = users[msg.sender];
        createUserHistory(product_id, user.role, block.timestamp, image_url, extra_data);
    }


    function sellProduct(address buyer_id,string memory product_id) public
    {
        require(buyer_id != msg.sender, "Buyer must be different than the seller");

        Types.User memory buyer = users[buyer_id];
        require(buyer.id != address(0), "Buyer does not exist");

        Types.User memory seller = users[msg.sender];
        require(buyer.id != address(0), "Seller does not exist");

        require(seller.role < buyer.role, "Cannot sell");

        Types.Product memory product = products[product_id];
        require(!compareStrings(product.id, ""), "Product does not exist");
        require(product.current_owner == seller.id, "Product is not owned by seller");

        sell(buyer_id, product_id, buyer);
    }

    function addUser(string memory name, string memory email, Types.UserRole role) public
    {
        AddUser(name, email, role);
    }

    function getUser(address id_) public view returns (Types.User memory)
    {
        return GetUser(id_);
    }

    function getMyDetails() public view returns (Types.User memory) {
        return GetUser(msg.sender);
    }

    
    function approveProductHistory(string memory product_id) public{

        Types.User memory user = getUser(msg.sender);
        Types.Product memory product = products[product_id];
        Types.ProductHistory memory productHist = productHistory[product_id];

        require( user.id != address(0), "User not exist");
        require(!compareStrings(product.id, ""), "Product not exist");
        // require(productHist.supplier.user_id != address(0), "User history does not exist");

        if (Types.UserRole(user.role) == Types.UserRole.Supplier){
            require(productHist.supplier.user_id == user.id, "User not in product history");
            productHistory[product_id].approved_by_supplier = true; 
        }
        else if (Types.UserRole(user.role) == Types.UserRole.Crafter){
            require(productHist.crafter.user_id == user.id, "User not in product history");
            productHistory[product_id].approved_by_crafter = true; 
        }
        else if (Types.UserRole(user.role) == Types.UserRole.Distributor){
            require(productHist.distributor.user_id == user.id, "User not in product history");
            productHistory[product_id].approved_by_distributor = true; 
        }
        else if (Types.UserRole(user.role) == Types.UserRole.Retailer){
            require(productHist.retailer.user_id == user.id, "User not in product history");
            productHistory[product_id].approved_by_retailer = true; 
        }
        else revert("Not valid operation");
    }

}
