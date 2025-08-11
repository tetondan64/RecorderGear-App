import { GlobalAudioManager } from '@/hooks/useGlobalAudioManager.native';

describe('GlobalAudioManager native', () => {
  it('provides safe no-op behavior', () => {
    const manager = GlobalAudioManager.getInstance();
    manager.setCurrentAudio({}, 'file1');
    expect(manager.getCurrentFileId()).toBe('file1');
    manager.stopAll();
    expect(manager.getCurrentFileId()).toBeNull();
    expect(manager.isCurrentAudio('file1')).toBe(false);
  });
});
