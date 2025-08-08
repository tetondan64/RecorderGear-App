import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { Tag } from '@/types/tag';

interface TagChipsProps {
  tags: Tag[];
  maxVisible?: number;
}

export default function TagChips({ tags, maxVisible = 3 }: TagChipsProps) {
  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = Math.max(0, tags.length - maxVisible);

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleTags}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.chipContainer}>
            <BlurView intensity={15} style={styles.chip}>
              <View style={[styles.tagDot, { backgroundColor: item.color || '#f4ad3d' }]} />
              <Text style={styles.chipText} numberOfLines={1}>
                {item.name}
              </Text>
            </BlurView>
          </View>
        )}
        contentContainerStyle={styles.chipsList}
      />
      
      {remainingCount > 0 && (
        <View style={styles.moreChipContainer}>
          <BlurView intensity={15} style={styles.moreChip}>
            <Text style={styles.moreChipText}>+{remainingCount}</Text>
          </BlurView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipsList: {
    paddingRight: 8,
  },
  chipContainer: {
    marginRight: 6,
  },
  chip: {
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f4ad3d',
    maxWidth: 60,
  },
  moreChipContainer: {
    marginLeft: 4,
  },
  moreChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  moreChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});