/*
skOperator[0].seed: SOAEPJ5WJHD3F3RASWZZSGXQXLEZWSFGFAOBT6FP67ARJBPMJ3DCMLTBXI
skOperator[1].seed: SOANDWPKXHNEN7B7EMAXZJOPE5HWVRSPSRHDVJBLHGDACE5V4JU2GHJVJE
skOperator[2].seed: SOAF7OVO5ZVJOU6HCWK5SPT3TIJ6REXRJISG5VAL2VXPG2Z62GFWOCLSTY
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

import { createAccount, createOperator, fromSeed } from "@nats-io/nkeys";
import { encodeAccount, encodeUser, encodeOperator, Operator } from "@nats-io/jwt";

const endoderInstance = new TextEncoder();
const encode = endoderInstance.encode.bind(endoderInstance);

const decoderInstance = new TextDecoder();
const decode = decoderInstance.decode.bind(decoderInstance);

const operatorKP = fromSeed(encode('SOAHGERKP26RQMZ7OO7VZDAMBECBRLLZGORGJPGMD7RGCUYVNFEJZQ22SQ'))

const sysAccountKP = fromSeed(encode('SAAF7LLK6TIGQ24YCLL5NUTJVVOL2ODBUX4R42CCQKXVLFWZMWMBZUJ5HM'));

const signingKeysPairs = [
    'SAAOTUZCGVG4QSYWA7L74LNCK45LNVKK3QANVYTIM3HXWPYODJVFHS7SPY',
    'SAAOK54YVRNV25M23CJSZJIZZDC2SQHW52Z4Q5UDRTUMU2S7B6NBFV3AAA',
    'SAAOOTTUKRS727U5WNBNETMBDP6ZYDF4HA3MOZQYCWIQYMT7CO2FSXFIT4'
].map(seed => fromSeed(encode(seed)));


const jwt = await encodeAccount('system_account', sysAccountKP, {
    // this looks like no limits what-so-ever
    signing_keys: signingKeysPairs.map(skp => skp.getPublicKey()),
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

console.log('system jwt', jwt);

console.log('operator pubkey', operatorKP.getPublicKey())
console.log('sysaccount pubkey', sysAccountKP.getPublicKey())



