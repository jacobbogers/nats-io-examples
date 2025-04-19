import { createAccount, createOperator, fromSeed } from "@nats-io/nkeys";
import { encodeAccount, encodeUser, encodeOperator, Operator } from "@nats-io/jwt";

const endoderInstance = new TextEncoder();
const encode = endoderInstance.encode.bind(endoderInstance);

const decoderInstance = new TextDecoder();
const decode = decoderInstance.decode.bind(decoderInstance);

/*
operatorKP.privateKey: 3 PBDORXVNVNHSST2X3JVYQZB5AEGVDB7OMZUOGEQJRPTO4CAKSFDN3BXIY5CR7ZQF4RJEDSML5ZH5VTHJSYT7LXQIN6TLTTBRE43RKTIYPEVA
operatorKP.publicKey: 3 OCDORR2FD7TALZCSIHEYX3SP3LGOTFRH6XPAQ35GXHGDCJZXCVGRQF7K
operatorKP.seed: 3 SOAEN2G6VWVU6KKPK7NGXCDEHUAQ2UMH5ZTGRYYSBGF6N3QIBKIUNXL2YM
*/

const kp = fromSeed(encode('SOAEN2G6VWVU6KKPK7NGXCDEHUAQ2UMH5ZTGRYYSBGF6N3QIBKIUNXL2YM'));

console.log('pubkey', kp.getPublicKey());
console.log('privkey', decode(kp.getPrivateKey()));