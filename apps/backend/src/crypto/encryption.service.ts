import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_SALT = 'resume-builder-api-key-encryption';

@Injectable()
export class EncryptionService {
  constructor(private readonly configService: ConfigService) {}

  private getKey(): Buffer {
    const secret = this.configService.get<string>('encryption.key');
    if (!secret) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }
    return scryptSync(secret, KEY_SALT, 32);
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.getKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(blob: string): string {
    const [ivB64, authTagB64, ciphertextB64] = blob.split(':');
    if (!ivB64 || !authTagB64 || !ciphertextB64) {
      throw new Error('Invalid encrypted value format');
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      this.getKey(),
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
