import { Skeleton, User } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import useUserStore from '../../store/user';

const UserData = ({ to }: { to?: string }) => {
  const user = useUserStore((store) => store.user);
  const loading = useUserStore((store) => store.loading);
  const { t } = useTranslation();

  return (
    <Skeleton isLoaded={!!user && !loading}>
      <User
        {...(to ? { as: Link, to } : {})}
        name={user?.firstName || '-'}
        description={
          user?.membershipCardNumber &&
          t('profile.card', {
            n: user?.membershipCardNumber || '-',
          })
        }
        avatarProps={{
          name: `${user?.firstName || '-'} ${user?.lastName || '-'}`,
          src:
            user?.emailHash &&
            `https://gravatar.com/avatar/${user?.emailHash || '-'}`,
        }}
      />
    </Skeleton>
  );
};

export default UserData;
