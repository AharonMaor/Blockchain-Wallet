const SHA256=require('crypto-js/sha256')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')
const { BloomFilter } = require("bloom-filters")
const { MerkleTree } = require("merkletreejs")



class Transaction {
    constructor(fromAddress , toAddress , amount){
        this.fromAddress=fromAddress
        this.toAddress=toAddress
        this.amount=amount
        this.time_stamp=Date.now()
        this.segwitWitness=[]
    }

    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.time_stamp).toString()
    }

    signTransaction(singing_key){
        if (singing_key.getPublic('hex') !== this.fromAddress){
            throw new Error('Can not sign transaction for another wallet')
        }

        const hash_tx = this.calculateHash()
        const sig = singing_key.sign(hash_tx,'base64') 
        this.segwitWitness.push(sig.toDER('hex'))
        this.signature = this.segwitWitness[0]
    }

    isValid(){
        
        if(this.fromAddress === null) {
            return true
        }

        if(!this.segwitWitness || this.segwitWitness.length === 0 ){
            throw new Error('No signature in this transaction')
        } 

        const public_key = ec.keyFromPublic(this.fromAddress,'hex')
        return public_key.verify(this.calculateHash(),this.segwitWitness[0])
    }
}



class Block {
    constructor(time_stamp, transactions, previous_hash=" "){
        this.time_stamp=time_stamp
        this.transactions=transactions
        this.previous_hash=previous_hash
        this.hash=this.calculateHash()
        this.nonce=0
        this.BloomFilter = new BloomFilter(10,4)
    }

    initializeMerkleTree(transactions){
        const leaves = Object.entries(transactions).map((x) => SHA256(x.signature))
        this.merkletree = new MerkleTree(leaves,SHA256)
        this.root = this.merkletree.getRoot().toString('hex')
    }

    initializeBloomFilter(transactions){
        for (const tx of transactions){
            if (tx.fromAddress != null){
                this.BloomFilter.add(tx.signature)
            }
        }
    }
    
    findInBloomFilter(signature){
        return this.BloomFilter.has(signature)
    }

    findInMerkleTree(signature){
        const leaf = SHA256(signature)
        const proof = this.merkletree.getProof(leaf)
        return this.merkletree.verify(proof, leaf, this.root)
    }

    calculateHash(){
        return SHA256(this.previous_hash + this.time_stamp + JSON.stringify(this.transactions) + this.nonce).toString()
        
    }

    mineBlock(difficulty){
        while(this.hash.substring(0,difficulty) !== Array(difficulty + 1).join('0')){
            this.nonce++
            this.hash=this.calculateHash()
        }
        console.log('Block mined successfuly' );
            
    }

    validTransaction(){
        for (const tx of this.transactions){
            if(!tx.isValid()){
                return false
            }
        }
        return true
    }
}





class BlockChain {
    constructor(){
        this.chain=[this.createGenesisBlock()]
        this.difficulty=2
        this.pending_transactions=[]
        this.mining_coins = 200
    }

    createGenesisBlock(){
        return new Block("03/04/2023","","0")
    }
    
    getLatestBlock(){
        return this.chain[this.chain.length-1] 
    }
    
    miningPendingTransaction(mining_reward_addr){
        const reward_tx = new Transaction(null,mining_reward_addr,this.mining_coins - 2)
        const cushion_reward_tx = new Transaction(null, mining_reward_addr, 3)
        const reward_tx_for_burn = new Transaction(null,'burning_wallet', 2)
        this.block_transactions = []
        for(let i = 0; i < 4 ;i++){
            if(this.pending_transactions[i] != undefined)
            {
                this.block_transactions.push(this.pending_transactions[i])
            }
            else
            {
                break
            }
        }
        if (this.block_transactions.length != 0)
        {
            console.log(this.block_transactions);
        }
        
        this.block_transactions.push(reward_tx)
        this.block_transactions.push(cushion_reward_tx)
        this.block_transactions.push(reward_tx_for_burn)
        const block = new Block(Date.now(),this.block_transactions,this.getLatestBlock().hash)
        block.mineBlock(this.difficulty)
        block.initializeBloomFilter(this.block_transactions)
        block.initializeMerkleTree(this.block_transactions)
        this.chain.push(block)
        this.pending_transactions=this.pending_transactions.slice(4,this.pending_transactions.length)
    }

    addTransaction(transaction){
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error('Transaction must include from and to address')
        }

        if(!transaction.isValid()){
            throw new Error('Cannot add invalid transaction to chain')
        }

        if(transaction.amount <= 0){
            throw new Error('Transaction amount should be higher than 0')
        }

        const curr_balance = this.getBalanceOfAddress(transaction.fromAddress)
        if (curr_balance < transaction.amount){
            throw new Error('Not enough balance in your wallet');
        }
        this.pending_transactions.push(transaction)
    }

    getBalanceOfAddress (address){
        let balance=0
        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.fromAddress === address){
                    balance-=trans.amount
                }
                if(trans.toAddress === address){
                    balance+=trans.amount
                }
            }
        }
        return balance
    }
    
    burnedCoins(){
        this.burned_coins = 0 
        for (const block of this.chain){
            for(const transaction of block.transactions){
                if (transaction.toAddress === 'burning_wallet')
                {
                    this.burned_coins+=transaction.amount
                }
            }
        }
        return this.burned_coins
    }
}


module.exports.BlockChain=BlockChain
module.exports.Block=Block
module.exports.Transaction=Transaction