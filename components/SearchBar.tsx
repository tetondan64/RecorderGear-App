import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Search, X } from 'lucide-react-native';

interface SearchBarProps {
  visible: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  placeholder?: string;
}

export default function SearchBar({ 
  visible, 
  query, 
  onQueryChange, 
  onClose,
  placeholder = "Search recordings..."
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      // Focus input after search bar opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const handleClearQuery = () => {
    onQueryChange('');
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <BlurView intensity={20} style={styles.searchCard}>
        <View style={styles.searchInputContainer}>
          <Search size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={query}
            onChangeText={onQueryChange}
            autoFocus={true}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearQuery}>
              <X size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={18} color="rgba(255, 255, 255, 0.7)" strokeWidth={1.5} />
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
});