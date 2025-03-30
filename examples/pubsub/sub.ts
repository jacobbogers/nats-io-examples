import { connect, ConnectionError } from "@nats-io/transport-node";
import type { Subscription } from "@nats-io/transport-node";

// create a connection
try {
    const nc = await connect({ servers: "localhost:4223" });
    const sub = nc.subscribe("nyse.>", { max: 5 });
    await handler(sub);
    await nc.close()
}
catch (e) {
    if (e instanceof ConnectionError) {
        console.log('there was an error', e);
    }
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



