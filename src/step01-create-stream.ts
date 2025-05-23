import { readFileSync } from 'node:fs';


import { jetstreamManager } from "@nats-io/jetstream";
import { connect, credsAuthenticator, ConnectionOptions } from '@nats-io/transport-node';

const endoderInstance = new TextEncoder();
const encode: (string) => Uint8Array = endoderInstance.encode.bind(endoderInstance);

const jsUserCreds = readFileSync('./jetstream-user.creds', { encoding: 'utf-8' })

const options: ConnectionOptions = {
    servers: "localhost:4222",
    authenticator: credsAuthenticator(encode(jsUserCreds)),
    name: 'step-01',
};

const nc = await connect(options);
console.log('jetstream user connected');

nc.closed().then(() => console.log('connection closed'));

const jsm = await jetstreamManager(nc);
const streamInfo = await jsm.streams.list();

const streamName = 'KV_order-book';

console.log('purging stream: %s', streamName);
const purgeResponse = await jsm.streams.purge(streamName, { filter: 'nasdaq.>', seq: 1e9 });
console.log('purge response: %o', purgeResponse);
console.log('deleting stream: %s', streamName);
const deleteResponse = await jsm.streams.delete(streamName);
console.log('deleteResponse response: %o', deleteResponse);

const testStream = await jsm.streams.add({
    name: streamName,
    description: 'jetstream order',
    storage: 'file',
    num_replicas: 1,
    metadata: {
        'reason': 'this is a test stream'
    },
    subjects: ['nasdaq.>', '$KV.order-book.>']
});

console.log('stream %s created, state:%o, info:%o', streamName, testStream.state, testStream.config);
for await (const info of streamInfo) {
    console.log('stream name: %s', info.config.name);
}

await nc.drain();