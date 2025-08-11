import { Transcript, TranscriptSegment } from '@/types/transcript';
import { StorageService } from './storageService';

export class TranscriptService {
  private static readonly STORAGE_KEY = 'transcripts';

  // Debug utility to check storage state
  static async debugStorage(fileId: string): Promise<void> {
    try {
      const key = `transcript-${fileId}`;
      console.log('🔍 Debug storage check for fileId:', fileId);
      console.log('🔑 Debug key:', key);
      
      const value = await StorageService.getItem(key);
      console.log('🔍 Debug retrieved value exists:', value !== null);
      console.log('🔍 Debug retrieved value preview:', 
        value ? value.substring(0, 200) + '...' : 'null'
      );
      
      // Show all keys for comparison
      const allKeys = await StorageService.getAllKeys();
      console.log('🔍 All storage keys:', allKeys);
      
      // Filter to transcript keys only
      const transcriptKeys = allKeys.filter(k => k.startsWith('transcript-'));
      console.log('🔍 Transcript keys only:', transcriptKeys);
      
    } catch (error) {
      console.error('❌ Debug storage failed:', error);
    }
  }

  static async storeTranscriptWithVerification(transcriptId: string, data: Transcript): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 200;
    
    // 📦 Log what we're storing before save
    console.log('📦 Storing transcript:');
    console.log('📦 Transcript ID:', transcriptId);
    console.log('📦 Data type:', typeof data);
    console.log('📦 Data keys:', data && typeof data === 'object' ? Object.keys(data) : 'Not an object');
    
    if (data && typeof data === 'object') {
      console.log('📦 Full text validation before store:');
      console.log('  - Has fullText:', !!data.fullText);
      console.log('  - FullText type:', typeof data.fullText);
      if (typeof data.fullText === 'string') {
        console.log('  - FullText length:', data.fullText.length);
        console.log('  - FullText preview:', data.fullText.substring(0, 100) + '...');
      }
      
      console.log('📦 Segments validation before store:');
      console.log('  - Has segments:', !!data.segments);
      console.log('  - Segments is array:', Array.isArray(data.segments));
      if (Array.isArray(data.segments)) {
        console.log('  - Segments count:', data.segments.length);
        if (data.segments.length > 0) {
          console.log('  - First 2 segments preview:');
          data.segments.slice(0, 2).forEach((seg, index) => {
            console.log(`    → Segment ${index}: ${seg?.text || 'No text'}`);
          });
        }
      }
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📥 Storage attempt ${attempt}/${maxRetries} for transcript:`, transcriptId);
        console.log('📌 Exact storage key:', `transcript-${transcriptId}`);
        console.log('💾 Data being stored (truncated):', {
          type: typeof data,
          keys: data && typeof data === 'object' ? Object.keys(data) : 'Not an object',
          textLength: data && data.fullText && typeof data.fullText === 'string' ? data.fullText.length : 'No valid fullText',
          segmentsCount: data && Array.isArray(data.segments) ? data.segments.length : 'No valid segments'
        });
        
        // Store the transcript
        await StorageService.setItem(`transcript-${transcriptId}`, JSON.stringify(data));
        console.log(`✅ AsyncStorage.setItem completed for attempt ${attempt}`);
        
        // Small delay to ensure storage is committed
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify storage immediately
        console.log(`🔍 Verifying storage for attempt ${attempt}...`);
        console.log('📌 Verification key:', `transcript-${transcriptId}`);
        
        const storedValue = await StorageService.getItem(`transcript-${transcriptId}`);
        const exists = storedValue !== null;
        
        console.log(`🔍 Verification result for attempt ${attempt}:`, {
          exists,
          storedValueType: typeof storedValue,
          storedValueLength: storedValue && typeof storedValue === 'string' ? storedValue.length : 'Not a string',
          storedValuePreview: storedValue && typeof storedValue === 'string' ? storedValue.substring(0, 100) + '...' : 'No valid stored value'
        });
        
        if (exists) {
          console.log(`✅ Storage verification successful on attempt ${attempt}`);
          return true;
        } else {
          console.warn(`⚠️ Storage verification failed on attempt ${attempt} - stored value is null`);
          
          if (attempt < maxRetries) {
            console.log(`🔁 Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
        
      } catch (error) {
        console.error(`❌ Storage attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          console.log(`🔁 Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.error(`❌ All ${maxRetries} storage attempts failed`);
          return false;
        }
      }
    }
    
    console.error(`❌ Storage verification failed after ${maxRetries} attempts`);
    return false;
  }

  static async storeTranscript(transcriptId: string, data: Transcript): Promise<boolean> {
    try {
      return await this.storeTranscriptWithVerification(transcriptId, data);
    } catch (error) {
      console.error('❌ Failed to store transcript:', error);
      return false;
    }
  }

  static async getAllTranscripts(): Promise<Transcript[]> {
    try {
      const data = await StorageService.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading transcripts:', error);
      return [];
    }
  }

  static async getTranscriptByFileId(fileId: string): Promise<Transcript | null> {
    console.log('🔍 getTranscriptByFileId called with fileId:', fileId);
    console.log('🔑 Will use storage key:', `transcript-${fileId}`);
    
    try {
      const storageKey = `transcript-${fileId}`;
      console.log('🔍 Attempting to retrieve with key:', storageKey);
      
      const storedValue = await StorageService.getItem(storageKey);
      console.log('🔍 Retrieved value exists:', storedValue !== null);
      
      if (!storedValue) {
        console.log('❌ No stored value found for key:', storageKey);
        
        // Debug: show all keys for comparison
        const allKeys = await StorageService.getAllKeys();
        console.log('🔍 All storage keys:', allKeys);
        
        const transcriptKeys = allKeys.filter(k => k.startsWith('transcript-'));
        console.log('🔍 Transcript keys only:', transcriptKeys);
        
        return null;
      }
      
      // 📤 Log what we retrieved after successful fetch
      console.log('📤 Retrieved transcript from storage:');
      console.log('📤 Storage key used:', storageKey);
      console.log('📤 Raw stored value length:', typeof storedValue === 'string' ? storedValue.length : 'Not a string');
      
      console.log('✅ Found stored transcript, parsing...');
      const transcript = JSON.parse(storedValue);
      
      // 📤 Validate retrieved transcript structure
      console.log('📤 Retrieved transcript validation:');
      console.log('  - Has id:', !!transcript?.id);
      console.log('  - Has fileId:', !!transcript?.fileId);
      console.log('  - Has fullText:', !!transcript?.fullText);
      console.log('  - FullText type:', typeof transcript?.fullText);
      if (typeof transcript?.fullText === 'string') {
        console.log('  - FullText length:', transcript.fullText.length);
        console.log('  - FullText preview:', transcript.fullText.substring(0, 100) + '...');
      }
      
      console.log('  - Has segments:', !!transcript?.segments);
      console.log('  - Segments is array:', Array.isArray(transcript?.segments));
      if (Array.isArray(transcript?.segments)) {
        console.log('  - Segments count:', transcript.segments.length);
        if (transcript.segments.length > 0) {
          console.log('  - First segment text:', transcript.segments[0]?.text || 'No text');
        }
      }
      
      // 🔍 Validate segments are not null/empty
      if (!transcript?.segments || !Array.isArray(transcript.segments)) {
        console.log('⚠️ Retrieved transcript segments are null or missing.');
      } else {
        const validSegments = transcript.segments.filter(
          (s: TranscriptSegment) => s && typeof s.text === 'string' && s.text.trim().length > 0
        );
        console.log('✅ Valid segments count:', validSegments.length);
        if (validSegments.length !== transcript.segments.length) {
          console.log('⚠️ Some segments have invalid text');
        }
      }
      
      console.log('✅ Transcript parsed successfully:', {
        id: transcript?.id,
        fileId: transcript?.fileId,
        hasSegments: Array.isArray(transcript?.segments),
        segmentCount: Array.isArray(transcript?.segments) ? transcript.segments.length : 0,
        hasFullText: typeof transcript?.fullText === 'string',
        fullTextLength: typeof transcript?.fullText === 'string' ? transcript.fullText.length : 0
      });
      
      return transcript;
    } catch (error) {
      console.error('❌ Error getting transcript by file ID:', error);
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
      console.error('Error saving transcript:', error);
      throw error;
    }
  }

  static async deleteTranscript(transcriptId: string): Promise<void> {
    try {
      const transcripts = await this.getAllTranscripts();
      const filtered = transcripts.filter(t => t.id !== transcriptId);
      await StorageService.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting transcript:', error);
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
    console.log('🔍 createTranscriptFromWhisper called with:', {
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
      console.log('🔍 About to process segments...');
      
      if (segments && Array.isArray(segments)) {
        console.log('🔍 Segments validation passed, length:', segments.length);
        
        processedSegments = segments.map((segment, index) => {
          console.log(`🔍 Processing segment ${index}:`, {
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
        
        console.log('🔍 Segments processed successfully:', {
          processedCount: Array.isArray(processedSegments) ? processedSegments.length : 'Not an array'
        });
      } else {
        console.warn('⚠️ No valid segments array provided, using empty array');
        processedSegments = [];
      }
    } catch (segmentError) {
      console.error('❌ Error processing segments:', segmentError);
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

    console.log('🔍 About to save transcript:', {
      transcriptId: transcript.id,
      fileId: transcript.fileId,
      segmentsCount: Array.isArray(transcript.segments) ? transcript.segments.length : 'Not an array',
      fullTextLength: typeof transcript.fullText === 'string' ? transcript.fullText.length : 'Not a string',
      storageKey: `transcript-${transcript.fileId}`
    });

    // Store using the fileId as the key for consistency
    console.log('💾 About to store transcript with fileId:', transcript.fileId);
    const stored = await this.storeTranscript(transcript.fileId, transcript);
    if (!stored) {
      throw new Error('Failed to store transcript after multiple attempts');
    }
    
    console.log('✅ Transcript created and stored successfully for fileId:', transcript.fileId);
    
    return transcript;
  }

  static async updateTranscriptSegment(
    transcriptId: string,
    segmentId: string,
    newText: string
  ): Promise<void> {
    console.log('🔍 updateTranscriptSegment called:', {
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
      console.log('🔍 Loaded transcripts:', {
        exists: !!transcripts,
        isArray: Array.isArray(transcripts),
        length: Array.isArray(transcripts) ? transcripts.length : 'Not an array'
      });
      
      const transcript = transcripts.find(t => t.id === transcriptId);
      
      if (!transcript) {
        throw new Error('Transcript not found');
      }

      console.log('🔍 Found transcript:', {
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
      console.log('🔍 About to regenerate full text from segments...');
      
      if (transcript.segments && Array.isArray(transcript.segments)) {
        console.log('🔍 Segments validation passed for full text generation, length:', transcript.segments.length);
        
        try {
          const textParts = transcript.segments.map((s, index) => {
            console.log(`🔍 Processing segment ${index} for full text:`, {
              segmentId: s?.id,
              hasText: s && typeof s.text === 'string',
              textLength: s && s.text && typeof s.text === 'string' ? s.text.length : 'No valid text'
            });
            
            return s && s.text && typeof s.text === 'string' ? s.text : '';
          });
          
          console.log('🔍 Text parts generated:', {
            partsCount: Array.isArray(textParts) ? textParts.length : 'Not an array'
          });
          
          if (Array.isArray(textParts)) {
            transcript.fullText = textParts.join(' ');
            console.log('🔍 Full text regenerated successfully, length:', 
              typeof transcript.fullText === 'string' ? transcript.fullText.length : 'Not a string'
            );
          } else {
            console.warn('⚠️ Text parts is not an array, keeping original full text');
          }
        } catch (fullTextError) {
          console.error('❌ Error regenerating full text:', fullTextError);
          // Keep original full text on error
        }
      } else {
        console.warn('⚠️ No valid segments for full text regeneration');
      }

      await this.saveTranscript(transcript);
    } catch (error) {
      console.error('Error updating transcript segment:', error);
      throw error;
    }
  }
  static async hasTranscript(fileId: string): Promise<boolean> {
    console.log('🔍 hasTranscript called for fileId:', fileId);
    
    try {
      const storageKey = `transcript-${fileId}`;
      console.log('🔑 hasTranscript storage key:', storageKey);
      
      const stored = await StorageService.getItem(storageKey);
      const exists = stored !== null;
      console.log(`🔍 hasTranscript result: ${fileId} = ${exists}`);
      
      if (!exists) {
        // Debug: show what keys do exist
        const allKeys = await StorageService.getAllKeys();
        const transcriptKeys = allKeys.filter(k => k.startsWith('transcript-'));
        console.log('🔍 hasTranscript - available transcript keys:', transcriptKeys);
      }
      
      return exists;
    } catch (error) {
      console.error('❌ hasTranscript failed for fileId:', fileId, 'Error:', error);
      return false;
    }
  }

  static async deleteTranscriptByFileId(fileId: string): Promise<void> {
    console.log('🗑️ deleteTranscriptByFileId called for fileId:', fileId);
    
    try {
      const storageKey = `transcript-${fileId}`;
      console.log('🔑 Deleting transcript with key:', storageKey);
      
      await StorageService.removeItem(storageKey);
      console.log('✅ Transcript deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting transcript:', error);
      throw new Error('Failed to delete transcription');
    }
  }

  static async updateTranscript(transcript: Transcript): Promise<void> {
    console.log('🔍 updateTranscript called:', {
      transcriptId: transcript?.id,
      segmentsExists: !!transcript?.segments,
      segmentsIsArray: Array.isArray(transcript?.segments),
      segmentsLength: Array.isArray(transcript?.segments) ? transcript.segments.length : 'Not an array'
    });
    
    try {
      await this.saveTranscript(transcript);
      console.log('✅ Transcript updated successfully');
    } catch (error) {
      console.error('❌ Error updating transcript:', error);
      throw error;
    }
  }
}