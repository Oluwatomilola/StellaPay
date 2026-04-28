import { describe, expect, it } from 'vitest';
import {
  formatHash,
  formatTokenAmount,
  getStellarExpertLink,
  isValidStellarAddress,
  parseTokenAmount,
} from '../utils/errors.js';

describe('error and formatting helpers', () => {
  it('validates a Stellar address', () => {
    expect(
      isValidStellarAddress('GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVXA')
    ).toBe(true);
    expect(isValidStellarAddress('INVALID')).toBe(false);
  });

  it('parses and formats token amounts', () => {
    expect(parseTokenAmount('12.34', 7)).toBe(123400000n);
    expect(formatTokenAmount('123400000', 7, 2)).toBe('12.34');
  });

  it('formats transaction hashes', () => {
    expect(formatHash('1234567890abcdef')).toBe('123456...abcdef');
  });

  it('builds the correct explorer URL', () => {
    expect(getStellarExpertLink('abc123', 'testnet')).toBe(
      'https://testnet.stellar.expert/tx/abc123'
    );
  });
});
