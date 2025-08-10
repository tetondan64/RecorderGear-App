import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Search, CreditCard as Edit3, Lightbulb, MessageCircle, Pin, X, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Layout from '@/components/Layout';
import AudioPlayerModule from '@/components/AudioPlayerModule';
import TranscriptBlock from '@/components/TranscriptBlock';
import TranscriptSearch from '@/components/TranscriptSearch';
import ConfirmModal from '../../components/ConfirmModal';
import { AudioStorageService } from '@/services/audioStorage';
import { TranscriptService } from '@/services/transcriptService';
import { AudioFile } from '@/types/audio';
import { Transcript, TranscriptSegment } from '@/types/transcript';

export default function ViewerScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const [file, setFile] = useState<AudioFile | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [originalTranscript, setOriginalTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastAutoScrollTime, setLastAutoScrollTime] = useState(0);
  const audioPlayerRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadFileAndTranscript();
  }, [fileId]);

  // Reset user scrolling flag after a delay
  useEffect(() => {
    if (isUserScrolling) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 3000); // Reset after 3 seconds of no user interaction
    }
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isUserScrolling]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);
  const loadFileAndTranscript = async () => {
    if (!fileId) return;
    
    try {
      setLoading(true);
      const audioFile = await AudioStorageService.getFileById(fileId);
      if (!audioFile) {
        Alert.alert('Error', 'File not found');
        router.back();
        return;
      }
      
      setFile(audioFile);
      
      // Load or generate transcript
      setTranscriptLoading(true);
      const transcriptData = await TranscriptService.getTranscriptByFileId(fileId);
      setTranscript(transcriptData);
      setOriginalTranscript(transcriptData);
      setTranscriptLoading(false);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load file');
      router.back();
    } finally {
      setLoading(false);
      setTranscriptLoading(false);
    }
  };

  const scrollToActiveSegment = (segmentId: string) => {
    if (!transcript || !flatListRef.current || isUserScrolling) {
      return;
    }

    const segmentIndex = transcript.segments.findIndex(s => s.id === segmentId);
    if (segmentIndex === -1) {
      return;
    }

    // Debounce auto-scroll to prevent jitter
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }

    autoScrollTimeoutRef.current = setTimeout(() => {
      if (flatListRef.current && !isUserScrolling) {
        try {
          flatListRef.current.scrollToIndex({
            index: segmentIndex,
            animated: true,
            viewPosition: 0.5, // Center the item vertically
          });
          setLastAutoScrollTime(Date.now());
        } catch (error) {
          // Fallback to scrollToOffset if scrollToIndex fails
          console.warn('ScrollToIndex failed, using fallback scroll');
          const estimatedOffset = segmentIndex * 100; // Estimate based on average segment height
          flatListRef.current.scrollToOffset({
            offset: estimatedOffset,
            animated: true,
          });
        }
      }
    }, 100); // 100ms debounce
  };

  const handleUserScroll = () => {
    const now = Date.now();
    // Only set user scrolling if it's not from our auto-scroll
    if (now - lastAutoScrollTime > 500) {
      setIsUserScrolling(true);
    }
  };
  const jumpToTimestamp = (timestamp: number) => {
    // Find the segment that contains this timestamp
    const segment = transcript?.segments.find(s => s.startTime === timestamp);
    if (segment) {
      setActiveSegmentId(segment.id);
      
      // Seek audio player to timestamp
      if (audioPlayerRef.current && audioPlayerRef.current.seekTo) {
        audioPlayerRef.current.seekTo(timestamp);
      }
      
      // Scroll to the segment
      scrollToActiveSegment(segment.id);
      
      console.log(`Seeking to timestamp: ${timestamp}s`);
    }
  };

  const handleEditTranscript = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowCancelModal(true);
    } else {
      exitEditMode();
    }
  };

  const handleSaveEdit = async () => {
    if (!transcript) return;
    
    try {
      // Save changes to transcript service
      await TranscriptService.updateTranscript(transcript);
      setOriginalTranscript(transcript);
      setHasUnsavedChanges(false);
      exitEditMode();
      Alert.alert('Success', 'Changes saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setHasUnsavedChanges(false);
  };

  const handleDiscardChanges = () => {
    setTranscript(originalTranscript);
    setHasUnsavedChanges(false);
    setShowCancelModal(false);
    exitEditMode();
  };

  const handleSegmentTextChange = (segmentId: string, newText: string) => {
    if (!transcript) return;
    
    setTranscript(prev => {
      if (!prev) return prev;
      
      const updatedSegments = prev.segments.map(segment =>
        segment.id === segmentId ? { ...segment, text: newText } : segment
      );
      
      return {
        ...prev,
        segments: updatedSegments,
        fullText: updatedSegments.map(s => s.text).join(' '),
      };
    });
    
    setHasUnsavedChanges(true);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
  };

  const handleSearchMatchSelect = (segment: TranscriptSegment, matchIndex: number) => {
    console.log('🔍 Search match selected:', {
      segmentId: segment.id,
      startTime: segment.startTime,
      text: segment.text.substring(0, 50) + '...'
    });
    
    // Set the active segment for visual highlighting - use the exact segment
    setActiveSegmentId(segment.id);
    
    // Jump to the timestamp in the audio player
    if (audioPlayerRef.current && audioPlayerRef.current.seekTo) {
      audioPlayerRef.current.seekTo(segment.startTime);
    }
    
    // Scroll to the segment (this will override user scrolling temporarily)
    setIsUserScrolling(false);
    scrollToActiveSegment(segment.id);
    
    console.log(`🔍 Navigated to search match at ${segment.startTime}s`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Layout>
    );
  }

  if (!file) {
    return (
      <Layout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>File not found</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={isEditMode ? handleCancelEdit : () => router.back()}
        >
          {isEditMode ? (
            <X size={24} color="#FFFFFF" strokeWidth={1.5} />
          ) : (
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={1.5} />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isEditMode ? 'Editing Transcript' : ''}
        </Text>
        <TouchableOpacity 
          style={styles.moreButton} 
          onPress={isEditMode ? handleSaveEdit : handleSearchToggle}
        >
          {isEditMode ? (
            <Check size={20} color="#f4ad3d" strokeWidth={1.5} />
          ) : (
            <Search size={20} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Component */}
      <TranscriptSearch
        visible={showSearch}
        segments={transcript?.segments || []}
        onMatchSelect={handleSearchMatchSelect}
        onClose={() => setShowSearch(false)}
      />

      {/* Transcript List */}
      <View style={styles.transcriptContainer}>
        {!isEditMode && (
          <View style={styles.toolsHeader}>
          <View style={styles.toolsRow}>
            <TouchableOpacity style={styles.toolButton} onPress={() => Alert.alert('Summarize', 'AI summarization coming soon')}>
              <BlurView intensity={18} style={styles.toolButtonBlur}>
                <Lightbulb size={16} color="#f4ad3d" strokeWidth={1.5} />
                <Text style={styles.toolButtonText}>Summarize</Text>
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolButton} onPress={() => Alert.alert('Chat', 'AI chat functionality coming soon')}>
              <BlurView intensity={18} style={styles.toolButtonBlur}>
                <MessageCircle size={16} color="#f4ad3d" strokeWidth={1.5} />
                <Text style={styles.toolButtonText}>Chat</Text>
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolButton} onPress={() => Alert.alert('Pin', 'Pin functionality coming soon')}>
              <BlurView intensity={18} style={styles.toolButtonBlur}>
                <Pin size={16} color="#f4ad3d" strokeWidth={1.5} />
                <Text style={styles.toolButtonText}>Pin</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditTranscript}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        )}
        
        {transcript && transcript.segments.length > 0 ? (
          transcriptLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading transcript...</Text>
            </View>
          ) : (
          <FlatList
            ref={flatListRef}
            data={transcript.segments}
            keyExtractor={(item) => item.id}
            onScrollBeginDrag={handleUserScroll}
            onMomentumScrollBegin={handleUserScroll}
            getItemLayout={(data, index) => ({
              length: 100, // Estimated item height
              offset: 100 * index,
              index,
            })}
            renderItem={({ item }) => (
              <TranscriptBlock
                segment={item}
                isActive={activeSegmentId === item.id}
                isEditMode={isEditMode}
                onPress={jumpToTimestamp}
                onTextChange={handleSegmentTextChange}
                searchQuery={showSearch ? '' : ''} // Will be connected to search state
                fuzzySearchEnabled={true}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transcriptList}
          />
          )
        ) : (
          <View style={styles.noTranscriptContainer}>
            <BlurView intensity={18} style={[styles.noTranscriptCard, { backgroundColor: 'rgba(0, 0, 0, 0.25)' }]}>
              <Text style={styles.noTranscriptText}>
                No transcript available yet
              </Text>
              <Text style={styles.noTranscriptSubtext}>
                Transcription functionality will be implemented in the next phase
              </Text>
            </BlurView>
          </View>
        )}
      </View>

      {/* Bottom Section with Audio Player and Tools */}
      {!isEditMode && (
        <View style={styles.bottomSection}>
        <AudioPlayerModule
          ref={audioPlayerRef}
          audioFile={file}
          onPlayPause={() => console.log('Play/Pause')}
          onSkipBack={() => console.log('Skip back')}
          onSkipForward={() => console.log('Skip forward')}
          onSpeedChange={(speed) => console.log('Speed changed:', speed)}
          onSeek={(time) => {
            console.log('Seek to:', time);
            // Reset user scrolling when seeking manually
            setIsUserScrolling(false);
          }}
          onTimeUpdate={(currentTime) => {
            // Update active segment based on current time
            const currentSegment = transcript?.segments.find(s => 
              currentTime >= s.startTime && currentTime <= s.endTime
            );
            if (currentSegment && currentSegment.id !== activeSegmentId) {
              setActiveSegmentId(currentSegment.id);
              // Auto-scroll to keep active segment centered during playback
              scrollToActiveSegment(currentSegment.id);
            }
          }}
        />
      </View>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        visible={showCancelModal}
        title="Discard your changes?"
        message="You have unsaved changes that will be lost if you continue."
        confirmText="Discard"
        cancelText="Keep Editing"
        onConfirm={handleDiscardChanges}
        onCancel={() => setShowCancelModal(false)}
        isDestructive={true}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfoContainer: {
    marginBottom: 20,
  },
  fileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fileMetadata: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  transcriptContainer: {
    flex: 1,
  },
  toolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toolButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  toolButtonBlur: {
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  transcriptList: {
    paddingBottom: 20,
    paddingHorizontal: 4, // Add horizontal padding to prevent glow cut-off
  },
  noTranscriptContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  noTranscriptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  noTranscriptText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  noTranscriptSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 20, // Position at bottom of screen
    left: 24,
    right: 24,
  },
});