import { AudioFile } from '@/types/audio';

export function useAudioPlayer(_files: AudioFile[] = []) {
  const playPause = async (_fileId: string, _audioFile?: AudioFile) => {};
  const seekTo = (_fileId: string, _time: number) => {};
  const getCurrentTime = (_fileId: string) => 0;
  const isPlaying = (_fileId: string) => false;
  const stopPlaybackIfPlaying = (_fileId: string) => {};

  return {
    playPause,
    seekTo,
    getCurrentTime,
    isPlaying,
    stopPlaybackIfPlaying,
  };
}
