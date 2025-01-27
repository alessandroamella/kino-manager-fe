import { User, Skeleton } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import useUserStore from '../../store/user';

const UserData = () => {
  const user = useUserStore((store) => store.user);
  const loading = useUserStore((store) => store.loading);
  const { t } = useTranslation();

  return (
    <Skeleton isLoaded={!!user && !loading}>
      <User
        name={user?.firstName || '-'}
        description={
          user?.membershipCardNumber &&
          t('profile.card', {
            n: user?.membershipCardNumber || '-',
          })
        }
        avatarProps={{
          name: `${user?.firstName || '-'} ${user?.lastName || '-'}`,
          src: `https://gravatar.com/avatar/${user?.emailHash || '-'}`,
        }}
      />
    </Skeleton>
  );
};

export default UserData;
