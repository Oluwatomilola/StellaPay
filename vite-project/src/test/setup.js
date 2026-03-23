import { vi } from 'vitest';export { default as setupTests } from './setup.js';











global.fetch = vi.fn();// Mock fetch for API calls};  signTransaction: vi.fn(),  getPublicKey: vi.fn().mockResolvedValue('GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX'),  isConnected: vi.fn().mockResolvedValue(true),global.freighter = {// Mock Freighter API