import { base64url } from 'multiformats/bases/base64';
import * as secp256k1 from '@noble/secp256k1';
import { mnemonicToSeedSync } from '@scure/bip39'
import { HDKey } from '@scure/bip32';
import nostrTools from 'nostr-tools';
const { getPublicKey, nip19 } = nostrTools;

export function privateKeyFromSeedWords(mnemonic, path, passphrase = null) {
  const root = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic, passphrase));
  const privateKey = root.derive(path).privateKey;
  if (!privateKey) throw new Error('could not derive private key');
  return secp256k1.utils.bytesToHex(privateKey);
}

function generateJwkPair(privateKeyHex) {
  const privateKeyBytes = secp256k1.utils.hexToBytes(privateKeyHex);
  const publicKeyBytes = getPublicKey(privateKeyBytes);

  const x = base64url.baseEncode(publicKeyBytes);
  const publicJwk = {
    alg : 'ES256K',
    kty : 'EC',
    crv : 'secp256k1',
    x,
  };

  const d = base64url.baseEncode(privateKeyBytes);
  const privateJwk = { ...publicJwk, d };

  return { publicJwk, privateJwk };
}

function generateDocument(did, didPrivateKeyHex, relays = null) {
  // Generate JWK (JSON Web Key) pair for DID key.
  const { publicJwk, didPrivateJwk } = generateJwkPair(didPrivateKeyHex);

  const didDocument = {
    'id': did,
    '@context': [
      'https://www.w3.org/ns/did/v1',
      {
        '@base': did,
      }
    ],
    'verificationMethod': [
      {
        'id': `${did}#npub-0`,
        'controller': did,
        'type': 'JsonWebKey2020',
        'publicKeyJwk': publicJwk
      }
    ],
    'authentication': [
      `${did}#npub-0`
    ],
    'keyAgreement': [
      `${did}#npub-0`
    ],
  }

  if (relays) {
    didDocument.service = [
      {
        'id'              : 'relay',
        'type'            : 'NostrRelay',
        'serviceEndpoint' : {
          'nodes': relays
        }
      }
    ];
  }

  return didDocument;
}

function generateDocumentMetadata(did, updatePrivateKeyHex) {
  const dateNow = new Date().toISOString().slice(0, -5) + 'Z';
  const documentMetadata = {
    canonicalId: did,
    created: dateNow,
    method: {
      published: false,
      updateCommitment: 'EiCBC1lW5vswlMzp80SaGmS-wUBgV445-JId5p0_zCZpsg', // TODO: Generate hash or use update pub key
      // recoveryCommitment: 'EiDgdspVioQZnpTFyEZRKy1uceha1LcPZlQ3uy6lEDw2Qw' // OPTIONAL
    },
  };
  return documentMetadata;
}

function generateIdentifier(privateKeyHex, npub = null) {
  // Generate did:nostr identifier.
  const id = npub ?? nip19.npubEncode(getPublicKey(privateKeyHex));
  return `did:nostr:${id}`;
}

export function createFromSeedWords(mnemonic, relays, npub = null) {
  // Derive private key for did:nostr identifier.
  let didPrivateKeyHex = privateKeyFromSeedWords(mnemonic, "m/44'/1237'/0'/0/0'");

  // Derive private key for did:nostr update operations.
  let updatePrivateKeyHex = privateKeyFromSeedWords(mnemonic, "m/44'/1237'/1'/0/0'");

  const did = generateIdentifier(didPrivateKeyHex, npub);

  const didDocument = generateDocument(did, didPrivateKeyHex, relays);
  const didDocumentMetadata = generateDocumentMetadata(did, updatePrivateKeyHex);

  return { didDocument, didDocumentMetadata };
}

export function resolve(did) {
  // TODO: Determine how to store and retrieve DID document and document metadata.
  let didDocument = {};

  // REFERENCES:
  // https://w3c-ccg.github.io/did-resolution/
  // https://identity.foundation/sidetree/spec/#update-3
  // TODO: Replace with retrieved metadata.
  const documentMetadata = {
    canonicalId: did,
    created: '2023-02-09T06:35:22Z',
		updated: '2023-02-10T13:40:06Z',
    method: {
      published: true,
      updateCommitment: 'EiCBC1lW5vswlMzp80SaGmS-wUBgV445-JId5p0_zCZpsg',
      recoveryCommitment: 'EiDgdspVioQZnpTFyEZRKy1uceha1LcPZlQ3uy6lEDw2Qw'
    },
  };

  const resolution = {
    '@context': 'https://w3id.org/did-resolution/v1',
    didDocument,
    didDocumentMetadata: documentMetadata
  };

  return resolution;
}