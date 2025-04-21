import { createAccount, createOperator } from "@nats-io/nkeys";
import { encodeAccount, encodeOperator, Operator } from "@nats-io/jwt";

const decoderInstance = new TextDecoder();
const decode = decoderInstance.decode.bind(decoderInstance);

const operatorKP = createOperator();
// create 3 operators
const signingKeysOperator = Array.from({ length: 3 }, () => createOperator());
const systemAccountKP = createAccount();
const signingKeysSystemAccount = Array.from({ length: 3 }, () => createAccount());

[...signingKeysOperator, operatorKP].forEach((sk, i) => {
    const prefix = (sk !== operatorKP) ? 'Operator siging key #[%s]' : 'operatorKP';
    console.log(prefix + '.publicKey: %s', i, sk.getPublicKey());
    console.log(prefix + '.seed: %s', i, decode(sk.getSeed()));
});

[...signingKeysSystemAccount, systemAccountKP].forEach((sk, i) => {
    const prefix = (sk !== systemAccountKP) ? 'System Account signing key #[%s]' : 'sysAccountKP';
    console.log(prefix + '.publicKey: %s', i, sk.getPublicKey());
    console.log(prefix + '.seed: %s', i, decode(sk.getSeed()));
});

const signingKeysOperatorPublic = signingKeysOperator.map(sk => sk.getPublicKey());

const options: Operator = {
    signing_keys: signingKeysOperatorPublic,
    system_account: systemAccountKP.getPublicKey(),
    type: "operator",
    version: 2
};

const operatorJwt = await encodeOperator('operator-03', operatorKP, options);


const systemAccountJwt = await encodeAccount('system_account', systemAccountKP, {
    signing_keys: signingKeysOperatorPublic,
    type: 'account',
    limits: {
        subs: -1,
        data: -1,
        payload: -1,
        imports: -1,
        exports: -1,
        wildcards: true,
        conn: -1,
        leaf: -1,
        //  account will not be allowed to create/sub/pub to  jetstreams
        //  account can only consume advisory messages
        //  "mem_storage": -1, 
        //  "disk_storage": -1
    }
}, { signer: operatorKP.getSeed() });

console.log('operator jwt:', operatorJwt)
console.log('system jwt:', systemAccountJwt);

console.log('operator pubkey', operatorKP.getPublicKey())
console.log('sysaccount pubkey', systemAccountKP.getPublicKey())


