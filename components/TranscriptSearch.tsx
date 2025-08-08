import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Search, X, ChevronUp, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react-native';
import Fuse from 'fuse.js';
import { TranscriptSegment } from '@/types/transcript';

interface SearchMatch {
  segment: TranscriptSegment;
  matches: Array<{
    indices: [number, number][];
    value: string;
  }>;
  score: number;
}

interface TranscriptSearchProps {
  segments: TranscriptSegment[];
  onMatchSelect: (segment: TranscriptSegment, matchIndex: number) => void;
  onClose: () => void;
  visible: boolean;
}

export default function TranscriptSearch({ 
  segments, 
  onMatchSelect, 
  onClose, 
  visible 
}: TranscriptSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [fuzzySearchEnabled, setFuzzySearchEnabled] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);

  // Configure Fuse.js for fuzzy search
  const fuseOptions = {
    threshold: 0.3, // 0.0 = exact match, 1.0 = match anything
    keys: ['text'],
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  };

  const fuse = useMemo(() => new Fuse(segments, fuseOptions), [segments]);

  // Perform search when query or fuzzy setting changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentMatchIndex(0);
      return;
    }

    if (fuzzySearchEnabled) {
      // Use Fuse.js for fuzzy search
      const results = fuse.search(searchQuery);
      const matches: SearchMatch[] = results.map(result => ({
        segment: result.item,
        matches: result.matches || [],
        score: result.score || 0,
      }));
      setSearchResults(matches);
    } else {
      // Use exact string matching
      const exactMatches: SearchMatch[] = segments
        .filter(segment => 
          segment.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(segment => {
          const lowerText = segment.text.toLowerCase();
          const lowerQuery = searchQuery.toLowerCase();
          const startIndex = lowerText.indexOf(lowerQuery);
          
          return {
            segment,
            matches: [{
              indices: [[startIndex, startIndex + searchQuery.length - 1]] as [number, number][],
              value: segment.text,
            }],
            score: 0,
          };
        });
      setSearchResults(exactMatches);
    }
    
    setCurrentMatchIndex(0);
  }, [searchQuery, fuzzySearchEnabled, segments, fuse]);

  const navigateToMatch = (direction: 'next' | 'previous') => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentMatchIndex === 0 ? searchResults.length - 1 : currentMatchIndex - 1;
    }

    setCurrentMatchIndex(newIndex);
    const match = searchResults[newIndex];
    
    // Navigate to the exact matched segment
    onMatchSelect(match.segment, newIndex);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentMatchIndex(0);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <BlurView intensity={20} style={styles.searchCard}>
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <View style={styles.searchInputContainer}>
            <Search size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transcript..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <X size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Fuzzy Search Toggle */}
        <View style={styles.optionsRow}>
          <TouchableOpacity 
            style={styles.fuzzyToggle}
            onPress={() => setFuzzySearchEnabled(!fuzzySearchEnabled)}
          >
            {fuzzySearchEnabled ? (
              <ToggleRight size={20} color="#f4ad3d" strokeWidth={1.5} />
            ) : (
              <ToggleLeft size={20} color="rgba(255, 255, 255, 0.4)" strokeWidth={1.5} />
            )}
            <Text style={[
              styles.fuzzyToggleText,
              fuzzySearchEnabled && styles.fuzzyToggleTextActive
            ]}>
              Fuzzy Search
            </Text>
          </TouchableOpacity>

          {/* Results Counter */}
          {searchResults.length > 0 && (
            <Text style={styles.resultsCounter}>
              {currentMatchIndex + 1} of {searchResults.length}
            </Text>
          )}
        </View>

        {/* Navigation Controls */}
        {searchResults.length > 0 && (
          <View style={styles.navigationRow}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigateToMatch('previous')}
            >
              <BlurView intensity={15} style={styles.navButtonBlur}>
                <ChevronUp size={16} color="#f4ad3d" strokeWidth={1.5} />
                <Text style={styles.navButtonText}>Previous</Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigateToMatch('next')}
            >
              <BlurView intensity={15} style={styles.navButtonBlur}>
                <ChevronDown size={16} color="#f4ad3d" strokeWidth={1.5} />
                <Text style={styles.navButtonText}>Next</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        )}

        {/* No Results Message */}
        {searchQuery.length > 0 && searchResults.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No matches found</Text>
            <Text style={styles.noResultsSubtext}>
              Try {fuzzySearchEnabled ? 'disabling fuzzy search' : 'enabling fuzzy search'} or different keywords
            </Text>
          </View>
        )}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 24,
  },
  searchCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fuzzyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fuzzyToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  fuzzyToggleTextActive: {
    color: '#f4ad3d',
  },
  resultsCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    fontVariant: ['tabular-nums'],
  },
  navigationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  navButtonBlur: {
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.2)',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4ad3d',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});