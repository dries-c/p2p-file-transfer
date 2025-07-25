import {getBaseOptions, Peer, PeerState, PROTOCOL} from './Peer.ts'
import {createLibp2p} from 'libp2p'
import type {Connection} from '@libp2p/interface'
import {FileSendStream} from '../file/FileSendStream.ts'
import type {Multiaddr} from '@multiformats/multiaddr'
import {WebRTC} from '@multiformats/multiaddr-matcher'

export class SenderPeer extends Peer<FileSendStream> {
  private connectionAddress: Multiaddr | undefined
  private peerConnection: Connection | undefined

  static async setupSender(addr: Multiaddr): Promise<SenderPeer | null> {
    const node = await createLibp2p({
      addresses: {
        listen: ['/p2p-circuit', '/webrtc'],
      },
      ...getBaseOptions(),
    })
    await node.dial(addr)

    const senderPeer = new SenderPeer(node)

    const connectionAddress = await senderPeer.waitForWebRTCMultiaddr()
    if (!connectionAddress) {
      return null
    }

    senderPeer.connectionAddress = connectionAddress

    node.addEventListener('connection:open', async event => {
      if (senderPeer.getState() === PeerState.AWAITING_CONNECTION && !event.detail.limits) {
        senderPeer.setState(PeerState.CONNECTED)
        senderPeer.peerConnection = event.detail
      }
    })
    return senderPeer
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

  async sendFile(file: File): Promise<FileSendStream> {
    const fileStream = new FileSendStream(await this.peerConnection!.newStream([PROTOCOL]), file)
    this.addStream(fileStream)

    return fileStream
  }

  getConnectionAddress(): Multiaddr {
    if (!this.connectionAddress) {
      throw new Error('Connection address is not set. Ensure the sender is properly initialized.')
    }

    return this.connectionAddress
  }
}
