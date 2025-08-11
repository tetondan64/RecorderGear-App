import { jest } from '@jest/globals';

let store: Record<string, string> = {};

export const StorageService = {
  getItem: jest.fn(async (key: string) => {
    return key in store ? store[key] : null;
  }),
  setItem: jest.fn(async (key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete store[key];
  }),
  __clear: () => {
    store = {};
  },
};
