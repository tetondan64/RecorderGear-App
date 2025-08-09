import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Plus, Chrome as Home, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Layout from '@/components/Layout';
import { FolderExplorerProvider } from '@/context/FolderExplorerContext';
import FileExplorerContent, { FileExplorerContentHandles } from '@/components/FileExplorerContent';
import { FoldersAdapter } from '@/services/foldersAdapter';
import { AudioFile } from '@/types/audio';
import { Folder } from '@/types/folder';
import { RecordingsStore } from '@/data/recordingsStore';

export default function FileExplorerScreen() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<AudioFile[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [pathLoading, setPathLoading] = useState(true);
  const [folderPath, setFolderPath] = useState([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const explorerRef = useRef<FileExplorerContentHandles>(null);
  
  const adapter = FoldersAdapter.getInstance();

  useEffect(() => {
    loadRecordingsAndPath();
    
    // Debug: Log what we're loading
    console.log('🔍 FileExplorer: Loading content for folderId:', currentFolderId);
  }, [currentFolderId]);

  // Refresh content when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 FileExplorer: Screen focused, refreshing content');
      loadRecordings(); // Only load recordings here, path is handled by context
    }, [currentFolderId]) // Depend on currentFolderId
  );

  const loadRecordingsAndPath = async () => {
    try {
      setPathLoading(true);
      
      console.log('🔍 FileExplorer: Starting to load folder content for:', currentFolderId);
      
      // Load recordings and path for current location
      const [recordingsData, pathData] = await Promise.all([
        adapter.getRecordingsInFolder(currentFolderId),
        adapter.getPath(currentFolderId)
      ]);
      
      console.log('🔍 FileExplorer: Loaded data:', {
        recordingsCount: recordingsData.length,
        pathLength: pathData.length
      });
      
      setRecordings(recordingsData);
      setFolderPath(pathData);
    } catch (error) {
      console.error('Failed to load folder content:', error);
      Alert.alert('Error', 'Failed to load folder content');
    } finally {
      setRecordingsLoading(false);
      setPathLoading(false);
    }
  };

  const loadRecordings = async () => {
    try {
      const recordingsData = await adapter.getRecordingsInFolder(currentFolderId);
      setRecordings(recordingsData);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleFolderPress = (folder: Folder) => {
    setCurrentFolderId(folder.id);
  };

  const handleBreadcrumbPress = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const renderBreadcrumbs = () => {
    const breadcrumbs = [
      { id: null, name: 'Root' },
      ...folderPath
    ];

    return (
      <View style={styles.breadcrumbsContainer}>
        <FlatList
          data={breadcrumbs}
          keyExtractor={(item) => item.id || 'root'}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={styles.breadcrumbItem}>
              <TouchableOpacity
                style={styles.breadcrumbButton}
                onPress={() => handleBreadcrumbPress(item.id)}
              >
                {index === 0 ? (
                  <Home size={16} color="#f4ad3d" strokeWidth={1.5} />
                ) : null}
                <Text style={[
                  styles.breadcrumbText,
                  index === breadcrumbs.length - 1 && styles.breadcrumbTextActive
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
              
              {index < breadcrumbs.length - 1 && (
                <ChevronRight size={14} color="rgba(255, 255, 255, 0.4)" strokeWidth={1.5} />
              )}
            </View>
          )}
          contentContainerStyle={styles.breadcrumbsList}
        />
      </View>
    );
  };

  const renderContent = () => {
    return (
      <Layout>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>File Explorer</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => explorerRef.current?.openNewFolderModal()}
          >
            <Plus size={20} color="#f4ad3d" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Breadcrumbs */}
        {renderBreadcrumbs()}

        {/* Content */}
        <View style={styles.contentContainer}>
          <FolderExplorerProvider parentId={currentFolderId}> {/* Wrap with provider */}
            <FileExplorerContent
              ref={explorerRef}
              recordings={recordings}
              recordingsLoading={recordingsLoading}
              pathLoading={pathLoading}
              currentFolderId={currentFolderId}
              onFolderPress={(folder) => setCurrentFolderId(folder.id)}
            />
          </FolderExplorerProvider>
        </View>
      </Layout>
    );
  };

  return renderContent();
}

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 173, 61, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 173, 61, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breadcrumbsContainer: {
    marginBottom: 20,
  },
  breadcrumbsList: {
    paddingHorizontal: 4,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    gap: 6,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    maxWidth: 120,
  },
  breadcrumbTextActive: {
    color: '#f4ad3d',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
});