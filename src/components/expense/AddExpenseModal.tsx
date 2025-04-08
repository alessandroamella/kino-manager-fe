import { cn, getUserStr } from '@/lib/utils';
import useUserStore from '@/store/user';
import { getErrorMsg } from '@/types/error';
import { CreateExpense, Expense } from '@/types/Expense';
import { Member } from '@/types/Member';
import { dateToCalendarDate } from '@/utils/calendar';
import {
  Alert,
  Button,
  CalendarDate,
  Checkbox,
  DatePicker,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Select,
  SelectItem,
  SelectSection,
} from '@heroui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { omit, orderBy } from 'lodash-es';
import { minus, round, times } from 'number-precision';
import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FaEuroSign } from 'react-icons/fa';
import * as yup from 'yup';

interface AddExpenseModalProps {
  onExpenseAdded: (e: Expense) => void;
  users: Member[];
  loggedInUserId: number;
}

const AddExpenseModal = ({
  onExpenseAdded,
  users: _users,
  loggedInUserId,
}: AddExpenseModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const userToken = useUserStore((state) => state.accessToken);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const users = useMemo(() => {
    return orderBy(_users, ['firstName', 'lastName'], ['asc', 'asc']);
  }, [_users]);

  const { t } = useTranslation();

  const defaultValues = useMemo(
    () => ({
      userId: loggedInUserId,
      description: '',
      amount: 0,
      repaid: false,
      expenseDate: new Date(),
      imageBase64: '',
    }),
    [loggedInUserId],
  );

  const validationSchema = useMemo(
    () =>
      yup.object().shape({
        userId: yup.number().required('User is required'),
        description: yup
          .string()
          .min(
            1,
            t('errors.field.tooShort', {
              field: t('expenses.addModal.descriptionLabel'),
              min: 1,
            }),
          )
          .required(
            t('errors.field.required', {
              field: t('expenses.addModal.descriptionLabel'),
            }),
          ),
        amount: yup
          .number()
          .positive(
            t('errors.field.positive', {
              field: t('expenses.addModal.amountLabel'),
            }),
          )
          .required(),
        repaid: yup.boolean().required(),
        expenseDate: yup.date().required(),
        imageBase64: yup.string().nullable().defined(),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateExpense>({
    defaultValues,
    resolver: yupResolver(validationSchema),
  });

  const amount = watch('amount');
  const expenseDate = watch('expenseDate');

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64String = event.target?.result as string;
            setValue('imageBase64', base64String);
            setPreviewImage(base64String);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [setValue],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
  });

  const onSubmit = async (formData: CreateExpense) => {
    setLoading(true);
    try {
      const payload: CreateExpense = {
        ...formData,
        userId: Number(formData.userId),
      };

      const { data } = await axios.post<Expense>(`/v1/expense`, payload, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      closeModal();
      onExpenseAdded(data);
      reset({
        userId: loggedInUserId,
        description: '',
        amount: 0,
        repaid: false,
        expenseDate: new Date(),
        imageBase64: '',
      });
      setPreviewImage(null);
    } catch (error) {
      console.error('Error creating expense:', error);
      setError(getErrorMsg(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = useCallback(
    (date: CalendarDate | null) => {
      console.log('Date selected:', date);
      if (!date) {
        return;
      }
      setValue('expenseDate', date.toDate('UTC'));
      trigger('expenseDate');
    },
    [setValue, trigger],
  );

  return (
    <>
      {error && (
        <Alert color="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="flex flex-row justify-between gap-4">
        <h2 className="text-2xl font-semibold mb-4">{t('expenses.title')}</h2>
        <Button color="secondary" onPress={openModal}>
          <FaEuroSign />
          {t('expenses.addModal.addButton')}
        </Button>
      </div>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="lg">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t('expenses.addModal.header')}
              </ModalHeader>
              <ModalBody className="max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Select
                      defaultSelectedKeys={[loggedInUserId.toString()]}
                      isRequired
                      label={t('expenses.addModal.userLabel')}
                      placeholder={t('expenses.addModal.userPlaceholder')}
                      {...register('userId')}
                      isInvalid={!!errors.userId}
                      errorMessage={errors.userId?.message}
                    >
                      <SelectSection
                        title={t('expenses.addModal.userSectionTitle')}
                      >
                        {users.map((user) => (
                          <SelectItem
                            className={cn({
                              'font-bold': user.id === loggedInUserId,
                              'text-danger': user.isAdmin,
                            })}
                            key={user.id.toString()}
                          >
                            {getUserStr(user, { showEmail: true })}
                          </SelectItem>
                        ))}
                      </SelectSection>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      isRequired
                      label={t('expenses.addModal.descriptionLabel')}
                      placeholder={t(
                        'expenses.addModal.descriptionPlaceholder',
                      )}
                      {...register('description')}
                      isInvalid={!!errors.description}
                      errorMessage={errors.description?.message}
                    />
                  </div>
                  <div>
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          isRequired
                          label={t('expenses.addModal.amountLabel')}
                          startContent={
                            <FaEuroSign
                              className="scale-85 mb-[2.3px]"
                              color="gray"
                            />
                          }
                          step={0.01}
                          placeholder={t('expenses.addModal.amountPlaceholder')}
                          onValueChange={(value) => {
                            setValue('amount', value ? round(value, 2) : 0);
                          }}
                          description={
                            amount &&
                            `= ${Math.floor(amount)} EUR ${times(
                              minus(amount, Math.floor(amount)),
                              100,
                            )} cent`
                          }
                          isInvalid={!!errors.amount}
                          errorMessage={errors.amount?.message}
                          className="md:mt-2"
                          onBlur={() => {
                            trigger('amount');
                            field.onBlur();
                          }}
                          {...omit(field, ['onChange', 'onBlur'])}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <DatePicker
                      isRequired
                      label={t('expenses.addModal.dateLabel')}
                      onChange={handleDateChange}
                      onBlur={() => trigger('expenseDate')}
                      value={
                        expenseDate ? dateToCalendarDate(expenseDate) : null
                      }
                      labelPlacement="outside"
                      isInvalid={!!errors.expenseDate}
                      errorMessage={errors.expenseDate?.message}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <Checkbox {...register('repaid')}>
                      {t('expenses.addModal.repaidLabel')}
                    </Checkbox>
                  </div>
                  <div className="md:col-span-2">
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-md p-4 cursor-pointer ${
                        isDragActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <input {...getInputProps()} />
                      {previewImage ? (
                        <div className="relative">
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="max-h-48 w-auto rounded-md"
                          />
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            className="absolute top-2 right-2"
                            onPress={() => {
                              setValue('imageBase64', '');
                              setPreviewImage(null);
                            }}
                          >
                            {t('common.remove')}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-500">
                            {t('expenses.addModal.imageDropzoneLabel')}
                          </p>
                          <p className="text-sm text-gray-400">
                            {t('expenses.addModal.imageDropzoneSubLabel')}
                          </p>
                        </div>
                      )}
                    </div>
                    <input type="hidden" {...register('imageBase64')} />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={closeModal}>
                  {t('common.cancel')}
                </Button>
                <Button
                  color="primary"
                  onClick={handleSubmit(onSubmit)}
                  isLoading={loading}
                >
                  {t('expenses.addModal.submitButton')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddExpenseModal;
