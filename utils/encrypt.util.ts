import type { Buffer } from "node:buffer";
import * as console from "node:console";
import { basename } from "node:path";
import {
  ready,
  to_base64,
  to_hex,
} from "libsodium-wrappers-sumo";
import { calcKeyFromPassword, decryptFile, encryptFile, generateNewSalt } from "./CryptoTool";

function isEqual(arr1: Uint8Array, arr2: Uint8Array): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  return arr1.every((value, index) => value === arr2[index]);
}

interface IEncryptModResult {
  crypt: {
    name: string;
    data: Uint8Array;
  };
  salt: {
    name: string;
    data: Uint8Array;
  };
  nonce: {
    name: string;
    data: Uint8Array;
  };
}
export async function encryptModZipFile(f: Buffer, password: string, filename: string): Promise<IEncryptModResult> {
  await ready;

  const salt = await generateNewSalt();
  console.log("salt", salt.length);
  console.log("salt_hex", to_hex(salt));
  console.log("salt_base64", to_base64(salt));
  const key = await calcKeyFromPassword(password, salt);
  console.log("key", key.length);
  console.log("key_hex", to_hex(key));
  console.log("key_base64", to_base64(key));
  const { nonce, ciphertext } = await encryptFile(f, key);

  console.log("nonce", nonce.length);
  console.log("nonce_hex", to_hex(nonce));
  console.log("nonce_base64", to_base64(nonce));
  console.log("ciphertext", ciphertext.length);

  const R: IEncryptModResult = {
    crypt: {
      name: `${basename(filename)}.crypt`,
      data: ciphertext,
    },
    salt: {
      name: `${basename(filename)}.salt`,
      data: salt,
    },
    nonce: {
      name: `${basename(filename)}.nonce`,
      data: nonce,
    },
  } as IEncryptModResult;

  const decrypted = await decryptFile(
    R.crypt.data,
    await calcKeyFromPassword(password, R.salt.data),
    R.nonce.data,
  );
  console.log("decrypted", decrypted.length);
  console.log(isEqual(decrypted, f));

  return R;
}
