// using require rather than import to make this simple for a standard javascript example
const {connect, StringCodec, credsAuthenticator} = require('nats');
const {encodeAccount, encodeUser} = require('nats-jwt');
const {createAccount, createUser, fromSeed} = require('nkeys.js');

// The Seed representing the Operator - you'll need this to sign new Accounts. Notice it starts with 'SO'
const opSeed = 'SOA...';
// The JWT representing the User from the System Account (Step 4)
const sysJwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJlZDI1NTE5LW5rZXkifQ...';
// The Seed representing the User from the System Account (Step 3). Notice it starts with 'SU'
const sysSeed = 'SUA...';

// A function to define the contents of a credentials file. Needed for a client to authenticate
function returnCreds(jwt, seed) {
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

(async () => {
    // Lets generate an Operator object 'opk'
    const operator = fromSeed(new TextEncoder().encode(opSeed));

    // Lets generate a NEW account
    const account = createAccount();
    console.info(`Account Public Key - ${account.getPublicKey()}`);
    console.info(`Account Private Key - ${new TextDecoder().decode(account.getPrivateKey())}`);
    console.info(`Account Seed Key - ${new TextDecoder().decode(account.getSeed())}`);

    // Lets generate a NEW User
    const user = createUser();
    console.info(`User Public Key - ${user.getPublicKey()}`);
    console.info(`User Private Key - ${new TextDecoder().decode(user.getPrivateKey())}`);
    console.info(`User Seed Key - ${new TextDecoder().decode(user.getSeed())}`);
    const userSeed = new TextDecoder().decode(user.getSeed());

    // Lets generate a JWT for the Account and sign that JWT with the operator - this will result in the JWT iss claim being the operator public key
    // first we define the limits of the account and also enable JetStream by defining mem_storage and disk_storage
    const nats = {
        "limits": {
            "subs": -1,
            "data": -1,
            "payload": -1,
            "imports": -1,
            "exports": -1,
            "wildcards": true,
            "conn": -1,
            "leaf": -1,
            "mem_storage": -1,
            "disk_storage": -1
        }
    }
    const accJwt = await encodeAccount('my-account', account, nats, { signer: operator } );
    console.info(`ACCOUNT JWT - ${accJwt}`);

    // Lets generate a JWT for the User and sign it with the Account
    const config = {
        "pub": {},
        "sub": {},
        "subs": -1,
        "data": -1,
        "payload": -1,
        "issuer_account": account.getPublicKey()
    }
    const userJwt = await encodeUser('my-user', user, account, config)
    console.info(`USER JWT - ${userJwt}`);

    // Lets push the new Account to NATS
    // First we create a system account credentials record
    const sysCreds = returnCreds(sysJwt, sysSeed);
    // Then we use this system credentials record to connect to NATS with our node client
    const nc = await connect({ servers: "localhost:4222", authenticator: credsAuthenticator(new TextEncoder().encode(sysCreds)) });
    // create a codec
    const sc = StringCodec();

    // Publish the new account to the $SYS.REQ.CLAIMS.UPDATE subject to save it to the /local/jwt folder
    try {
        const m = await nc.request("$SYS.REQ.CLAIMS.UPDATE", sc.encode(accJwt));
        console.log(`got response: ${sc.decode(m.data)}`);
    } catch (err) {
        console.log(`problem with request: ${err.message}`);
        console.info(err);
    }
    await nc.close();

    // FINALLY, lets use our new User JWT to subscribe to a topic of our choosing.
    // If we've done this correctly, this user will be authenticated and authorized
    const userCreds = returnCreds(userJwt, userSeed);
    const nc2 = await connect({ servers: "localhost:4222", authenticator: credsAuthenticator(new TextEncoder().encode(userCreds)) });

    // create a simple subscriber and iterate over messages
    // matching the subscription
    const sub = nc2.subscribe("hello");
    (async () => {
        for await (const m of sub) {
            console.log(`[${sub.getProcessed()}]: ${sc.decode(m.data)}`);
        }
        console.log("subscription closed");
    })();
    await nc2.close();
})()