import { BaseDocument } from './BaseDocument';
import { Item } from './Item';

export interface Category extends Pick<BaseDocument, 'id'> {
  name: string;
  description?: string | null;
  imageUrl: string | null;
}

export interface CategoryWithItems extends Category {
  items: Item[];
}
