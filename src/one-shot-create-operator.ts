import { createAccount, createOperator } from "@nats-io/nkeys";
import { encodeAccount, encodeOperator, Operator } from "@nats-io/jwt";

const decoderInstance = new TextDecoder();
const decode = decoderInstance.decode.bind(decoderInstance);

const operatorKP = createOperator();
// create 3 operators
const signingKeysOperator = Array.from({ length: 3 }, () => createOperator());
const systemAccountKP = createAccount();

// system accounts gets 3 signing keys
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

// chicken and the egg
// at creation of the operator we dont really have a system user
// what we do have is the private/public key pair to create the future system user
// that is used as a reference to the system_account in the operator jwt 
const options: Operator = {
    signing_keys: signingKeysOperatorPublic,
    system_account: systemAccountKP.getPublicKey(),
    type: "operator",
    version: 2
};

// create operator
const operatorJwt = await encodeOperator('operator-03', operatorKP, options);


// what do system accounts do? https://docs.nats.io/running-a-nats-service/configuration/sys_accounts
// now we create the system user
const systemAccountJwt = await encodeAccount('system_account', systemAccountKP, {
    signing_keys: signingKeysOperatorPublic,
    type: 'account',
    limits: {
        // nats limits
        subs: -1, // unlimited subscriptions
        data: -1, // unlimited (total) messages sizes
        payload: -1,// unlimited message body sizes

        // account limits
        imports: -1,
        exports: -1,
        wildcards: true,
        conn: -1,
        leaf: -1,
        disallow_bearer: true, // i have added this




        // jetstream limits: Partial<JetStreamLimits>
        //    "mem_storage": number;                       ->  not specified = account cannot create streams in memory
        //    "disk_storage": number;                      ->  not specified = account cannot create streams on disk
        //    streams: number;
        //    consumer: number;
        //    "mem_max_stream_bytes": number;
        //    "disk_max_stream_bytes": number;
        //    "max_bytes_required": boolean;               -> redundant because I cannot create streams
        //    "max_ack_pending": number;

        // just as above but splitted out by "tiers"
        // export type JetStreamTieredLimits = {
        // tiered_limits?: {
        //      cheap_wait_your_turn_tier: Partial<JetStreamLimits>;
        //      expensive_always_available_tier: Partial<JetStreamLimits>;
        // };


        //  account will not be allowed to create/sub/pub to  jetstreams
        //  account can only consume advisory messages

    }
}, { signer: operatorKP.getSeed() });

console.log('operator jwt:', operatorJwt)
console.log('system jwt:', systemAccountJwt);

console.log('operator pubkey', operatorKP.getPublicKey())
console.log('sysaccount pubkey', systemAccountKP.getPublicKey())


