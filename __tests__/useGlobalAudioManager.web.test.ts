import { GlobalAudioManager } from '@/hooks/useGlobalAudioManager.web';

describe('GlobalAudioManager web', () => {
  it('stops all audio elements and clears current file', () => {
    const manager = GlobalAudioManager.getInstance();

    const audio1 = document.createElement('audio');
    const audio2 = document.createElement('audio');
    Object.defineProperty(audio1, 'paused', { value: false, writable: true });
    Object.defineProperty(audio2, 'paused', { value: false, writable: true });
    audio1.pause = jest.fn(function () {
      (this as any).paused = true;
      (this as any).currentTime = 0;
    });
    audio2.pause = jest.fn(function () {
      (this as any).paused = true;
      (this as any).currentTime = 0;
    });
    document.body.append(audio1, audio2);

    manager.setCurrentAudio(audio1, 'one');
    (audio1.pause as jest.Mock).mockClear();
    (audio2.pause as jest.Mock).mockClear();
    Object.defineProperty(audio2, 'paused', { value: false, writable: true });

    manager.stopAll();

    expect(audio1.pause).toHaveBeenCalled();
    expect(audio2.pause).toHaveBeenCalled();
    expect(manager.getCurrentFileId()).toBeNull();

    document.body.removeChild(audio1);
    document.body.removeChild(audio2);
  });
});
