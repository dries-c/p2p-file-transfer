import type {Libp2p} from 'libp2p'
import type {PeerId} from '@libp2p/interface'
import {RemotePeer} from './peer/RemotePeer.ts'
import {DEVICE_INFORMATION_PROTOCOL, getRelayPeerAddress, LOCAL_DISCOVERY_PROTOCOL} from './peer/Peer.ts'
import type {TransceiverPeer} from './peer/TransceiverPeer.ts'
import {lpStream} from 'it-length-prefixed-stream'

export class DeviceManager {
  private peers: Map<string, RemotePeer> = new Map()
  private peerConnectListeners: ((peer: RemotePeer) => void)[] = []

  constructor(transceiver: TransceiverPeer, node: Libp2p) {
    node.handle(DEVICE_INFORMATION_PROTOCOL, async event =>
      this.getPeer(event.connection.remotePeer)?.handleDeviceInformation(event),
    )

    node.handle(LOCAL_DISCOVERY_PROTOCOL, async event => {
      if (transceiver.isRelayPeer(event.connection.remotePeer)) {
        const lp = lpStream(event.stream)
        const req = await lp.read()

        const peerId = new TextDecoder().decode(req.subarray())

        const connection = await node.dial(getRelayPeerAddress(peerId))
        await transceiver.sendDeviceInformation(connection)
      }
    })

    node.addEventListener('connection:open', async event => {
      if (!event.detail.limits && !transceiver.isRelayPeer(event.detail.remotePeer)) {
        const peerId = event.detail.remotePeer.toString()
        const remotePeer = this.peers.get(peerId)

        if (remotePeer) {
          remotePeer.setConnection(event.detail)
        } else {
          const remotePeer = new RemotePeer(event.detail)
          this.peers.set(peerId, remotePeer)

          this.onPeerConnect(remotePeer)
        }
      }
    })

    node.addEventListener('connection:close', event => {
      const peerId = event.detail.remotePeer
      const peer = this.peers.get(peerId.toString())

      if (peer) {
        const connections = node.getConnections(peerId)

        if (connections.length === 0) {
          peer.onConnectionClose(event)
          this.peers.delete(peerId.toString())
        }
      }
    })
  }

  addPeerConnectListener(listener: (peer: RemotePeer) => void): void {
    this.peerConnectListeners.push(listener)
  }

  getPeer(peerId: PeerId): RemotePeer | undefined {
    return this.peers.get(peerId.toString())
  }

  private onPeerConnect(peer: RemotePeer): void {
    for (const listener of this.peerConnectListeners) {
      listener(peer)
    }
  }
}
