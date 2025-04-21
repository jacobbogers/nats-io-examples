/*
operatorKP.seed: 3 SOAHGERKP26RQMZ7OO7VZDAMBECBRLLZGORGJPGMD7RGCUYVNFEJZQ22SQ
skSysAccount[0].publicKey: AAVG6EBRH4TFF4XPHEX276CWPXH3BCFNUACUQJLTATODZ536SXG7SCQV
skSysAccount[0].seed: SAAOTUZCGVG4QSYWA7L74LNCK45LNVKK3QANVYTIM3HXWPYODJVFHS7SPY
skSysAccount[1].publicKey: ADTKP3FGCWTGVXMEIH6RQUHKIRFQDYKF6A5C75CSATEKF2ECRDRTQY2Z
skSysAccount[1].seed: SAAOK54YVRNV25M23CJSZJIZZDC2SQHW52Z4Q5UDRTUMU2S7B6NBFV3AAA
skSysAccount[2].publicKey: ABN6F6NZBVU5QZVHU3KY6LOSJM5DJLQ5T5TTYVVJCXREWSRRFAXJ2SKW
skSysAccount[2].seed: SAAOOTTUKRS727U5WNBNETMBDP6ZYDF4HA3MOZQYCWIQYMT7CO2FSXFIT4
sysAccountKP.publicKey: 3 AD3ROLV4Q3YHUYBSONWY6LVL54KC6GV5MUQ2ZYC6VGFW6JG4MAW3I6JI
sysAccountKP.seed: 3 SAAF7LLK6TIGQ24YCLL5NUTJVVOL2ODBUX4R42CCQKXVLFWZMWMBZUJ5HM
operator jwt: eyJ0eXAiOiJKV1QiLCJhbGciOiJlZDI1NTE5LW5rZXkifQ.eyJhdWQiOiJOQVRTIiwibmFtZSI6Im9wZXJhdG9yLTAzIiwic3ViIjoiT0FCTVZPQzZOQVVWVE9YSDM2SE9PNjJVSFczRllNRTM1VlUzQ1lVUzM3M1pSTERIVjRFRUpRMzMiLCJuYXRzIjp7InNpZ25pbmdfa2V5cyI6WyJPQUs1SlQyRUtUQkdQV0NKUkc0NUdFRUJCVkw0RExQU1BWVUlNNFhYSEMzVzVIRFJYSkZRUFNNTyIsIk9DVlpHUlJaV1hJWjY0TFUzNlBVSlQyVjRKQkFaVFJVMkRFVERSSzZTR1dDV0VRQlQ1QldHVVdNIiwiT0E3Q1lHRVlUNVlRM0NMUDQ3S1lMMkI0VENDQzdRVENDU05aRFJaR0YyVlkyWUhYNkdOWkZLNVIiXSwic3lzdGVtX2FjY291bnQiOiJBRDNST0xWNFEzWUhVWUJTT05XWTZMVkw1NEtDNkdWNU1VUTJaWUM2VkdGVzZKRzRNQVczSTZKSSIsInR5cGUiOiJvcGVyYXRvciIsInZlcnNpb24iOjJ9LCJpc3MiOiJPQUJNVk9DNk5BVVZUT1hIMzZIT082MlVIVzNGWU1FMzVWVTNDWVVTMzczWlJMREhWNEVFSlEzMyIsImlhdCI6MTc0NTA5NDQ1MywianRpIjoiL2JXRzFYczJSQmxzMWxUNjdNTzdFcmI3anhnN0lUZ0hHeUlEaHRkMnR3KzF4T1lnV1JNYkdkVnRyOTdib1c3V1pPUjY0TEY3VjZKTFF6VTRLcHdmaXc9PSJ9.39-Z3F2OyHJM3K0vlMxlQPx4Ve3VI5kGAyP-lbk6xlYft1ARESfR4iiXSnv-95Qu6CdWGwyGq039oNLMN27rDg
*/
import { fromSeed, createUser } from "@nats-io/nkeys";
import { encodeUser, User } from "@nats-io/jwt";
import { writeFileSync } from 'node:fs';

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
//   return new Promise<void>(resolve => setTimeout(() => resolve(undefined), ts));
// }

async function runme() {
  const endoderInstance = new TextEncoder();
  const encode: (string) => Uint8Array = endoderInstance.encode.bind(endoderInstance);

  const decoderInstance = new TextDecoder();
  const decode: (Uint8Array) => string = decoderInstance.decode.bind(decoderInstance);

  // to sign the creation of a system user
  const systemAccountKP = fromSeed(encode('SAAF7LLK6TIGQ24YCLL5NUTJVVOL2ODBUX4R42CCQKXVLFWZMWMBZUJ5HM'));
  const systemAccountSK = fromSeed(encode('SAAOTUZCGVG4QSYWA7L74LNCK45LNVKK3QANVYTIM3HXWPYODJVFHS7SPY'));

  // system user nkey pair, aslong as we have any signing key of the system account we can create system users on the fly
  //      no need to store them in the server config file
  const userPK = createUser();
  // Lets generate a JWT for the User and sign it with the Account
  const config: Partial<User> = {
    "pub": {},
    "sub": {},
    "subs": -1,
    "data": -1,
    "payload": -1,
    "issuer_account": systemAccountKP.getPublicKey()
  }
  const userJwt = await encodeUser('system-user', userPK, systemAccountSK, config)
  const userPrivKeyString = decode(userPK.getPrivateKey());
  const userPubKey = userPK.getPublicKey();
  const userSeed = decode(userPK.getSeed());

  console.log('user nkey', userPubKey);
  console.log('account nkey', systemAccountKP.getPublicKey());

  const sysUserCreds = returnCreds(userJwt, userSeed);
  writeFileSync('./sys-user.creds', sysUserCreds);
  const connectOptions: ConnectionOptions = {
    servers: 'localhost:4222',
    authenticator: credsAuthenticator(encode(sysUserCreds)),
    name: 'temp-system-user',
    reconnect: true,
    reconnectJitter: 0.5e3
  };
  let nc: NatsConnection;
  try {
    nc = await connect(connectOptions);
    console.log('connection success');
    console.log('servers:', nc.getServer(), nc.stats());

  }
  catch (e) {
    console.log('connect failed, reason: %s', e)
    return;
  }
  const sc = StringCodec();

  nc.closed().then(() => {
    console.log('the connection is closed');
  });


  // Publish the new account to the $SYS.REQ.CLAIMS.UPDATE subject to save it to the /local/jwt folder
  try {
    const m = await nc.request('$SYS.REQ.USER.INFO');
    console.log(`user.info ->: ${sc.decode(m.data)}`);
    const m2 = await nc.request('$SYS.REQ.SERVER.PING.IDZ');
    const json = JSON.parse(sc.decode(m2.data));
    console.log(`sever ping -> %o:`, json);
    const m3 = await nc.request('$SYS.REQ.SERVER.PING');
    console.log(`sever ping+healthcheck ->: ${sc.decode(m3.data)}`);
    //
    // dont wait for this connection since it will be close
    //    maybe assign reconnect prop (no that did not work)
    // const subj = `$SYS.REQ.SERVER.${json.id}.RELOAD`;
    // const m4 = await nc.request(subj);
    // await delay(2000);
    // await nc.reconnect()
    // console.log(`config hot reload ->: ${sc.decode(m4.data)}`);


  } catch (err) {
    console.log(`problem with request: ${err.message}`);
    console.info(err);
  }
  await nc.close();
}

runme();


