import {Peer, getBaseOptions, PROTOCOL, PeerState} from './Peer.ts'
import {createLibp2p} from 'libp2p'
import type {Multiaddr} from '@multiformats/multiaddr'
import {FileReceiveStream} from '../file/FileReceiveStream.ts'

export type FileReceiverStreamListener = (stream: FileReceiveStream) => void

export class ReceiverPeer extends Peer<FileReceiveStream> {
  private fileReceiveStreamListeners: FileReceiverStreamListener[] = []

  static async setupReceiver(multiAddr: Multiaddr): Promise<ReceiverPeer> {
    //todo: handle failure
    const node = await createLibp2p(getBaseOptions())
    await node.dial(multiAddr)

    const receiverPeer = new ReceiverPeer(node)
    receiverPeer.setState(PeerState.CONNECTED)

    await node.handle(PROTOCOL, async event => {
      if ([PeerState.CONNECTED, PeerState.AWAITING_APPROVAL].includes(receiverPeer.getState())) {
        const stream = new FileReceiveStream(event.stream)

        receiverPeer.addStream(stream)
        receiverPeer.onFileStreamReceived(stream)
      } else {
        await event.stream.close()
      }
    })

    return receiverPeer
  }

  addFileReceiveStreamListener(listener: FileReceiverStreamListener): void {
    this.fileReceiveStreamListeners.push(listener)
  }

  private onFileStreamReceived(stream: FileReceiveStream): void {
    for (const listener of this.fileReceiveStreamListeners) {
      listener(stream)
    }
  }
}
