import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export function useFilePicker() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const pickAudioFile = async () => {
    if (isPickerOpen) return null;
    
    try {
      setIsPickerOpen(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: false,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file type
        const supportedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const supportedExtensions = ['mp3', 'wav', 'm4a', 'mp4'];
        
        if (!supportedTypes.includes(file.mimeType || '') && !supportedExtensions.includes(fileExtension || '')) {
          throw new Error('Unsupported format. Please select an audio file.');
        }

        return {
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
          mimeType: file.mimeType,
        };
      }
      
      return null;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to select file. Please try again.');
    } finally {
      setIsPickerOpen(false);
    }
  };

  return {
    pickAudioFile,
    isPickerOpen,
  };
}