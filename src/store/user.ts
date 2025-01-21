import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware'; // Import the persist middleware
import axios, { isAxiosError } from 'axios';
import { Member } from '../types/Member';

interface UserState {
  user: Member | null; // User data will be stored here
  accessToken: string | null; // Access token is stored separately
  loading: boolean;
  error: string | null;
  fetchUser: (id: number) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (id: number, updates: Partial<Member>) => Promise<void>;
}

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null, // Initialize accessToken to null
      loading: false,
      error: null,

      fetchUser: async (id: number) => {
        set({ loading: true, error: null });
        try {
          const { data } = await axios.get<Member>(`/v1/users/${id}`);
          set({ user: data, loading: false }); // Store the actual Member data
        } catch (error) {
          let errorMessage = 'Failed to fetch user';
          if (
            isAxiosError<{ message: string }>(error) &&
            error.response?.data?.message
          ) {
            errorMessage = error.response.data.message;
          }
          set({ error: errorMessage, loading: false });
        }
      },

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post<{ access_token: string }>(
            '/v1/auth/login',
            { email, password },
          );
          set({
            accessToken: response.data.access_token,
            loading: false,
            user: null,
          }); // Store the access token

          // Fetch user data immediately after login
          const userResponse = await axios.get<Member>('/v1/member/me', {
            headers: {
              Authorization: `Bearer ${response.data.access_token}`,
            },
          });
          set({ user: userResponse.data, loading: false });
        } catch (error) {
          let errorMessage = 'Login failed';
          if (
            isAxiosError<{ message: string }>(error) &&
            error.response?.data?.message
          ) {
            errorMessage = error.response.data.message;
          }
          set({ error: errorMessage, loading: false });
        }
      },

      logout: async () => {
        return new Promise<void>((resolve) => {
          set({ loading: true, error: null });

          // remove token from local storage
          localStorage.removeItem('token');
          set({ accessToken: null, user: null, loading: false }); // Clear both accessToken and user
          resolve();
        });
      },

      updateUser: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const { data } = await axios.put<Member>(`/v1/users/${id}`, updates);
          set({ user: data, loading: false }); // Store the updated Member data
        } catch (error) {
          let errorMessage = 'Update failed';
          if (
            isAxiosError<{ message: string }>(error) &&
            error.response?.data?.message
          ) {
            errorMessage = error.response.data.message;
          }
          set({ error: errorMessage, loading: false });
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accessToken: state.accessToken }), // Persist only the accessToken
    },
  ),
);

export default useUserStore;
