const { __asyncGenerator } = require("tslib");

const CryptoForest = artifacts.require('CryptoForest');

contract('CryptoForest', (accounts) => {
    it('should list a tree', async () => {
        const cryptoForest = await CryptoForest.deployed();
        // List trees
        await cryptoForest.setTree("First", 2, 12, { from: accounts[1] }); // Seller Index = 0; All tree Index = 0
        await cryptoForest.setTree("Second", 2, 5, { from: accounts[1] }); // Seller Index = 1; All tree Index = 1
        // Get count
        let count = await cryptoForest.getTreeCount();
        assert.equal(count, 2, 'Two trees were listed');

        let treeData = await cryptoForest.getTreeData(0);
        const {3: listprice} = treeData;

        assert.equal(listprice.toNumber(), 2, 'Listed price is 2')
        //console.log(listprice.toNumber());
    });

    it('should display seller trees', async () => {
        const cryptoForest = await CryptoForest.deployed();
  
        // List additional trees
        await cryptoForest.setTree("Another", 1, 4, { from: accounts[2] }); // Seller Index = 0; All tree Index = 2

        // Specify cost in ether as we use this in the next test case
        let cost_eth = web3.utils.toWei('2', 'ether');
        await cryptoForest.setTree("Three", cost_eth, 3, { from: accounts[1] }); // Seller Index = 2; All tree Index = 3

        // Get seller tree count
        let count = await cryptoForest.getTreesOfSeller(accounts[1]);
        assert.equal(count.toNumber(), 3, 'Three trees were listed by seller');

        let treeIndex = await cryptoForest.getTreeIndexOfSeller(accounts[1], 2); // Seller's tree index is 2
        assert.equal(treeIndex, 3, 'Seller second tree is index 3');

        let treeData = await cryptoForest.getTreeData(3);
        const {2: name} = treeData;
        assert.equal(name, "Three", 'Tree at index 3 is called \'Three\'');
    });

    it('should buy a tree', async () => {
        const cryptoForest = await CryptoForest.deployed();
        let initialBuyer = await web3.eth.getBalance(accounts[0]);
        let initialSeller = await web3.eth.getBalance(accounts[1]);
        // console.log("Buyer " + initialBuyer + " Seller " +initialSeller);

        // Cost is list price + mint price. 
        // Mint price = 0.25 X (list price X instalments)
        let cost = web3.utils.toWei('3.5', 'ether');
       
        // Buy a tree
        await cryptoForest.buyTree(3, { from: accounts[0], value: cost}); 

        let buyerBal = await web3.eth.getBalance(accounts[0]);
        let sellerBal = await web3.eth.getBalance(accounts[1]);
        // console.log("Buyer " + buyerBal + " Seller " +sellerBal);

        let expectedBuyerBal = initialBuyer - cost;

        assert.isTrue(expectedBuyerBal > buyerBal, "Buyer balance is not decreased by 2 ETH"); // Also has gas price
        let sellerCost = web3.utils.toWei('2', 'ether');
        let expectedSellerBal = parseInt(initialSeller) + parseInt(sellerCost);

        assert.equal(expectedSellerBal, sellerBal, "Seller balance is not increased by 2 ETH");
    });

    it('should submit proof for payment', async () => {
        const cryptoForest = await CryptoForest.deployed();        
        // Submit proof. Won't work if the contract time is set to 30 days
        await cryptoForest.submitProofForPayment(3, "New Tree Data", { from: accounts[1]}); 

        // Check the proof count
        let treeProofCount = await cryptoForest.getCountOfTreeProofs(3);
        assert.equal(treeProofCount.toNumber(), 1, "Expected 1 tree data for Tree at index 3");

        let treeProofData = await cryptoForest.getTreeProofData(3, 0);
        const {2: data, 3:state} = treeProofData;
        assert.equal(data, "New Tree Data", "Expected data to be '\New Tree Data\'");
        assert.equal(state.toNumber(), 0, "Expected state is 0 = Submitted");
    });

    it('should mark submitted proof as valid', async () => {
        const cryptoForest = await CryptoForest.deployed(); 

        let initialBuyer = await web3.eth.getBalance(accounts[0]);
        let initialSeller = await web3.eth.getBalance(accounts[1]);
       
        // Cost is list price paid when proof is marked as valid
        let cost = web3.utils.toWei('2', 'ether');       
        // mark the previous submitted proof as valid
        await cryptoForest.markProofAsValid(3, 0, { from: accounts[0], value: cost});

        let buyerBal = await web3.eth.getBalance(accounts[0]);
        let sellerBal = await web3.eth.getBalance(accounts[1]);

        let expectedBuyerBal = initialBuyer - cost;  
        assert.isTrue(expectedBuyerBal > buyerBal, "Buyer balance is not decreased by 2 ETH"); // Also has gas price
 
        let expectedSellerBal = parseInt(initialSeller) + parseInt(cost);
        assert.equal(expectedSellerBal, sellerBal, "Seller balance is not increased by 2 ETH");
    });

    it('should mark submitted proof as invalid', async () => {
        const cryptoForest = await CryptoForest.deployed(); 

        // Submit proof. Won't work if the contract time is set to 30 days
        await cryptoForest.submitProofForPayment(3, "Second proof", { from: accounts[1]}); 
        
        // mark the previous submitted proof as invalid
        await cryptoForest.markProofAsInvalid(3, 1, { from: accounts[0]});

        let treeData = await cryptoForest.getTreeData(3);
        const {4: instalment, 5:state} = treeData;
        assert.equal(instalment.toNumber(), 0, 'Remaining installment should be 0');
        assert.equal(state.toNumber(), 3, "State should be cancelled");
    });
});