const UserRole = {
    Supplier: 0,
    Crafter: 1,
    Distributor: 2,
    Retailer: 3,
    Customer: 4,
  };
  const UserRoleReversed = Object.assign({}, ...Object.entries(UserRole).map(([a, b]) => ({ [b]: a })))

const ProductList = (products, mainnetProvider, blockExplorer, setSelectedProduct) => {

    const history = useHistory()
    
  
    return (
      
            <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <br></br>
              <List
                bordered
                dataSource={products}
                renderItem={item => {
                  const id = item.id;
                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.current_owner}>
                      <Card
                        title={
                          <div>
                            <span style={{ fontSize: 16, marginRight: 8 }}>#{id}</span> {item.name}
                          </div>
                        }
                      >
                        <div>
                          <img src={item.image_url} style={{ maxWidth: 150 }} />
                        </div>
                        <br></br>
                        <div>{item.description}</div>
                      </Card>

                      <div>
                        Current owner:
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
                          onClick={async() => {
                            let result = await getProductById(item.id)
                            // let phist = result.product_history.map(ph=>)
                            setSelectedProduct({...item, product_history: result.product_history});
                            this.props.history.push('/product_history')
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
    )
  }
  
  export default ProductList