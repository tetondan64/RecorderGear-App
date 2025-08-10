import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  setStorage,
  list,
  create,
  update,
  remove,
} from '../data/summaryStylesStore.ts';
import type { StorageLike } from '../data/summaryStylesStore.ts';

class MemoryStorage implements StorageLike {
  private store: Record<string, string> = {};
  async getItem(key: string): Promise<string | null> {
    return this.store.hasOwnProperty(key) ? this.store[key] : null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.store[key] = value;
  }
  async removeItem(key: string): Promise<void> {
    delete this.store[key];
  }
}

beforeEach(() => {
  setStorage(new MemoryStorage());
});

test('create and list summary style', async () => {
  const created = await create({ title: 'Title', subtitle: 'Sub', prompt: 'Prompt' });
  const styles = await list();
  assert.equal(styles.length, 1);
  assert.equal(styles[0].id, created.id);
});

test('update summary style', async () => {
  const created = await create({ title: 'Title', subtitle: 'Sub', prompt: 'Prompt' });
  const updated = await update(created.id, { title: 'New Title' });
  assert.ok(updated);
  assert.equal(updated?.title, 'New Title');
  const styles = await list();
  assert.equal(styles[0].title, 'New Title');
});

test('remove summary style', async () => {
  const created = await create({ title: 'Title', subtitle: 'Sub', prompt: 'Prompt' });
  await remove(created.id);
  const styles = await list();
  assert.equal(styles.length, 0);
});
