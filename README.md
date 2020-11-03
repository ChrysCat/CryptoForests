# CryptoForests
## Blockchain for Green Contracts
Our world is losing its forest cover and greenery at an unprecedented rate. While firms are willing to offset their carbon footprint by purchasing carbon credits, the carbon credit market is not accessible to individuals and communities around the world. One method of carbon offsetting is by planting or maintaining trees, which naturally exist in rural and remote parts of the world. CryptoForests connects individuals passionate about conservation with communities that can rewild or maintain their existing forest cover, resulting in carbon sequestration and empowering rural communities. 
## Workflow
1.	Vendors list the trees they want to sell in a green contract.
2.  Green contract: Unvalidated contracts are listed for sale. Each contract has a GPS location, Photo, price and number of payment instalments.
3.	Validators review the proofs and validate/invalidate. Validators receive a small flat fee for validating the contracts.
4.	Buyer buy unvalidated contracts and choose a validator. When a buyer purchases a tree, the first price is split as: 70% to the vendor, 10% to the Validator and 10% to mint a LeafCoin. 1 LeafCoin = 1 R-BTC. 10% is added to the pot.
5.  A fraction of the pot is rewarded to the buyers as reward. As other LeafCoins are minted, the pot grows and the buyers recieve higher fraction of the pot.
6.  Vendors upload proof of their work as a photo with GPS location and timestamp.
7.	If the Validator accepts proof of work, payment is released as per the contract. 90% to the vendor and 10% to the validator. Once the installments are complete, the contract ends.
8.  If the Validator rejects the proof of work, the remaining part of contract is cancelled and contract terminates.
## Prerequisites
Require git, npm/yarn, truffle and crypto wallet, preferably, Nifty with R-BTC from RSK Testnet.
## Installation
1.  git clone <this repo>
2.  yarn install/ npm install
3.  save your mnemonic in .mnemonic in the root directory
4.  truffle compile
5.  truffle migrate --network testnet --reset
6.  cd client
7.  yarn install/ npm install
8.  App would be running on the local machine on port 8545. Browser launches automatically or browse to the location.
9.  Connect to your wallet and try out.
