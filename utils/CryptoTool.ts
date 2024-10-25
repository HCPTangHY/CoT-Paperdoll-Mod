import { Buffer } from "node:buffer";
import {
  crypto_aead_chacha20poly1305_decrypt,
  crypto_aead_chacha20poly1305_encrypt,
  crypto_aead_chacha20poly1305_KEYBYTES,
  crypto_aead_chacha20poly1305_keygen,
  crypto_aead_chacha20poly1305_NPUBBYTES,
  crypto_pwhash,
  crypto_pwhash_ALG_DEFAULT,
  crypto_pwhash_MEMLIMIT_INTERACTIVE,
  crypto_pwhash_OPSLIMIT_INTERACTIVE,
  crypto_pwhash_PASSWD_MAX,
  crypto_pwhash_PASSWD_MIN,
  crypto_pwhash_SALTBYTES,
  randombytes_buf,
  ready,
} from "libsodium-wrappers-sumo";

//  Buffer(nodejs) === Uint8Array(browser)

// :: encrypt ::
// generateNewSalt() -> salt
// user input password -> password
// calcKeyFromPassword(password, salt) -> key
// read file -> file
// encryptFile(file, key) -> {nonce, ciphertext}
// save {nonce, ciphertext, salt} to file

// :: decrypt ::
// read file -> {nonce, ciphertext, salt}
// user input password -> password
// calcKeyFromPassword(password, salt) -> key
// decryptFile(ciphertext, key, nonce) -> file
// save file

export async function generateNewSalt() {
  await ready;
  console.log("crypto_pwhash_SALTBYTES", crypto_pwhash_SALTBYTES);
  console.log("crypto_pwhash", crypto_pwhash);
  console.log("crypto_pwhash_PASSWD_MIN", crypto_pwhash_PASSWD_MIN);
  console.log("crypto_pwhash_PASSWD_MAX", crypto_pwhash_PASSWD_MAX);
  console.log("crypto_aead_chacha20poly1305_keygen", crypto_aead_chacha20poly1305_keygen);
  console.log("crypto_aead_chacha20poly1305_encrypt", crypto_aead_chacha20poly1305_encrypt);
  console.log("crypto_aead_chacha20poly1305_decrypt", crypto_aead_chacha20poly1305_decrypt);
  return randombytes_buf(crypto_pwhash_SALTBYTES, "uint8array");
}

export async function calcKeyFromPassword(password: string, salt: Uint8Array) {
  await ready;
  // if (!(crypto_pwhash_PASSWD_MIN <= password.length && password.length <= crypto_pwhash_PASSWD_MAX)) {
  //     return Promise.reject(new Error(`password length error, (${crypto_pwhash_PASSWD_MIN}~${crypto_pwhash_PASSWD_MAX})`));
  // }
  if (!(crypto_pwhash_SALTBYTES === salt.length)) {
    return Promise.reject(new Error("salt length error"));
  }
  return crypto_pwhash(
    crypto_aead_chacha20poly1305_KEYBYTES,
    Buffer.from(password),
    salt,
    crypto_pwhash_OPSLIMIT_INTERACTIVE,
    crypto_pwhash_MEMLIMIT_INTERACTIVE,
    crypto_pwhash_ALG_DEFAULT,
  );
}

export async function calcKeyFromPasswordBrowser(password: string, salt: Uint8Array) {
  await ready;
  // if (!(crypto_pwhash_PASSWD_MIN <= password.length && password.length <= crypto_pwhash_PASSWD_MAX)) {
  //     return Promise.reject(new Error(`password length error, (${crypto_pwhash_PASSWD_MIN}~${crypto_pwhash_PASSWD_MAX})`));
  // }
  if (!(crypto_pwhash_SALTBYTES === salt.length)) {
    return Promise.reject(new Error("salt length error"));
  }
  return crypto_pwhash(
    crypto_aead_chacha20poly1305_KEYBYTES,
    new TextEncoder().encode(password),
    salt,
    crypto_pwhash_OPSLIMIT_INTERACTIVE,
    crypto_pwhash_MEMLIMIT_INTERACTIVE,
    crypto_pwhash_ALG_DEFAULT,
  );
}

export async function encryptFile(data: Uint8Array, key: Uint8Array, _additionalData: Uint8Array | null = null) {
  await ready;
  if (!(crypto_aead_chacha20poly1305_KEYBYTES === key.length)) {
    return Promise.reject(new Error("key length error"));
  }
  const nonce = randombytes_buf(crypto_aead_chacha20poly1305_NPUBBYTES);
  const ciphertext = crypto_aead_chacha20poly1305_encrypt(data, null, null, nonce, key);
  return { nonce, ciphertext };
}

export async function decryptFile(data: Uint8Array, key: Uint8Array, nonce: Uint8Array, additionalData: Uint8Array | null = null) {
  await ready;
  if (!(crypto_aead_chacha20poly1305_NPUBBYTES === nonce.length)) {
    return Promise.reject(new Error("nonce length error"));
  }
  if (!(crypto_aead_chacha20poly1305_KEYBYTES === key.length)) {
    return Promise.reject(new Error("key length error"));
  }
  return crypto_aead_chacha20poly1305_decrypt(null, data, additionalData, nonce, key);
}
