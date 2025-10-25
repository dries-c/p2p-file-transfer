import type {CircuitRelayService} from '@libp2p/circuit-relay-v2'
import type {Libp2p} from 'libp2p'
import type {PeerId} from '@libp2p/interface'
import {CODE_IP4, CODE_IP6, CODE_IP6ZONE, Multiaddr} from '@multiformats/multiaddr'
import {lpStream} from '@libp2p/utils'

export const LOCAL_DISCOVERY_PROTOCOL = '/p2p-file-transfer/local-discovery/1.0.0'

export class LocalDiscovery {
  knownLocalPeers: Map<string, PeerId[]> = new Map()

  constructor(private readonly node: Libp2p<{relay: CircuitRelayService}>) {}

  private getIPFromMultiaddr(multiaddr: Multiaddr): string {
    const options = multiaddr.getComponents()

    let zone = ''

    for (const option of options) {
      if (option.code === CODE_IP6ZONE) {
        zone = `%${option.value ?? ''}`
      }

      if (option.code === CODE_IP4 || option.code === CODE_IP6) {
        return option.value + zone
      }
    }

    throw new Error('No IP address found in multiaddr')
  }

  private getKnownLocalPeers(peerId: PeerId) {
    return this.knownLocalPeers.get(peerId.toString()) ?? []
  }

  private isKnownLocalPeer(localPeer: PeerId, remotePeer: PeerId) {
    return this.getKnownLocalPeers(localPeer).some(p => p.equals(remotePeer))
  }

  private removeRetiredLocalPeers(peerId: PeerId, alivePeers: PeerId[]) {
    const knownPeers = this.getKnownLocalPeers(peerId)
    const updatedPeers = knownPeers.filter(p => alivePeers.some(ap => ap.equals(p)))

    if (updatedPeers.length === 0) {
      this.knownLocalPeers.delete(peerId.toString())
    } else {
      this.knownLocalPeers.set(peerId.toString(), updatedPeers)
    }
  }

  private removeRetiredPeers(alivePeers: PeerId[]) {
    const currentKnownPeers = Array.from(this.knownLocalPeers.keys())
    const retiredPeers = currentKnownPeers.filter(p => !alivePeers.some(ap => ap.toString() === p))

    for (const retiredPeer of retiredPeers) {
      this.knownLocalPeers.delete(retiredPeer)
    }
  }

  private addKnownLocalPeers(peerId: PeerId, peers: PeerId[]) {
    if (!this.knownLocalPeers.has(peerId.toString())) {
      this.knownLocalPeers.set(peerId.toString(), [])
    }

    this.knownLocalPeers.get(peerId.toString())!.push(...peers)
  }

  private getIpGroups(): Record<string, Array<PeerId>> {
    const ipGroups: Record<string, Array<PeerId>> = {}

    this.node.services.relay.reservations.forEach((value, key) => {
      const ip = this.getIPFromMultiaddr(value.addr)

      if (!ipGroups[ip]) {
        ipGroups[ip] = []
      }

      ipGroups[ip].push(key)
    })

    return ipGroups
  }

  async tick() {
    const ipGroups = this.getIpGroups()

    for (const peerIds of Object.values(ipGroups)) {
      if (peerIds.length > 1) {
        for (const peerId of peerIds) {
          const newPeerIds = peerIds.filter(p => !p.equals(peerId) && !this.isKnownLocalPeer(peerId, p))

          if (newPeerIds.length > 0) {
            const currentConnection = this.node.getConnections(peerId)[0] ?? null

            if (currentConnection && currentConnection.status === 'open') {
              for (const newPeerId of newPeerIds) {
                try {
                  const stream = await currentConnection.newStream([LOCAL_DISCOVERY_PROTOCOL])
                  await lpStream(stream).write(new TextEncoder().encode(newPeerId.toString()))
                  await stream.close()
                } catch (error) {
                  // Ignore errors, they might happen if the peer is not reachable
                }
              }

              this.addKnownLocalPeers(peerId, newPeerIds)
            }
          }

          this.removeRetiredLocalPeers(peerId, peerIds)
        }
      }
    }

    this.removeRetiredPeers(Array.from(this.node.services.relay.reservations.keys()))
  }
}
