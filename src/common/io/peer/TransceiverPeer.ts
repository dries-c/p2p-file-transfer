import {ErrorState, getBaseOptions, PeerState, RELAY_ADDRESS, RELAY_PEER_ID} from './Peer.ts'
import {createLibp2p, type Libp2p} from 'libp2p'
import type {Multiaddr} from '@multiformats/multiaddr'
import {WebRTC} from '@multiformats/multiaddr-matcher'
import {DeviceManager} from '../DeviceManager.ts'
import {ReceiverPeer} from './ReceiverPeer.ts'
import type {PeerId} from '@libp2p/interface'
import {peerIdFromString} from '@libp2p/peer-id'

export class TransceiverPeer extends ReceiverPeer {
  private readonly deviceManager: DeviceManager

  static async setupTransceiver(): Promise<TransceiverPeer | null> {
    const node = await createLibp2p({
      addresses: {
        listen: ['/p2p-circuit', '/webrtc'],
      },
      ...getBaseOptions(),
    })

    const transceiverPeer = new TransceiverPeer(node, peerIdFromString(RELAY_PEER_ID))

    transceiverPeer.dial(RELAY_ADDRESS)

    return transceiverPeer
  }

  constructor(
    node: Libp2p,
    private readonly relayPeerId: PeerId,
  ) {
    super(node)

    this.deviceManager = new DeviceManager(this, node)

    this.waitForWebRTCMultiaddr().then(peerAddress => {
      if (peerAddress) {
        this.setState(PeerState.CONNECTED)
      } else {
        this.setErrorState(ErrorState.NO_WEBRTC_MULTIADDR)
      }
    })
  }

  private async waitForWebRTCMultiaddr(timeoutMs = 10000, intervalMs = 500): Promise<Multiaddr | null> {
    const start = Date.now()

    let ma: Multiaddr | undefined
    while (Date.now() - start < timeoutMs) {
      ma = this.node.getMultiaddrs().find(ma => WebRTC.matches(ma))
      if (ma) return ma
      await new Promise(res => setTimeout(res, intervalMs))
    }

    return null
  }

  isRelayPeer(peerId: PeerId): boolean {
    return peerId.equals(this.relayPeerId)
  }

  getDeviceManager(): DeviceManager {
    return this.deviceManager
  }
}
