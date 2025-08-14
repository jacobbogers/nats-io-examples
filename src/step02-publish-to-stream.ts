import { readFileSync } from 'node:fs';
import { encode } from './helpers';
import config from './config';

import { jetstreamManager, PubAck } from "@nats-io/jetstream";
import { connect, credsAuthenticator, ConnectionOptions, headers } from '@nats-io/transport-node';

const { node1, kvStreamName: streamName } = config;

const jsUserCreds = readFileSync('./jetstream-user.creds', { encoding: 'utf-8' })

const options: ConnectionOptions = {
    servers: node1,
    authenticator: credsAuthenticator(encode(jsUserCreds)),
    name: 'step-02'
};

const nc = await connect(options);
console.log('jetstream user connected', nc.info);

// set up a close handler, this promise is long lived
nc.closed().then(() => console.log('connection closed'));

const jsm = await jetstreamManager(nc);

// get the existing stream
const testStream = await jsm.streams.get(streamName);
const testStreamInfo = await testStream.info()
console.log('stream info: name=[%s], state:%o, config:%o', streamName, testStreamInfo.state, testStreamInfo.config);

const msgHeaders = headers();
msgHeaders.set('Nats-TTL', `${24 * 3600}`, 'canonical');



if (testStreamInfo.state.messages > 0) {
    console.log('there area messages in this stream %s will not add more', testStreamInfo.state.messages);
    process.exit(0);
}

// publish some messages to the stream
const jsClient = jsm.jetstream();
const nrMessages = 1E4; // 10k

const t0 = Date.now();

const ackPromises: Promise<PubAck>[] = [];
for (let i = 0; i < nrMessages; i++) {
    const id = Math.random();
    const promise = jsClient.publish('$KV.order-book.nasdaq.klm.7794', encode(JSON.stringify({ id })), { msgID: 'ref-' + id, headers: msgHeaders });
    ackPromises.push(promise);
}

await Promise.all(ackPromises);

console.log('headers', msgHeaders);

const dt = Math.round((Date.now() - t0) / 10) / 100;

console.log('duration %s sec', dt);

await nc.drain();