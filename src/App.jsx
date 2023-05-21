import Portis from "@portis/web3";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Button, Card, Col, Input, List, Menu, Row, Avatar, Table, Select, notification, Typography, Modal } from "antd";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import { useEventListener } from "eth-hooks/events/useEventListener";
import Fortmatic from "fortmatic";
import React, { useCallback, useEffect, useState, useRef } from "react";
import ReactJson from "react-json-view";
import { BrowserRouter, Link, Route, Switch, useHistory, withRouter } from "react-router-dom";
//import Torus from "@toruslabs/torus-embed"
import WalletLink from "walletlink";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Address, AddressInput, Contract, Faucet, GasGauge, Header, Ramp, ThemeSwitch } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import { useContractConfig } from "./hooks";
const { ethers } = require("ethers");
const { Paragraph, Text } = Typography;

const DEBUG = true;

const blockTimeStampToDate = x => new Date(parseInt(x.toString()) * 1000)

function productModel(x) {
  return {
    id: x.id,
    name: x.name,
    previous_owner: x.previous_owner,
    current_owner: x.current_owner,
    created_at: blockTimeStampToDate(x.created_at)    
  }
}

function UserHistoryModel(x, role) {
  if (x.user_id === ethers.constants.AddressZero) return undefined
  
  let extra 
  try {
    extra = JSON.parse(JSON.parse(x.extra_data))
  } catch (error) {
    console.log(error)
    extra = x.extra_data
  }
  

  
  return {
    user_id: x.user_id,
    image_url: x.image_url,
    date: blockTimeStampToDate(x.date),
    extra_data: extra,
    role: role
  }
}

function ProductHistoryModel(x) {
  return {
    supplier: UserHistoryModel(x.supplier, "Supplier"),
    crafter: UserHistoryModel(x.crafter, "Crafter"),
    distributor: UserHistoryModel(x.distributor, "Distributor"),
    retailer: UserHistoryModel(x.retailer, "Retailer"),
    customers: x.customers.length === 0 ? [] : x.customers.map(c => UserHistoryModel(c, "Customer")),
    approved_by_supplier: x.approved_by_supplier,
    approved_by_crafter: x.approved_by_crafter,
    approved_by_distributor: x.approved_by_distributor,
    approved_by_retailer: x.approved_by_retailer
  }
}

const info = (title, content) => {
  Modal.info({
    title: title,
    content: (
      <div>
        <p>{content}</p>
      </div>
    ),
    onOk() {},
  });
};

const infoWithHTMLElement = (title, content) => {
  Modal.info({
    title: title,
    content: (
      <div>
        {content}
      </div>
    ),
    onOk() {},
  });
};

const confirm = (title, content, func) => {
  Modal.confirm({
    title: title,
    content: (
      <div>
        <p>{content}</p>
      </div>
    ),
    onOk: func
  })
};

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
const mainnetProvider = ethers.getDefaultProvider("mainnet", {
  infura: INFURA_ID,
  etherscan: "ETHERSCAN_KEY",
  quorum: 1,
});
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);

const scaffoldEthProvider = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544") : null;
const poktMainnetProvider = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider( "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",) : null;
const mainnetInfura = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID) : null;
const sepoliaInfura = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://sepolia.infura.io/v3/" + INFURA_ID): null;

const targetNetwork = NETWORKS.sepolia;
const localProviderUrl = targetNetwork.rpcUrl;
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);
const blockExplorer = targetNetwork.blockExplorer;

let faucetHint = "";
const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

const dataTable = [
  {
    key: "1",
    name: "Mike",
    age: 32,
    address: "10 Downing Street",
  },
  {
    key: "2",
    name: "John",
    age: 42,
    address: "10 Downing Street",
  },
];

const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Age",
    dataIndex: "age",
    key: "age",
  },
  {
    title: "Address",
    dataIndex: "address",
    key: "address",
  },
];

const UserRole = {
  Supplier: 0,
  Crafter: 1,
  Distributor: 2,
  Retailer: 3,
  Customer: 4,
};
const UserRoleReversed = Object.assign({}, ...Object.entries(UserRole).map(([a, b]) => ({ [b]: a })))
const UserRoleKeyArr = Object.keys(UserRole).map(x => x.toLowerCase())

// /* Web3 modal helps us "connect" external wallets: */
const web3Modal = new Web3Modal({
  network: "sepolia", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
        },
      },
    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
  },
});


const handleImgError = e => {
  e.target.src = "https://static.thenounproject.com/png/504708-200.png"
}

function App() {

  const mainnetProvider = mainnetInfura;

  const history = useHistory()
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [yourJSON, setYourJSON] = useState({});
  const [sending, setSending] = useState();
  const [ipfsHash, setIpfsHash] = useState();
  const [ipfsDownHash, setIpfsDownHash] = useState();
  const [ipfsContent, setIpfsContent] = useState();
  const [route, setRoute] = useState();
  const [transferToAddresses, setTransferToAddresses] = useState({});
  const [downloading, setDownloading] = useState();
  const [faucetClicked, setFaucetClicked] = useState(false);

  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);
  const gasPrice = useGasPrice(targetNetwork, "fast");
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  const contractConfig = useContractConfig();
  

  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId = userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  const tx = Transactor(userSigner, gasPrice);
  const faucetTx = Transactor(localProvider, gasPrice);

  const yourLocalBalance = useBalance(localProvider, address);
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  console.log("COOOOOOOOON")
  console.log(contractConfig)
  console.log(userSigner)
  console.log(localChainId)

  const readContracts = useContractLoader(userSigner, contractConfig, localChainId);
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // const balance = useContractReader(readContracts, "YourCollectible", "balanceOf", [address]);
  // console.log("🤗 balance:", balance);

  // const transferEvents = useEventListener(readContracts, "YourCollectible", "Transfer", localProvider, 1);
  // console.log("📟 Transfer events:", transferEvents);

  const [currentUser, setCurrentUser] = useState({})


  const [newUser, setNewUser] = useState({});

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({});
  const [myProducts, setMyProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState({});

  const [newUserHistory, setNewUserHistory] = useState({});

  const productHistoryMenu = useRef(null);
  const userHistoryMenu = useRef(null);
  const homeMenu = useRef(null);

  const clickElement = (ref) => {
    ref.current.dispatchEvent(
      new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      }),
    );
  };

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);


  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  useEffect(async() => {
    if(route === "/product_history") if(selectedProduct.id) {
      let result = await getProductById(selectedProduct.id)
        let phist = ProductHistoryModel(result.product_history)
        console.log(result)
        setSelectedProduct({ ...result, product_history: phist });
    }
    else if(route === "/") await getAllProducts()
    else if(route === "/myproducts") await getMyProducts()
  }, [route]);

  useEffect(() => {
    if (address) getCurrentUser(address)
  }, [address, readContracts])

  useEffect(() => {
    if (currentUser.id) {
      notification.open({ message: `Current User id: ${currentUser.id}` })
      getMyProducts()
    }
  }, [currentUser])

  useEffect(() => {
    if (readContracts.SupplyChain) getAllProducts();
  }, [readContracts])

  // useEffect(() => {
  //   if(selectedProduct) getProductById(selectedProduct.id)
  // }, [selectedProduct]);

  useEffect(async () => {
    if (web3Modal.cachedProvider) {
      const provider = await web3Modal.connect();
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    }

    window.ethereum.on('accountsChanged', function (accounts) {
      setAddress(accounts[0])
    })

  }, [])

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {

        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);


      }
    }
    getAddress();
  }, [userSigner, injectedProvider]);

  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  useEffect(() => {
    if (DEBUG) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  const getMyProducts = async () => {

    try {

      const result = await readContracts.SupplyChain.getMyProducts();
      console.log(result)
      console.log(await readContracts.SupplyChain.getMyDetails())
      let resultProcessed = result.map(r => productModel(r)).filter(r => r.id)

      for (let r of resultProcessed) r.latest_image = await getLatestProductHistoryImage(r.id)

      setMyProducts(resultProcessed);
    } catch (error) {
      console.log(error)
    }
  };

  const getAllProducts = async () => {    

    const result = await readContracts.SupplyChain.getAllProducts();
    let resultProcessed = (result.map(r => productModel(r)))
    for (let r of resultProcessed) {
      r.currentOwnerData = await getUserByAddress(r.current_owner)
      r.latest_image = await getLatestProductHistoryImage(r.id)
    }
    console.log(resultProcessed)
    setProducts(resultProcessed);
  };

  const getProductById = async (id) => {

    const result = await readContracts.SupplyChain.getProductById(id);

    return { ...result[0], product_history: result[1] };
  };

  const getUserByAddress = async (address) => {

    if (!readContracts.SupplyChain) return;

    const result = await readContracts.SupplyChain.getUser(address);

    if (result.id === ethers.constants.AddressZero) return null

    return result;
  };

  const getProductHistoryByProductId = async (product_id) => {

    if (!readContracts.SupplyChain) return;

    const result = await readContracts.SupplyChain.getProductHistoryByProductId(product_id);

    // if (result.id === ethers.constants.AddressZero) return null

    return ProductHistoryModel(result);
  };

  const getLatestProductHistoryImage = async (product_id) => {

    const result = await getProductHistoryByProductId(product_id);
    console.log(result)

    let latest_history
    for (let r of UserRoleKeyArr) if (result[r]) latest_history = result[r]

    if (latest_history?.length) latest_history = latest_history[latest_history.length - 1]
    // if (result.id === ethers.constants.AddressZero) return null

    return latest_history?.image_url;
  };

  const getCurrentUser = async (address) => {

    if (!readContracts.SupplyChain) return;

    const result = await getUserByAddress(address);
    console.log(result)
    if (result) setCurrentUser(result);
    else setCurrentUser({})
  };

  const createUser = async (name, email, role) => {

    if (!writeContracts.SupplyChain) return;

    const result = tx(
      writeContracts &&
      writeContracts.SupplyChain &&
      writeContracts.SupplyChain.addUser(name, email, role),
      update => {
        console.log("📡 Transaction Update:", update);
        if(update.status === 1){
          notification.success({
            message: "Sign up successful",
            description: `You are now registered`,
          });
          window.location = "/";
        }
        

      },
    );
  };

  const createProduct = async (id, name) => {
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
      writeContracts.SupplyChain.addProduct(id, name),
      update => {
        console.log("📡 Transaction Update:", update);
        notification.success({
          message: "Product successfully created",
          description: `Product with id ${id} has been successfully created`,
        });

      },
    );

  };

  const createUserHistory = async (product_id, image_url, extra_data) => {
    
    extra_data = JSON.stringify(extra_data).replace(/\s/g,'')
    console.log(extra_data)

    const result = tx(
      writeContracts &&
      writeContracts.SupplyChain &&
      writeContracts.SupplyChain.addUserHistory(product_id, image_url, extra_data),
      update => {
        console.log("📡 Transaction Update:", update);
        if(update.status === 1){
          notification.success({
            message: "User History successfully created",
            description: `User History of ${UserRoleReversed[currentUser.role]} for product id ${product_id} has been successfully created`,
          });
          clickElement(productHistoryMenu)
        } 

      },
    );

  };

  const sellProduct = async (buyer_id, product_id) => {
    // const uploaded = await ipfs.add(JSON.stringify(json[count]));
    // setCount(count + 1);
    // console.log("Uploaded Hash: ", uploaded);

    const buyer = await getUserByAddress(buyer_id)
    if (!buyer) {
      notification.error({
        message: "Non-existent buyer",
        description: `Buyer with id ${buyer_id} does not exist`,
      });
      return;
    }

    if (!(currentUser.role < buyer.role)) {
      notification.error({
        message: "Cannot sell",
        description: `Buyer is not under your hierarchy in the supply chain`,
      });
      return;
    }

    const result = tx(
      writeContracts &&
      writeContracts.SupplyChain &&
      writeContracts.SupplyChain.sellProduct(buyer_id, product_id),
      update => {
        console.log("📡 Transaction Update:", update);
        if(update.status === 1){
          notification.success({
            message: "Product successfully sold",
            description: `Product with id ${product_id} has been successfully sold to user with id ${buyer_id}`,
          });
          getMyProducts()
        } 

      },
    );

  };

  return (
    <div className="App">
      <Header />
      <BrowserRouter>
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              Products
            </Link>
          </Menu.Item>
          <Menu.Item key="/myproducts" disabled={!currentUser.id}>
            <Link
              onClick={() => {
                setRoute("/myproducts");
              }}
              to="/myproducts"
              ref={homeMenu}
            >
              My Products
            </Link>
          </Menu.Item>
          <Menu.Item key="/product_history">
            <Link
              onClick={() => {
                setRoute("/product_history");
              }}
              to="/product_history"
              ref={productHistoryMenu}
            >
              Product History
            </Link>
          </Menu.Item>
          <Menu.Item key="/user_history" hidden>
            <Link
              onClick={() => {
                setRoute("/user_history");
              }}
              to="/create_user_history"
              ref={userHistoryMenu}
            >
              User history
            </Link>
          </Menu.Item>
          {/* <Menu.Item key="/transfers">
            <Link
              onClick={() => {
                setRoute("/transfers");
              }}
              to="/transfers"
            >
              Transactions
            </Link>
          </Menu.Item> */}
          {/* <Menu.Item key="/transfers2">
            <Link
              onClick={() => {
                setRoute("/transfers2");
              }}
              to="/transfers2"
            >
              Transactions 2
            </Link>
          </Menu.Item> */}
          {/* <Menu.Item key="/ipfsup">
            <Link
              onClick={() => {
                setRoute("/ipfsup");
              }}
              to="/ipfsup"
            >
              IPFS Upload
            </Link>
          </Menu.Item>
          <Menu.Item key="/ipfsdown">
            <Link
              onClick={() => {
                setRoute("/ipfsdown");
              }}
              to="/ipfsdown"
            >
              IPFS Download
            </Link>
          </Menu.Item> */}
        </Menu>
        <Switch>
          <Route exact path="/">
            {/* <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <Button
                disabled={minting}
                shape="round"
                size="large"
                onClick={() => {
                  // mintItem();
                }}
              >
                MINT NFT
              </Button>
            </div> */}
            <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <br></br>
              <List
                bordered
                dataSource={products}
                renderItem={(item) => {
                  const id = item.id;
                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.current_owner}>
                      <Card
                        style={{ width: 300 }}
                        title={
                          <div >
                            <span style={{ fontSize: 16, marginRight: 8 }}>id: {id}</span>
                            <Paragraph ellipsis={true}> {item.name}</Paragraph>
                          </div>
                        }
                      >
                        <div>
                          <img src={item.latest_image} style={{ maxWidth: 150 } }  onError={handleImgError} />
                        </div>
                        <br></br>
                        <div>{item.description}</div>
                      </Card>

                      <div>
                        Current owner: &nbsp;
                        <Address
                          address={item.current_owner}
                          role={UserRoleReversed[item.currentOwnerData?.role]}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <br></br>
                        <br></br>
                        <Button
                          onClick={async () => {
                            setSelectedProduct(item)
                            clickElement(productHistoryMenu) //navigate to product_history page
                          }}
                        >
                          Product history
                        </Button>
                        <br></br><br></br>
                        <h6>Created at: {item.created_at.toDateString()}</h6>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>
          </Route>
          <Route exact path="/myproducts">

            <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <List
                bordered
                dataSource={myProducts}
                renderItem={item => {
                  const id = item.id;
                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.current_owner}>
                      <Card
                        style={{ width: 300 }}
                        title={
                          <div>
                            <span style={{ fontSize: 16, marginRight: 8 }}>id: {id}</span>
                            <Paragraph ellipsis={true}> {item.name}</Paragraph>
                          </div>
                        }
                      >
                        <div>
                          <img src={item.latest_image} style={{ maxWidth: 150 }} onError={handleImgError}/>
                        </div>
                        <div>{item.description}</div>
                      </Card>

                      <div>
                        <AddressInput
                          ensProvider={mainnetProvider}
                          placeholder="transfer to address"
                          value={transferToAddresses[id]}
                          onChange={newValue => {
                            const update = {};
                            update[id] = newValue;
                            setTransferToAddresses({ ...transferToAddresses, ...update });
                          }}
                        />
                        <br></br>
                        <Button
                          onClick={() => { confirm("Are you sure ?", "This action cannot be reversed", ()=>sellProduct(transferToAddresses[id], id))  }}
                        >
                          Transfer
                        </Button>
                        <br></br>
                        <br></br>
                        {}
                        <Button
                          onClick={async () => {
                            let result = await getProductById(item.id)
                            let phist = ProductHistoryModel(result.product_history)
                            console.log(phist)
                            setSelectedProduct({ ...item, product_history: phist });
                            clickElement(productHistoryMenu)
                          }}
                        >
                          Product history
                        </Button>
                      </div>
                    </List.Item>
                  );
                }}
              />
              <br></br>
              {currentUser.role === UserRole.Supplier &&
                <Button

                  shape="round"
                  size="large"
                  onClick={() => {
                    setRoute("/create_product")
                    window.location = "/create_product"
                  }}
                >
                  Add new product
                </Button>
              }

            </div>

          </Route>

          <Route path="/sign_up">
            <br></br>
            <h3>Enter your details for first time use</h3>
            <div style={{ width: 200, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <Input value={newUser.name} placeHolder="Name" onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              <br></br>
              <br></br>
              <Input value={newUser.email} placeHolder="Email" onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              <br></br>
              <br></br>

              <Select placeholder="Role" style={{ width: 200 }} value={newUser.role} onSelect={e => setNewUser({ ...newUser, role: e })}>
                {Object.keys(UserRole).map(x => (
                  <Option value={UserRole[x]}>{x}</Option>
                ))}
              </Select>
              <br></br><br></br><br></br>
              <Button onClick={() => {
                createUser(newUser.name, newUser.email, newUser.role)
              }}>Sign up</Button>
            </div>
          </Route>

          <Route path="/create_product">
            <br></br>
            <h3>Create Product</h3>
            <div style={{ width: 200, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <Input value={newProduct.id} placeHolder="ID" onChange={e => setNewProduct({ ...newProduct, id: e.target.value })} />
              <br></br>
              <br></br>
              <Input value={newProduct.name} placeHolder="Name" onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
              <br></br>
              <br></br>
              {/* <Input value={newProduct.location} placeHolder="Location" onChange={e => setNewProduct({ ...newProduct, location: e.target.value })} />
              <br></br>
              <br></br> */}
              {/* <Input value={newProduct.image_url} placeHolder="Image URL" onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} />
              <br></br>
              <br></br> */}
              {/* <Input value={newProduct.extra_data} placeHolder="Extra data in JSON" onChange={e => setNewProduct({ ...newProduct, extra_data: e.target.value })} />
              <br></br>
              <br></br> */}
              <Button onClick={() => {
                createProduct(newProduct.id, newProduct.name)
              }}>Create</Button>
            </div>
          </Route>

          <Route path="/create_user_history">
            <br></br>
            <h3>Create User History</h3>
            <div style={{ width: 200, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <Input value={selectedProduct.id} placeHolder="Product ID" disabled/>
              <br></br>
              <br></br>
              <Input value={newUserHistory.image_url} placeHolder="Image URL" onChange={e => setNewUserHistory({ ...newUserHistory, image_url: e.target.value })} />
              <br></br>
              <br></br>
              <Input value={newUserHistory.extra_data} placeHolder="Extra data (JSON)" onChange={e => setNewUserHistory({ ...newUserHistory, extra_data: e.target.value })} />
              <br></br>
              <br></br>
              <Button onClick={() => {
                createUserHistory(selectedProduct.id, newUserHistory.image_url, newUserHistory.extra_data)
              }}>Create</Button>
              <br></br><br></br>
              <Card style={{ marginRight:100, width:300}}>Image Preview
              <img style={{"max-width":"100%"}} src={newUserHistory.image_url} onError={handleImgError}></img>
              </Card>
            </div>
          </Route>

          <Route path="/product_history">
            <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              {selectedProduct?.name && <h1>{selectedProduct?.name}'s product history</h1>}
              <br></br>
              <List
                bordered
                dataSource={
                  // { id: "0xskdlfj", role: "Supplier", datetime: "04/25/2023:9:50:16.95" },
                  // { id: "0xsksdfdsfj", role: "Crafter", datetime: "04/26/2023:12:50:16.95" },
                  selectedProduct?.product_history ?
                    [selectedProduct.product_history.supplier, selectedProduct.product_history.crafter, selectedProduct.product_history.distributor, selectedProduct.product_history.retailer, ...selectedProduct.product_history.customers].filter(s => s)
                    : []
                }
                renderItem={item => {
                  if (item.user_id === ethers.constants.AddressZero) return <></>
                  return (
                    <List.Item key={item.user_id}>
                      <Address address={item.user_id} role={item.role} ensProvider={mainnetProvider} fontSize={16} /> |{" "}
                      {item.date.toDateString()}
                      <br></br><br></br>
                      <Card>
                      <img src={item.image_url} style={{ maxWidth: 150 }} onError={handleImgError}/>
                      </Card>
                      <br></br>
                      {console.log(typeof item.extra_data,  item.extra_data)}
                      <Button onClick={()=>info("History information", Object.entries(item.extra_data).map(([k,v])=> <p>{k} : {v}</p>))}>More information</Button>
                      
                    </List.Item>
                  );
                }}
              />
            </div>
            {selectedProduct.id && selectedProduct.product_history && currentUser.id && selectedProduct.current_owner === currentUser.id 
            && selectedProduct.product_history[UserRoleReversed[currentUser.role].toLowerCase()]?.user_id !== currentUser.id && currentUser.role !== UserRole.Customer
            &&
              <Button
                          onClick={async () => {
                            clickElement(userHistoryMenu)
                            
                          }}
                        >
                          Add user history
                        </Button>
            }
            {selectedProduct.id && selectedProduct.product_history && currentUser.id && selectedProduct.current_owner === currentUser.id 
            && currentUser.role === UserRole.Customer && !selectedProduct.product_history.customers.find(c=> c.user_id === currentUser.id)
            &&
              <Button
                          onClick={async () => {
                            clickElement(userHistoryMenu)
                            
                          }}
                        >
                          Add user history
                        </Button>
            }
            
          </Route>

          <Route path="/transfers">
            <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <br></br>
              <List
                bordered
                dataSource={[1]}
                renderItem={item => {
                  return (
                    <List.Item key={item[0] + "_" + item[1] + "_" + "_" + item[2]}>
                      <span style={{ fontSize: 16, marginRight: 8 }}>#{item[2]}</span>
                      <Address
                        address={"0x232234"}
                        role={"Supplier"}
                        ensProvider={mainnetProvider}
                        fontSize={16}
                      />{" "}
                      =&gt;
                      <Address address={"0xlsfjlsdjf"} role={"Crafter"} ensProvider={mainnetProvider} fontSize={16} />
                    </List.Item>
                  );
                }}
              />
            </div>
          </Route>

          <Route path="/transfers2">
            <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <Table dataSource={dataTable} columns={columns} />;
            </div>
          </Route>

          <Route path="/ipfsup">
            <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
              <ReactJson
                style={{ padding: 8 }}
                src={yourJSON}
                theme="pop"
                enableClipboard={false}
                onEdit={(edit, a) => {
                  setYourJSON(edit.updated_src);
                }}
                onAdd={(add, a) => {
                  setYourJSON(add.updated_src);
                }}
                onDelete={(del, a) => {
                  setYourJSON(del.updated_src);
                }}
              />
            </div>

            <Button
              style={{ margin: 8 }}
              loading={sending}
              size="large"
              shape="round"
              type="primary"
              onClick={async () => {
                console.log("UPLOADING...", yourJSON);
                setSending(true);
                setIpfsHash();
                
                if (result && result.path) {
                  setIpfsHash(result.path);
                }
                setSending(false);
                console.log("RESULT:", result);
              }}
            >
              Upload to IPFS
            </Button>

            <div style={{ padding: 16, paddingBottom: 150 }}>{ipfsHash}</div>
          </Route>
          <Route path="/ipfsdown">
            <div style={{ paddingTop: 32, width: 740, margin: "auto" }}>
              <Input
                value={ipfsDownHash}
                placeHolder="IPFS hash (like QmadqNw8zkdrrwdtPFK1pLi8PPxmkQ4pDJXY8ozHtz6tZq)"
                onChange={e => {
                  setIpfsDownHash(e.target.value);
                }}
              />
            </div>
            <Button
              style={{ margin: 8 }}
              loading={sending}
              size="large"
              shape="round"
              type="primary"
              onClick={async () => {
                console.log("DOWNLOADING...", ipfsDownHash);
                setDownloading(true);
                setIpfsContent();
                
                if (result && result.toString) {
                  setIpfsContent(result.toString());
                }
                setDownloading(false);
              }}
            >
              Download from IPFS
            </Button>

            <pre style={{ padding: 16, width: 500, margin: "auto", paddingBottom: 150 }}>{ipfsContent}</pre>
          </Route>
          {/* <Route path="/debugcontracts">
            <Contract
              name="YourCollectible"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route> */}
        </Switch>
      </BrowserRouter>

      <ThemeSwitch />
      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        {console.log(address)}
        <Account
          address={address}
          role={UserRoleReversed[currentUser.role]}
          localProvider={localProvider}
          userSigner={userSigner}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
          user_id={currentUser.id}
        />
        {faucetHint}
        <br></br>
        {web3Modal.cachedProvider && !currentUser.id &&
          <Button onClick={() => {
            setRoute("/sign_up");
            window.location = "/sign_up"
          }}>Sign Up</Button>
        }

      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[8, 8]}>
          {/* <Col span={12}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={12} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col> */}
          {/* <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col> */}
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              // faucetAvailable ? (
              //   <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              // ) : (
              //   ""
              // )
            }
          </Col>
        </Row>
      </div>
    </div>
    
  );
}

export default App;
