import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import { AudioPlayerState } from '@/types/transcript';
import { AudioFile } from '@/types/audio';

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

const AudioPlayerModule = forwardRef<AudioPlayerRef, AudioPlayerModuleProps>(({
  audioFile,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSpeedChange,
  onSeek,
  onTimeUpdate,
}, ref) => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: audioFile?.duration || 0,
    playbackSpeed: 1.0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const playerStateRef = useRef(playerState);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const pendingBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  // Initialize audio element when audioFile changes
  useEffect(() => {
    if (audioFile?.uri) {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio();
        
        // Add loadedmetadata listener to handle blob URL cleanup
        audioRef.current.addEventListener('loadedmetadata', () => {
          // Now it's safe to revoke the previous blob URL
          if (pendingBlobUrlRef.current) {
            URL.revokeObjectURL(pendingBlobUrlRef.current);
            pendingBlobUrlRef.current = null;
          }
        });
      }
      
      // Store previous blob URL for later revocation (after new audio loads)
      if (currentBlobUrlRef.current) {
        pendingBlobUrlRef.current = currentBlobUrlRef.current;
      }
      
      // Set new source
      audioRef.current.src = audioFile.uri;
      
      // Track new blob URL
      if (audioFile.uri.startsWith('blob:')) {
        currentBlobUrlRef.current = audioFile.uri;
      } else {
        currentBlobUrlRef.current = null;
      }
      
      audioRef.current.load();
    }
    
    // Cleanup function
    return () => {
      if (pendingBlobUrlRef.current) {
        URL.revokeObjectURL(pendingBlobUrlRef.current);
        pendingBlobUrlRef.current = null;
      }
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
        currentBlobUrlRef.current = null;
      }
    };
  }, [audioFile?.uri]);

  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setPlayerState(prev => ({ ...prev, currentTime: time }));
      }
      onSeek?.(time);
    },
    getCurrentTime: () => playerStateRef.current.currentTime,
    getIsPlaying: () => playerStateRef.current.isPlaying,
    play: () => {
      if (audioRef.current) {
        audioRef.current.play();
      }
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
      onPlayPause?.();
    },
    pause: () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      onPlayPause?.();
    },
  }), [onSeek, onPlayPause]);

  const handleTimeUpdate = (event: any) => {
    if (!isDragging) {
      const audio = event.target;
      const newCurrentTime = audio.currentTime;
      const newDuration = audio.duration || 0;
      
      setPlayerState(prev => ({
        ...prev,
        currentTime: newCurrentTime,
        duration: newDuration,
      }));
      
      onTimeUpdate?.(newCurrentTime);
    }
  };

  const handleLoadedMetadata = (event: any) => {
    const audio = event.target;
    setPlayerState(prev => ({
      ...prev,
      duration: audio.duration || 0,
    }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioFile?.uri) return;

    if (playerState.isPlaying) {
      audioRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    } else {
      audioRef.current.play();
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    }
    onPlayPause?.();
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playerState.playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
    
    setPlayerState(prev => ({ ...prev, playbackSpeed: nextSpeed }));
    onSpeedChange?.(nextSpeed);
  };

  const handleProgressPress = (event: any) => {
    if (!audioRef.current || !playerState.duration) return;
    
    const progressContainer = event.currentTarget;
    const rect = progressContainer.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progressWidth = rect.width;
    const clickPercentage = clickX / progressWidth;
    const newTime = clickPercentage * playerState.duration;
    
    audioRef.current.currentTime = newTime;
    setPlayerState(prev => ({ ...prev, currentTime: newTime }));
    onSeek?.(newTime);
  };

  const handleMouseDown = (event: any) => {
    setIsDragging(true);
    handleProgressPress(event);
  };

  const handleMouseMove = (event: any) => {
    if (isDragging) {
      handleProgressPress(event);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse up listener to handle mouse up outside the progress bar
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      const handleGlobalMouseMove = (event: MouseEvent) => {
        if (isDragging && audioRef.current && playerState.duration) {
          const progressContainer = document.querySelector('[data-progress-container]');
          if (progressContainer) {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
            const progressWidth = rect.width;
            const clickPercentage = clickX / progressWidth;
            const newTime = clickPercentage * playerState.duration;
            
            audioRef.current.currentTime = newTime;
            setPlayerState(prev => ({ ...prev, currentTime: newTime }));
            onSeek?.(newTime);
          }
        }
      };
      
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
      
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [isDragging, playerState.duration, onSeek]);

  const progressPercentage = playerState.duration > 0 
    ? (playerState.currentTime / playerState.duration) * 100 
    : 0;

  return (
    <View style={styles.container}>
      {/* Hidden HTML audio element */}
      {audioFile?.uri && (
        <audio
          ref={audioRef}
          src={audioFile.uri}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          controls={false}
          autoPlay={false}
          style={{ display: 'none' }}
        />
      )}
      
      <BlurView intensity={40} style={styles.playerCard}>
        {/* Main Controls Row */}
        <View style={styles.controlsRow}>
          {/* Play Button */}
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={handlePlayPause}
            disabled={!audioFile?.uri}
          >
            <BlurView intensity={20} style={styles.playButtonBlur}>
              {playerState.isPlaying ? (
                <Pause size={20} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Play size={20} color="#FFFFFF" strokeWidth={2} />
              )}
            </BlurView>
          </TouchableOpacity>

          {/* File Info */}
          <View style={styles.fileInfoContainer}>
            {audioFile?.name && (
              <div style={{ 
                overflow: 'hidden', 
                width: '100%',
                whiteSpace: 'nowrap'
              }}>
                <Text style={[styles.fileName, {
                  animation: audioFile.name.length > 30 ? 'marquee 10s linear infinite' : 'none'
                }]}>
                  {audioFile.name}
                </Text>
              </div>
            )}
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(playerState.currentTime)}</Text>
              <Text style={styles.timeSeparator}>•</Text>
              <Text style={styles.timeText}>{formatTime(playerState.duration)}</Text>
            </View>
          </View>

          {/* Speed Control */}
          <TouchableOpacity 
            style={styles.speedButton} 
            onPress={handleSpeedChange}
            disabled={!audioFile?.uri}
          >
            <BlurView intensity={15} style={styles.speedButtonBlur}>
              <Text style={styles.speedText}>{playerState.playbackSpeed}×</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <div 
          style={styles.progressContainer} 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          data-progress-container
        >
          <View style={styles.progressTrack}>
            <View style={styles.progressBackground} />
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            <View style={[styles.progressThumb, { left: `${progressPercentage}%` }]} />
          </View>
        </div>
      </BlurView>
    </View>
  );
});

AudioPlayerModule.displayName = 'AudioPlayerModule';

export default AudioPlayerModule;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  playerCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 16,
  },
  playButtonBlur: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f4ad3d',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  fileInfoContainer: {
    flex: 1,
    marginRight: 16,
    overflow: 'hidden',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 16,
    color: '#f4ad3d',
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  timeSeparator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  speedButton: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 48,
  },
  speedButtonBlur: {
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  speedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4ad3d',
    letterSpacing: -0.1,
  },
  progressContainer: {
    height: 20,
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  progressTrack: {
    height: 4,
    position: 'relative',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#f4ad3d',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f4ad3d',
    marginLeft: -6,
    shadowColor: '#f4ad3d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});