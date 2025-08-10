import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, ChevronDown, FileText, MessageCircle, Tag, MapPin, Loader as Loader2, Copy, ExternalLink } from 'lucide-react-native';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import SummaryDropdown from '@/components/SummaryDropdown';
import { useAudioFiles } from '@/hooks/useAudioFiles';
import { TranscriptService } from '@/services/transcriptService';
import { SummaryStylesService } from '@/services/summaryStylesService';
import { Transcript } from '@/types/transcript';
import { SummaryStyle } from '@/types/summary';

interface AIResult {
  id: string;
  type: 'summary' | 'question' | 'tags' | 'highlights';
  content: string;
  timestamp?: number;
  expanded: boolean;
}

export default function AIToolsScreen() {
  const { files } = useAudioFiles();
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<AIResult[]>([]);
  const [autoTagEnabled, setAutoTagEnabled] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [showSummaryDropdown, setShowSummaryDropdown] = useState(false);
  const [selectedSummaryStyle, setSelectedSummaryStyle] = useState<SummaryStyle | null>(null);

  useEffect(() => {
    if (selectedTranscriptId) {
      loadSelectedTranscript();
    }
  }, [selectedTranscriptId]);

  useEffect(() => {
    // Initialize default summary styles when component mounts
    initializeSummaryStyles();
  }, []);

  const initializeSummaryStyles = async () => {
    try {
      await SummaryStylesService.initializeDefaultStyles();
    } catch (error) {
      console.error('Failed to initialize summary styles:', error);
    }
  };

  const loadSelectedTranscript = async () => {
    if (!selectedTranscriptId) return;
    
    try {
      const transcript = await TranscriptService.getTranscriptByFileId(selectedTranscriptId);
      setSelectedTranscript(transcript);
    } catch (error) {
      Alert.alert('Error', 'Failed to load transcript');
    }
  };

  const setLoading = (toolId: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [toolId]: loading }));
  };

  const addResult = (type: AIResult['type'], content: string, timestamp?: number) => {
    const newResult: AIResult = {
      id: Date.now().toString(),
      type,
      content,
      timestamp,
      expanded: false,
    };
    setResults(prev => [newResult, ...prev]);
  };

  const toggleResultExpanded = (resultId: string) => {
    setResults(prev => prev.map(result => 
      result.id === resultId 
        ? { ...result, expanded: !result.expanded }
        : result
    ));
  };

  const handleSummarize = () => {
    if (!selectedTranscript) {
      Alert.alert('Error', 'Please select a transcript first');
      return;
    }

    // Show the summary style dropdown
    setShowSummaryDropdown(true);
  };

  const handleSummaryStyleSelect = async (style: SummaryStyle) => {
    if (!selectedTranscript) return;

    setSelectedSummaryStyle(style);
    setLoading('summarize', true);

    try {
      // Simulate AI processing with the selected style
      setTimeout(() => {
        const mockSummary = `**${style.title.toUpperCase()}**\n\nGenerated using "${style.title}" style:\n\nThis transcript discusses effective communication in professional settings. Key points include the importance of clarity, active listening, and thoughtful responses. The speakers emphasize that while digital tools have expanded communication options, fundamental principles of empathy and understanding remain crucial for successful interactions.\n\n*Summary generated with style: ${style.subtitle}*`;
        
        addResult('summary', mockSummary);
        setLoading('summarize', false);
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate summary');
      setLoading('summarize', false);
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedTranscript) {
      Alert.alert('Error', 'Please select a transcript first');
      return;
    }

    if (!questionText.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    setLoading('ask_question', true);
    
    // Simulate AI processing
    setTimeout(() => {
      const mockAnswer = `Based on the transcript, the main communication principles discussed are: clarity in speech, active listening, empathy, and understanding. The speakers emphasize that these fundamentals apply regardless of whether you're using digital tools or having face-to-face conversations.`;
      
      addResult('question', `Q: ${questionText}\n\nA: ${mockAnswer}`);
      setQuestionText('');
      setLoading('ask_question', false);
    }, 1500);
  };

  const handleAutoTag = async () => {
    if (!selectedTranscript) {
      Alert.alert('Error', 'Please select a transcript first');
      return;
    }

    setLoading('auto_tag', true);
    
    // Simulate AI processing
    setTimeout(() => {
      const mockTags = `#communication #professional #digital-tools #active-listening #empathy #presentation #workplace #skills`;
      
      addResult('tags', mockTags);
      setLoading('auto_tag', false);
    }, 1800);
  };

  const handleHighlightMoments = async () => {
    if (!selectedTranscript) {
      Alert.alert('Error', 'Please select a transcript first');
      return;
    }

    setLoading('highlight_moments', true);
    
    // Simulate AI processing
    setTimeout(() => {
      const mockHighlights = `🎯 0:05 - "Effective communication involves not just speaking clearly, but also listening actively"\n\n🎯 0:20 - "Clarity, empathy, and understanding are key to successful interactions"\n\n🎯 0:28 - "These principles will serve you well whether presenting to a large audience or having one-on-one conversations"`;
      
      addResult('highlights', mockHighlights);
      setLoading('highlight_moments', false);
    }, 2200);
  };

  const getSelectedFileName = () => {
    if (!selectedTranscriptId) return 'Select transcript';
    const file = files.find(f => f.id === selectedTranscriptId);
    return file?.name || 'Unknown file';
  };

  const getResultIcon = (type: AIResult['type']) => {
    switch (type) {
      case 'summary': return <FileText size={16} color="#f4ad3d" strokeWidth={1.5} />;
      case 'question': return <MessageCircle size={16} color="#f4ad3d" strokeWidth={1.5} />;
      case 'tags': return <Tag size={16} color="#f4ad3d" strokeWidth={1.5} />;
      case 'highlights': return <MapPin size={16} color="#f4ad3d" strokeWidth={1.5} />;
      default: return <FileText size={16} color="#f4ad3d" strokeWidth={1.5} />;
    }
  };

  const getResultTitle = (type: AIResult['type']) => {
    switch (type) {
      case 'summary': return 'Summary';
      case 'question': return 'Q&A';
      case 'tags': return 'Tags & Categories';
      case 'highlights': return 'Key Moments';
      default: return 'Result';
    }
  };

  return (
    <Layout>
      <Header 
        title="AI Tools" 
        rightIcon={<Settings size={20} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />}
        onRightIconPress={() => {
          Alert.alert('Settings', 'AI settings coming soon');
        }}
      />

      {/* Transcript Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Select Transcript</Text>
        <TouchableOpacity 
          style={styles.dropdown} 
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <BlurView intensity={20} style={styles.dropdownBlur}>
            <Text style={styles.dropdownText} numberOfLines={1}>
              {getSelectedFileName()}
            </Text>
            <ChevronDown 
              size={20} 
              color="rgba(255, 255, 255, 0.6)" 
              strokeWidth={1.5}
              style={[styles.chevron, showDropdown && styles.chevronRotated]}
            />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* AI Features */}
      <View style={styles.featuresContainer}>
        {/* Summarize */}
        <View style={styles.featureCard}>
          <BlurView intensity={10} style={styles.featureCardBlur}>
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <FileText size={24} color="#f4ad3d" strokeWidth={1.5} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Summarize Transcript</Text>
                <Text style={styles.featureDescription}>
                  Generates a short summary of the full transcript
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleSummarize}
              disabled={!selectedTranscript || loadingStates.summarize}
            >
              <LinearGradient
                colors={['#f4ad3d', '#e09b2d']}
                style={[styles.actionButtonGradient, (!selectedTranscript || loadingStates.summarize) && styles.disabledButton]}
              >
                {loadingStates.summarize ? (
                  <Loader2 size={16} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Text style={styles.actionButtonText}>Generate</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Ask Question */}
        <View style={styles.featureCard}>
          <BlurView intensity={10} style={styles.featureCardBlur}>
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <MessageCircle size={24} color="#f4ad3d" strokeWidth={1.5} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Ask a Question</Text>
                <Text style={styles.featureDescription}>
                  User can ask any question about the transcript
                </Text>
              </View>
            </View>
            <TextInput
              style={styles.questionInput}
              placeholder="What would you like to know?"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={questionText}
              onChangeText={setQuestionText}
              multiline={true}
            />
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleAskQuestion}
              disabled={!selectedTranscript || !questionText.trim() || loadingStates.ask_question}
            >
              <LinearGradient
                colors={['#f4ad3d', '#e09b2d']}
                style={[styles.actionButtonGradient, (!selectedTranscript || !questionText.trim() || loadingStates.ask_question) && styles.disabledButton]}
              >
                {loadingStates.ask_question ? (
                  <Loader2 size={16} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Text style={styles.actionButtonText}>Ask</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Auto-Tag */}
        <View style={styles.featureCard}>
          <BlurView intensity={10} style={styles.featureCardBlur}>
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <Tag size={24} color="#f4ad3d" strokeWidth={1.5} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Auto-Tag & Categorize</Text>
                <Text style={styles.featureDescription}>
                  AI pulls out keywords, categories, or labels
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.toggleContainer}
                onPress={() => setAutoTagEnabled(!autoTagEnabled)}
              >
                <View style={[styles.toggle, autoTagEnabled && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, autoTagEnabled && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleAutoTag}
              disabled={!selectedTranscript || !autoTagEnabled || loadingStates.auto_tag}
            >
              <LinearGradient
                colors={['#f4ad3d', '#e09b2d']}
                style={[styles.actionButtonGradient, (!selectedTranscript || !autoTagEnabled || loadingStates.auto_tag) && styles.disabledButton]}
              >
                {loadingStates.auto_tag ? (
                  <Loader2 size={16} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Text style={styles.actionButtonText}>Generate</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Highlight Moments */}
        <View style={styles.featureCard}>
          <BlurView intensity={10} style={styles.featureCardBlur}>
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <MapPin size={24} color="#f4ad3d" strokeWidth={1.5} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Highlight Key Moments</Text>
                <Text style={styles.featureDescription}>
                  AI scans and marks notable quotes or timestamps
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.toggleContainer}
                onPress={() => setHighlightEnabled(!highlightEnabled)}
              >
                <View style={[styles.toggle, highlightEnabled && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, highlightEnabled && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleHighlightMoments}
              disabled={!selectedTranscript || !highlightEnabled || loadingStates.highlight_moments}
            >
              <LinearGradient
                colors={['#f4ad3d', '#e09b2d']}
                style={[styles.actionButtonGradient, (!selectedTranscript || !highlightEnabled || loadingStates.highlight_moments) && styles.disabledButton]}
              >
                {loadingStates.highlight_moments ? (
                  <Loader2 size={16} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Text style={styles.actionButtonText}>Highlight</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>

      {/* Results Section */}
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results</Text>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.resultCard}>
                <BlurView intensity={15} style={styles.resultCardBlur}>
                  <TouchableOpacity 
                    style={styles.resultHeader}
                    onPress={() => toggleResultExpanded(item.id)}
                  >
                    <View style={styles.resultHeaderLeft}>
                      {getResultIcon(item.type)}
                      <Text style={styles.resultTitle}>{getResultTitle(item.type)}</Text>
                    </View>
                    <ChevronDown 
                      size={16} 
                      color="rgba(255, 255, 255, 0.6)" 
                      strokeWidth={1.5}
                      style={[styles.resultChevron, item.expanded && styles.resultChevronRotated]}
                    />
                  </TouchableOpacity>
                  
                  {item.expanded && (
                    <View style={styles.resultContent}>
                      <Text style={styles.resultText}>{item.content}</Text>
                      <View style={styles.resultActions}>
                        <TouchableOpacity 
                          style={styles.resultActionButton}
                          onPress={() => Alert.alert('Copy', 'Copied to clipboard')}
                        >
                          <Copy size={14} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
                          <Text style={styles.resultActionText}>Copy</Text>
                        </TouchableOpacity>
                        {item.timestamp && (
                          <TouchableOpacity 
                            style={styles.resultActionButton}
                            onPress={() => Alert.alert('Jump', `Jump to ${item.timestamp}s`)}
                          >
                            <ExternalLink size={14} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
                            <Text style={styles.resultActionText}>Jump to</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </BlurView>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        </View>
      )}

      {/* Dropdown Options - Positioned absolutely to appear above everything */}
      {showDropdown && (
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownOptions}>
            <BlurView intensity={20} style={styles.dropdownOptionsBlur}>
              {files.length === 0 ? (
                <Text style={styles.noFilesText}>No transcripts available</Text>
              ) : (
                files.map((file) => (
                  <TouchableOpacity
                    key={file.id}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedTranscriptId(file.id);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText} numberOfLines={1}>
                      {file.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </BlurView>
          </View>
        </View>
      )}

      {/* Summary Style Dropdown */}
      <SummaryDropdown
        visible={showSummaryDropdown}
        onClose={() => setShowSummaryDropdown(false)}
        onStyleSelect={handleSummaryStyleSelect}
        selectedStyleId={selectedSummaryStyle?.id || null}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  selectorContainer: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dropdown: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  dropdownBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    paddingHorizontal: 24,
    paddingTop: 120, // Position below the selector
  },
  dropdownOptions: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownOptionsBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  noFilesText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    padding: 16,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 24,
  },
  featureCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  featureCardBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  toggleContainer: {
    marginLeft: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#f4ad3d',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  questionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minHeight: 44,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultCardBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  resultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultChevron: {
    marginLeft: 8,
  },
  resultChevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  resultContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 12,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resultActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  resultActionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
});