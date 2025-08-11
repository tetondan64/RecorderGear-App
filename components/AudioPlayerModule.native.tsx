import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';
import { AudioFile } from '@/types/audio';
import { AudioPlayerState } from '@/types/transcript';

interface AudioPlayerModuleProps {
  audioFile?: AudioFile;
  onPlayPause?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  onSpeedChange?: (speed: number) => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export interface AudioPlayerRef {
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  play: () => void;
  pause: () => void;
  getIsPlaying: () => boolean;
}

const AudioPlayerModule = forwardRef<AudioPlayerRef, AudioPlayerModuleProps>(({ audioFile }, ref) => {
  useImperativeHandle(ref, () => ({
    seekTo: () => {},
    getCurrentTime: () => 0,
    play: () => {},
    pause: () => {},
    getIsPlaying: () => false,
  }));

  return (
    <View>
      <Text>Audio playback not supported on native platform.</Text>
    </View>
  );
});

AudioPlayerModule.displayName = 'AudioPlayerModule';

export default AudioPlayerModule;
