import { User, Skeleton } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import useUserStore from '../../store/user';

const UserData = () => {
  const user = useUserStore((store) => store.user);
  const loading = useUserStore((store) => store.loading);
  const { t } = useTranslation();

  return user?.emailHash && !loading ? (
    <User
      name={user.firstName}
      description={t(
        `profile.${user.verificationDate ? 'verified' : 'notVerified'}`,
      )}
      avatarProps={{
        name: `${user.firstName} ${user.lastName}`,
        src: `https://gravatar.com/avatar/${user.emailHash}`,
      }}
    />
  ) : (
    <Skeleton>
      <User
        name={user?.firstName || 'Lorem ipsum'}
        description={t(
          `profile.${user?.verificationDate ? 'verified' : 'notVerified'}`,
        )}
      />
    </Skeleton>
  );
};

export default UserData;
