'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken'); 
    if (!token) {
      router.push('/login'); 
    } else {
      setCheckingAuth(false); 
    }
  }, []);

  if (checkingAuth) return <div>No Token Provided..</div>; 

  return <>{children}</>; 
}