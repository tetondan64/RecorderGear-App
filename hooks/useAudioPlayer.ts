import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioFile } from '@/types/audio';
import { useGlobalAudioManager } from '@/hooks/useGlobalAudioManager';
import logger from '@/utils/logger';

interface AudioPlayerState {
  currentFileId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export function useAudioPlayer(files: AudioFile[] = []) {
  const { stopAllAudio, setCurrentAudio } = useGlobalAudioManager();
  
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentFileId: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const pendingBlobUrlRef = useRef<string | null>(null);
  const shouldPlayAfterLoadRef = useRef<boolean>(false);

  // Track blob URL changes for currently playing file
  useEffect(() => {
    if (playerState.currentFileId && audioRef.current) {
      const currentFile = files.find(f => f.id === playerState.currentFileId);
      if (currentFile && currentFile.uri !== audioRef.current.src) {
        // Blob URL has changed, update the audio source
        logger.log('🔄 Updating audio source for file:', currentFile.name);
        loadAudioFile(currentFile);
      }
    }
  }, [files, playerState.currentFileId]);

  // Initialize single audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.addEventListener('ended', () => {
        setPlayerState(prev => ({
          ...prev,
          isPlaying: false,
          currentTime: 0,
        }));
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });

      audioRef.current.addEventListener('loadedmetadata', () => {
        setPlayerState(prev => ({
          ...prev,
          duration: audioRef.current?.duration || 0,
        }));
        
        // Check if we should start playing after load
        if (shouldPlayAfterLoadRef.current && audioRef.current) {
          audioRef.current.play().then(() => {
            startTimeTracking();
            setPlayerState(prev => ({ ...prev, isPlaying: true }));
          }).catch(error => {
            logger.error('Audio playback error:', error);
          });
          shouldPlayAfterLoadRef.current = false;
        }
        
        // Now it's safe to revoke the previous blob URL
        if (pendingBlobUrlRef.current) {
          URL.revokeObjectURL(pendingBlobUrlRef.current);
          pendingBlobUrlRef.current = null;
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      if (pendingBlobUrlRef.current) {
        URL.revokeObjectURL(pendingBlobUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', () => {});
        audioRef.current.removeEventListener('loadedmetadata', () => {});
      }
    };
  }, []);

  const loadAudioFile = useCallback((audioFile: AudioFile) => {
    if (!audioRef.current) return;

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
    
    // Load the new audio
    audioRef.current.load();
  }, []);

  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setPlayerState(prev => ({
          ...prev,
          currentTime: audioRef.current?.currentTime || 0,
        }));
      }
    }, 100);
  }, []);

  const stopTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playPause = useCallback(async (fileId: string, audioFile?: AudioFile) => {
    // Stop all other audio first to prevent conflicts
    stopAllAudio();
    
    // Find the file from the files array if not provided
    const targetFile = audioFile || files.find(f => f.id === fileId);
    if (!targetFile) {
      logger.error('File not found for playback:', fileId);
      return;
    }

    try {
      // If different file, stop current and switch
      if (playerState.currentFileId !== fileId) {
        stopTimeTracking();
        shouldPlayAfterLoadRef.current = true; // Flag to play after load
        loadAudioFile(targetFile);
        setPlayerState(prev => ({
          ...prev,
          currentFileId: fileId,
          isPlaying: false,
          currentTime: 0,
        }));
        return; // Exit early, playback will start after load
      }

      // Toggle playback
      if (audioRef.current) {
        if (playerState.isPlaying && playerState.currentFileId === fileId) {
          audioRef.current.pause();
          stopTimeTracking();
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
        } else {
          shouldPlayAfterLoadRef.current = false; // Clear flag for same file
          await audioRef.current.play();
          startTimeTracking();
          setPlayerState(prev => ({ 
            ...prev, 
            isPlaying: true,
            currentFileId: fileId,
          }));
        }
      }
    } catch (error) {
      logger.error('Audio playback error:', error);
      shouldPlayAfterLoadRef.current = false; // Clear flag on error
    }
  }, [stopAllAudio, files, playerState.currentFileId, playerState.isPlaying, stopTimeTracking, loadAudioFile, startTimeTracking, setCurrentAudio]);

  const seekTo = useCallback((fileId: string, time: number) => {
    if (audioRef.current && playerState.currentFileId === fileId) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({
        ...prev,
        currentTime: time,
      }));
    }
  }, [playerState.currentFileId]);

  const getCurrentTime = useCallback((fileId: string): number => {
    if (playerState.currentFileId === fileId) {
      return playerState.currentTime;
    }
    return 0;
  }, [playerState.currentFileId, playerState.currentTime]);

  const isPlaying = useCallback((fileId: string): boolean => {
    return playerState.currentFileId === fileId && playerState.isPlaying;
  }, [playerState.currentFileId, playerState.isPlaying]);

  return {
    playPause,
    seekTo,
    getCurrentTime,
    isPlaying,
    currentFileId: playerState.currentFileId,
    stopPlaybackIfPlaying: useCallback((fileId: string) => {
      if (playerState.currentFileId === fileId && playerState.isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        stopTimeTracking();
        setPlayerState(prev => ({
          ...prev,
          isPlaying: false,
          currentTime: 0,
          currentFileId: null,
        }));
        logger.log('🛑 Stopped playback for deleted file:', fileId);
      }
    }, [playerState.currentFileId, playerState.isPlaying, stopTimeTracking]),
  };
}