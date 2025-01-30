import { BaseDocument } from './BaseDocument';
import { Category } from './Category';

export interface Item extends Pick<BaseDocument, 'id'> {
  name: string;
  nameShort: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number;
  cost: string | null;
  category: Category | null;
}
