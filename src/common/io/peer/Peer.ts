import type {Libp2pOptions} from 'libp2p'
import {webSockets} from '@libp2p/websockets'
import {webRTC} from '@libp2p/webrtc'
import {circuitRelayTransport} from '@libp2p/circuit-relay-v2'
import {noise} from '@chainsafe/libp2p-noise'
import {yamux} from '@chainsafe/libp2p-yamux'
import {identify} from '@libp2p/identify'
import {type FileStream, FileStreamState} from '../file/FileStream.ts'
import {type Multiaddr, multiaddr} from '@multiformats/multiaddr'

export const FILE_TRANSFER_PROTOCOL = '/p2p-file-transfer/file-transfer/1.0.0'
export const LOCAL_DISCOVERY_PROTOCOL = '/p2p-file-transfer/local-discovery/1.0.0'
export const DEVICE_INFORMATION_PROTOCOL = '/p2p-file-transfer/device-information/1.0.0'
//export const RELAY_ADDRESS = multiaddr('/dnsaddr/relay.driesc.be') for some reason doesn't work
export const RELAY_ADDRESS = multiaddr(
  '/dns/relay.driesc.be/tcp/5000/wss/p2p/12D3KooWSibDjAgSue7PTiDbXSiTLMHzQWdUGWZK4vCtdZDggyNN',
)

export function getRelayPeerAddress(peerId: string): Multiaddr {
  return RELAY_ADDRESS.encapsulate(`/p2p-circuit/webrtc/p2p/${peerId}`)
}

export function getBaseOptions(): Libp2pOptions {
  return {
    transports: [
      webSockets(),
      webRTC({
        rtcConfiguration: {
          iceServers: [{urls: 'stun:stun.l.google.com:19302'}, {urls: 'stun:stun1.l.google.com:19302'}],
        },
      }),
      circuitRelayTransport(),
    ],
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

export enum ErrorState {
  UNKNOWN,
  RELAY_UNREACHABLE,
  PEER_UNREACHABLE,
  NO_WEBRTC_MULTIADDR,
}

export enum PeerState {
  ERROR,
  CONNECTING_TO_RELAY,
  CONNECTED,
  AWAITING_APPROVAL,
  EXCHANGING,
  REJECTED,
  DONE,
}

export abstract class Peer<T extends FileStream> {
  private streams: T[] = []

  private state: PeerState = PeerState.CONNECTING_TO_RELAY
  private errorState: ErrorState | null = null

  private stateChangeListeners: ((state: PeerState) => void)[] = []

  protected addStream(stream: T): void {
    this.streams.push(stream)
    stream.addStateChangeListener(() => this.recalculateState())
  }

  protected recalculateState(): void {
    if (this.streams.length === 0) {
      this.setState(PeerState.CONNECTED)
    } else if (this.streams.every(s => s.getState() === FileStreamState.AWAITING_APPROVAL)) {
      this.setState(PeerState.AWAITING_APPROVAL)
    } else if (this.streams.some(s => s.getState() === FileStreamState.EXCHANGING)) {
      this.setState(PeerState.EXCHANGING)
    } else if (this.streams.every(s => s.getState() === FileStreamState.REJECTED)) {
      this.setState(PeerState.REJECTED)
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

  protected setErrorState(errorState: ErrorState): void {
    this.errorState = errorState
    this.setState(PeerState.ERROR)
  }

  async reset(): Promise<void> {
    await Promise.all(this.streams.map(stream => stream.close()))

    this.streams = []
    this.setState(PeerState.CONNECTED)
  }

  addStateChangeListener(listener: (state: PeerState) => void): void {
    this.stateChangeListeners.push(listener)
  }

  removeStateChangeListener(listener: (state: PeerState) => void): void {
    const index = this.stateChangeListeners.indexOf(listener)

    if (index !== -1) {
      this.stateChangeListeners.splice(index, 1)
    }
  }

  getStreams(): T[] {
    return this.streams
  }

  getState(): PeerState {
    return this.state
  }

  getErrorState(): ErrorState | null {
    return this.errorState
  }
}
