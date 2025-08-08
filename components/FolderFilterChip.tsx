import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Folder, X } from 'lucide-react-native';

interface FolderFilterChipProps {
  folderName: string;
  onClear: () => void;
}

export default function FolderFilterChip({ folderName, onClear }: FolderFilterChipProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={18} style={styles.chip}>
        <View style={styles.chipContent}>
          <Folder size={14} color="#f4ad3d" strokeWidth={1.5} />
          <Text style={styles.chipText} numberOfLines={1}>
            {folderName}
          </Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={12} color="rgba(255, 255, 255, 0.7)" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  chip: {
    backgroundColor: 'rgba(244, 173, 61, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.3)',
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    maxWidth: 200,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4ad3d',
    flex: 1,
  },
  clearButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});