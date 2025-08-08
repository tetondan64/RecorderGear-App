import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import Fuse from 'fuse.js';
import { TranscriptSegment } from '@/types/transcript';

interface TranscriptBlockProps {
  segment: TranscriptSegment;
  isActive?: boolean;
  isEditMode?: boolean;
  onPress?: (startTime: number) => void;
  onTextChange?: (segmentId: string, newText: string) => void;
  searchQuery?: string;
  fuzzySearchEnabled?: boolean;
}

export default function TranscriptBlock({ 
  segment, 
  isActive = false, 
  isEditMode = false,
  onPress,
  onTextChange,
  searchQuery = '',
  fuzzySearchEnabled = true,
}: TranscriptBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(segment.text);
  const textInputRef = useRef<TextInput>(null);
  const blockRef = useRef<View>(null);

  useEffect(() => {
    setEditText(segment.text);
  }, [segment.text]);

  useEffect(() => {
    if (!isEditMode && isEditing) {
      handleSaveEdit();
    }
  }, [isEditMode]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBlockPress = () => {
    if (isEditMode) {
      setIsEditing(true);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } else {
      onPress?.(segment.startTime);
    }
  };

  const handleSaveEdit = () => {
    if (editText !== segment.text) {
      onTextChange?.(segment.id, editText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(segment.text);
    setIsEditing(false);
  };

  const highlightSearchMatches = (text: string): React.ReactNode => {
    if (!searchQuery.trim()) {
      return <Text style={[
        styles.transcriptText, 
        isActive && styles.activeText,
        isEditMode && styles.editModeText
      ]}>{text}</Text>;
    }

    if (fuzzySearchEnabled) {
      // Use Fuse.js for fuzzy highlighting
      const fuse = new Fuse([{ text }], {
        threshold: 0.3,
        keys: ['text'],
        includeMatches: true,
        minMatchCharLength: 2,
        ignoreLocation: true,
      });

      const results = fuse.search(searchQuery);
      if (results.length > 0 && results[0].matches) {
        const matches = results[0].matches[0];
        if (matches && matches.indices) {
          return (
            <Text style={[
              styles.transcriptText, 
              isActive && styles.activeText,
              isEditMode && styles.editModeText
            ]}>
              {renderHighlightedText(text, matches.indices)}
            </Text>
          );
        }
      }
    } else {
      // Exact string matching
      const lowerText = text.toLowerCase();
      const lowerQuery = searchQuery.toLowerCase();
      const startIndex = lowerText.indexOf(lowerQuery);
      
      if (startIndex !== -1) {
        const endIndex = startIndex + searchQuery.length;
        return (
          <Text style={[
            styles.transcriptText, 
            isActive && styles.activeText,
            isEditMode && styles.editModeText
          ]}>
            {text.substring(0, startIndex)}
            <Text style={styles.highlightFuzzy}>
              {text.substring(startIndex, endIndex)}
            </Text>
            {text.substring(endIndex)}
          </Text>
        );
      }
    }

    return <Text style={[
      styles.transcriptText, 
      isActive && styles.activeText,
      isEditMode && styles.editModeText
    ]}>{text}</Text>;
  };

  const renderHighlightedText = (text: string, indices: [number, number][]): React.ReactNode => {
    if (!indices || indices.length === 0) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    indices.forEach(([start, end], index) => {
      // Add text before highlight
      if (start > lastIndex) {
        parts.push(text.substring(lastIndex, start));
      }
      
      // Add highlighted text
      parts.push(
        <Text key={`highlight-${index}`} style={styles.highlightFuzzy}>
          {text.substring(start, end + 1)}
        </Text>
      );
      
      lastIndex = end + 1;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleBlockPress}
      disabled={isEditing}
      ref={blockRef}
    >
      <BlurView
        nativeID={`segment-${segment.startTime}`}
        id={`segment-${segment.startTime}`}
        intensity={isActive ? 20 : 10} 
        style={[
          styles.card, 
          isActive && styles.activeCard,
          isEditMode && styles.editModeCard,
          isEditing && styles.editingCard
        ]}
      >
        <View style={styles.timestampContainer}>
          <Text style={[
            styles.timestamp, 
            isActive && styles.activeTimestamp,
            isEditMode && styles.editModeTimestamp
          ]}>
            {formatTime(segment.startTime)}
          </Text>
        </View>
        
        <View style={styles.textContainer}>
          {isEditing ? (
            <TextInput
              ref={textInputRef}
              style={[styles.textInput, isActive && styles.activeTextInput]}
              value={editText}
              onChangeText={setEditText}
              onBlur={handleSaveEdit}
              multiline={true}
              autoFocus={true}
              placeholder="Enter transcript text..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
            />
          ) : (
            highlightSearchMatches(segment.text)
          )}
        </View>
        
        {isEditMode && !isEditing && (
          <View style={styles.editIndicator}>
            <Text style={styles.editHint}>Tap to edit</Text>
          </View>
        )}
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginHorizontal: 2, // Add horizontal margin to prevent glow cut-off
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    flexDirection: 'row',
    overflow: 'visible', // Allow glow effects to show
  },
  activeCard: {
    backgroundColor: 'rgba(244, 173, 61, 0.25)',
    borderColor: '#f4ad3d',
    borderWidth: 2,
    shadowColor: '#f4ad3d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
    marginHorizontal: 3, // Minimal margin for glow visibility
    marginVertical: 3, // Minimal vertical margin for glow visibility
  },
  editModeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  editingCard: {
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderColor: 'rgba(244, 173, 61, 0.4)',
    shadowColor: '#f4ad3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timestampContainer: {
    marginRight: 16,
    minWidth: 50,
  },
  timestamp: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  activeTimestamp: {
    color: '#FFFFFF',
    backgroundColor: '#f4ad3d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '700',
    overflow: 'hidden',
  },
  editModeTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  textContainer: {
    flex: 1,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  editModeText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.3)',
    minHeight: 48,
  },
  activeTextInput: {
    borderColor: '#f4ad3d',
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
  },
  editIndicator: {
    marginLeft: 12,
    alignSelf: 'flex-start',
  },
  editHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  highlightFuzzy: {
    backgroundColor: 'rgba(255, 221, 0, 0.6)',
    color: '#000000',
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});