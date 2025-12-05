import { useState, useEffect } from 'react';

interface UserSession {
  userId: number | null;
  userRole: string | null;
  userName: string | null;
  userEmail: string | null;
}

export function useUserSession(): UserSession {
  const [session, setSession] = useState<UserSession>(() => {
    if (typeof window === 'undefined') {
      return {
        userId: null,
        userRole: null,
        userName: null,
        userEmail: null,
      };
    }

    const userId = Number(window.localStorage.getItem('userId')) || null;
    const userRole = window.localStorage.getItem('userRole');
    const userName = window.localStorage.getItem('userName');
    const userEmail = window.localStorage.getItem('userEmail');

    return {
      userId: Number.isFinite(userId) ? userId : null,
      userRole,
      userName,
      userEmail,
    };
  });

  return session;
}
