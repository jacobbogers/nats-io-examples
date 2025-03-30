import { connect, ConnectionError } from "@nats-io/transport-node";
import { jetstream, AckPolicy, jetstreamManager } from "@nats-io/jetstream";
import type { Subscription } from "@nats-io/transport-node";

// create a connection
try {
    const streamName = 'ticker-tape';
    const consumerName = 'consumer-123';
    const nc = await connect({ servers: "localhost:4223" });
    /*
    const jsm = await jetstreamManager(nc);
    // you only need "js" below if  you want to publish
    // const js = jsm.jetstream();
    const consumer = await jsm.consumers.add(streamName, {
        name: consumerName,
        ack_policy: AckPolicy.Explicit,
    })
    */
    const js = jetstream(nc);
    const c = await js.consumers.get(streamName, consumerName);
    console.log('consumer info:', c.info());
    const oc = await js.consumers.get(streamName);
    console.log(await oc.info(true));
    await nc.close()
}
catch (e) {
    // if (e instanceof ConnectionError) {
    console.log('there was an error', e);
    // }
    process.exit(1);
}


async function handler(sub: Subscription) {

    for await (const m of sub) {
        const closed = sub.isClosed();
        const max = sub.getMax();
        const received = sub.getReceived();
        const processed = sub.getProcessed();
        const { subject, sid, data, reply, string: getString, headers } = m;
        console.log('message received:', {
            headers,
            max,
            closed,
            received,
            processed,
            subject,
            sid,
            data,
            reply,
            string: getString.call(m)
        });
    }
    console.log('exhausted')
}



