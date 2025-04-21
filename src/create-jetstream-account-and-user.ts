/*
operatorKP.seed: 3 SOAHGERKP26RQMZ7OO7VZDAMBECBRLLZGORGJPGMD7RGCUYVNFEJZQ22SQ
skOperator[0].seed: SOAEPJ5WJHD3F3RASWZZSGXQXLEZWSFGFAOBT6FP67ARJBPMJ3DCMLTBXI
operator jwt: eyJ0eXAiOiJKV1QiLCJhbGciOiJlZDI1NTE5LW5rZXkifQ.eyJhdWQiOiJOQVRTIiwibmFtZSI6Im9wZXJhdG9yLTAzIiwic3ViIjoiT0FCTVZPQzZOQVVWVE9YSDM2SE9PNjJVSFczRllNRTM1VlUzQ1lVUzM3M1pSTERIVjRFRUpRMzMiLCJuYXRzIjp7InNpZ25pbmdfa2V5cyI6WyJPQUs1SlQyRUtUQkdQV0NKUkc0NUdFRUJCVkw0RExQU1BWVUlNNFhYSEMzVzVIRFJYSkZRUFNNTyIsIk9DVlpHUlJaV1hJWjY0TFUzNlBVSlQyVjRKQkFaVFJVMkRFVERSSzZTR1dDV0VRQlQ1QldHVVdNIiwiT0E3Q1lHRVlUNVlRM0NMUDQ3S1lMMkI0VENDQzdRVENDU05aRFJaR0YyVlkyWUhYNkdOWkZLNVIiXSwic3lzdGVtX2FjY291bnQiOiJBRDNST0xWNFEzWUhVWUJTT05XWTZMVkw1NEtDNkdWNU1VUTJaWUM2VkdGVzZKRzRNQVczSTZKSSIsInR5cGUiOiJvcGVyYXRvciIsInZlcnNpb24iOjJ9LCJpc3MiOiJPQUJNVk9DNk5BVVZUT1hIMzZIT082MlVIVzNGWU1FMzVWVTNDWVVTMzczWlJMREhWNEVFSlEzMyIsImlhdCI6MTc0NTA5NDQ1MywianRpIjoiL2JXRzFYczJSQmxzMWxUNjdNTzdFcmI3anhnN0lUZ0hHeUlEaHRkMnR3KzF4T1lnV1JNYkdkVnRyOTdib1c3V1pPUjY0TEY3VjZKTFF6VTRLcHdmaXc9PSJ9.39-Z3F2OyHJM3K0vlMxlQPx4Ve3VI5kGAyP-lbk6xlYft1ARESfR4iiXSnv-95Qu6CdWGwyGq039oNLMN27rDg
*/
import { fromSeed, createUser, createAccount } from "@nats-io/nkeys";
import { encodeUser, encodeAccount, User } from "@nats-io/jwt";
import { writeFileSync, readFileSync } from 'node:fs';

import { connect, ConnectionOptions, credsAuthenticator, StringCodec, type NatsConnection } from 'nats';

// NOTE: FORMATTING IS IMPORTANT (no indent) FOR "nats" CLI TOOL
function returnCreds(jwt: string, seed: string) {
    return `-----BEGIN NATS USER JWT-----
${jwt}
------END NATS USER JWT------

************************* IMPORTANT *************************
NKEY Seed printed below can be used sign and prove identity.
NKEYs are sensitive and should be treated as secrets.

-----BEGIN USER NKEY SEED-----
${seed}
------END USER NKEY SEED------
`;
}

// function delay(ts: number) {
//     return new Promise<void>(resolve => setTimeout(() => resolve(undefined), ts));
// }

async function runme() {
    const endoderInstance = new TextEncoder();
    const encode: (string) => Uint8Array = endoderInstance.encode.bind(endoderInstance);

    const decoderInstance = new TextDecoder();
    const decode: (Uint8Array) => string = decoderInstance.decode.bind(decoderInstance);


    const operatorKP = fromSeed(encode('SOAHGERKP26RQMZ7OO7VZDAMBECBRLLZGORGJPGMD7RGCUYVNFEJZQ22SQ'));
    const operatorSK = fromSeed(encode('SOAEPJ5WJHD3F3RASWZZSGXQXLEZWSFGFAOBT6FP67ARJBPMJ3DCMLTBXI'));
    const jetStreamAccountKP = createAccount();
    const systemUserCreds = readFileSync('./sys-user.creds', { encoding: 'utf-8' })
    const userPK = createUser();


    // create non system account with jetstream enabled

    const jetStreamJwt = await encodeAccount('normal-account-with-js', jetStreamAccountKP, {
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
            //  no limits for jetstream
            //  account can only consume advisory messages
            mem_storage: -1, // unlimited for jetstream  
            disk_storage: -1 // unlimited for jetstream
        }
    }, { signer: operatorSK });

    // create user for jetstream account

    const config: Partial<User> = {
        "pub": {},
        "sub": {},
        "subs": -1,
        "data": -1,
        "payload": -1,
        "issuer_account": jetStreamAccountKP.getPublicKey()
    }

    const userJwt = await encodeUser('casual-user', userPK, jetStreamAccountKP, config);

    console.log('user seed', userPK.getPublicKey);
    console.log('account seed', decode(jetStreamAccountKP.getSeed()));

    const connectOptions: ConnectionOptions = {
        servers: 'localhost:4222',
        authenticator: credsAuthenticator(encode(systemUserCreds)),
        name: 'jetstream-account',
        reconnect: true,
        reconnectJitter: 0.5e3
    };

    const sc = StringCodec();

    let nc: NatsConnection;
    try {
        nc = await connect(connectOptions);
        console.log('sys user connection success');
        const m = await nc.request("$SYS.REQ.CLAIMS.UPDATE", sc.encode(jetStreamJwt));
        console.log(`account update response: ${sc.decode(m.data)}`);
        await nc.close();


        // FINALLY, lets use our new User JWT to subscribe to a topic of our choosing.
        // If we've done this correctly, this user will be authenticated and authorized
        const userCreds = returnCreds(userJwt, decode(userPK.getSeed()));
        const nc2 = await connect({ servers: "localhost:4222", authenticator: credsAuthenticator(encode(userCreds)) });
        console.log('jetstream user connection success');
        writeFileSync('./jetstream-user.creds', userCreds);
        nc2.close();
    }
    catch (e) {
        console.log('connect failed, reason: %s', e)
        return;
    }
}

runme();


