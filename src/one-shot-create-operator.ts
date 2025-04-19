import { createAccount, createOperator, fromSeed } from "@nats-io/nkeys";
import { encodeAccount, encodeUser, encodeOperator, Operator } from "@nats-io/jwt";


const decoderInstance = new TextDecoder();
const decode = decoderInstance.decode.bind(decoderInstance);

const operatorKP = createOperator();
const signingKeysOperator = Array.from({ length: 3 }, () => createOperator());
const systemAccount = createAccount();
const signingKeysSystemAccount = Array.from({ length: 3 }, () => createAccount());


[...signingKeysOperator, operatorKP].forEach((sk, i) => {
    const prefix = (sk !== operatorKP) ? 'skOperator[%s]' : 'operatorKP';
    // console.log(prefix + '.privateKey: %s', i, decode(sk.getPrivateKey()));
    // console.log(prefix + '.publicKey: %s', i, sk.getPublicKey());
    console.log(prefix + '.seed: %s', i, decode(sk.getSeed()));
});

[...signingKeysSystemAccount, systemAccount].forEach((sk, i) => {
    const prefix = (sk !== systemAccount) ? 'skSysAccount[%s]' : 'sysAccountKP';
    // console.log(prefix + '.privateKey: %s', i, decode(sk.getPrivateKey()));
    console.log(prefix + '.publicKey: %s', i, sk.getPublicKey());
    console.log(prefix + '.seed: %s', i, decode(sk.getSeed()));
});

const signingKeysOperatorPublic = signingKeysOperator.map(sk => sk.getPublicKey());

const options: Operator = {
    signing_keys: signingKeysOperatorPublic,
    // "account_server_url"?: string;
    // "operator_service_urls"?: string[];
    system_account: systemAccount.getPublicKey(),
    //
    // tags?: string[], // what is this?
    //
    type: "operator",
    version: 2
};

encodeOperator('operator-03', operatorKP, options).then(str => {
    console.log('operator jwt:', str);
});


