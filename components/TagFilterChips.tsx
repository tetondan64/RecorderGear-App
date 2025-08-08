import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { Tag as TagIcon, X } from 'lucide-react-native';
import { Tag } from '@/types/tag';

interface TagFilterChipsProps {
  selectedTags: Tag[];
  onRemoveTag: (tagId: string) => void;
  onClearAll: () => void;
}

export default function TagFilterChips({ selectedTags, onRemoveTag, onClearAll }: TagFilterChipsProps) {
  if (selectedTags.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={selectedTags}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.chipContainer}>
            <BlurView intensity={18} style={styles.chip}>
              <View style={styles.chipContent}>
                <View style={[styles.tagDot, { backgroundColor: item.color || '#f4ad3d' }]} />
                <Text style={styles.chipText} numberOfLines={1}>
                  {item.name}
                </Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => onRemoveTag(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color="rgba(255, 255, 255, 0.7)" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        )}
        contentContainerStyle={styles.chipsList}
      />
      
      {selectedTags.length > 1 && (
        <TouchableOpacity 
          style={styles.clearAllButton}
          onPress={onClearAll}
        >
          <BlurView intensity={18} style={styles.clearAllBlur}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </BlurView>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipsList: {
    paddingRight: 12,
  },
  chipContainer: {
    marginRight: 8,
  },
  chip: {
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.3)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    maxWidth: 120,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4ad3d',
    flex: 1,
  },
  removeButton: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  clearAllButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  clearAllBlur: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
});