import type {Libp2p} from 'libp2p'
import type {Libp2pOptions} from 'libp2p'
import {webSockets} from '@libp2p/websockets'
import {webRTC} from '@libp2p/webrtc'
import {circuitRelayTransport} from '@libp2p/circuit-relay-v2'
import {noise} from '@chainsafe/libp2p-noise'
import {yamux} from '@chainsafe/libp2p-yamux'
import {identify} from '@libp2p/identify'
import {type FileStream, FileStreamState} from '../file/FileStream.ts'
export const PROTOCOL = 'p2p-file-transfer/1.0.0'

export function getBaseOptions(): Libp2pOptions {
  return {
    transports: [webSockets(), webRTC(), circuitRelayTransport()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    connectionGater: {
      denyDialMultiaddr: () => false,
    },
    services: {
      identify: identify(),
    },
  }
}

export enum PeerState {
  AWAITING_CONNECTION,
  CONNECTED,
  AWAITING_APPROVAL,
  EXCHANGING,
  DONE,
}

export abstract class Peer<T extends FileStream> {
  protected node: Libp2p

  private streams: T[] = []
  private state: PeerState = PeerState.AWAITING_CONNECTION
  private stateChangeListeners: ((state: PeerState) => void)[] = []

  protected constructor(node: Libp2p) {
    this.node = node
  }

  protected addStream(stream: T): void {
    stream.addStateChangeListener(() => this.recalculateState())
    this.streams.push(stream)
  }

  protected recalculateState(): void {
    if (this.streams.length === 0) {
      this.setState(PeerState.CONNECTED)
    } else if (this.streams.every(s => s.getState() === FileStreamState.AWAITING_APPROVAL)) {
      this.setState(PeerState.AWAITING_APPROVAL)
    } else if (this.streams.some(s => s.getState() === FileStreamState.EXCHANGING)) {
      this.setState(PeerState.EXCHANGING)
    } else if (this.streams.every(s => s.getState() === FileStreamState.DONE)) {
      this.setState(PeerState.DONE)
    }
  }

  protected setState(state: PeerState): void {
    if (state !== this.state) {
      this.state = state

      for (const listener of this.stateChangeListeners) {
        listener(this.state)
      }
    }
  }

  addStateChangeListener(listener: (state: PeerState) => void): void {
    this.stateChangeListeners.push(listener)
  }

  getStreams(): T[] {
    return this.streams
  }

  getState(): PeerState {
    return this.state
  }

  async stop(): Promise<void> {
    await this.node.stop()
  }
}
