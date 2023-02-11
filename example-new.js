import nostrTools from 'nostr-tools';
const { nip06 } = nostrTools;
import * as nipXX from './src/index.js';

/*
 * NEW NOSTR USER EXAMPLE
 */

// Generate BIP39 seed phrase.
const mnemonic = nip06.generateSeedWords();

const relays = ['wss://relay.damus.io', 'wss://relay.snort.social', 'wss://brb.io'];

const { didDocument, didDocumentMetadata } = nipXX.createFromSeedWords(mnemonic, relays)

console.log('DID Document:', JSON.stringify(didDocument, null, 2));
console.log('\nDID Document Metadata:', JSON.stringify(didDocumentMetadata, null, 2));