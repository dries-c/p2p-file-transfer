import type {PrivateKey} from '@libp2p/interface'
import {generateKeyPair, privateKeyFromProtobuf, privateKeyToProtobuf} from '@libp2p/crypto/keys'

export async function getPrivateKey(): Promise<PrivateKey> {
  try {
    if (process.env.PRIVATE_KEY) {
      return base64decodePrivateKey(process.env.PRIVATE_KEY)
    }
  } catch (error) {
    console.error('Failed to decode private key from environment variable:', error)
  }

  const privateKey = await generateKeyPair('Ed25519')
  console.log('Generated new private key:', base64EncodePrivateKey(privateKey))
  console.log('You can set the PRIVATE_KEY environment variable to use a custom private key')
  return privateKey
}

function base64EncodePrivateKey(privateKey: PrivateKey): string {
  return Buffer.from(privateKeyToProtobuf(privateKey)).toString('base64')
}

function base64decodePrivateKey(base64: string): PrivateKey {
  return privateKeyFromProtobuf(Buffer.from(base64, 'base64'))
}
