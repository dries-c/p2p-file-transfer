import type {Libp2p} from 'libp2p'
import type {PeerId} from '@libp2p/interface'
import {RemotePeer} from './peer/RemotePeer.ts'
import {DEVICE_INFORMATION_PROTOCOL, getRelayPeerAddress, LOCAL_DISCOVERY_PROTOCOL} from './peer/Peer.ts'
import type {TransceiverPeer} from './peer/TransceiverPeer.ts'
import {lpStream} from '@libp2p/utils'

export class DeviceManager {
  private peers: Map<string, RemotePeer> = new Map()
  private localPeerIds: string[] = []
  private peerConnectListeners: ((peer: RemotePeer) => void)[] = []

  constructor(transceiver: TransceiverPeer, node: Libp2p) {
    node.handle(
      DEVICE_INFORMATION_PROTOCOL,
      async (stream, connection): Promise<void> => this.getPeer(connection.remotePeer)?.handleDeviceInformation(stream),
    )

    node.handle(LOCAL_DISCOVERY_PROTOCOL, async (stream, connection): Promise<void> => {
      if (transceiver.isRelayPeer(connection.remotePeer)) {
        const lp = lpStream(stream)
        const req = await lp.read()

        const peerId = new TextDecoder().decode(req.subarray())

        if (!this.localPeerIds.includes(peerId)) {
          this.localPeerIds.push(peerId)

          const connection = await node.dial(getRelayPeerAddress(peerId))
          await transceiver.sendDeviceInformation(connection)
        }
      }
    })

    node.addEventListener('connection:open', async event => {
      if (!event.detail.limits && !transceiver.isRelayPeer(event.detail.remotePeer)) {
        const peerId = event.detail.remotePeer.toString()
        const remotePeer = this.peers.get(peerId)

        if (remotePeer) {
          remotePeer.setConnection(event.detail)
        } else {
          const remotePeer = new RemotePeer(
            event.detail,
            this.localPeerIds.includes(event.detail.remotePeer.toString()),
          )
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

          this.localPeerIds.splice(this.localPeerIds.indexOf(peerId.toString()), 1)
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
