import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Utility for cryptographic hashing operations
 */
@Injectable()
export class HashUtil {
  /**
   * Calculate SHA-256 hash of a buffer
   * @param buffer - File buffer
   * @returns SHA-256 hash in hexadecimal format
   */
  calculateSha256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Verify if a buffer matches a given SHA-256 hash
   * @param buffer - File buffer
   * @param expectedHash - Expected SHA-256 hash
   * @returns true if hash matches, false otherwise
   */
  verifySha256(buffer: Buffer, expectedHash: string): boolean {
    const calculatedHash = this.calculateSha256(buffer);
    return calculatedHash === expectedHash;
  }
}
