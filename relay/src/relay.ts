import {noise} from '@chainsafe/libp2p-noise'
import {circuitRelayServer} from '@libp2p/circuit-relay-v2'
import {identify} from '@libp2p/identify'
import {webSockets} from '@libp2p/websockets'
import {createLibp2p} from 'libp2p'
import {yamux} from '@chainsafe/libp2p-yamux'
import {LocalDiscovery} from './localDiscovery.js'
import {getPrivateKey} from './crypto.js'
import * as fs from 'node:fs'

async function startRelay() {
  const node = await createLibp2p({
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${process.env.PORT ?? 5000}/tls/ws`],
    },
    transports: [
      webSockets({
        https: {
          cert: await fs.promises.readFile(process.env.SSL_CERT_PATH ?? './ssl/cert.pem'),
          key: await fs.promises.readFile(process.env.SSL_KEY_PATH ?? './ssl/key.pem'),
        },
      }),
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      relay: circuitRelayServer(),
    },
    privateKey: await getPrivateKey(),
  })

  console.log(`Node started with id ${node.peerId.toString()}`)
  console.log(
    'Relay started at:\n',
    node
      .getMultiaddrs()
      .map(addr => addr.toString())
      .join(',\n'),
  )

  const localDiscovery = new LocalDiscovery(node)
  setInterval(async () => {
    await localDiscovery.tick()
  }, 1_000)
}

startRelay()
