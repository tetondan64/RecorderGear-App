import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { AudioFile } from '@/types/audio';
import { AudioStorageService } from './audioStorage';
import logger from '@/utils/logger';

interface WhisperResponse {
  text: string;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
  language?: string;
  duration?: number;
}

interface TranscriptionResult {
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
  fullText: string;
  language: string;
  duration: number;
}

export class WhisperService {
  static async safeTranscribe(file: AudioFile, apiKey: string): Promise<TranscriptionResult> {
    logger.log('🔍 Starting transcription for:', file.name);
    
    // Validate file
    if (!file?.uri || !file?.name || !file?.fileSize) {
      throw new Error('Invalid file: Missing required properties');
    }

    // Convert file URI to File object for FormData
    let fileBlob: Blob;
    let fileName: string;
    try {
      if (Platform.OS === 'web' && file.base64Data) {
        // Use stored Base64 data directly on web platform
        fileBlob = AudioStorageService.base64ToBlob(file.base64Data, file.mimeType || 'audio/mpeg');
        fileName = file.name;
      } else {
        // Use fetch for blob URLs or native file URIs
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
        fileName = file.name;
      }
      logger.log('✅ File prepared:', fileName, fileBlob.size, 'bytes');
    } catch (error) {
      logger.error('❌ Failed to prepare file:', error);
      throw new Error('Failed to prepare file for upload');
    }

    // Prepare FormData for Whisper API
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0');
    // Note: Removed language and prompt to avoid interference

    logger.log('📡 Calling Whisper API...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('❌ Whisper API error:', response.status, errorText);
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const result: WhisperResponse = await response.json();
      logger.log('📥 Whisper response received:', {
        hasText: !!result?.text,
        textLength: result?.text?.length || 0,
        hasSegments: !!result?.segments,
        segmentCount: result?.segments?.length || 0,
        language: result?.language,
        duration: result?.duration
      });

      // Validate response
      if (!result?.text || typeof result.text !== 'string') {
        throw new Error('No transcript text received from Whisper API');
      }

      // Check for prompt injection
      if (result.text.includes('Include all spoken content') || 
          result.text.includes('Transcribe the complete audio')) {
        logger.error('❌ Prompt injection detected in response');
        throw new Error('Transcription failed - received prompt text instead of speech content');
      }

      // Process segments or create fallback
      let segments = [];
      if (result.segments && Array.isArray(result.segments) && result.segments.length > 0) {
        segments = result.segments.map((segment, index) => ({
          id: segment.id || index,
          start: segment.start || 0,
          end: segment.end || 0,
          text: segment.text?.trim() || '',
        }));
      } else {
        // Create single segment from full text
        const estimatedDuration = file.duration || result.duration || 60;
        segments = [{
          id: 0,
          start: 0,
          end: estimatedDuration,
          text: result.text.trim(),
        }];
      }

      const transcriptionResult: TranscriptionResult = {
        segments,
        fullText: result.text.trim(),
        language: result.language || 'en',
        duration: result.duration || file.duration || 0,
      };

      logger.log('✅ Transcription completed:', {
        segmentCount: transcriptionResult.segments.length,
        textLength: transcriptionResult.fullText.length,
        duration: transcriptionResult.duration
      });

      return transcriptionResult;

    } catch (error) {
      logger.error('❌ Transcription failed:', error);
      throw error;
    }
  }
}