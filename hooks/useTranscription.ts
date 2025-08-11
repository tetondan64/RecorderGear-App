import { useState } from 'react';
import { WhisperService } from '@/services/whisperService';
import { TranscriptService } from '@/services/transcriptService';
import logger from '@/utils/logger';

export interface AudioFile {
  id: string;
  name: string;
  uri: string;
  fileSize: number;
  mimeType?: string;
}

export function useTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const transcribeFile = async (file: AudioFile, apiKey: string) => {
    logger.log('🎯 useTranscription.transcribeFile called with:', file.id, file.name);
    
    setIsTranscribing(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      setProgress(10);
      
      logger.log('📡 Calling WhisperService.safeTranscribe...');
      const result = await WhisperService.safeTranscribe(file, apiKey);
      
      setProgress(80);
      
      logger.log('💾 Storing transcript in TranscriptService...');
      const storedTranscript = await TranscriptService.createTranscriptFromWhisper(
        file.id,
        result.segments || [],
        result.text,
        result.language || 'en',
        result.duration || 0
      );
      
      setProgress(100);
      
      logger.log('✅ Transcription completed successfully:', {
        storedId: storedTranscript.id,
        textLength: storedTranscript.fullText.length,
        segmentCount: storedTranscript.segments.length
      });
      
      return result;
      
    } catch (error) {
      logger.error('❌ Transcription failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetTranscription = () => {
    setIsTranscribing(false);
    setProgress(0);
    setError(null);
  };

  return {
    isTranscribing,
    progress,
    error,
    transcribeFile,
    resetTranscription
  };
}