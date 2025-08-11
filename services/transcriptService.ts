import { Transcript, TranscriptSegment } from '@/types/transcript';
import { StorageService } from './storageService';
import logger from '@/utils/logger';

export class TranscriptService {
  private static readonly STORAGE_KEY = 'transcripts';

  // Debug utility to check storage state
  static async debugStorage(fileId: string): Promise<void> {
    try {
      const key = `transcript-${fileId}`;
      logger.log('🔍 Debug storage check for fileId:', fileId);
      logger.log('🔑 Debug key:', key);
      
      const value = await StorageService.getItem(key);
      logger.log('🔍 Debug retrieved value exists:', value !== null);
      logger.log('🔍 Debug retrieved value preview:', 
        value ? value.substring(0, 200) + '...' : 'null'
      );
      
      // Show all keys for comparison
      const allKeys = await StorageService.getAllKeys();
      logger.log('🔍 All storage keys:', allKeys);
      
      // Filter to transcript keys only
      const transcriptKeys = allKeys.filter(k => k.startsWith('transcript-'));
      logger.log('🔍 Transcript keys only:', transcriptKeys);
      
    } catch (error) {
      logger.error('❌ Debug storage failed:', error);
    }
  }

  static async storeTranscriptWithVerification(transcriptId: string, data: any): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 200;
    
    // 📦 Log what we're storing before save
    logger.log('📦 Storing transcript:');
    logger.log('📦 Transcript ID:', transcriptId);
    logger.log('📦 Data type:', typeof data);
    logger.log('📦 Data keys:', data && typeof data === 'object' ? Object.keys(data) : 'Not an object');
    
    if (data && typeof data === 'object') {
      logger.log('📦 Full text validation before store:');
      logger.log('  - Has fullText:', !!data.fullText);
      logger.log('  - FullText type:', typeof data.fullText);
      if (typeof data.fullText === 'string') {
        logger.log('  - FullText length:', data.fullText.length);
        logger.log('  - FullText preview:', data.fullText.substring(0, 100) + '...');
      }
      
      logger.log('📦 Segments validation before store:');
      logger.log('  - Has segments:', !!data.segments);
      logger.log('  - Segments is array:', Array.isArray(data.segments));
      if (Array.isArray(data.segments)) {
        logger.log('  - Segments count:', data.segments.length);
        if (data.segments.length > 0) {
          logger.log('  - First 2 segments preview:');
          data.segments.slice(0, 2).forEach((seg, index) => {
            logger.log(`    → Segment ${index}: ${seg?.text || 'No text'}`);
          });
        }
      }
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.log(`📥 Storage attempt ${attempt}/${maxRetries} for transcript:`, transcriptId);
        logger.log('📌 Exact storage key:', `transcript-${transcriptId}`);
        logger.log('💾 Data being stored (truncated):', {
          type: typeof data,
          keys: data && typeof data === 'object' ? Object.keys(data) : 'Not an object',
          textLength: data && data.fullText && typeof data.fullText === 'string' ? data.fullText.length : 'No valid fullText',
          segmentsCount: data && Array.isArray(data.segments) ? data.segments.length : 'No valid segments'
        });
        
        // Store the transcript
        await StorageService.setItem(`transcript-${transcriptId}`, JSON.stringify(data));
        logger.log(`✅ AsyncStorage.setItem completed for attempt ${attempt}`);
        
        // Small delay to ensure storage is committed
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify storage immediately
        logger.log(`🔍 Verifying storage for attempt ${attempt}...`);
        logger.log('📌 Verification key:', `transcript-${transcriptId}`);
        
        const storedValue = await StorageService.getItem(`transcript-${transcriptId}`);
        const exists = storedValue !== null;
        
        logger.log(`🔍 Verification result for attempt ${attempt}:`, {
          exists,
          storedValueType: typeof storedValue,
          storedValueLength: storedValue && typeof storedValue === 'string' ? storedValue.length : 'Not a string',
          storedValuePreview: storedValue && typeof storedValue === 'string' ? storedValue.substring(0, 100) + '...' : 'No valid stored value'
        });
        
        if (exists) {
          logger.log(`✅ Storage verification successful on attempt ${attempt}`);
          return true;
        } else {
          logger.warn(`⚠️ Storage verification failed on attempt ${attempt} - stored value is null`);
          
          if (attempt < maxRetries) {
            logger.log(`🔁 Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
        
      } catch (error) {
        logger.error(`❌ Storage attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          logger.log(`🔁 Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          logger.error(`❌ All ${maxRetries} storage attempts failed`);
          return false;
        }
      }
    }
    
    logger.error(`❌ Storage verification failed after ${maxRetries} attempts`);
    return false;
  }

  static async storeTranscript(transcriptId: string, data: any): Promise<boolean> {
    try {
      return await this.storeTranscriptWithVerification(transcriptId, data);
    } catch (error) {
      logger.error('❌ Failed to store transcript:', error);
      return false;
    }
  }

  static async getAllTranscripts(): Promise<Transcript[]> {
    try {
      const data = await StorageService.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Error loading transcripts:', error);
      return [];
    }
  }

  static async getTranscriptByFileId(fileId: string): Promise<Transcript | null> {
    logger.log('🔍 getTranscriptByFileId called with fileId:', fileId);
    logger.log('🔑 Will use storage key:', `transcript-${fileId}`);
    
    try {
      const storageKey = `transcript-${fileId}`;
      logger.log('🔍 Attempting to retrieve with key:', storageKey);
      
      const storedValue = await StorageService.getItem(storageKey);
      logger.log('🔍 Retrieved value exists:', storedValue !== null);
      
      if (!storedValue) {
        logger.log('❌ No stored value found for key:', storageKey);
        
        // Debug: show all keys for comparison
        const allKeys = await StorageService.getAllKeys();
        logger.log('🔍 All storage keys:', allKeys);
        
        const transcriptKeys = allKeys.filter(k => k.startsWith('transcript-'));
        logger.log('🔍 Transcript keys only:', transcriptKeys);
        
        return null;
      }
      
      // 📤 Log what we retrieved after successful fetch
      logger.log('📤 Retrieved transcript from storage:');
      logger.log('📤 Storage key used:', storageKey);
      logger.log('📤 Raw stored value length:', typeof storedValue === 'string' ? storedValue.length : 'Not a string');
      
      logger.log('✅ Found stored transcript, parsing...');
      const transcript = JSON.parse(storedValue);
      
      // 📤 Validate retrieved transcript structure
      logger.log('📤 Retrieved transcript validation:');
      logger.log('  - Has id:', !!transcript?.id);
      logger.log('  - Has fileId:', !!transcript?.fileId);
      logger.log('  - Has fullText:', !!transcript?.fullText);
      logger.log('  - FullText type:', typeof transcript?.fullText);
      if (typeof transcript?.fullText === 'string') {
        logger.log('  - FullText length:', transcript.fullText.length);
        logger.log('  - FullText preview:', transcript.fullText.substring(0, 100) + '...');
      }
      
      logger.log('  - Has segments:', !!transcript?.segments);
      logger.log('  - Segments is array:', Array.isArray(transcript?.segments));
      if (Array.isArray(transcript?.segments)) {
        logger.log('  - Segments count:', transcript.segments.length);
        if (transcript.segments.length > 0) {
          logger.log('  - First segment text:', transcript.segments[0]?.text || 'No text');
        }
      }
      
      // 🔍 Validate segments are not null/empty
      if (!transcript?.segments || !Array.isArray(transcript.segments)) {
        logger.log('⚠️ Retrieved transcript segments are null or missing.');
      } else {
        const validSegments = transcript.segments.filter(s => s && typeof s.text === 'string' && s.text.trim().length > 0);
        logger.log('✅ Valid segments count:', validSegments.length);
        if (validSegments.length !== transcript.segments.length) {
          logger.log('⚠️ Some segments have invalid text');
        }
      }
      
      logger.log('✅ Transcript parsed successfully:', {
        id: transcript?.id,
        fileId: transcript?.fileId,
        hasSegments: Array.isArray(transcript?.segments),
        segmentCount: Array.isArray(transcript?.segments) ? transcript.segments.length : 0,
        hasFullText: typeof transcript?.fullText === 'string',
        fullTextLength: typeof transcript?.fullText === 'string' ? transcript.fullText.length : 0
      });
      
      return transcript;
    } catch (error) {
      logger.error('❌ Error getting transcript by file ID:', error);
      return null;
    }
  }

  static async saveTranscript(transcript: Transcript): Promise<void> {
    try {
      const transcripts = await this.getAllTranscripts();
      const existingIndex = transcripts.findIndex(t => t.id === transcript.id);
      
      if (existingIndex >= 0) {
        transcripts[existingIndex] = transcript;
      } else {
        transcripts.push(transcript);
      }
      
      await StorageService.setItem(this.STORAGE_KEY, JSON.stringify(transcripts));
    } catch (error) {
      logger.error('Error saving transcript:', error);
      throw error;
    }
  }

  static async deleteTranscript(transcriptId: string): Promise<void> {
    try {
      const transcripts = await this.getAllTranscripts();
      const filtered = transcripts.filter(t => t.id !== transcriptId);
      await StorageService.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      logger.error('Error deleting transcript:', error);
      throw error;
    }
  }

  static async createTranscriptFromWhisper(
    fileId: string,
    segments: any[],
    fullText: string,
    language: string,
    duration: number
  ): Promise<Transcript> {
    logger.log('🔍 createTranscriptFromWhisper called with:', {
      fileId,
      segments: {
        exists: !!segments,
        isArray: Array.isArray(segments),
        length: Array.isArray(segments) ? segments.length : 'Not an array',
        type: typeof segments
      },
      fullText: {
        exists: !!fullText,
        type: typeof fullText,
        length: typeof fullText === 'string' ? fullText.length : 'Not a string'
      },
      language,
      duration
    });

    // Safe segments processing with comprehensive guards
    let processedSegments: TranscriptSegment[] = [];
    
    try {
      logger.log('🔍 About to process segments...');
      
      if (segments && Array.isArray(segments)) {
        logger.log('🔍 Segments validation passed, length:', segments.length);
        
        processedSegments = segments.map((segment, index) => {
          logger.log(`🔍 Processing segment ${index}:`, {
            segment,
            hasText: segment && typeof segment.text === 'string',
            textLength: segment && segment.text && typeof segment.text === 'string' ? segment.text.length : 'No valid text'
          });
          
          return {
            id: `segment_${index}`,
            startTime: segment && typeof segment.start === 'number' ? segment.start : 0,
            endTime: segment && typeof segment.end === 'number' ? segment.end : 0,
            text: segment && segment.text && typeof segment.text === 'string' ? segment.text : '',
          };
        });
        
        logger.log('🔍 Segments processed successfully:', {
          processedCount: Array.isArray(processedSegments) ? processedSegments.length : 'Not an array'
        });
      } else {
        logger.warn('⚠️ No valid segments array provided, using empty array');
        processedSegments = [];
      }
    } catch (segmentError) {
      logger.error('❌ Error processing segments:', segmentError);
      processedSegments = [];
    }

    const transcript: Transcript = {
      id: `transcript_${fileId}_${Date.now()}`,
      fileId,
      segments: processedSegments,
      fullText: typeof fullText === 'string' ? fullText : '',
      language,
      duration,
      createdAt: new Date().toISOString(),
    };

    logger.log('🔍 About to save transcript:', {
      transcriptId: transcript.id,
      fileId: transcript.fileId,
      segmentsCount: Array.isArray(transcript.segments) ? transcript.segments.length : 'Not an array',
      fullTextLength: typeof transcript.fullText === 'string' ? transcript.fullText.length : 'Not a string',
      storageKey: `transcript-${transcript.fileId}`
    });

    // Store using the fileId as the key for consistency
    logger.log('💾 About to store transcript with fileId:', transcript.fileId);
    const stored = await this.storeTranscript(transcript.fileId, transcript);
    if (!stored) {
      throw new Error('Failed to store transcript after multiple attempts');
    }
    
    logger.log('✅ Transcript created and stored successfully for fileId:', transcript.fileId);
    
    return transcript;
  }

  static async updateTranscriptSegment(
    transcriptId: string,
    segmentId: string,
    newText: string
  ): Promise<void> {
    logger.log('🔍 updateTranscriptSegment called:', {
      transcriptId,
      segmentId,
      newText: {
        exists: !!newText,
        type: typeof newText,
        length: typeof newText === 'string' ? newText.length : 'Not a string'
      }
    });

    try {
      const transcripts = await this.getAllTranscripts();
      logger.log('🔍 Loaded transcripts:', {
        exists: !!transcripts,
        isArray: Array.isArray(transcripts),
        length: Array.isArray(transcripts) ? transcripts.length : 'Not an array'
      });
      
      const transcript = transcripts.find(t => t.id === transcriptId);
      
      if (!transcript) {
        throw new Error('Transcript not found');
      }

      logger.log('🔍 Found transcript:', {
        id: transcript.id,
        segmentsExists: !!transcript.segments,
        segmentsIsArray: Array.isArray(transcript.segments),
        segmentsLength: Array.isArray(transcript.segments) ? transcript.segments.length : 'Not an array'
      });

      const segment = transcript.segments.find(s => s.id === segmentId);
      if (!segment) {
        throw new Error('Segment not found');
      }

      segment.text = newText;
      
      // Regenerate full text from all segments
      logger.log('🔍 About to regenerate full text from segments...');
      
      if (transcript.segments && Array.isArray(transcript.segments)) {
        logger.log('🔍 Segments validation passed for full text generation, length:', transcript.segments.length);
        
        try {
          const textParts = transcript.segments.map((s, index) => {
            logger.log(`🔍 Processing segment ${index} for full text:`, {
              segmentId: s?.id,
              hasText: s && typeof s.text === 'string',
              textLength: s && s.text && typeof s.text === 'string' ? s.text.length : 'No valid text'
            });
            
            return s && s.text && typeof s.text === 'string' ? s.text : '';
          });
          
          logger.log('🔍 Text parts generated:', {
            partsCount: Array.isArray(textParts) ? textParts.length : 'Not an array'
          });
          
          if (Array.isArray(textParts)) {
            transcript.fullText = textParts.join(' ');
            logger.log('🔍 Full text regenerated successfully, length:', 
              typeof transcript.fullText === 'string' ? transcript.fullText.length : 'Not a string'
            );
          } else {
            logger.warn('⚠️ Text parts is not an array, keeping original full text');
          }
        } catch (fullTextError) {
          logger.error('❌ Error regenerating full text:', fullTextError);
          // Keep original full text on error
        }
      } else {
        logger.warn('⚠️ No valid segments for full text regeneration');
      }

      await this.saveTranscript(transcript);
    } catch (error) {
      logger.error('Error updating transcript segment:', error);
      throw error;
    }
  }
  static async hasTranscript(fileId: string): Promise<boolean> {
    logger.log('🔍 hasTranscript called for fileId:', fileId);
    
    try {
      const storageKey = `transcript-${fileId}`;
      logger.log('🔑 hasTranscript storage key:', storageKey);
      
      const stored = await StorageService.getItem(storageKey);
      const exists = stored !== null;
      logger.log(`🔍 hasTranscript result: ${fileId} = ${exists}`);
      
      if (!exists) {
        // Debug: show what keys do exist
        const allKeys = await StorageService.getAllKeys();
        const transcriptKeys = allKeys.filter(k => k.startsWith('transcript-'));
        logger.log('🔍 hasTranscript - available transcript keys:', transcriptKeys);
      }
      
      return exists;
    } catch (error) {
      logger.error('❌ hasTranscript failed for fileId:', fileId, 'Error:', error);
      return false;
    }
  }

  static async deleteTranscriptByFileId(fileId: string): Promise<void> {
    logger.log('🗑️ deleteTranscriptByFileId called for fileId:', fileId);
    
    try {
      const storageKey = `transcript-${fileId}`;
      logger.log('🔑 Deleting transcript with key:', storageKey);
      
      await StorageService.removeItem(storageKey);
      logger.log('✅ Transcript deleted successfully');
    } catch (error) {
      logger.error('❌ Error deleting transcript:', error);
      throw new Error('Failed to delete transcription');
    }
  }

  static async updateTranscript(transcript: Transcript): Promise<void> {
    logger.log('🔍 updateTranscript called:', {
      transcriptId: transcript?.id,
      segmentsExists: !!transcript?.segments,
      segmentsIsArray: Array.isArray(transcript?.segments),
      segmentsLength: Array.isArray(transcript?.segments) ? transcript.segments.length : 'Not an array'
    });
    
    try {
      await this.saveTranscript(transcript);
      logger.log('✅ Transcript updated successfully');
    } catch (error) {
      logger.error('❌ Error updating transcript:', error);
      throw error;
    }
  }
}