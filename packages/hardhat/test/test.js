/* eslint-disable prettier/prettier */
//
// this script executes when you run 'yarn test'
//
// you can also test remote submissions like:
// CONTRACT_ADDRESS=0x43Ab1FCd430C1f20270C2470f857f7a006117bbb yarn test --network rinkeby
//
// you can even run mint commands if the tests pass like:
// yarn test && echo "PASSED" || echo "FAILED"
//

const hre = require("hardhat");

const { ethers } = hre;
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { networks, defaultNetwork } = require("../hardhat.config");

use(solidity);

const UserRole = {
  "Supplier": 0,
  "Crafter": 1,
  "Distributor": 2,
  "Retailer": 3,
  "Customer": 4
}

const dummyProducts = [
  { "id": "b3ce14fa-69c9-4600-954e-fb7c73afcb99", "name": "Brigg", "location": "Herálec", "image_url": "http://dummyimage.com/114x100.png/5fa2dd/ffffff" },
  { "id": "72da5ecd-8c06-4c4c-804e-23acb5c739c0", "name": "Alia", "location": "Ngampon", "image_url": "http://dummyimage.com/158x100.png/5fa2dd/ffffff" },
  { "id": "78cde7fa-b89d-4af6-a473-43ca6cd2cabd", "name": "Chryste", "location": "Cidima", "image_url": "http://dummyimage.com/246x100.png/dddddd/000000" },
  { "id": "683eca2c-1ca6-47b8-b2ce-bf9161ec8fe8", "name": "Terry", "location": "Kangaslampi", "image_url": "http://dummyimage.com/200x100.png/5fa2dd/ffffff" },
  { "id": "2b528d0b-fd31-4ca0-9152-4de318a5eb73", "name": "Marie", "location": "Halayhay", "image_url": "http://dummyimage.com/177x100.png/ff4444/ffffff" }
]
// describe("Stingray Supply Chain Smart Contract", async function () {
//   this.timeout(120000);

//   let myContract;

//   console.log("hre:", Object.keys(hre)) // <-- you can access the hardhat runtime env here



//local hardhat blockchain
// describe("SupplyChain.sol", function () {
//   let contractArtifact;
//   contractArtifact = "contracts/SupplyChain.sol:SupplyChain";

//   let myContract

//   it("Should deploy the contract", async function () {
//     const contract = await ethers.getContractFactory(contractArtifact);
//     myContract = await contract.deploy();
//     console.log("\t", " 🛰  Contract deployed on", myContract.address);
//   });

//   it("Should add user as supplier", async function () {
//     const user = {
//       name: "Daniel",
//       email: "danielamazia@gmail.com",
//       role: UserRole.Supplier
//     }
//     await myContract.addUser(user.name, user.email, user.role)
//     const addedUser = await myContract.getMyDetails()

//     expect(addedUser.email).equal(user.email)
//     expect(addedUser.role).equal(UserRole.Supplier)
//   });

//   it("Should add user as crafter", async function () {

//     const signers = await ethers.getSigners()

//     const user = {
//       name: "Daniel",
//       email: "danielamazia@gmail.com",
//       role: UserRole.Crafter
//     }
//     await myContract.connect(signers[1]).addUser(user.name, user.email, user.role)
//     const addedUser = await myContract.connect(signers[1]).getMyDetails()

//     expect(addedUser.email).equal(user.email)
//     expect(addedUser.role).equal(UserRole.Crafter)
//   });
//   it("Should add user as distributor", async function () {

//     const signers = await ethers.getSigners()

//     const user = {
//       name: "Daniel",
//       email: "danielamazia@gmail.com",
//       role: UserRole.Distributor
//     }
//     await myContract.connect(signers[2]).addUser(user.name, user.email, user.role)
//     const addedUser = await myContract.connect(signers[2]).getMyDetails()

//     expect(addedUser.email).equal(user.email)
//     expect(addedUser.role).equal(UserRole.Distributor)
//   });
//   it("Should add user as retailer", async function () {

//     const signers = await ethers.getSigners()

//     const user = {
//       name: "Daniel",
//       email: "danielamazia@gmail.com",
//       role: UserRole.Retailer
//     }
//     await myContract.connect(signers[3]).addUser(user.name, user.email, user.role)
//     const addedUser = await myContract.connect(signers[3]).getMyDetails()

//     expect(addedUser.email).equal(user.email)
//     expect(addedUser.role).equal(UserRole.Retailer)
//   });
//   it("Should add user as customer", async function () {

//     const signers = await ethers.getSigners()

//     const user = {
//       name: "Daniel",
//       email: "danielamazia@gmail.com",
//       role: UserRole.Customer
//     }
//     await myContract.connect(signers[4]).addUser(user.name, user.email, user.role)
//     const addedUser = await myContract.connect(signers[4]).getMyDetails()

//     expect(addedUser.email).equal(user.email)
//     expect(addedUser.role).equal(UserRole.Customer)
//   });

//   it("Should not add user with same address and role", async function () {
//     const user = {
//       name: "Daniel",
//       email: "bbb@gmail.com",
//       role: UserRole.Supplier
//     }
//     await expect(myContract.addUser(user.name, user.email, user.role)).to.be.reverted


//   });

//   it("Should add product", async function () {


//     const product = {
//       id: "abcd-efg",
//       name: "Dompet stingray",
//       location: "Jakarta",
//       image_url: "http://stingray.com"
//     }

//     await myContract.addProduct(product.id, product.name, product.location, product.image_url)
//     const [addedProduct, addedProductHistory] = await myContract.getSingleProduct(product.id)

//     expect(addedProduct.id).equal(product.id)
//   });

//   it("Should not add product with same id", async function () {

//     const product = {
//       id: "abcd-efg",
//       name: "bvlabl",
//       location: "Tangerang",
//       image_url: "http://stangingray.com"
//     }

//     await expect(myContract.addProduct(product.id, product.name, product.location, product.image_url)).to.be.reverted
//   });

//   it("Only supplier can add product", async function () {

//     const signers = await ethers.getSigners()


//     const addedUser = await myContract.connect(signers[2]).getMyDetails()
//     expect(addedUser.role).not.equal(UserRole.Supplier)

//     const product = {
//       id: "xxx-efg",
//       name: "bvlabl",
//       location: "Tangerang",
//       image_url: "http://stangingray.com"
//     }

//     await expect(myContract.connect(signers[2]).addProduct(product.id, product.name, product.location, product.image_url)).to.be.reverted


//   });


//   it("Should get my products", async function () {

//     console.log(await myContract.getMyProducts())
//   });

//   it("Should be able to approve product history", async function () {
//     const product_id = "abcd-efg"
//     await myContract.approveProductHistory(product_id)
//     console.log(await myContract.getSingleProduct(product_id))
//   });

//   it("Cannot approve product history of a product that is not related", async function () {
//     const signers = await ethers.getSigners()
//     const product_id = "abcd-efg"

//     await expect(myContract.connect(signers[2]).approveProductHistory(product_id)).to.be.reverted
//   });

//   it("Cannot sell product to the seller itself", async function () {
//     const signers = await ethers.getSigners()
//     const product_id = "abcd-efg"

//     await expect(myContract.sellProduct(signers[0].address, product_id, "hahah.com")).to.be.reverted    
//     // await expect(myContract.sellProduct(buyer_id, product_id, "hahah.com" )).to.be.reverted
//   });


//   it("Should be able to sell product", async function () {
//     const signers = await ethers.getSigners()
//     const product_id = "abcd-efg"
//     const buyer_id = signers[1].address

//     console.log(await myContract.connect(signers[1]).getMyDetails())

//     await myContract.sellProduct(buyer_id, product_id, "hahah.com")
//     console.log(await myContract.getSingleProduct(product_id))
//     // await expect(myContract.sellProduct(buyer_id, product_id, "hahah.com" )).to.be.reverted
//   });



//   it("Can only sell to under the hierarchy.", async function () {
//     const signers = await ethers.getSigners()
//     const product_id = "abcd-efg"
//     await expect(myContract.connect(signers[1]).sellProduct(signers[0].address, product_id, "hahah.com")).to.be.reverted
//     // await expect(myContract.sellProduct(signers[0].address, product_id, "hahah.com")).to.be.reverted    
//   });



// });



// });

describe.only("SupplyChain in Sepolia testnet network", async function () {
  this.timeout(2400000);
  let contract

  before(async () => {
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS_5
    contract = (await ethers.getContractFactory("SupplyChain")).attach(CONTRACT_ADDRESS);

    console.log("\t", " 🛰  Contract deployed on", contract.address);
  });

  it("Should add 10 user as supplier", async function () {
    const signers = await ethers.getSigners()
    for (let s of signers) {
      console.log(s.address)

      const user = {
        name: `address_${s.address}`,
        email: `${s.address}@gmail.com`,
        role: UserRole.Supplier
      }
      let result = await contract.connect(s).addUser(user.name, user.email, user.role)
      await result.wait(1)
      const addedUser = await contract.connect(s).getMyDetails()

      expect(addedUser.email).equal(user.email)
      expect(addedUser.role).equal(UserRole.Supplier)
    }

  });



  // it("Should add product", async function () {

  //   try {
  //     const product = {
  //       id: "nanda",
  //       name: "Dompet stingray",
  //       location: "Jakarta",
  //       image_url: "http://stingray.com"
  //     }

  //     let result = await contract.addProduct(product.id, product.name, product.location, product.image_url)
  //     await result.wait(1)
  //     const [addedProduct, addedProductHistory] = await contract.getSingleProduct(product.id)

  //     expect(addedProduct.id).equal(product.id)
  //   } catch (error) {
  //     console.log(error)
  //   }


  // });

  // it("Should add multiple products", async function () {

  //   try {

  //     for(let product of dummyProducts){

  //       console.log(product)
  //       let result = await contract.addProduct(product.id, product.name, product.location, product.image_url)
  //       await result.wait(1)
  //       // const [addedProduct, addedProductHistory] = await contract.getSingleProduct(product.id)

  //       // expect(addedProduct.id).equal(product.id)
  //     }


  //   } catch (error) {
  //     console.log(error)
  //   }


  // });

  // it("Should be able to sell product", async function () {

  //   const signers = await ethers.getSigners()
  //   const buyer_id = signers[1].address
  //   console.log(await contract.connect(signers[1]).getMyDetails())

  //   for (let product of dummyProducts) {
  //     try {
  //       console.log(product.id)
  //       await contract.sellProduct(buyer_id, product.id, "hahah.com")
  //     } catch (error) {
  //       console.log(error)
  //       continue
  //     }
  //   }






  // });

  // it("Should be able to approve product history", async function () {

  //   for (let product of dummyProducts) {
  //     try {
  //       console.log(product.id)
  //       await contract.approveProductHistory(product.id)
  //     } catch (error) {
  //       console.log(error)
  //       continue
  //     }
  //   }



  // });

})