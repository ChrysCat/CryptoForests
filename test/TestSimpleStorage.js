const GreenContract = artifacts.require('GreenContract');

contract('GreenContract', (accounts) => {
    it('should store a tree', async () => {
        const greenContract = await GreenContract.deployed();
        // Set a tree
        await greenContract.setTree("MyTree", 120, 12, { from: accounts[0] });
        // Get stored value
        let price = await greenContract.getPrice();
        assert.equal(price, 120, 'The price 120 was not stored.');
        let installments = await greenContract.getInstallments();
        assert.equal(installments, 12, 'The installments 12 was not stored.');
    });
    
    it("should buy a tree and get an installment", async () => {
        const greenContract = await GreenContract.deployed();
        let owner = accounts[0];
        let buyer = accounts[1];
        let validator = accounts[2];
        await greenContract.setTree("MyTree", 20, 2, { from: owner});
        await greenContract.buyTree(validator, {from: buyer});
        await greenContract.markValidated({from: validator});
        let price = await greenContract.getPrice();
        assert.equal(price, 10, 'The price should be 10.');
        let installments = await greenContract.getInstallments();
        assert.equal(installments, 1, 'The installments should now be 1.');
    });

    it("should submit proof and get installment", async () => {
        const greenContract = await GreenContract.deployed();
        let owner = accounts[0];
        let buyer = accounts[1];
        let validator = accounts[2];
        await greenContract.submitProofOfWork("MyProof", {from: owner});
        await greenContract.markValidated({from: validator});
        let price = await greenContract.getPrice();
        assert.equal(price, 0, 'The price should be 0.');
        let installments = await greenContract.getInstallments();
        assert.equal(installments, 0, 'The installments should now be 0.');
    });

});