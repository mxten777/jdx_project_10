import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthProfile() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex items-center gap-3 py-2">
      {user ? (
        <>
          {user.photoURL && (
            <img src={user.photoURL} alt="프로필" className="w-8 h-8 rounded-full" />
          )}
          <span className="font-semibold text-accent">{user.displayName || user.email}</span>
          <button className="px-3 py-1 rounded bg-accent text-white" onClick={handleLogout}>로그아웃</button>
        </>
      ) : (
        <button className="px-4 py-2 rounded bg-accent text-white font-bold" onClick={handleLogin}>Google 로그인</button>
      )}
    </div>
  );
}
