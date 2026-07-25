import CryptoJS from 'crypto-js';
import { WHATSAPP_PAYLOAD_ENCRYPTION_KEY } from '../helpers/AppConstants';

const KEY = WHATSAPP_PAYLOAD_ENCRYPTION_KEY;

export function encryptText(plaintext: string): string {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(
    plaintext,
    CryptoJS.enc.Hex.parse(KEY),
    {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );
  // Return iv + ciphertext in base64 or hex
  const ivHex = iv.toString(CryptoJS.enc.Hex);
  const ct = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  return ivHex + ':' + ct;
}

export function decryptText(cipher: string): string {
  const [ivHex, ctHex] = cipher.split(':');
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(ctHex)
  });
  const decrypted = CryptoJS.AES.decrypt(
    cipherParams,
    CryptoJS.enc.Hex.parse(KEY),
    {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );
  return decrypted.toString(CryptoJS.enc.Utf8);
}
