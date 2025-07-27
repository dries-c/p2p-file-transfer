import {noise} from '@chainsafe/libp2p-noise'
import {circuitRelayServer} from '@libp2p/circuit-relay-v2'
import {identify} from '@libp2p/identify'
import {webSockets} from '@libp2p/websockets'
import {createLibp2p} from 'libp2p'
import {yamux} from '@chainsafe/libp2p-yamux'
import * as fs from 'node:fs'
import type {PeerId, PrivateKey} from '@libp2p/interface'
import {privateKeyFromProtobuf, privateKeyToProtobuf} from '@libp2p/crypto/keys'
import {generateKeyPair} from '@libp2p/crypto/keys'
import type {Multiaddr} from '@multiformats/multiaddr'
import {lpStream} from 'it-length-prefixed-stream'

async function getRelay() {
  return createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/56492/ws'],
    },
    transports: [webSockets()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      relay: circuitRelayServer(),
    },
    privateKey: await getPrivateKeyFromDisk(),
  })
}

async function getPrivateKeyFromDisk(): Promise<PrivateKey> {
  try {
    return privateKeyFromProtobuf(await fs.promises.readFile('privateKey.pem'))
  } catch (_error) {
    const privateKey = await generateKeyPair('Ed25519')
    await writePrivateKeyToDisk(privateKey)
    return privateKey
  }
}

function writePrivateKeyToDisk(privateKey: PrivateKey) {
  return fs.promises.writeFile('privateKey.pem', privateKeyToProtobuf(privateKey))
}

function getIPFromMultiaddr(multiaddr: Multiaddr): string {
  return multiaddr.nodeAddress().address
}

function startRelay() {
  getRelay()
    .then(node => {
      console.log(`Node started with id ${node.peerId.toString()}`)
      console.log(
        'Relay started a t:',
        node
          .getMultiaddrs()
          .map(addr => addr.toString())
          .join(', '),
      )

      const knownLocalPeers: Map<string, PeerId[]> = new Map()

      function getKnownLocalPeers(peerId: PeerId) {
        return knownLocalPeers.get(peerId.toString()) ?? []
      }

      function isKnownLocalPeer(localPeer: PeerId, remotePeer: PeerId) {
        return getKnownLocalPeers(localPeer).some(p => p.equals(remotePeer))
      }

      function removeRetiredLocalPeers(peerId: PeerId, alivePeers: PeerId[]) {
        const knownPeers = getKnownLocalPeers(peerId)
        const updatedPeers = knownPeers.filter(p => alivePeers.some(ap => ap.equals(p)))

        if (updatedPeers.length === 0) {
          knownLocalPeers.delete(peerId.toString())
        } else {
          knownLocalPeers.set(peerId.toString(), updatedPeers)
        }
      }

      function removeRetiredPeers(alivePeers: PeerId[]) {
        const currentKnownPeers = Array.from(knownLocalPeers.keys())
        const retiredPeers = currentKnownPeers.filter(p => !alivePeers.some(ap => ap.toString() === p))

        for (const retiredPeer of retiredPeers) {
          knownLocalPeers.delete(retiredPeer)
        }
      }

      function addKnownLocalPeers(peerId: PeerId, peers: PeerId[]) {
        if (!knownLocalPeers.has(peerId.toString())) {
          knownLocalPeers.set(peerId.toString(), [])
        }

        knownLocalPeers.get(peerId.toString())!.push(...peers)
      }

      // every 1 second log the current reservations
      setInterval(() => {
        const ipGroups: Record<string, Array<PeerId>> = {}

        node.services.relay.reservations.forEach((value, key) => {
          const ip = getIPFromMultiaddr(value.addr)

          if (!ipGroups[ip]) {
            ipGroups[ip] = []
          }

          ipGroups[ip].push(key)
        })

        Object.entries(ipGroups).forEach(async ([_ip, peerIds]) => {
          if (peerIds.length > 1) {
            for (const peerId of peerIds) {
              const newPeerIds = peerIds.filter(p => !p.equals(peerId) && !isKnownLocalPeer(peerId, p))

              if (newPeerIds.length > 0) {
                const currentConnection = node.getConnections(peerId)[0] ?? null

                if (currentConnection) {
                  for (const newPeerId of newPeerIds) {
                    const stream = lpStream(
                      await currentConnection.newStream(['/p2p-file-transfer/local-discovery/1.0.0']),
                    )
                    await stream.write(new TextEncoder().encode(newPeerId.toString()))
                  }

                  addKnownLocalPeers(peerId, newPeerIds)
                }
              }

              removeRetiredLocalPeers(peerId, peerIds)
            }
          }
        })

        removeRetiredPeers(Array.from(node.services.relay.reservations.keys()))
      }, 1_000)
    })
    .catch(error => {
      console.error('Error starting relay:', error)
    })
}

startRelay()
