import { useState, useEffect, useCallback } from 'react';
import { Tag, TagFilter } from '@/types/tag';
import { TagService } from '@/services/tagService';
import { RecordingsStore } from '@/data/recordingsStore';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TagFilter>({
    selectedTagIds: [],
    selectedTags: [],
  });

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allTags = await RecordingsStore.getTags();
      setTags(allTags);
    } catch (err) {
      setError('Failed to load tags');
      console.error('Error loading tags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = useCallback(async (name: string) => {
    try {
      setError(null);
      
      const newTag = await RecordingsStore.createTag(name);
      setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteTag = useCallback(async (tagId: string) => {
    try {
      setError(null);
      
      await RecordingsStore.deleteTag(tagId);
      setTags(prev => prev.filter(t => t.id !== tagId));
      
      // Remove from active filter if deleted
      if (activeFilter.selectedTagIds.includes(tagId)) {
        setActiveFilter(prev => ({
          selectedTagIds: prev.selectedTagIds.filter(id => id !== tagId),
          selectedTags: prev.selectedTags.filter(tag => tag.id !== tagId),
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tag';
      setError(errorMessage);
      throw err;
    }
  }, [activeFilter.selectedTagIds]);

  const setTagsFilter = useCallback((selectedTags: Tag[]) => {
    setActiveFilter({
      selectedTagIds: selectedTags.map(tag => tag.id),
      selectedTags: selectedTags,
    });
  }, []);

  const removeTagFromFilter = useCallback((tagId: string) => {
    setActiveFilter(prev => ({
      selectedTagIds: prev.selectedTagIds.filter(id => id !== tagId),
      selectedTags: prev.selectedTags.filter(tag => tag.id !== tagId),
    }));
  }, []);

  const clearTagsFilter = useCallback(() => {
    setActiveFilter({
      selectedTagIds: [],
      selectedTags: [],
    });
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return {
    tags,
    loading,
    error,
    activeFilter,
    createTag,
    deleteTag,
    setTagsFilter,
    removeTagFromFilter,
    clearTagsFilter,
    refreshTags: loadTags,
  };
}