# nats-io-examples
These are standalone snippets of nats.io configurations

## Ultra-minimal config

```bash
subst.exe N: $(realpath.exe ./jetstream-n0/)
```

Now `N` is a drive on windows storing on `jetstream-no`

`/n/data` is for jetstream data
`/n/` is for config files

server config ultra-minimum config

```ini
server_name: n0

# The address and port clients must connect to
listen: 0.0.0.0:4222

# HTTP requests can be made to this port for monitoring purpose
monitor_port: 8222
```

Starting nats-server (single node)

```bash
nats-server.exe -c /n/config  # assume "n" is a mounted drive pointing to project folder "./jetstream-n0"
```

## Adding operator to the config

We choose to do this programically

```typescript
seed: SOAMNTJLDAIOH2S2N4NK6QWOHXIWBZFVKUOHCULUOC4YDG7WBTX5YXAV5Q
seed: SOAMNTJLDAIOH2S2N4NK6QWOHXIWBZFVKUOHCULUOC4YDG7WBTX5YXAV5Q
privateKey: PDDM2KYYCDR6UWTPDKXUFTR52FQOJNKVDRYVC5DQXGAZX5QM57OFYCOKHQB4RJR7UDYPNHXMHHXMLVQEPBNY24AJSWYVLGW3AQJOJLSVZZDA
privateKey: PDDM2KYYCDR6UWTPDKXUFTR52FQOJNKVDRYVC5DQXGAZX5QM57OFYCOKHQB4RJR7UDYPNHXMHHXMLVQEPBNY24AJSWYVLGW3AQJOJLSVZZDA
publicKey: OAE4UPADZCTD7IHQ62POYOPOYXLAI6C3RVYATFNRKWNNWBAS4SXFLC4Z
publicKey: OAE4UPADZCTD7IHQ62POYOPOYXLAI6C3RVYATFNRKWNNWBAS4SXFLC4Z
```

