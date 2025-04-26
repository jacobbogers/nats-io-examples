import { readFileSync } from 'node:fs';


import { jetstreamManager, JsMsg } from "@nats-io/jetstream";
import { connect, credsAuthenticator, ConnectionOptions } from '@nats-io/transport-node';

import { Kvm, KvEntry } from '@nats-io/kv';

const endoderInstance = new TextEncoder();
const encode: (string) => Uint8Array = endoderInstance.encode.bind(endoderInstance);

const decoderInstance = new TextDecoder();
const decode: (Uint8Array) => string = decoderInstance.decode.bind(decoderInstance);

const jsUserCreds = readFileSync('./jetstream-user.creds', { encoding: 'utf-8' })
const connectOptions: ConnectionOptions = {
    servers: "localhost:4222",
    authenticator: credsAuthenticator(encode(jsUserCreds))
}
const nc = await connect(connectOptions);
console.log('user connected');

nc.closed().then(() => console.log('connection closed'));

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
console.log('stream added', testStream.config);
const client = jsm.jetstream();
console.log('client acquired');

await client.publish('$KV.order-book.nasdaq.klm.7794', encode('first message'), { msgID: '14568' })


const kvm = new Kvm(client);
const kv = await kvm.create('order-book', { streamName: 'KV_order-book' });
console.log('orderbook kv created');

const num1 = await kv.put('nasdaq.klm.7794', 'hello');
console.log('kv post:', num1);

let received = (await kv.get('nasdaq.klm.7794'))!
console.log('kv get 7794', received.string(), received.operation, received.revision);

console.log('pubstream', await client.publish('$KV.order-book.nasdaq.klm.7794', encode('hello 3')));

console.log('pubstream', await client.publish('$KV.order-book.nasdaq.klm.7794', encode('hello 6')));

received = (await kv.get('nasdaq.klm.7794'))!
console.log('kv get 7794', received.string(), received.operation, received.revision);
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

const history = await kv.history();
for await (const hist of history) {
    console.log('history', decode(hist.value), hist.key);
}

// console.log('all keys printed');
console.log('set up consumer');

const ci = await jsm.consumers.add('KV_order-book', {
    // adding this wont work name: 'name-of-consumer:' + Math.trunc(Math.random() * 1E6),
    inactive_threshold: 2 * 60 * 1E9,
    durable_name: 'durable',
    // idle_heartbeat: 1000 * 1E9, (only for pushed based consumer)
    // ack_policy: AckPolicy.None,

    opt_start_seq: 1,
    deliver_policy: "by_start_sequence"
});
const c = await client.consumers.get('KV_order-book', ci.name);

console.log('consumer created', await c.info(true));
console.log('is pull consumer', c.isPullConsumer());
console.log('is push consumer', c.isPushConsumer());

while (true) {
    const messages = await c.consume();
    console.log('messages recieved');
    const iter: AsyncIterator<JsMsg, JsMsg, JsMsg> = messages[Symbol.asyncIterator]();
    console.log('pending', await messages.getPending());
    const msg1 = await iter.next();
    console.log('msg1', msg1.value.string());
    msg1.value.ack();
    console.log('pending', await messages.getPending());
    const msg2 = await iter.next();
    console.log('msg2', msg2.value.string());
    console.log('pending', await messages.getPending());
    /**
     * ask yourself again can pull messages be "acked?" the initiative is from the consumer
     * ack makes sense if it is push (otherwise redelivery) or move the pull cursor forward
     */
    // messages.stop();
    // messages.closed()

    console.log('close messages');
    await nc.drain();
    console.log('pending 2', await messages.getPending());
    // messages.stop();
    while ((await iter.next()).done !== true) {

    }

    console.log('pending 3', await messages.getPending());

    // 
    break;
    try {
        for await (const m of messages) {
            console.log(m.subject);
            console.log(decode(m.data));
            //console.log(m.info);
            console.log(m.seq);
            console.log(m.sid);
            m.ackAck();
        }
        break;
    } catch (err) {
        console.log(`consume failed: ${err.message}`);
    }

}

console.log('message consumption done');

