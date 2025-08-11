import { useRef, useCallback } from 'react';

class GlobalAudioManager {
  private static instance: GlobalAudioManager;
  private currentFileId: string | null = null;

  static getInstance(): GlobalAudioManager {
    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager();
    }
    return GlobalAudioManager.instance;
  }

  stopAll(): void {
    this.currentFileId = null;
  }

  setCurrentAudio(_audio: any, fileId: string): void {
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

export { GlobalAudioManager };
