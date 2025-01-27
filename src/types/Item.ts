import { BaseDocument } from './BaseDocument';
import { Category } from './Category';

export interface Item extends Pick<BaseDocument, 'id'> {
  name: string;
  description: string | null;
  price: number;
  cost: string | null;
  category: Category | null;
}
