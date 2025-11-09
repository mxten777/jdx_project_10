import { useState, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  type User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import { useToast } from './useToast';
import { useSecurity } from './useSecurity';
import { secureLogger } from '../utils/security';
import { toError, getErrorCode } from '../utils/errorUtils';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null
  });

  const toast = useToast();
  const { validateEmail, validatePassword, sanitizeInput } = useSecurity();

  // ?�� Email/Password Sign In
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!validateEmail(email)) {
      toast.error('?�바�??�메??주소�??�력?�주?�요.');
      return { success: false };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      secureLogger.log('User signed in successfully', { uid: result.user.uid });
      toast.success('로그???�공!');
      
      setAuthState({
        user: result.user,
        loading: false,
        error: null
      });

      return { success: true, user: result.user };
    } catch (error: unknown) {
      const errorMessage = getAuthErrorMessage(getErrorCode(error) || "");
      secureLogger.error("Auth error:", toError(error));
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [validateEmail, toast]);

  // ?�� Email/Password Sign Up
  const signUpWithEmail = useCallback(async (
    email: string, 
    password: string, 
    displayName: string
  ) => {
    if (!validateEmail(email)) {
      toast.error('?�바�??�메??주소�??�력?�주?�요.');
      return { success: false };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error(`비�?번호 조건??만족?�주?�요: ${passwordValidation.feedback.join(', ')}`);
      return { success: false };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, {
        displayName: sanitizeInput(displayName)
      });

      // Create user document in Firestore
      await setDoc(doc(firestore, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: sanitizeInput(displayName),
        photoURL: result.user.photoURL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
        preferences: {
          theme: 'light',
          notifications: true,
          publicProfile: true
        }
      });

      secureLogger.log('User registered successfully', { uid: result.user.uid });
      toast.success('?�원가???�공!');
      
      setAuthState({
        user: result.user,
        loading: false,
        error: null
      });

      return { success: true, user: result.user };
    } catch (error: unknown) {
      const errorMessage = getAuthErrorMessage(getErrorCode(error) || "");
      secureLogger.error("Auth error:", toError(error));
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [validateEmail, validatePassword, sanitizeInput, toast]);

  // ?�� Google Sign In
  const signInWithGoogle = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(firestore, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          provider: 'google',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true,
          preferences: {
            theme: 'light',
            notifications: true,
            publicProfile: true
          }
        });
      } else {
        // Update last login
        await setDoc(doc(firestore, 'users', result.user.uid), {
          lastLoginAt: new Date()
        }, { merge: true });
      }

      secureLogger.log('Google sign in successful', { uid: result.user.uid });
      toast.success('Google 로그???�공!');
      
      setAuthState({
        user: result.user,
        loading: false,
        error: null
      });

      return { success: true, user: result.user };
    } catch (error: unknown) {
      if ((getErrorCode(error) || "") !== 'auth/popup-closed-by-user') {
        const errorMessage = getAuthErrorMessage(getErrorCode(error) || "");
        secureLogger.error("Auth error:", toError(error));
        
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));

        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false };
    }
  }, [toast]);

  // ?�� GitHub Sign In
  const signInWithGitHub = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const provider = new GithubAuthProvider();
      provider.addScope('user:email');
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(firestore, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          provider: 'github',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true,
          preferences: {
            theme: 'light',
            notifications: true,
            publicProfile: true
          }
        });
      } else {
        // Update last login
        await setDoc(doc(firestore, 'users', result.user.uid), {
          lastLoginAt: new Date()
        }, { merge: true });
      }

      secureLogger.log('GitHub sign in successful', { uid: result.user.uid });
      toast.success('GitHub 로그???�공!');
      
      setAuthState({
        user: result.user,
        loading: false,
        error: null
      });

      return { success: true, user: result.user };
    } catch (error: unknown) {
      if ((getErrorCode(error) || "") !== 'auth/popup-closed-by-user') {
        const errorMessage = getAuthErrorMessage(getErrorCode(error) || "");
        secureLogger.error("Auth error:", toError(error));
        
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));

        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false };
    }
  }, [toast]);

  // ?�� Password Reset
  const resetPassword = useCallback(async (email: string) => {
    if (!validateEmail(email)) {
      toast.error('?�바�??�메??주소�??�력?�주?�요.');
      return { success: false };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await sendPasswordResetEmail(auth, email);
      
      secureLogger.log('Password reset email sent', { email });
      toast.success('비�?번호 ?�설???�메?�을 ?�송?�습?�다.');
      
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = getAuthErrorMessage(getErrorCode(error) || "");
      secureLogger.error("Auth error:", toError(error));
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [validateEmail, toast]);

  // ?�� Sign Out
  const signOut = useCallback(async () => {
    try {
      await auth.signOut();
      
      setAuthState({
        user: null,
        loading: false,
        error: null
      });

      secureLogger.log('User signed out successfully');
      toast.success('로그?�웃 ?�었?�니??');
      
      return { success: true };
    } catch (error: unknown) {
      secureLogger.error("Auth error:", toError(error));
      toast.error('로그?�웃 �??�류가 발생?�습?�다.');
      return { success: false };
    }
  }, [toast]);

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGitHub,
    resetPassword,
    signOut
  };
};

// Helper function to convert Firebase auth error codes to user-friendly messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return '?�록?��? ?��? ?�메?�입?�다.';
    case 'auth/wrong-password':
      return '비�?번호가 ?�바르�? ?�습?�다.';
    case 'auth/email-already-in-use':
      return '?��? ?�용 중인 ?�메?�입?�다.';
    case 'auth/weak-password':
      return '비�?번호가 ?�무 ?�합?�다.';
    case 'auth/invalid-email':
      return '?�바르�? ?��? ?�메???�식?�니??';
    case 'auth/user-disabled':
      return '비활?�화??계정?�니??';
    case 'auth/too-many-requests':
      return '?�무 많�? ?�도�??�해 ?�시 ???�시 ?�도?�주?�요.';
    case 'auth/network-request-failed':
      return '?�트?�크 ?�류?�니?? ?�터???�결???�인?�주?�요.';
    case 'auth/popup-blocked':
      return '?�업??차단?�었?�니?? ?�업???�용?�주?�요.';
    case 'auth/popup-closed-by-user':
      return '로그?�이 취소?�었?�니??';
    case 'auth/account-exists-with-different-credential':
      return '?�른 로그??방식?�로 가?�된 계정?�니??';
    default:
      return '로그??�??�류가 발생?�습?�다.';
  }
};
