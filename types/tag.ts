export interface Tag {
  id: string;
  name: string;
  createdAt: number;
  color?: string;
}

export interface TagFilter {
  selectedTagIds: string[];
  selectedTags: Tag[];
}