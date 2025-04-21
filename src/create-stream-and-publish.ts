import { fromSeed, createUser, createAccount } from "@nats-io/nkeys";
import { encodeUser, encodeAccount, User } from "@nats-io/jwt";
import { writeFileSync, readFileSync } from 'node:fs';
import ms from 'ms';

import { AckPolicy, connect, ConnectionOptions, ConsumerMessages, credsAuthenticator, KvEntry, PubAck, StringCodec } from 'nats';
import { jetstreamManager, JsMsg } from "@nats-io/jetstream";
import { type NatsConnection } from "@nats-io/transport-node";
import { Kvm } from '@nats-io/kv';

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
    console.log('purging stream: %s', info.config.name);
    const purgeResponse = await jsm.streams.purge(info.config.name, { filter: 'nasdaq.>', seq: 1e9 });
    console.log('purge response: %o', purgeResponse);
    console.log('deleting stream: %s', info.config.name);
    const deleteResponse = await jsm.streams.delete(info.config.name);
    console.log('deleteResponse response: %o', deleteResponse);
}
const testStream = await jsm.streams.add({ name: 'KV_order-book', storage: 'file', num_replicas: 1, subjects: ['nasdaq.>', '$KV.order-book.>'] });
console.log('client acquired');
const client = jsm.jetstream();
console.log('client acquired');

await client.publish('nasdaq.klm.7794', encode('hello world'), { msgID: '14568' })

const kvm = new Kvm(client);
const kv = await kvm.create('order-book', { streamName: 'KV_order-book' });
console.log('orderbook kv created');

const num1 = await kv.put('nasdaq.klm.7794', 'hello');
console.log('kv post:', num1);

const received = await kv.get('nasdaq.klm.7794')
console.log('kv get', received?.string());

// const data = new Uint8Array(2048).map(() => Math.random() * 256 - 128);

// const t0 = new Date();
// console.log('benchmark start')
// const nrMessages = 1e2;
// const promises: PubAck[] = [];
// for (let i = 0; i < nrMessages; i++) {
//     promises.push(await client.publish('nasdaq.klm.7794', data, { msgID: '14568' + i }));
// }
// const allMsg = await Promise.all(promises);

// const dt = new Date().valueOf() - t0.valueOf();
// console.log(allMsg);
// console.log('timespan:', ms(dt));
// console.log('nr of messages written: %s', nrMessages);
// console.log('nr of bytes written total: %s kb', Math.round(data.byteLength * nrMessages / 1024))
// console.log('flux: %s bytesperSec', Math.round(nrMessages * (data.byteLength / dt) * 1000));
// console.log('bytes per message:%s bytes', data.byteLength)

// const kvStatus = await kv.status();
// console.log('kv status object', kvStatus);
// console.log('kv status bucket', kvStatus.bucket); // 'order-book'
// console.log('kv status sources', kvStatus.sources); // 
// console.log('kv status streamInfo', kvStatus.streamInfo) // subjects is like '$KV.order-book.>'


const entries = await kv.keys(['>'])

console.log('trying to find all keys')
for await (const entry of entries) {
    console.log('entry', entry);
}

// console.log('all keys printed');
console.log('set up consumer');

const ci = await jsm.consumers.add('KV_order-book', {
    // adding this wont work name: 'name-of-consumer:' + Math.trunc(Math.random() * 1E6),
    inactive_threshold: 2 * 60 * 1E9,
    durable_name: 'durable',
    // idle_heartbeat: 1000 * 1E9, (only for pushed based consumer)
    ack_policy: AckPolicy.Explicit,
});

console.log('ci', ci);

const c = await client.consumers.get('KV_order-book', ci.name);

console.log('consumer created', await c.info(false));
console.log('is pull consumer', c.isPullConsumer());
console.log('is push consumer', c.isPushConsumer());

while (true) {
    const messages = await c.consume();
    try {
        for await (const m of messages) {
            console.log(m.subject);
            console.log(decode(m.data));
            console.log(m.seq);
            console.log(m.sid);
            m.ack();
        }
    } catch (err) {
        console.log(`consume failed: ${err.message}`);
    }
}

console.log('message consumption done');

await nc.close()