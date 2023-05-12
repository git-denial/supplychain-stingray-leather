const getMyProducts = async () => {

    try {
      
      const result = await readContracts.SupplyChain.getMyProducts();
      notification.open({message: JSON.stringify(result)})
      console.log(result)
      console.log(await readContracts.SupplyChain.getMyDetails())
      let resultProcessed = result.map(r=> productModel(r)).filter(r=> r.id)
      setMyProducts(resultProcessed);
    } catch (error) {
      console.log(error)
    }
  };

  const getAllProducts = async () => {

    const result = await readContracts.SupplyChain.getAllProducts();
    let resultProcessed = (result.map(r=> productModel(r)))
    for(let r of resultProcessed){
      r.currentOwnerData = await getUserByAddress(r.current_owner)
    }
    console.log(resultProcessed)
    setProducts(resultProcessed);
  };

  const getProductById = async (id) => {

    const result = await readContracts.SupplyChain.getProductById(id);
    
    return {...result, product_history: result[1]};
  };

  const getUserByAddress = async (address) => {

    if (!readContracts.SupplyChain) return;

    const result = await readContracts.SupplyChain.getUser(address);
    
    if (result.id === ethers.constants.AddressZero) return null

    return result;
  };

  const getCurrentUser = async (address) => {

    if (!readContracts.SupplyChain) return;

    const result = await getUserByAddress(address);
    console.log(result)
    if (result) setCurrentUser(result);
  };

  const createUser = async (name, email, role) => {

    if (!writeContracts.SupplyChain) return;

    const result = tx(
      writeContracts &&
      writeContracts.SupplyChain &&
      writeContracts.SupplyChain.addUser(name, email, role),
      update => {
        console.log("📡 Transaction Update:", update);

      },
    );
  };

  const createProduct = async (id, name, location, image_url) => {
    // const uploaded = await ipfs.add(JSON.stringify(json[count]));
    // setCount(count + 1);
    // console.log("Uploaded Hash: ", uploaded);

    const product = await readContracts.SupplyChain.getProductById(id);
    console.log(product)
    if (product[0].id) {
      notification.error({
        message: "Duplicate product",
        description: `Product with id ${id} already exist`,
      });
      return
    }

    const result = tx(
      writeContracts &&
      writeContracts.SupplyChain &&
      writeContracts.SupplyChain.addProduct(id, name, location, image_url),
      update => {
        console.log("📡 Transaction Update:", update);
        notification.success({
          message: "Product successfully created",
          description: `Product with id ${id} has been successfully created`,
        });

      },
    );

  };

  const sellProduct = async (buyer_id, product_id, image_url) => {
    // const uploaded = await ipfs.add(JSON.stringify(json[count]));
    // setCount(count + 1);
    // console.log("Uploaded Hash: ", uploaded);

    const buyer = await getUserByAddress(buyer_id)
    if(!buyer){
      notification.error({
        message: "Non-existent buyer",
        description: `Buyer with id ${buyer_id} does not exist`,
      });
      return;
    }
    
    if(!(currentUser.role < buyer.role)) {
      notification.error({
        message: "Cannot sell",
        description: `Buyer is not under your hierarchy in the supply chain`,
      });
      return;
    }

    const result = tx(
      writeContracts &&
      writeContracts.SupplyChain &&
      writeContracts.SupplyChain.sellProduct(buyer_id, product_id, image_url),
      update => {
        console.log("📡 Transaction Update:", update);
        notification.success({
          message: "Product successfully created",
          description: `Product with id ${product_id} has been successfully sold to user with id ${buyer_id}`,
        });

      },
    );

  };