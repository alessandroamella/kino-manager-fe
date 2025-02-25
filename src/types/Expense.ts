export interface Expense {
  id: number;
  userId: number;
  description: string;
  amount: number;
  repaid: boolean;
  expenseDate: Date;
  imageR2Key: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExpense = Pick<
  Expense,
  'userId' | 'description' | 'amount' | 'repaid' | 'expenseDate'
> & { imageBase64: string | null };
