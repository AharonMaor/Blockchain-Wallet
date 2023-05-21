const { randomInt } = require('bloom-filters/dist/utils.js')
const {BlockChain,Block, Transaction}=require('./blockchain.js')
const EC = require('elliptic').ec 
const ec = new EC('secp256k1')


const key_1 = ec.keyFromPrivate('077687f98ff31b532601b564e4ab15e4132dfda8b8e9fd334784cf7ccd3c11b3')
const key_2 = ec.keyFromPrivate('f95acdb394a33cad856635d094afa3fa23a14f05f4909e6b985a0f9fc71a1d84')
const key_3 = ec.keyFromPrivate('5be990e09e5c4babe50f599c72c46e703ee06611d493632d0e2af567fb097b5a')


const address_1 = key_1.getPublic('hex')
const address_2 = key_2.getPublic('hex')
const address_3 = key_3.getPublic('hex')



const savjeeCoin = new BlockChain()
savjeeCoin.miningPendingTransaction(address_1)
savjeeCoin.miningPendingTransaction(address_2)
savjeeCoin.miningPendingTransaction(address_3)

const keysArray = [key_1,key_2,key_3]
const addressArray = [address_1,address_2,address_3]
let amountMinedCoins = 0;
for(let i = 1; i <= 30; i++){
    let random = randomInt(0,2)
    let randomTo = randomInt(0,2)
    let randomAmmount = randomInt(1,10)
    if (i < 5 )
    {
        amountMinedCoins = amountMinedCoins + randomAmmount;
    }
    const tx = new Transaction(addressArray[random], addressArray[randomTo],randomAmmount)
    tx.signTransaction(keysArray[random])
    savjeeCoin.addTransaction(tx)
}

savjeeCoin.miningPendingTransaction(address_1)
console.log()

console.log("BloomFilter validation : " + savjeeCoin.getLatestBlock().findInBloomFilter(savjeeCoin.pending_transactions[1]['signature']))
console.log("MerkleTree validation : " +savjeeCoin.getLatestBlock().findInMerkleTree(savjeeCoin.pending_transactions[1]['signature']))

console.log()

console.log('Balance of all wallets : ')
let counter = 0
for (let j = 0; j < addressArray.length;j++)
{
    let k = j + 1
    counter += savjeeCoin.getBalanceOfAddress(addressArray[j])
    console.log('Balance of wallet ' + k + ' is: ' + savjeeCoin.getBalanceOfAddress(addressArray[j]))
}
console.log()

console.log("Total coins on the blockchain network : " + (counter + savjeeCoin.getBalanceOfAddress('burning_wallet')))

console.log()

console.log("The total of the coins mined in the blocks of the network is : " + amountMinedCoins)

console.log()

console.log("Num of burned coins is : " + savjeeCoin.burnedCoins())

console.log()