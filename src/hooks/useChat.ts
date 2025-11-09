import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  doc,
  updateDoc,
  where,
  limit as firestoreLimit
} from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { useToast } from './useToast';
import { useSecurity, useRateLimit } from './useSecurity';
import { secureLogger } from '../utils/security';

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isEdited?: boolean;
  reactions?: Record<string, string[]>; // emoji -> userIds
  replyTo?: string; // message ID
  isRead?: boolean;
  type: 'text' | 'image' | 'system';
}

export interface TypingUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  timestamp: number;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const toast = useToast();
  const { sanitizeInput } = useSecurity();
  const { checkRateLimit } = useRateLimit(10, 60000); // 10 messages per minute

  // 📨 Send message
  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' = 'text', replyTo?: string) => {
    if (!auth.currentUser) {
      toast.error('로그인이 필요합니다.');
      return { success: false };
    }

    const sanitizedContent = sanitizeInput(content.trim());
    if (!sanitizedContent) {
      toast.error('메시지 내용을 입력해주세요.');
      return { success: false };
    }

    // Rate limiting
    if (!checkRateLimit(auth.currentUser.uid)) {
      toast.error('메시지 전송 속도가 너무 빠릅니다. 잠시 후 다시 시도해주세요.');
      return { success: false };
    }

    setSending(true);

    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        content: sanitizedContent,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous',
        authorPhotoURL: auth.currentUser.photoURL || undefined,
        createdAt: Timestamp.now(),
        type,
        replyTo,
        reactions: {},
        isRead: false
      };

      await addDoc(collection(firestore, 'chatMessages'), messageData);
      
      // Clear typing indicator
      await clearTypingIndicator();
      
      secureLogger.log('Message sent successfully', { 
        authorId: auth.currentUser.uid, 
        type, 
        hasReply: !!replyTo 
      });

      return { success: true };
    } catch (error) {
      secureLogger.error('Failed to send message', error as Error);
      toast.error('메시지 전송에 실패했습니다.');
      return { success: false };
    } finally {
      setSending(false);
    }
  }, [sanitizeInput, checkRateLimit, toast]);

  // ✏️ Update typing indicator
  const updateTypingIndicator = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const typingDoc = doc(firestore, 'typing', auth.currentUser.uid);
      await updateDoc(typingDoc, {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'Anonymous',
        photoURL: auth.currentUser.photoURL || null,
        timestamp: Date.now()
      });
    } catch (error) {
      // Document doesn't exist, create it
      try {
        await addDoc(collection(firestore, 'typing'), {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || 'Anonymous',
          photoURL: auth.currentUser.photoURL || null,
          timestamp: Date.now()
        });
      } catch (createError) {
        secureLogger.error('Failed to update typing indicator', createError as Error);
      }
    }
  }, []);

  // 🚮 Clear typing indicator
  const clearTypingIndicator = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const typingDoc = doc(firestore, 'typing', auth.currentUser.uid);
      await updateDoc(typingDoc, {
        timestamp: 0 // Set to 0 to indicate not typing
      });
    } catch (error) {
      secureLogger.error('Failed to clear typing indicator', error as Error);
    }
  }, []);

  // 👍 Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!auth.currentUser) return { success: false };

    try {
      const messageRef = doc(firestore, 'chatMessages', messageId);
      const message = messages.find(m => m.id === messageId);
      
      if (!message) return { success: false };

      const reactions = message.reactions ? { ...message.reactions } : {};
      const userReactions = reactions[emoji] || [];
      
      // Toggle reaction
      if (userReactions.includes(auth.currentUser.uid)) {
        reactions[emoji] = userReactions.filter(uid => uid !== auth.currentUser?.uid);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji] = [...userReactions, auth.currentUser.uid];
      }

      await updateDoc(messageRef, { reactions });
      
      return { success: true };
    } catch (error) {
      secureLogger.error('Failed to add reaction', error as Error);
      toast.error('반응 추가에 실패했습니다.');
      return { success: false };
    }
  }, [messages, toast]);

  // 📖 Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!auth.currentUser) return;

    try {
      const messageRef = doc(firestore, 'chatMessages', messageId);
      await updateDoc(messageRef, { 
        isRead: true,
        readBy: {
          [auth.currentUser.uid]: Timestamp.now()
        }
      });
    } catch (error) {
      secureLogger.error('Failed to mark message as read', error as Error);
    }
  }, []);

  // 📱 Update online status
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!auth.currentUser) return;

    try {
      const presenceRef = doc(firestore, 'presence', auth.currentUser.uid);
      await updateDoc(presenceRef, {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'Anonymous',
        photoURL: auth.currentUser.photoURL || null,
        isOnline,
        lastSeen: Timestamp.now()
      });
    } catch (error) {
      // Document doesn't exist, create it
      try {
        await addDoc(collection(firestore, 'presence'), {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || 'Anonymous',
          photoURL: auth.currentUser.photoURL || null,
          isOnline,
          lastSeen: Timestamp.now()
        });
      } catch (createError) {
        secureLogger.error('Failed to update online status', createError as Error);
      }
    }
  }, []);

  // 📡 Subscribe to messages
  useEffect(() => {
    const messagesQuery = query(
      collection(firestore, 'chatMessages'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));

      setMessages(newMessages.reverse());
      setLoading(false);
    }, (error) => {
      secureLogger.error('Messages subscription error', error);
      toast.error('메시지 로딩에 실패했습니다.');
      setLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  // 👥 Subscribe to typing indicators
  useEffect(() => {
    const typingQuery = query(
      collection(firestore, 'typing'),
      where('timestamp', '>', Date.now() - 10000) // Last 10 seconds
    );

    const unsubscribe = onSnapshot(typingQuery, (snapshot) => {
      const typing = snapshot.docs
        .map(doc => doc.data() as TypingUser)
        .filter(user => user.uid !== auth.currentUser?.uid && user.timestamp > Date.now() - 10000);

      setTypingUsers(typing);
    });

    return unsubscribe;
  }, []);

  // 🟢 Subscribe to online users
  useEffect(() => {
    const presenceQuery = query(
      collection(firestore, 'presence'),
      where('isOnline', '==', true)
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const online = snapshot.docs
        .map(doc => doc.data().uid as string)
        .filter(uid => uid !== auth.currentUser?.uid);

      setOnlineUsers(online);
    });

    return unsubscribe;
  }, []);

  // 💔 Handle page visibility and cleanup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (auth.currentUser) {
        updateOnlineStatus(!document.hidden);
      }
    };

    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        clearTypingIndicator();
        updateOnlineStatus(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Set initial online status
    if (auth.currentUser) {
      updateOnlineStatus(true);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Cleanup on unmount
      if (auth.currentUser) {
        clearTypingIndicator();
        updateOnlineStatus(false);
      }
    };
  }, [updateOnlineStatus, clearTypingIndicator]);

  return {
    messages,
    loading,
    sending,
    typingUsers,
    onlineUsers,
    sendMessage,
    updateTypingIndicator,
    clearTypingIndicator,
    addReaction,
    markAsRead
  };
};