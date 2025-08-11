import { Tag } from '@/types/tag';
import { StorageService } from './storageService';
import logger from '@/utils/logger';
import { generateUniqueId } from '@/utils/id';

export class TagService {
  private static readonly STORAGE_KEY = 'tags';

  // Predefined colors for tags
  private static readonly TAG_COLORS = [
    '#f4ad3d', // Orange
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#6366F1', // Indigo
  ];


  static getRandomColor(): string {
    return this.TAG_COLORS[Math.floor(Math.random() * this.TAG_COLORS.length)];
  }

  static async getAllTags(): Promise<Tag[]> {
    try {
      const tagsJson = await StorageService.getItem(this.STORAGE_KEY);
      if (!tagsJson) return [];
      
      const tags: Tag[] = JSON.parse(tagsJson);
      return tags.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      logger.error('Failed to get tags:', error);
      return [];
    }
  }

  static async createTag(name: string): Promise<Tag> {
    try {
      const trimmedName = name.trim();
      
      if (!trimmedName) {
        throw new Error('Tag name cannot be empty');
      }

      // Check for duplicates
      const existingTags = await this.getAllTags();
      const isDuplicate = existingTags.some(tag => 
        tag.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (isDuplicate) {
        throw new Error('A tag with this name already exists');
      }

      const newTag: Tag = {
        id: generateUniqueId(),
        name: trimmedName,
        createdAt: Date.now(),
        color: this.getRandomColor(),
      };

      const updatedTags = [...existingTags, newTag];
      await StorageService.setItem(this.STORAGE_KEY, JSON.stringify(updatedTags));
      
      logger.log('✅ Tag created:', newTag.name);
      return newTag;
    } catch (error) {
      logger.error('Failed to create tag:', error);
      throw error;
    }
  }

  static async deleteTag(tagId: string): Promise<void> {
    try {
      const tags = await this.getAllTags();
      const updatedTags = tags.filter(t => t.id !== tagId);
      await StorageService.setItem(this.STORAGE_KEY, JSON.stringify(updatedTags));
      
      logger.log('✅ Tag deleted:', tagId);
    } catch (error) {
      logger.error('Failed to delete tag:', error);
      throw error;
    }
  }

  static async renameTag(tagId: string, newName: string): Promise<Tag> {
    try {
      const trimmedName = newName.trim();
      
      if (!trimmedName) {
        throw new Error('Tag name cannot be empty');
      }

      const tags = await this.getAllTags();
      const tagToRename = tags.find(t => t.id === tagId);
      
      if (!tagToRename) {
        throw new Error('Tag not found');
      }

      // Check for duplicates (excluding current tag)
      const isDuplicate = tags.some(tag => 
        tag.id !== tagId && 
        tag.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (isDuplicate) {
        throw new Error('A tag with this name already exists');
      }

      const updatedTag: Tag = {
        ...tagToRename,
        name: trimmedName,
      };

      const updatedTags = tags.map(t => 
        t.id === tagId ? updatedTag : t
      );
      
      await StorageService.setItem(this.STORAGE_KEY, JSON.stringify(updatedTags));
      
      logger.log('✅ Tag renamed:', updatedTag.name);
      return updatedTag;
    } catch (error) {
      logger.error('Failed to rename tag:', error);
      throw error;
    }
  }
}