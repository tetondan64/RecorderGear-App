import { useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Global audio manager to ensure only one audio plays at a time
export class GlobalAudioManager {
  private static instance: GlobalAudioManager;
  private currentAudio: any | null = null;
  private currentFileId: string | null = null;

  static getInstance(): GlobalAudioManager {
    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager();
    }
    return GlobalAudioManager.instance;
  }

  stopAll(): void {
    logger.log('🛑 GlobalAudioManager: Stopping all audio');

    // Stop our tracked audio
    if (this.currentAudio) {
      logger.log('  - Stopping tracked audio for file:', this.currentFileId);
      if (typeof this.currentAudio.pause === 'function') {
        this.currentAudio.pause();
      }
      if (typeof this.currentAudio.currentTime === 'number') {
        this.currentAudio.currentTime = 0;
      } else if (typeof this.currentAudio.setPositionAsync === 'function') {
        this.currentAudio.setPositionAsync(0);
      }
    }

    // Stop ALL audio elements on the page (web only)
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach((audio, index) => {
        if (!audio.paused) {
          logger.log(`  - Force stopping audio element ${index + 1}`);
          audio.pause();
          audio.currentTime = 0;
        }
      });
    }

    this.currentAudio = null;
    this.currentFileId = null;
  }

  setCurrentAudio(audio: any, fileId: string): void {
    logger.log('🎵 GlobalAudioManager: Setting current audio for file:', fileId);
    
    // Stop any existing audio first
    this.stopAll();
    
    this.currentAudio = audio;
    this.currentFileId = fileId;
  }

  getCurrentFileId(): string | null {
    return this.currentFileId;
  }

  isCurrentAudio(fileId: string): boolean {
    return this.currentFileId === fileId;
  }
}

export function useGlobalAudioManager() {
  const managerRef = useRef(GlobalAudioManager.getInstance());

  const stopAllAudio = useCallback(() => {
    managerRef.current.stopAll();
  }, []);

  const setCurrentAudio = useCallback((audio: any, fileId: string) => {
    managerRef.current.setCurrentAudio(audio, fileId);
  }, []);

  const getCurrentFileId = useCallback(() => {
    return managerRef.current.getCurrentFileId();
  }, []);

  const isCurrentAudio = useCallback((fileId: string) => {
    return managerRef.current.isCurrentAudio(fileId);
  }, []);

  return {
    stopAllAudio,
    setCurrentAudio,
    getCurrentFileId,
    isCurrentAudio,
  };
}