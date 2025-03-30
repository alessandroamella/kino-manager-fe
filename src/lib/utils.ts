import { Member } from '@/types/Member';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserStr(
  user: Member,
  options?: {
    showEmail?: boolean;
  },
) {
  const { showEmail = false } = options || {};
  return `${user.firstName} ${user.lastName} (#${user.id}${
    showEmail ? ` - ${user.email}` : ''
  })`;
}
