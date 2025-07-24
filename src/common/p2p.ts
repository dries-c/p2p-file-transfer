import { createLibp2p } from "libp2p";
import { webSockets } from '@libp2p/websockets'
import { identify } from "@libp2p/identify";
import { webRTC } from "@libp2p/webrtc";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { WebRTC } from "@multiformats/multiaddr-matcher";
import { multiaddr } from '@multiformats/multiaddr'
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";

function createNode() {
  return createLibp2p({
    addresses: {
      listen: [
        '/p2p-circuit',
        '/webrtc',
      ]
    },
    transports: [
      webSockets(),
      webRTC(),
      circuitRelayTransport(),
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    connectionGater: {
      denyDialMultiaddr: () => {
        // by default we refuse to dial local addresses from the browser since they
        // are usually sent by remote peers broadcasting undialable multiaddrs but
        // here we are explicitly connecting to a local node so do not deny dialing
        // any discovered address
        return false
      }
    },
    services: {
      identify: identify(),
    }
  })
}

export async function test() {
  const node = await createNode();
  await node.dial(multiaddr("/ip4/127.0.0.1/tcp/58173/ws/p2p/12D3KooWGMtZNfKCYnMWRXH7KKBRPirGAshQfU7BD51PfZ15duW2"));

  let webRTCMultiaddr = null;
  while (true) {
    webRTCMultiaddr = node.getMultiaddrs().find(ma => WebRTC.matches(ma))

    if (webRTCMultiaddr) {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
  }

  console.log(webRTCMultiaddr.toString());
}
