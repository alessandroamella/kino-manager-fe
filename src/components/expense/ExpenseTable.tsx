import { getUserStr } from '@/lib/utils';
import { Expense } from '@/types/Expense';
import { Member } from '@/types/Member';
import {
  Alert,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react';
import { clamp } from 'lodash-es';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BsThreeDots } from 'react-icons/bs';
import {
  FaCheckCircle,
  FaExternalLinkAlt,
  FaMoneyBill,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import { MdMoneyOff } from 'react-icons/md';
import Price from '../items/Price';
import ViewExpensePictureModal from './ExpensePictureModal';

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
        <Table
          isVirtualized
          rowHeight={50}
          maxTableHeight={clamp(Math.ceil(expenses.length / 1.5), 1, 4) * 100}
          isStriped
          aria-label={t('expenses.table.ariaLabel')}
          className="table"
        >
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
                  <TableCell className="w-64 text-wrap">
                    <Tooltip content={item.description}>
                      <span className="w-fit line-clamp-2">
                        {item.description}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Price price={item.amount} round={false} />
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
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="bordered">
                          <BsThreeDots />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Static Actions">
                        <DropdownItem
                          onPress={() =>
                            markExpenseAsRepaid(item.id, !item.repaid)
                          }
                          key="mark-repaid"
                        >
                          {item.repaid ? (
                            <MdMoneyOff
                              color="yellow"
                              className="inline-block mr-2 mb-[2px]"
                            />
                          ) : (
                            <FaMoneyBill
                              color="green"
                              className="inline-block mr-2 mb-[2px]"
                            />
                          )}
                          {t(
                            item.repaid
                              ? 'expenses.table.markUnrepaid'
                              : 'expenses.table.markRepaid',
                          )}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          onPress={() => deleteExpense(item.id)}
                          className="text-danger"
                          color="danger"
                        >
                          <FaTrash
                            color="red"
                            className="inline-block mr-2 mb-[2px]"
                          />
                          {t('admin.delete')}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
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
