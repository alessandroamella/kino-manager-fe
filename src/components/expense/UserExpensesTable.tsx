import { getUserStr } from '@/lib/utils';
import { Expense } from '@/types/Expense';
import { Member } from '@/types/Member';
import {
  Alert,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { clamp } from 'lodash';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Price from '../items/Price';

interface UserExpenseSummary {
  userId: number;
  totalAmount: number;
  user: Member | undefined;
}

const UserExpensesTable = ({
  expenses,
  loading,
  error,
  users,
}: {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  users: Member[];
}) => {
  const getUserById = useCallback(
    (userId: number) => {
      return users.find((user) => user.id === userId);
    },
    [users],
  );

  const { t } = useTranslation();

  // Aggregate expenses by user
  const userExpensesSummary: { [userId: number]: UserExpenseSummary } = expenses
    .filter((e) => !e.repaid)
    .reduce((summary: { [userId: number]: UserExpenseSummary }, expense) => {
      const userId = expense.userId;
      if (!summary[userId]) {
        summary[userId] = {
          userId: userId,
          totalAmount: 0,
          user: getUserById(userId),
        };
      }
      summary[userId].totalAmount += expense.amount;
      return summary;
    }, {});

  // Convert the summary object to an array for table rendering
  const userExpenseData: UserExpenseSummary[] =
    Object.values(userExpensesSummary);

  return (
    <>
      {error && (
        <Alert color="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="w-full overflow-x-auto max-w-[92vw] md:max-w-[94vw]">
        <Table
          isVirtualized
          rowHeight={50}
          maxTableHeight={clamp(userExpenseData.length, 1, 4) * 100}
          isStriped
          className="table"
          aria-label={t('expenses.userTable.ariaLabel')}
        >
          <TableHeader>
            <TableColumn>{t('expenses.userTable.user')}</TableColumn>
            <TableColumn>{t('expenses.userTable.totalAmount')}</TableColumn>
          </TableHeader>
          <TableBody
            items={userExpenseData}
            isLoading={loading}
            loadingContent={<p>{t('expenses.userTable.loading')}</p>}
            emptyContent={<p>{t('expenses.userTable.empty')}</p>}
          >
            {(item) => {
              return (
                <TableRow key={item.userId}>
                  <TableCell>
                    {item.user ? getUserStr(item.user) : `#${item.userId}`}
                  </TableCell>
                  <TableCell>
                    <Price price={item.totalAmount} round={false} />
                  </TableCell>
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default UserExpensesTable;
