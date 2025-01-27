import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware'; // Import the persist middleware
import axios, { isAxiosError } from 'axios';
import { Member, MemberWithToken } from '../types/Member';
import { getErrorMsg } from '../types/error';
import { sha256 } from '../utils/sha256';

type AugmentedMember = Member & {
  isVerified: boolean;
  emailHash: string;
};

interface UserState {
  user: AugmentedMember | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  fetchUser: (accessToken: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      emailHash: null,
      loading: false,
      error: null,
      fetchUser: async (_accessToken: string) => {
        set({ loading: true, error: null });
        console.log('Fetching user...');
        try {
          const { data } = await axios.get<MemberWithToken>('/v1/member/me', {
            headers: {
              Authorization: `Bearer ${_accessToken}`,
            },
          });
          console.log('User data:', data);
          const emailHash = await sha256(data.email);

          const { accessToken, ...memberData } = data;

          set({
            user: {
              ...memberData,
              emailHash,
              isVerified: !!data.membershipCardNumber,
            },
            accessToken,
            loading: false,
          });
        } catch (error) {
          console.error('Fetch user error:', error);
          if (isAxiosError(error) && error.response?.status === 401) {
            console.log('Token expired or invalid, logging out...');
            localStorage.removeItem('token');
            set({ accessToken: null, user: null });
          }
          set({
            error: getErrorMsg(error),
            loading: false,
          });
        }
      },
      login: async (email: string, password: string) => {
        console.log('Logging in...');
        set({ loading: true, error: null, accessToken: null });
        try {
          const { data } = await axios.post<{ access_token: string }>(
            '/v1/auth/login',
            { email, password },
          );
          console.log('Login data:', data);
          set({ accessToken: data.access_token, user: null });
          return true;
        } catch (error) {
          console.error('Login error:', error);
          set({
            error: isAxiosError(error)
              ? error.response?.status === 401
                ? 'errors.auth.wrongPassword'
                : error.response?.status === 404
                ? 'errors.auth.userNotFound'
                : 'errors.generic'
              : 'errors.generic',
            loading: false,
          });
          return false;
        }
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ accessToken: null, user: null, loading: false });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accessToken: state.accessToken }),
    },
  ),
);

export default useUserStore;
