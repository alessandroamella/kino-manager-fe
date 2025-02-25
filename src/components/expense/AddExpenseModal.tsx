import useUserStore from '@/store/user';
import { getErrorMsg } from '@/types/error';
import { Expense, CreateExpense } from '@/types/Expense';
import { Member } from '@/types/Member';
import { dateToCalendarDate } from '@/utils/calendar';
import {
  Alert,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Checkbox,
  ModalFooter,
  Select,
  SelectItem,
  SelectSection,
  DatePicker,
  CalendarDate,
} from '@heroui/react';
import axios from 'axios';
import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { getUserStr } from '@/lib/utils';
import { FaEuroSign } from 'react-icons/fa';

interface AddExpenseModalProps {
  onExpenseAdded: (e: Expense) => void;
  users: Member[];
  loggedInUserId: number;
}

const validationSchema = yup.object().shape({
  userId: yup.number().required('User is required'),
  description: yup
    .string()
    .min(1, 'Description must be at least 1 character long')
    .required('Description is required'),
  amount: yup
    .number()
    .positive('Amount must be greater than 0')
    .required('Amount is required'),
  repaid: yup.boolean().required(),
  expenseDate: yup.date().required(),
  imageBase64: yup.string().nullable().defined(),
});

const AddExpenseModal = ({
  onExpenseAdded,
  users,
  loggedInUserId,
}: AddExpenseModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const userToken = useUserStore((state) => state.accessToken);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = useForm<CreateExpense>({
    defaultValues,
    resolver: yupResolver(validationSchema),
  });

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
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
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
                          <SelectItem key={user.id.toString()}>
                            {getUserStr(user, true)}
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
                    <Input
                      isRequired
                      label={t('expenses.addModal.amountLabel')}
                      type="number"
                      startContent={
                        <FaEuroSign
                          className="scale-85 mb-[2.3px]"
                          color="gray"
                        />
                      }
                      placeholder={t('expenses.addModal.amountPlaceholder')}
                      {...register('amount', { valueAsNumber: true })}
                      isInvalid={!!errors.amount}
                      errorMessage={errors.amount?.message}
                      className="md:mt-2"
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
