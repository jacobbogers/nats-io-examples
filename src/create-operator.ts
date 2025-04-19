import { createOperator, fromSeed, createServer } from "@nats-io/nkeys";
import { encodeAccount, encodeUser, encodeOperator } from "@nats-io/jwt";
const operatorKP = createOperator();

const seed = operatorKP.getSeed();
const publicKey = operatorKP.getPublicKey();
const privateKey = operatorKP.getPrivateKey();
// at this point this might well be a seed
const priv = fromSeed(seed);

const decoderInstance = new TextDecoder();

const decode = decoderInstance.decode.bind(decoderInstance);

console.log('operatorKP/privateKey: %s', decode(priv.getPrivateKey()));
console.log('operatorKP/privateKey: %s', decode(operatorKP.getPrivateKey()));

console.log('operatorKP/publicKey: %s', priv.getPublicKey());
console.log('operatorKP/publicKey: %s', operatorKP.getPublicKey());

const serverKP = createServer();
console.log('\n\n');
console.log('serverKP/privateKey %s', decode(serverKP.getPrivateKey()));
console.log('serverKP/publicKey %s', serverKP.getPublicKey());
console.log('serverKP/seed %s', decode(serverKP.getSeed()));

encodeOperator('operator-03', operatorKP,)
