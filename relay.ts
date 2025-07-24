import { noise } from '@chainsafe/libp2p-noise'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { webSockets } from '@libp2p/websockets'
import { createLibp2p } from 'libp2p'
import { yamux } from "@chainsafe/libp2p-yamux";

function getRelay(){
  return createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0/ws']
    },
    transports: [
      webSockets()
    ],
    connectionEncrypters: [
      noise()
    ],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      relay: circuitRelayServer()
    }
  })
}

function startRelay(){
  getRelay().then((node) => {
    console.log(`Node started with id ${node.peerId.toString()}`)
    console.log("Relay started at:", node.getMultiaddrs().map(addr => addr.toString()).join(', '));

    node.addEventListener('peer:connect', (event) => {
      console.log(`Connected to peer: ${event.detail.toString()}`);
    });
  }).catch((error) => {
    console.error("Error starting relay:", error);
  });
}

startRelay();
