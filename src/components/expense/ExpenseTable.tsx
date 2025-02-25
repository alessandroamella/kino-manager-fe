import { Expense } from '@/types/Expense';
import { Member } from '@/types/Member';
import {
  Alert,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tooltip,
} from '@heroui/react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCheckCircle,
  FaExternalLinkAlt,
  FaMoneyBill,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import Price from '../items/Price';
import ViewExpensePictureModal from './ExpensePictureModal';
import { getUserStr } from '@/lib/utils';

const ExpenseTable = ({
  expenses,
  loading,
  error,
  users,
  deleteExpense,
  markExpenseAsRepaid,
}: {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  users: Member[];
  deleteExpense: (expenseId: number) => void;
  markExpenseAsRepaid: (expenseId: number, repaid: boolean) => void;
}) => {
  const getUserById = useCallback(
    (userId: number) => {
      return users.find((user) => user.id === userId);
    },
    [users],
  );

  const { t } = useTranslation();

  const [viewingPicture, setViewingPicture] = useState<string | null>(null);

  return (
    <>
      {error && (
        <Alert color="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <ViewExpensePictureModal
        pictureKey={viewingPicture}
        setPictureKey={setViewingPicture}
      />
      <div className="w-full overflow-x-auto max-w-[92vw] md:max-w-[94vw]">
        <Table aria-label={t('expenses.table.ariaLabel')}>
          <TableHeader>
            <TableColumn>{t('expenses.table.user')}</TableColumn>
            <TableColumn>{t('expenses.table.description')}</TableColumn>
            <TableColumn>{t('expenses.table.amount')}</TableColumn>
            <TableColumn>{t('expenses.table.expenseDate')}</TableColumn>
            <TableColumn>{t('expenses.table.repaid')}</TableColumn>
            <TableColumn>{t('media.picture')}</TableColumn>
            <TableColumn>{t('admin.actions')}</TableColumn>
          </TableHeader>
          <TableBody
            items={expenses}
            isLoading={loading}
            loadingContent={<p>{t('expenses.table.loading')}</p>}
            emptyContent={<p>{t('expenses.table.empty')}</p>}
          >
            {(item) => {
              const user = getUserById(item.userId);
              return (
                <TableRow key={item.id}>
                  <TableCell className="min-w-52">
                    {user ? getUserStr(user) : `#${item.userId}`}
                  </TableCell>
                  <TableCell className="min-w-64">{item.description}</TableCell>
                  <TableCell>
                    <Price price={item.amount} />
                  </TableCell>
                  <TableCell>
                    {new Date(item.expenseDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {item.repaid ? (
                      <FaCheckCircle color="green" />
                    ) : (
                      <FaTimesCircle color="red" />
                    )}
                  </TableCell>
                  <TableCell>
                    {item.imageR2Key ? (
                      <Button
                        variant="bordered"
                        isIconOnly
                        onPress={() => setViewingPicture(item.imageR2Key)}
                      >
                        <FaExternalLinkAlt />
                      </Button>
                    ) : (
                      <FaTimesCircle className="ml-3" color="red" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip
                        content={t(
                          item.repaid
                            ? 'expenses.table.markUnrepaid'
                            : 'expenses.table.markRepaid',
                        )}
                      >
                        <Button
                          onPress={() =>
                            markExpenseAsRepaid(item.id, !item.repaid)
                          }
                          isIconOnly
                          variant="bordered"
                        >
                          {item.repaid ? (
                            <FaMoneyBill color="yellow" />
                          ) : (
                            <FaMoneyBill color="green" />
                          )}
                        </Button>
                      </Tooltip>
                      <Button
                        onPress={() => deleteExpense(item.id)}
                        isIconOnly
                        variant="bordered"
                      >
                        <FaTrash color="red" />
                      </Button>
                    </div>
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

export default ExpenseTable;
