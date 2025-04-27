import { readFileSync } from 'node:fs';


import { AckPolicy, jetstreamManager, PubAck, DeliverPolicy } from "@nats-io/jetstream";
import { connect, credsAuthenticator, ConnectionOptions } from '@nats-io/transport-node';
import { ConsumerApiAction } from 'nats/lib/jetstream/jsapi_types';


const endoderInstance = new TextEncoder();
const encode: (string) => Uint8Array = endoderInstance.encode.bind(endoderInstance);

const jsUserCreds = readFileSync('./jetstream-user.creds', { encoding: 'utf-8' })
const authenticator = credsAuthenticator(encode(jsUserCreds));
const options: ConnectionOptions = {
    servers: "localhost:4222",
    authenticator,
    name: 'step-03',
    timeout: 1e9,
};

const nc = await connect(options);
console.log('jetstream user connected');

nc.closed().then(() => console.log('connection closed'));

const jsm = await jetstreamManager(nc, { timeout: 1e9 });
const streamName = 'KV_order-book';

// get the existing stream
const testStream = await jsm.streams.get(streamName);
const testStreamInfo = await testStream.info()
console.log('stream %s found, state:%o, info:%o', streamName, testStreamInfo.state, testStreamInfo.config);

console.log('messages in stream', testStreamInfo.state.messages);

// publish some messages to the stream
const jsClient = jsm.jetstream();

// list all consumers

console.log('list consumer');

const cis = await jsm.consumers.list(streamName);
console.log('list of consumers attached to %s', streamName);
const consumers = new Set();
for await (const ci of cis) {
    consumers.add(ci.name);
    console.log('consumer name="%s", floor(sequenceinfo)="%o"', ci.name, ci.ack_floor);
}
console.log('list of consumers printed');

async function deleteConsumer(name: string): Promise<boolean> {
    if (consumers.has(name)) {
        const response = await jsm.consumers.delete(streamName, name);
        console.log('consumer %s was deleted with response: %s', name, response);
        return response;
    }
    return false;
}

await deleteConsumer('durable-namex');
await deleteConsumer('durable-namey');
await deleteConsumer('durable-namez');
await deleteConsumer('-');

const ci = await jsm.consumers.add('KV_order-book', {
    name: 'durable-name',
    // inactive_threshold: nanos(24 * 3600 * 1E3), // 24 hours
    durable_name: 'durable-name',
    metadata: {
        name: 'Jacob',
        lastName: 'Bogers'
    },
    filter_subjects: ['$KV.order-book.nasdaq.>'],
    deliver_policy: DeliverPolicy.All,
    ack_policy: AckPolicy.Explicit,
    // opt_start_seq: 573,
    // deliver_policy: DeliverPolicy.StartSequence,
    max_ack_pending: 5,
    // ack_wait: -1,
}, ConsumerApiAction.CreateOrUpdate);

console.log('consumer created with:', ci);

const c = await jsClient.consumers.get('KV_order-book', ci.name);

console.log('isPullConsumer', c.isPullConsumer());
console.log('isPushConsumer', c.isPushConsumer());

const messages = await c.fetch({ max_messages: 1 });


for await (const message of messages) {
    console.log('message received:', JSON.parse(message.string()));
    console.log('message subject:', message.subject);
    console.log('message seqNr', message.seq);
    console.log('==========================');
    await message.ack();
}

await nc.drain();