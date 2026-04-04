import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoadingScreen } from '../components/ui/primitives';
import { isLoggedIn } from '../lib/auth';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(isLoggedIn() ? '/dashboard' : '/login');
  }, []);
  return <LoadingScreen label="Opening SplitMint AI" />;
}
