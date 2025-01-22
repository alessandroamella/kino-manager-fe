import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Code,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spacer,
  Tooltip,
  Button,
  Form,
  Alert,
  Skeleton,
  Divider,
  Avatar,
} from '@heroui/react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { getErrorMsg } from '../../types/error';
import axios from 'axios';
import useUserStore from '../../store/user';
import {
  FiMail,
  FiCalendar,
  FiMapPin,
  FiCheckCircle,
  FiAlertTriangle,
  FiSend,
  FiX,
  FiMessageSquare,
  FiCode,
} from 'react-icons/fi';
import { dateFnsLang } from '../../utils/dateFnsLang';
import { BiTime } from 'react-icons/bi';

interface VerificationForm {
  verificationMethod: 'sms' | 'email';
}
const Profile = () => {
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );

  const {
    register: verificationRegister,
    handleSubmit: handleVerificationSubmit,
    formState: { errors: verificationErrors, isValid: isVerificationValid },
  } = useForm<VerificationForm>({
    mode: 'onBlur',
  });

  const { t, i18n } = useTranslation();

  const user = useUserStore((store) => store.user);

  const openVerificationModal = () => setVerificationModalOpen(true);
  const closeVerificationModal = () => setVerificationModalOpen(false);

  const handleVerificationChange = async (formData: VerificationForm) => {
    setVerificationError(null);
    try {
      const { data } = await axios.post('/v1/users/verification', formData);
      console.log('Verification successful:', data);
      closeVerificationModal();
    } catch (error) {
      console.error('Error verification:', error);
      setVerificationError(getErrorMsg(error));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="border-0">
        <CardHeader className="flex justify-between items-center px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('profile.myProfile')}
          </h2>
        </CardHeader>
        {user ? (
          <CardBody className="px-4 py-4">
            <div className="flex items-center space-x-4 mb-4 mx-auto">
              <Avatar
                size="lg"
                src={`https://gravatar.com/avatar/${user.emailHash}`}
              />
              <div>
                <h3 className="text-xl font-bold flex items-center gap-1 text-gray-900 dark:text-white">
                  <span>
                    {user.firstName} {user.lastName}
                  </span>

                  <Tooltip
                    showArrow
                    content={t(
                      user.isVerified
                        ? 'profile.verifiedOn'
                        : 'profile.toBeVerified',
                      {
                        date:
                          user.verificationDate &&
                          format(user.verificationDate, 'dd MMMM yyyy HH:mm', {
                            locale: dateFnsLang(i18n),
                          }),
                      },
                    )}
                  >
                    <div>
                      {user.isVerified ? (
                        <FiCheckCircle style={{ color: 'green' }} />
                      ) : (
                        <BiTime style={{ color: 'grey' }} />
                      )}
                    </div>
                  </Tooltip>
                </h3>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <Divider className="mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FiMail className="text-gray-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.email')}:
                  </span>
                </div>
                <p className="text-gray-900 dark:text-gray-100">{user.email}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code size="sm">
                    <FiMapPin className="text-gray-500" />
                  </Code>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.birthComune')}:
                  </span>
                </div>
                <p className="text-gray-900 dark:text-gray-100">
                  {user.birthComune || '-'}
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code size="sm">
                    <FiCalendar className="text-gray-500" />
                  </Code>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.birthDate')}:
                  </span>
                </div>
                <p className="text-gray-900 dark:text-gray-100">
                  {format(user.birthDate, 'dd MMMM yyyy', {
                    locale: dateFnsLang(i18n),
                  }) || '-'}
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code size="sm">
                    <FiMapPin className="text-gray-500" />
                  </Code>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.birthCountry')}:
                  </span>
                </div>
                <p className="text-gray-900 dark:text-gray-100">
                  {t(`countries.${user.birthCountry}`) || '-'}
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code size="sm">
                    <FiCode className="text-gray-500" />
                  </Code>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.codiceFiscale')}:
                  </span>
                </div>
                <Code size="md">{user.codiceFiscale}</Code>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FiCalendar className="text-gray-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('profile.memberSince')}:
                  </span>
                </div>
                <p className="text-gray-900 dark:text-gray-100">
                  {format(new Date(user.createdAt), 'dd MMMM yyyy', {
                    locale: dateFnsLang(i18n),
                  })}
                </p>
              </div>
            </div>
            <Spacer y={6} />
            <Divider className="mb-4" />
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {t('profile.verified')}:
                </span>
              </div>
              {user.verificationMethod && user.verificationDate ? (
                <Tooltip
                  content={`${t('profile.verifiedVia')} ${t(
                    'verificationMethod.' + user.verificationMethod,
                  )} on ${format(user.verificationDate, 'dd MMMM yyyy HH:mm', {
                    locale: dateFnsLang(i18n),
                  })}`}
                >
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <FiCheckCircle />
                    <span>{t('profile.yes')}</span>
                  </div>
                </Tooltip>
              ) : (
                <Button
                  onPress={openVerificationModal}
                  size="sm"
                  color="warning"
                  variant="flat"
                  className="gap-2"
                >
                  <FiAlertTriangle />
                  {t('profile.notVerified')}
                </Button>
              )}
            </div>
          </CardBody>
        ) : (
          <CardBody className="px-4 py-4">
            <Skeleton className="rounded-md">
              <div className="h-48 w-full" />
            </Skeleton>
          </CardBody>
        )}
      </Card>
      <Modal
        isOpen={verificationModalOpen}
        onClose={closeVerificationModal}
        aria-label="Verification Methods"
        placement="center"
      >
        <ModalContent className="bg-white dark:bg-gray-900">
          <ModalHeader className="flex flex-col items-center justify-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('profile.selectVerificationMethod')}
            </h2>
          </ModalHeader>
          <ModalBody className="p-6 space-y-4">
            {verificationError && (
              <Alert
                color="danger"
                title={t('profile.verificationErrorTitle')}
                description={verificationError}
                variant="faded"
              />
            )}
            <Form
              onSubmit={handleVerificationSubmit(handleVerificationChange)}
              className="max-w-md mx-auto space-y-4"
            >
              <Select
                label={t('profile.selectVerificationMethod')}
                placeholder={t('profile.selectVerificationMethodPlaceholder')}
                {...verificationRegister('verificationMethod', {
                  required: t('profile.verificationMethodRequired'),
                })}
                isInvalid={Boolean(verificationErrors.verificationMethod)}
                errorMessage={verificationErrors.verificationMethod?.message}
                isRequired
              >
                <SelectItem key="sms">
                  <FiMessageSquare className="inline-block mr-1" />
                  {t('profile.verificationMethod.sms')}
                </SelectItem>
                <SelectItem key="email">
                  <FiMail className="inline-block mr-1" />
                  {t('profile.verificationMethod.email')}
                </SelectItem>
              </Select>

              <Button
                color="primary"
                type="submit"
                isDisabled={!isVerificationValid}
              >
                <FiSend />
                {t('profile.sendVerificationCode')}
              </Button>
            </Form>
          </ModalBody>
          <ModalFooter className="justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="light"
              onPress={closeVerificationModal}
              className="gap-2"
            >
              <FiX />
              {t('profile.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Profile;
