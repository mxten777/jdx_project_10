import { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import { collection, onSnapshot, QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

interface Notification {
  id: string;
  type: 'memory' | 'comment' | 'event' | 'notice';
  text: string;
  createdAt?: { seconds: number };
}

export default function NotificationBar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Listen for new memories
    const unsubMem = onSnapshot(collection(firestore, 'memories'), (snap: QuerySnapshot<DocumentData>) => {
      const memNotis = snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'memory' as Notification['type'],
          text: `새 추억 등록: ${data.text?.slice(0, 20) || ''}`,
          createdAt: data.createdAt,
        };
      });
      setNotifications(prev => {
        // Merge and sort by createdAt
        const merged = [...prev.filter(n => n.type !== 'memory'), ...memNotis];
        return merged.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)).slice(0, 5);
      });
    });
    // Listen for new notices
    const unsubNotice = onSnapshot(collection(firestore, 'notices'), (snap: QuerySnapshot<DocumentData>) => {
      const noticeNotis = snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'notice' as Notification['type'],
          text: `새 공지: ${data.title?.slice(0, 20) || ''}`,
          createdAt: data.createdAt,
        };
      });
      setNotifications(prev => {
        const merged = [...prev.filter(n => n.type !== 'notice'), ...noticeNotis];
        return merged.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)).slice(0, 5);
      });
    });
    // Listen for new events
    const unsubEvent = onSnapshot(collection(firestore, 'events'), (snap: QuerySnapshot<DocumentData>) => {
      const eventNotis = snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'event' as Notification['type'],
          text: `새 이벤트: ${data.title?.slice(0, 20) || ''}`,
          createdAt: data.createdAt,
        };
      });
      setNotifications(prev => {
        const merged = [...prev.filter(n => n.type !== 'event'), ...eventNotis];
        return merged.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)).slice(0, 5);
      });
    });
    // Listen for new comments (from all memories)
    // For demo, only show last comment from each memory
    const unsubComments = onSnapshot(collection(firestore, 'memories'), (memSnap: QuerySnapshot<DocumentData>) => {
      memSnap.docs.forEach(memDoc => {
        const memId = memDoc.id;
        const commentsCol = collection(firestore, 'memories', memId, 'comments');
        onSnapshot(commentsCol, (comSnap: QuerySnapshot<DocumentData>) => {
          if (comSnap.docs.length > 0) {
            const lastCom = comSnap.docs[comSnap.docs.length - 1];
            const data = lastCom.data();
            setNotifications(prev => {
              const filtered = prev.filter(n => !(n.type === 'comment' && n.id === lastCom.id));
              const merged = [...filtered, {
                id: lastCom.id,
                type: 'comment' as Notification['type'],
                text: `새 댓글: ${data.text?.slice(0, 20) || ''}`,
                createdAt: data.createdAt,
              }];
              return merged.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)).slice(0, 5);
            });
          }
        });
      });
    });
    return () => {
      unsubMem();
      unsubNotice();
      unsubEvent();
      unsubComments();
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full bg-accent text-white py-2 px-4 shadow z-50 flex gap-4 items-center">
      <span className="font-bold">실시간 알림</span>
      {notifications.length === 0 ? (
        <span className="text-gray-200">최근 알림 없음</span>
      ) : (
        notifications.map(n => (
          <span key={n.id} className="px-2 py-1 rounded bg-white text-accent font-semibold text-xs shadow-soft">
            {n.text}
          </span>
        ))
      )}
    </div>
  );
}
