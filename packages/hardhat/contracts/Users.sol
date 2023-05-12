// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity 0.8.4; 

import "./Types.sol";


contract Users {
    mapping(address => Types.User) internal users;
    mapping(address => Types.User[]) internal manufacturerSuppliersList;
    mapping(address => Types.User[]) internal supplierVendorsList;
    mapping(address => Types.User[]) internal vendorCustomersList;

    event NewUser(string name, string email, Types.UserRole role);
    event DeletedUser(string name, string email, Types.UserRole role);

   
    function AddUser(string memory name, string memory email, Types.UserRole role) internal {
        require(msg.sender != address(0));
        require(!isUserExists(msg.sender), "Same user with same id exists");

        address id = msg.sender;
        users[id] = Types.User(id, name, email, role);

        emit NewUser(name, email, role);
    }

    
    function GetUser(address account) internal view returns (Types.User memory)
    {
        require(account != address(0));
        return users[account];
    }


    function RemoveUser(Types.UserRole role, address account) internal {
        require(account != address(0));
        require(hasIdAndRole(role, account));

        string memory name_ = users[account].name;
        string memory email_ = users[account].email;

        delete users[account];
        emit DeletedUser(name_, email_, role);
    }


    function isUserExists(address account) internal view returns (bool) {
        
        return users[account].id != address(0);
    }


    function hasIdAndRole(Types.UserRole role, address account)internal view returns (bool)
    {
        require(account != address(0));
        
        return users[account].id != address(0) && users[account].role == role;
    }

    // Modifiers

    modifier onlySupplier() {
        require(msg.sender != address(0), "Sender's address is Empty");
        require(users[msg.sender].id != address(0), "User does not exist");
        require( Types.UserRole(users[msg.sender].role) == Types.UserRole.Supplier, "Only supplier is allowed");
        _;
    }

    modifier onlyCustomer() {
        require(msg.sender != address(0), "Sender's address is Empty");
        require(users[msg.sender].id != address(0), "User does not exist");
        require( Types.UserRole(users[msg.sender].role) == Types.UserRole.Customer, "Only customer is allowed");
        _;
    }
}
