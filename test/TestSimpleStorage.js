const GreenContract = artifacts.require('GreenContract');

contract('GreenContract', (accounts) => {
    it('should store a tree', async () => {
        const greenContract = await GreenContract.deployed();
        // Set a tree
        await greenContract.setTree("MyTree", 120, 12, { from: accounts[0] });
        // Get stored value
        const price = await greenContract.getPrice();
        assert.equal(price, 120, 'The price 120 was not stored.');
        const installments = await greenContract.getInstallments();
        assert.equal(installments, 12, 'The installments 12 was not stored.');
    });
});