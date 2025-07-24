import {createLibp2p, type Libp2p} from 'libp2p'
import {webSockets} from '@libp2p/websockets'
import {identify} from '@libp2p/identify'
import {webRTC} from '@libp2p/webrtc'
import {circuitRelayTransport} from '@libp2p/circuit-relay-v2'
import {WebRTC} from '@multiformats/multiaddr-matcher'
import {type Multiaddr, multiaddr} from '@multiformats/multiaddr'
import {noise} from '@chainsafe/libp2p-noise'
import {yamux} from '@chainsafe/libp2p-yamux'
import type {Libp2pOptions} from 'libp2p'
import {type LengthPrefixedStream, lpStream} from 'it-length-prefixed-stream'
import { type FileInfo, getFileInfo } from "./file.ts";

const PROTOCOL = 'p2p-file-transfer/1.0.0'

function getBaseOptions(): Libp2pOptions {
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

function createSender() {
  return createLibp2p({
    addresses: {
      listen: ['/p2p-circuit', '/webrtc'],
    },
    ...getBaseOptions(),
  })
}

function createReceiver() {
  return createLibp2p(getBaseOptions())
}

function getRTCMultiAddrFromNode(node: Libp2p): Multiaddr | null {
  return node.getMultiaddrs().find(ma => WebRTC.matches(ma)) || null
}

async function sendFileInfo(lp: LengthPrefixedStream, fileInfo: FileInfo): Promise<void> {
  await lp.write(new TextEncoder().encode(JSON.stringify(fileInfo)))
}

async function sendFileData(lp: LengthPrefixedStream, file: File): Promise<void> {
  const fileStream = file.stream()
  const reader = fileStream.getReader()

  while (true) {
    const {done, value} = await reader.read()
    if (done) break
    await lp.write(value)
  }
}

async function readFileInfo(lp: LengthPrefixedStream): Promise<FileInfo> {
  const req = await lp.read()
  return JSON.parse(new TextDecoder().decode(req.subarray()))
}

async function readFileData(lp: LengthPrefixedStream, fileInfo: FileInfo): Promise<File> {
  const chunks: Uint8Array[] = []
  let received = 0

  while (received < fileInfo.size) {
    const chunk = await lp.read()
    if (!chunk) break
    chunks.push(chunk.subarray())
    received += chunk.length
  }

  const fileData = new Blob(chunks, {type: fileInfo.type})
  return new File([fileData], fileInfo.name, {type: fileInfo.type})
}

export async function sendFile(file: File): Promise<string> {
  const node = await createSender()
  await node.dial(multiaddr('/ip4/172.16.0.138/tcp/57114/ws/p2p/12D3KooWHjbrzQMvmPYnLKHNx6htToNc3ZRy4Dtd4KWXTUrQNJBt'))

  let webRTCMultiaddr = null
  while ((webRTCMultiaddr = getRTCMultiAddrFromNode(node)) === null) {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for 1 second before checking again
  }

  node.addEventListener('connection:open', async event => {
    const stream = await event.detail.newStream([PROTOCOL])

    const lp = lpStream(stream)

    await sendFileInfo(lp, getFileInfo(file))
    await sendFileData(lp, file)
  })

  return webRTCMultiaddr.toString()
}

export async function receiveFile(multiAddr: Multiaddr, onFileReceived: (file: File) => void): Promise<void> {
  const node = await createReceiver()

  await node.handle(PROTOCOL, async event => {
    const lp = lpStream(event.stream)

    const fileInfo = await readFileInfo(lp)
    const file = await readFileData(lp, fileInfo)

    onFileReceived(file)
  })

  await node.dial(multiAddr)
}
