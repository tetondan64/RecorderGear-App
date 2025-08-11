import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { FileAudio, MoveHorizontal as MoreHorizontal, Play, Pause, Share, CreditCard as Edit3, Tag as TagIcon, FolderOpen, Trash2, CircleCheck as CheckCircle, FileText, File, Sparkles, Bot } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AudioFile } from '@/types/audio';
import ConfirmModal from './ConfirmModal';
import RenameModal from './RenameModal';
import TagManagerModal from './TagManagerModal';
import FolderPickerModal from './FolderPickerModal';
import { RecordingsStore } from '@/data/recordingsStore';
import TagChips from './TagChips';
import { Tag } from '@/types/tag';

interface FileCardProps {
  file: AudioFile;
  onPress: () => void;
  onDeleteAudio: (file: AudioFile) => void;
  onDeleteTranscription: (file: AudioFile) => void;
  onTranscribe: (file: AudioFile) => void;
  onRename: (file: AudioFile, newName: string) => void;
  isPlaying?: boolean;
  currentTime?: number;
  onPlayPause?: (fileId: string) => void;
  onSeek?: (fileId: string, time: number) => void;
  onShare?: (file: AudioFile) => void;
  stopPlaybackIfPlaying?: (fileId: string) => void;
  collapsed?: boolean;
}

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  onTranscribe: () => void;
  onShare: () => void;
  onRename: () => void;
  onTag: () => void;
  onMove: () => void;
  onDeleteAudio: () => void;
  onDeleteTranscription: () => void;
  hasTranscript: boolean;
  onViewTranscript: () => void;
}

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

function DropdownMenu({ 
  visible, 
  onClose, 
  onTranscribe,
  onViewTranscript,
  onShare, 
  onRename, 
  onTag, 
  onMove, 
  onDeleteAudio,
  onDeleteTranscription,
  hasTranscript
}: DropdownMenuProps) {
  if (!visible) return null;

  const menuItems = [
    {
      id: hasTranscript ? 'view' : 'transcribe',
      label: hasTranscript ? 'View Transcription' : 'Transcribe',
      icon: hasTranscript 
        ? <File size={16} color="#4CAF50" strokeWidth={1.5} />
        : <FileAudio size={16} color="#f4ad3d" strokeWidth={1.5} />,
      onPress: hasTranscript ? onViewTranscript : onTranscribe,
      isPrimary: true,
      isTranscribed: hasTranscript,
    },
    {
      id: 'share',
      label: 'Share',
      icon: <Share size={16} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />,
      onPress: onShare,
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: <Edit3 size={16} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />,
      onPress: onRename,
    },
    {
      id: 'tag',
      label: 'Tag',
      icon: <TagIcon size={16} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />,
      onPress: onTag,
    },
    {
      id: 'move',
      label: 'Move to',
      icon: <FolderOpen size={16} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />,
      onPress: onMove,
    },
    {
      id: 'deleteAudio',
      label: 'Delete Audio',
      icon: <Trash2 size={16} color="#EF4444" strokeWidth={1.5} />,
      onPress: onDeleteAudio,
      isDanger: true,
    },
    {
      id: 'deleteTranscription',
      label: 'Delete Transcription',
      icon: <Trash2 size={16} color={hasTranscript ? "#F59E0B" : "rgba(255, 255, 255, 0.3)"} strokeWidth={1.5} />,
      onPress: onDeleteTranscription,
      isDanger: true,
      isDisabled: !hasTranscript,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.dropdownOverlay} onPress={onClose}>
        <View style={styles.dropdownContainer}>
          <BlurView intensity={40} style={styles.dropdownMenu}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dropdownItem,
                  item.isPrimary && styles.dropdownItemPrimary,
                  item.isTranscribed && styles.dropdownItemTranscribed,
                  index === menuItems.length - 1 && styles.dropdownItemLast,
                  item.isDisabled && styles.dropdownItemDisabled,
                ]}
                onPress={() => {
                  if (!item.isDisabled) {
                    item.onPress();
                    onClose();
                  }
                }}
                disabled={item.isDisabled}
              >
                <View style={styles.dropdownItemContent}>
                  {item.icon}
                  <Text style={[
                    styles.dropdownItemText,
                    item.isPrimary && styles.dropdownItemTextPrimary,
                    item.isTranscribed && styles.dropdownItemTextTranscribed,
                    item.isDanger && styles.dropdownItemTextDanger,
                  ]}>
                    {item.label}
                  </Text>
                </View>
                {item.isPrimary && <View style={styles.primaryGlow} />}
              </TouchableOpacity>
            ))}
          </BlurView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function FileCard({ 
  file, 
  onPress, 
  onDeleteAudio,
  onDeleteTranscription,
  onTranscribe,
  onRename,
  isPlaying = false, 
  currentTime = 0, 
  onPlayPause, 
  onSeek,
  onShare,
  stopPlaybackIfPlaying,
  collapsed = false
}: FileCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteAudioModal, setShowDeleteAudioModal] = useState(false);
  const [showDeleteTranscriptionModal, setShowDeleteTranscriptionModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showTagManagerModal, setShowTagManagerModal] = useState(false);
  const [showFolderPickerModal, setShowFolderPickerModal] = useState(false);
  const [isIconPressed, setIsIconPressed] = useState(false);
  const [isProgressDragging, setIsProgressDragging] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [fileTags, setFileTags] = useState<Tag[]>([]);

  // Animation values
  const translateX = useSharedValue(0);
  const leftActionsOpacity = useSharedValue(0);
  const rightActionsOpacity = useSharedValue(0);

  // Swipe threshold (20% of screen width, approximately 80px)
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 160;

  // Ensure persistent file reference and reinitialize on component mount
  useEffect(() => {
    // Reset swipe state when file changes
    translateX.value = withSpring(0);
    leftActionsOpacity.value = withSpring(0);
    rightActionsOpacity.value = withSpring(0);
    
    // Load tags for this file
    loadFileTags();
  }, [file]);

  const loadFileTags = async () => {
    try {
      if (file.tags && file.tags.length > 0) {
        const allTags = await RecordingsStore.getTags();
        const matchingTags = allTags.filter(tag => file.tags?.includes(tag.id));
        setFileTags(matchingTags);
      } else {
        setFileTags([]);
      }
    } catch (error) {
      console.error('Failed to load file tags:', error);
      setFileTags([]);
    }
  };

  // Define swipe actions
  const leftActions: SwipeAction[] = [
    {
      id: file.hasTranscript ? 'view' : 'transcribe',
      label: file.hasTranscript ? 'View' : 'Transcribe',
      icon: <FileText size={20} color="#FFFFFF" strokeWidth={1.5} />,
      color: '#FFFFFF',
      backgroundColor: file.hasTranscript ? '#4CAF50' : '#f4ad3d',
      onPress: () => {
        resetSwipe();
        if (file.hasTranscript) {
          onPress(); // Navigate to viewer
        } else {
          handleTranscribeAction();
        }
      },
    },
    {
      id: 'tag',
      label: 'Tag',
      icon: <TagIcon size={18} color="#FFFFFF" strokeWidth={1.5} />,
      color: '#FFFFFF',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      onPress: () => {
        resetSwipe();
        handleTagAction();
      },
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: 'move',
      label: 'Move',
      icon: <FolderOpen size={18} color="#FFFFFF" strokeWidth={1.5} />,
      color: '#FFFFFF',
      backgroundColor: '#3B82F6',
      onPress: () => {
        resetSwipe();
        handleMoveAction();
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={18} color="#FFFFFF" strokeWidth={1.5} />,
      color: '#FFFFFF',
      backgroundColor: '#EF4444',
      onPress: () => {
        resetSwipe();
        // Stop playback if this file is currently playing
        stopPlaybackIfPlaying?.(file.id);
        setShowDeleteAudioModal(true);
      },
    },
  ];

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const resetSwipe = () => {
    translateX.value = withSpring(0);
    leftActionsOpacity.value = withSpring(0);
    rightActionsOpacity.value = withSpring(0);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (!isProgressDragging) {
        runOnJS(triggerHaptic)();
      }
    })
    .onUpdate((event) => {
      if (isProgressDragging) {
        return;
      }
      
      const { translationX } = event;
      
      // Limit swipe distance
      const clampedTranslation = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, translationX));
      translateX.value = clampedTranslation;

      // Update action visibility based on swipe direction and distance
      if (translationX > SWIPE_THRESHOLD) {
        leftActionsOpacity.value = interpolate(
          translationX,
          [SWIPE_THRESHOLD, MAX_SWIPE],
          [0, 1],
          Extrapolate.CLAMP
        );
        rightActionsOpacity.value = 0;
      } else if (translationX < -SWIPE_THRESHOLD) {
        rightActionsOpacity.value = interpolate(
          Math.abs(translationX),
          [SWIPE_THRESHOLD, MAX_SWIPE],
          [0, 1],
          Extrapolate.CLAMP
        );
        leftActionsOpacity.value = 0;
      } else {
        leftActionsOpacity.value = 0;
        rightActionsOpacity.value = 0;
      }
    })
    .onEnd((event) => {
      if (isProgressDragging) return;
      
      const { translationX, velocityX } = event;
      
      // Check if swipe should stay open
      const distanceExceedsThreshold = Math.abs(translationX) > SWIPE_THRESHOLD;
      const velocityExceedsThreshold = Math.abs(velocityX) > 200;
      
      if (distanceExceedsThreshold || velocityExceedsThreshold) {
        // Stay open - snap to full open position
        if (translationX > 0) {
          translateX.value = withSpring(MAX_SWIPE);
          leftActionsOpacity.value = withSpring(1);
        } else {
          translateX.value = withSpring(-MAX_SWIPE);
          rightActionsOpacity.value = withSpring(1);
        }
      } else {
        // Snap back to closed position
        translateX.value = withSpring(0, {
          damping: 25,
          stiffness: 180,
          mass: 1,
        });
        leftActionsOpacity.value = withSpring(0);
        rightActionsOpacity.value = withSpring(0);
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const leftActionsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: leftActionsOpacity.value,
    };
  });

  const rightActionsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: rightActionsOpacity.value,
    };
  });

  // Action handlers
  const handleTranscribeAction = useCallback(() => {
    // If file already has transcript, navigate to viewer instead of re-transcribing
    if (file.hasTranscript) {
      console.log('📖 File already has transcript, navigating to viewer');
      onPress(); // Use the main onPress handler to navigate to viewer
      return;
    }
    
    if (!file || !file.id) {
      Alert.alert('Error', 'File reference lost. Please refresh the library and try again.');
      return;
    }
    
    setIsIconPressed(true);
    setTimeout(() => setIsIconPressed(false), 150);
    resetSwipe();
    
    onTranscribe(file);
  }, [file, onTranscribe]);

  const handleTagAction = useCallback(() => {
    setShowTagManagerModal(true);
  }, [file.name]);

  const handleMoveAction = useCallback(() => {
    setShowFolderPickerModal(true);
  }, [file.name]);

  const handleRenameAction = useCallback(() => {
    resetSwipe();
    setShowRenameModal(true);
  }, []);

  const handleRenameConfirm = useCallback((newName: string) => {
    setShowRenameModal(false);
    onRename(file, newName);
  }, [file, onRename]);

  const handleTagSave = useCallback(async (selectedTagIds: string[]) => {
    try {
      await RecordingsStore.updateRecordingTags(file.id, selectedTagIds);
      // The file will be updated through the store change listener
      setShowTagManagerModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update tags');
    }
  }, [file.id]);

  const handleFolderMove = useCallback(async (folderId: string | null) => {
    try {
      await RecordingsStore.moveRecordingToFolder(file.id, folderId);
      // The file will be updated through the store change listener
      setShowFolderPickerModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to move to folder');
    }
  }, [file.id]);

  const handlePlayPausePress = async (e: any) => {
    e.stopPropagation();
    onPlayPause?.(file.id);
  };

  const handleSharePress = (e: any) => {
    e.stopPropagation();
    onShare?.(file);
  };

  const handleMorePress = (e: any) => {
    e.stopPropagation();
    setShowDropdown(true);
  };

  const handleProgressPress = (event: any) => {
    if (!file.duration) return;
    
    const progressContainer = event.currentTarget;
    const rect = progressContainer.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progressWidth = rect.width;
    const clickPercentage = clickX / progressWidth;
    const newTime = clickPercentage * file.duration;
    
    setLocalCurrentTime(newTime);
    onSeek?.(file.id, newTime);
  };

  const handleMouseDown = (event: any) => {
    setIsProgressDragging(true);
    handleProgressPress(event);
    event.preventDefault();
    event.stopPropagation();
  };

  const handleMouseMove = (event: any) => {
    if (isProgressDragging) {
      handleProgressPress(event);
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleMouseUp = () => {
    setIsProgressDragging(false);
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (isProgressDragging) {
      const handleGlobalMouseUp = () => {
        setIsProgressDragging(false);
      };

      const handleGlobalMouseMove = (event: MouseEvent) => {
        if (isProgressDragging && file.duration) {
          const progressContainer = document.querySelector(`[data-progress-${file.id}]`);
          if (progressContainer) {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
            const progressWidth = rect.width;
            const clickPercentage = clickX / progressWidth;
            const newTime = clickPercentage * file.duration;

            setLocalCurrentTime(newTime);
            onSeek?.(file.id, newTime);
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
  }, [isProgressDragging, file.duration, file.id, onSeek]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Use local current time during dragging for immediate feedback
  const displayTime = isProgressDragging ? localCurrentTime : currentTime;
  const progressPercentage = file.duration && file.duration > 0 
    ? (displayTime / file.duration) * 100 
    : 0;

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.swipeContainer}>
          {/* Left Actions */}
          <Animated.View style={[styles.leftActions, leftActionsAnimatedStyle]}>
            {leftActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.swipeAction, { backgroundColor: action.backgroundColor }]}
                onPress={action.onPress}
              >
                {action.icon}
                <Text style={[styles.swipeActionText, { color: action.color }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Right Actions */}
          <Animated.View style={[styles.rightActions, rightActionsAnimatedStyle]}>
            {rightActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.swipeAction, { backgroundColor: action.backgroundColor }]}
                onPress={action.onPress}
              >
                {action.icon}
                <Text style={[styles.swipeActionText, { color: action.color }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Main Card */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.card, cardAnimatedStyle]}>
                <BlurView intensity={18} style={styles.cardBlur}>
                  <View style={[styles.content, collapsed && styles.collapsedContent]}>
                    {/* Main Content Container */}
                    <View style={styles.mainContentContainer}>
                      {/* Header Row with Darker Background */}
                      <View style={[styles.headerRowWrapper, collapsed && styles.collapsedHeaderRowWrapper]}>
                        <BlurView intensity={18} style={styles.headerRowBackground}>
                          <View style={styles.headerRow}>
                            <View style={styles.fileNameContainer}> 
                              <TouchableOpacity
                                style={styles.fileNameTouchable}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  onPress(); 
                                }}
                                activeOpacity={0.7}
                              >
                                <View style={styles.fileIconWrapper}>
                                  <FileAudio size={20} color="#f4ad3d" strokeWidth={1.5} />
                                </View>
                                <Text style={styles.fileName} numberOfLines={2}>
                                  {file.name}
                                </Text>
                              </TouchableOpacity>
                            </View>
                            
                            <View style={styles.rightIcons}>
                              <TouchableOpacity 
                                style={styles.moreButton} 
                                onPress={handleMorePress}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.moreIcon}>⋯</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </BlurView>
                      </View>

                  {!collapsed && (
                    <>
                      {/* Status Badge and Metadata Row */}
                      <View style={styles.statusAndMetadataRow}>
                        <View style={styles.statusBadgeContainer}>
                          {file.hasTranscript ? (
                            <TouchableOpacity
                              style={styles.statusBadge}
                              onPress={(e) => {
                                e.stopPropagation();
                                onPress(); // Navigate to viewer
                              }}
                              activeOpacity={0.7}
                            >
                              <CheckCircle size={14} color="#10B981" strokeWidth={2} />
                              <Text style={styles.statusBadgeText}>Transcribed</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity 
                              style={styles.transcribeItBadge}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleTranscribeAction();
                              }}
                              activeOpacity={0.7}
                            >
                              <FileText size={14} color="#f4ad3d" strokeWidth={2} />
                              <Text style={styles.transcribeItBadgeText}>Transcribe it</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        
                        <View style={styles.combinedInfoBlock}>
                          <View style={styles.metadataBadgesContainer}>
                            <View style={styles.fileSizeBadge}>
                              <Text style={styles.fileSizeBadgeText}>
                                {formatFileSize(file.fileSize || 0)}
                              </Text>
                            </View>
                            <View style={styles.durationBadge}>
                              <Text style={styles.durationBadgeText}>
                                {formatDuration(file.duration)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.dateText}>
                            {formatDate(file.importDate)}
                          </Text>
                        </View>
                      </View>

                      {/* Tags Row */}
                      {fileTags.length > 0 && (
                        <View style={styles.tagsRow}>
                          <TagChips tags={fileTags} maxVisible={3} />
                        </View>
                      )}

                      {/* Playback Controls */}
                      <View style={styles.playbackRow}>
                        <TouchableOpacity
                          style={styles.playButton}
                          onPress={handlePlayPausePress}
                          activeOpacity={0.8}
                        >
                          <BlurView intensity={18} style={styles.playButtonBlur}>
                            {isPlaying ? (
                              <Pause size={24} color="#FFFFFF" strokeWidth={1.5} />
                            ) : (
                              <Play size={24} color="#FFFFFF" strokeWidth={1.5} />
                            )}
                          </BlurView>
                        </TouchableOpacity>
                        
                        {/* Progress Bar */}
                        <View
                          style={styles.progressContainer}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          data-progress-container={file.id}
                        >
                          <View style={styles.progressTrack}>
                            <View style={styles.progressBackground} />
                            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                            <View
                              style={[styles.progressThumb, { left: `${progressPercentage}%` }]}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsProgressDragging(true);
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    </>
                  )}

                    </View>
                  </View>
                    {!collapsed && (
                      <View style={styles.featureBadgesRow}>
                        <BlurView intensity={18} style={styles.featureBadgesBlur}>
                          <View style={styles.featureBadgesInner}>
                          <FileText 
                            size={26} 
                            color="rgba(255, 255, 255, 0.5)" 
                            strokeWidth={1.5}
                            accessibilityLabel="View Transcript"
                          />
                          <File 
                            size={26} 
                            color="rgba(255, 255, 255, 0.5)" 
                            strokeWidth={1.5}
                            accessibilityLabel="View Raw File"
                          />
                          <TagIcon 
                            size={26} 
                            color="rgba(255, 255, 255, 0.5)" 
                            strokeWidth={1.5}
                            accessibilityLabel="Manage Tags"
                          />
                          <FolderOpen 
                            size={26} 
                            color="rgba(255, 255, 255, 0.5)" 
                            strokeWidth={1.5}
                            accessibilityLabel="Manage Folders"
                          />
                          <Sparkles
                            size={26}
                            color="rgba(255, 255, 255, 0.5)"
                            strokeWidth={1.5}
                            accessibilityLabel="AI Tools"
                          />
                        </View>
                      </BlurView>
                    </View>
                    )}

                </BlurView>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>

      {/* Dropdown Menu */}
      <DropdownMenu
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        onTranscribe={handleTranscribeAction}
        onViewTranscript={onPress}
        onShare={() => {
          setShowDropdown(false);
          onShare?.(file);
        }}
        onRename={() => {
          setShowDropdown(false);
          setShowRenameModal(true);
        }}
        onTag={() => {
          setShowDropdown(false);
          setShowTagManagerModal(true);
        }}
        onMove={() => {
          setShowDropdown(false);
          setShowFolderPickerModal(true);
        }}
        onDeleteAudio={() => {
          setShowDropdown(false);
          setShowDeleteAudioModal(true);
        }}
        onDeleteTranscription={() => {
          setShowDropdown(false);
          setShowDeleteTranscriptionModal(true);
        }}
        hasTranscript={file.hasTranscript || false}
      />

      {/* Delete Audio Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteAudioModal}
        title="Delete Audio?"
        message="This will permanently delete the audio file and its associated transcription. Are you sure?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          setShowDeleteAudioModal(false);
          onDeleteAudio(file);
        }}
        onCancel={() => setShowDeleteAudioModal(false)}
        isDestructive={true}
      />

      {/* Delete Transcription Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteTranscriptionModal}
        title="Delete Transcription?"
        message="This will permanently delete the transcription. The audio file will remain. Are you sure?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          setShowDeleteTranscriptionModal(false);
          onDeleteTranscription(file);
        }}
        onCancel={() => setShowDeleteTranscriptionModal(false)}
        isDestructive={true}
      />

      {/* Rename Modal */}
      <RenameModal
        visible={showRenameModal}
        currentName={file.name}
        onConfirm={handleRenameConfirm}
        onCancel={() => setShowRenameModal(false)}
      />

      {/* Tag Manager Modal */}
      <TagManagerModal
        visible={showTagManagerModal}
        onClose={() => setShowTagManagerModal(false)}
        onSave={handleTagSave}
        currentTagIds={file.tags || []}
        recordingName={file.name}
      />

      {/* Folder Picker Modal */}
      <FolderPickerModal
        visible={showFolderPickerModal}
        onClose={() => setShowFolderPickerModal(false)}
        onMove={handleFolderMove}
        currentFolderId={file.folderId || null}
        recordingName={file.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 0,
    marginHorizontal: 12,
    paddingHorizontal: 0,
  },
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  leftActions: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  rightActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  swipeAction: {
    width: 80,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBlur: {
    flex: 1,
    // BlurView intensity will be applied directly in the component
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  collapsedContent: {
    paddingVertical: 0,
  },
  mainContentContainer: {
    width: '100%',
  },
  headerRowWrapper: {
    marginHorizontal: -20, // Counteracts the paddingHorizontal: 20 from styles.content
    marginTop: -18,      // Counteracts the paddingTop (part of paddingVertical: 18) from styles.content
    paddingBottom: 0,   // Adds space below the header, replacing the old marginBottom
    marginBottom: 16,
  },
  collapsedHeaderRowWrapper: {
    marginTop: 0,
    marginBottom: 0,
  },
  headerRowBackground: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  fileNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  fileNameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statusBadgeRow: {
    // Removed - now part of statusAndMetadataRow
  },
  statusBadgeContainer: {
    // Container for status badge only
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  transcribeItBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  transcribeItBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  statusAndMetadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center', // Match speed button background
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderWidth: 1, // Add border
    borderColor: 'rgba(244, 173, 61, 0.25)', // Add border color
  },
  moreIcon: {
    fontSize: 20,
    color: '#f4ad3d', // Orange icon color
    fontWeight: '900',
  },
  tagsRow: {
    marginBottom: 16,
  },
  combinedInfoBlock: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  playButtonBlur: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  progressContainer: {
    flex: 1,
    height: 20, // Match AudioPlayerModule height
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
  },
  progressTrack: {
    height: 6,
    height: 4, // Match AudioPlayerModule height
    borderRadius: 2, // Match AudioPlayerModule radius
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Match AudioPlayerModule background
    borderRadius: 2, // Match AudioPlayerModule radius
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#f4ad3d', // Orange fill
    borderRadius: 2, // Match AudioPlayerModule radius
  },
  progressThumb: {
    position: 'absolute',
    top: -4, // Adjust position based on track height
    width: 12, // Match AudioPlayerModule size
    height: 12, // Match AudioPlayerModule size
    borderRadius: 6, // Match AudioPlayerModule radius
    backgroundColor: '#f4ad3d', // Orange thumb
    marginLeft: -6, // Center the thumb
    shadowColor: '#f4ad3d', // Orange shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  metadataBadgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  fileSizeBadge: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFA726',
  },
  fileSizeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFA726',
    fontVariant: ['tabular-nums'],
  },
  durationBadge: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFA726',
  },
  durationBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFA726',
    fontVariant: ['tabular-nums'],
  },
  featureBadgesRow: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBadgesBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  featureBadgesInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    justifyContent: 'space-around',
  },
  // Dropdown styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
  dropdownContainer: {
    width: 200,
    position: 'relative',
    zIndex: 9999,
  },
  dropdownMenu: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10000,
  },
  dropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemPrimary: {
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    position: 'relative',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemDisabled: {
    opacity: 0.5,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dropdownItemTextPrimary: {
    color: '#f4ad3d',
    fontWeight: '600',
  },
  dropdownItemTranscribed: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  dropdownItemTextTranscribed: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  dropdownItemTextDanger: {
    color: '#EF4444',
  },
  primaryGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(244, 173, 61, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#f4ad3d',
  },
});