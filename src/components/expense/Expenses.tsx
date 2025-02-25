import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@heroui/react';
import axios from 'axios';
import useUserStore from '@/store/user';
import { Expense } from '@/types/Expense';
import { getErrorMsg } from '@/types/error';
import { orderBy } from 'lodash';
import { Member } from '@/types/Member';
import AddExpenseModal from '@/components/expense/AddExpenseModal';
import ExpenseTable from '@/components/expense/ExpenseTable';
import { useTranslation } from 'react-i18next';
import UserExpensesTable from './UserExpensesTable';

const Expenses = ({ users }: { users: Member[] }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const accessToken = useUserStore((state) => state.accessToken);
  const user = useUserStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);
  const [addedExpenses, setAddedExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    async function fetchExpenses() {
      if (!accessToken) {
        console.log('Not expenses fetching - no access token found');
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get<Expense[]>(`/v1/expense`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setExpenses(response.data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        setError(getErrorMsg(error));
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, [accessToken]);

  const handleExpenseAdded = (expense: Expense) => {
    setAddedExpenses((prev) => [...prev, expense]);
  };

  const allExpenses = useMemo(() => {
    return orderBy([...expenses, ...addedExpenses], 'expenseDate', 'desc');
  }, [expenses, addedExpenses]);

  const { t } = useTranslation();

  const deleteExpense = useCallback(
    async (expenseId: number) => {
      if (!accessToken) {
        console.error('No access token found for deleteExpense');
        return;
      } else if (!window.confirm(t('expenses.table.confirmDelete'))) {
        console.log('User cancelled delete expense');
        return;
      }
      try {
        await axios.delete(`/v1/expense/${expenseId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        console.log('Deleted expense', expenseId);
      } catch (error) {
        console.error('Error deleting expense:', error);
        setError(getErrorMsg(error));
      }
    },
    [accessToken, t],
  );

  const markExpenseAsRepaid = useCallback(
    async (expenseId: number, repaid: boolean) => {
      if (!accessToken) {
        console.error('No access token found for markExpenseAsRepaid');
        return;
      }
      try {
        await axios.patch(
          `/v1/expense/repaid/${expenseId}`,
          { repaid },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        setExpenses((prev) =>
          prev.map((e) => (e.id === expenseId ? { ...e, repaid } : e)),
        );
        console.log('Marked expense as repaid:', expenseId);
      } catch (error) {
        console.error('Error marking expense as repaid:', error);
        setError(getErrorMsg(error));
      }
    },
    [accessToken],
  );

  return (
    <div className="flex flex-col gap-4">
      {user ? (
        <AddExpenseModal
          loggedInUserId={user.id}
          users={users}
          onExpenseAdded={handleExpenseAdded}
        />
      ) : (
        <Skeleton>
          <div className="h-96 w-full" />
        </Skeleton>
      )}
      <ExpenseTable
        users={users}
        expenses={allExpenses}
        loading={loading}
        error={error}
        deleteExpense={deleteExpense}
        markExpenseAsRepaid={markExpenseAsRepaid}
      />
      <UserExpensesTable
        error={error}
        loading={loading}
        expenses={allExpenses}
        users={users}
      />
    </div>
  );
};

export default Expenses;
