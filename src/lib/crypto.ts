/**
 * Client-Side Zero-Knowledge Encryption
 * Powered by native Web Crypto API (AES-256-GCM + PBKDF2)
 *
 * All user journal text payloads are encrypted locally in the browser
 * before ever being transmitted to Cloud Firestore. The server and database
 * only see encrypted ciphertext; the key is never sent to the network.
 */

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a user passphrase and salt via PBKDF2.
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Encrypts plain text using AES-256-GCM with a user-supplied passphrase.
 */
export async function encryptJournalText(plainText: string, passphrase: string): Promise<EncryptedPayload> {
  if (!passphrase || passphrase.trim() === '') {
    throw new Error('Encryption requires a non-empty passphrase.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const encodedText = enc.encode(plainText);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as ArrayBuffer,
    },
    key,
    encodedText
  );

  return {
    ciphertext: bufferToHex(encryptedBuffer),
    iv: bufferToHex(iv.buffer),
    salt: bufferToHex(salt.buffer),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext using the user-supplied passphrase.
 */
export async function decryptJournalText(
  ciphertextHex: string,
  ivHex: string,
  saltHex: string,
  passphrase: string
): Promise<string> {
  if (!passphrase) {
    throw new Error('Passphrase is required to unlock this entry.');
  }

  try {
    const salt = hexToBuffer(saltHex);
    const iv = hexToBuffer(ivHex);
    const ciphertext = hexToBuffer(ciphertextHex);

    const key = await deriveKey(passphrase, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as ArrayBuffer,
      },
      key,
      ciphertext as unknown as ArrayBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Incorrect passphrase or corrupted encrypted payload.');
  }
}
