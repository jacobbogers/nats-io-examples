console.log('part1');
/*
import { Objm } from "@nats-io/obj";

// or in node (only when using CJS)
const { Objm } = require("@nats-io/obj");

// using a nats connection:
const objm = new Objm(nc);
await objm.list();
await objm.create("myobj");
*/
console.log('part2');
/*
import { jetStream } from "@nats-io/jetstream";
import { Objm } from "@nats-io/obj";

const js = jetstream(nc, { timeout: 10_000 });
// KV will inherit all the options from the JetStream client
const objm = new Objm(js);
*/
console.log('part3');

/*
// create the named ObjectStore or bind to it if it exists:
const objm = new Objm(nc);
const os = await objm.create("testing", { storage: StorageType.File });

// ReadableStreams allows JavaScript to work with large data without
// necessarily keeping it all in memory.
//
// ObjectStore reads and writes to JetStream via ReadableStreams
// https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
// You can easily create ReadableStreams from static data or iterators

// here's an example of creating a readable stream from static data
function readableStreamFrom(data: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      // the readable stream adds data
      controller.enqueue(data);
      controller.close();
    },
  });
}

// reading from a ReadableStream is similar to working with an async iterator:
async function fromReadableStream(
  rs: ReadableStream<Uint8Array>,
) {
  let i = 1;
  const reader = rs.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value && value.length) {
      // do something with the accumulated data
      console.log(`chunk ${i++}: ${sc.decode(value)}`);
    }
  }
}

let e = await os.get("hello");
console.log(`hello entry exists? ${e !== null}`);

// watch notifies when a change in the object store happens
const watch = await os.watch();
(async () => {
  for await (const i of watch) {
    // when asking for history you get a null
    // that tells you when all the existing values
    // are provided
    if (i === null) {
      continue;
    }
    console.log(`watch: ${i!.name} deleted?: ${i!.deleted}`);
  }
})();

// putting an object returns an info describing the object
const info = await os.put({
  name: "hello",
  description: "first entry",
  options: {
    max_chunk_size: 1,
  },
}, readableStreamFrom(sc.encode("hello world")));

console.log(
  `object size: ${info.size} number of chunks: ${info.size} deleted: ${info.deleted}`,
);

// reading it back:
const r = await os.get("hello");
// it is possible while we read the ReadableStream that something goes wrong
// the error property on the result will resolve to null if there's no error
// otherwise to the error from the ReadableStream
r?.error.then((err) => {
  if (err) {
    console.error("reading the readable stream failed:", err);
  }
});

// use our sample stream reader to process output to the console
// chunk 1: h
// chunk 2: e
// ...
// chunk 11: d
await fromReadableStream(r!.data);

// list all the entries in the object store
// returns the info for each entry
const list = await os.list();
list.forEach((i) => {
  console.log(`list: ${i.name}`);
});

// you can also get info on the object store as a whole:
const status = await os.status();
console.log(`bucket: '${status.bucket}' size in bytes: ${status.size}`);

// you can prevent additional modifications by sealing it
const final = await os.seal();
console.log(`bucket: '${final.bucket}' sealed: ${final.sealed}`);

// only other thing that you can do is destroy it
// this gets rid of the objectstore
const destroyed = await os.destroy();
console.log(`destroyed: ${destroyed}`);
*/