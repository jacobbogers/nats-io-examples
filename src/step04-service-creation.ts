import { readFileSync } from 'node:fs';
import { AckPolicy, jetstreamManager, PubAck, DeliverPolicy } from "@nats-io/jetstream";
import { connect, credsAuthenticator, ConnectionOptions, NatsConnection, type QueuedIterator } from '@nats-io/transport-node';
import { ConsumerApiAction } from 'nats/lib/jetstream/jsapi_types';

import {
    Service,
    ServiceError,
    ServiceErrorCodeHeader,
    ServiceErrorHeader,
    Svcm,
    type ServiceMsg, type ServiceStats
} from '@nats-io/services';


const endoderInstance = new TextEncoder();
const encode: (string) => Uint8Array = endoderInstance.encode.bind(endoderInstance);

const jsUserCreds = readFileSync('./jetstream-user.creds', { encoding: 'utf-8' })

const authenticator = credsAuthenticator(encode(jsUserCreds));
const options: ConnectionOptions = {
    servers: "localhost:4222",
    authenticator,
    timeout: 1e9,
};

const nc = await connect(options);
console.log('jetstream user connected');

const svc = new Svcm(nc);

// validate input for add
async function validateAndParseAddRequest(r: ServiceMsg): Promise<number[]> {
    try {
        // decode JSON
        const a = r.json<number[]>();
        // if not an array, this is bad input
        if (!Array.isArray(a)) {
            throw new ServiceError(400, "input must be an array");
        }
        // if we don't have at least one number, this is bad input
        if (a.length < 1) {
            throw new ServiceError(400, "input must have more than one element");

        }
        // if we find an entry in the array that is not a number, we have bad input
        const bad = a.find((e) => {
            return typeof e !== "number";
        });
        if (bad) {
            throw new ServiceError(400, "input contains invalid types");
        }
        // otherwise we are good
        return a;
    } catch (err) {
        // this is JSON.parse() - failing to parse JSON
        throw new ServiceError(400, (err as Error).message);
    }
}

async function endPointAddHandler(endPointName: string, service: Service, endpoint: QueuedIterator<ServiceMsg>) {
    for await (const r of endpoint) {
        try {
            const requestObj = await validateAndParseAddRequest(r);
            const answer = requestObj.reduce((sum, v) => sum + v, 0);
            r.respond(JSON.stringify(answer));
        } catch (err: any) {
            const info = service.info();
            console.log(`${info.name}/${info.version}.${endPointName} got a bad request: ${err.message}`);
            r.respondError(
                (err as ServiceError).code || 400,
                err.message,
                JSON.stringify(0),
            );
        }
    }
}

// The service name is "calculator", which describes the entire service

async function startService() {
    // 
    let addCount = 0;
    const statsHandler = (): Promise<unknown> => {
        return Promise.resolve({ add_calls: addCount });
    };

    const service = await svc.add({
        name: "calculator",  // Service name
        version: "1.0.0",
        description: "A service for basic arithmetic operations",
        statsHandler,
        queue: 'some-group'
    });

    const add = service.addEndpoint("add", { subject: 'math.add' });

    // activate some logic when the service stops
    service.stopped.then((err: Error | null) => {
        console.log(`service stopped ${err ? "because: " + err.message : ""}`);
    });

    // run forever
    endPointAddHandler('add', service, add);
}

startService();


