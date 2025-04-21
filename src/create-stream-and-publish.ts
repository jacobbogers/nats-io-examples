import { fromSeed, createUser, createAccount } from "@nats-io/nkeys";
import { encodeUser, encodeAccount, User } from "@nats-io/jwt";
import { writeFileSync, readFileSync } from 'node:fs';

import { connect, ConnectionOptions, credsAuthenticator, StringCodec } from 'nats';
import { jetstreamManager } from "@nats-io/jetstream";
import { type NatsConnection } from "@nats-io/transport-node";

const endoderInstance = new TextEncoder();
const encode: (string) => Uint8Array = endoderInstance.encode.bind(endoderInstance);

const decoderInstance = new TextDecoder();
const decode: (Uint8Array) => string = decoderInstance.decode.bind(decoderInstance);

const jsUserCreds = readFileSync('./jetstream-user.creds', { encoding: 'utf-8' })

const nc: NatsConnection = await connect({ servers: "localhost:4222", authenticator: credsAuthenticator(encode(jsUserCreds)) }) as NatsConnection;
console.log('jetstream user connected');
const jsm = await jetstreamManager(nc);
const streamInfo = await jsm.streams.list();
for await (const info of streamInfo) {
    console.log(info.config.name);
    await jsm.streams.delete(info.config.name);
}
const testStream = await jsm.streams.add({ name: 'test-stream-5', storage: 'file', num_replicas: 1, subjects: ['nasdaq.>'] });
const client = jsm.jetstream();
console.log('client acquired')

const data = encode(JSON.stringify({ limitOrder: 7794, at: '4230.14', type: 'bid' }));
for (let i = 0; i < 2e1; i++) {
    await client.publish('nasdaq.klm.7794', data, { msgID: '4568' + i });
}


await nc.close()