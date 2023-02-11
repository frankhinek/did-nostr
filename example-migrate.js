import nostrTools from 'nostr-tools';
const { generatePrivateKey, getPublicKey, nip06, nip19 } = nostrTools;
import * as nipXX from './src/index.js';

/*
 * EXISTING NOSTR USER EXAMPLE
 */

// Simulate an existing Nostr key pair.
let sk = generatePrivateKey()
let pk = getPublicKey(sk)
let npub = nip19.npubEncode(pk)

// Generate BIP39 seed phrase.
const mnemonic = nip06.generateSeedWords();

const relays = ['wss://relay.damus.io', 'wss://relay.snort.social', 'wss://brb.io'];

let { didDocument, didDocumentMetadata } = nipXX.createFromSeedWords(mnemonic, relays, npub)

console.log(JSON.stringify(didDocument, null, 2));
console.log(JSON.stringify(didDocumentMetadata, null, 2));