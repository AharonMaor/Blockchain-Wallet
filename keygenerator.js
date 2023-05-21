const EC = require('elliptic').ec 

const ec = new EC('secp256k1')

const key = ec.genKeyPair()
const public_key = key.getPublic('hex')
const private_key = key.getPrivate('hex')

console.log('\n Your Public key (wallet address) : ' + public_key)
console.log('\n Your Private key (Keep it safe & private !) : ' + private_key)