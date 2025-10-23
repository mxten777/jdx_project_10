import { useEffect, useState } from 'react';
import { firestore, auth } from '../firebase';
import { collection, onSnapshot, QueryDocumentSnapshot, deleteDoc, doc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  type Notice = { id: string; title: string; content: string; createdAt?: { seconds: number } };
  type Event = { id: string; title: string; date: string; description: string; location: string; createdAt?: { seconds: number } };
  type Memory = { id: string; text: string; createdAt?: { seconds: number } };
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user: User | null) => {
      setIsAdmin(!!user && user.email === 'admin@email.com');
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsubNotice = onSnapshot(collection(firestore, 'notices'), snap => {
      setNotices(snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as Notice;
        return { ...data, id: doc.id };
      }));
    });
    const unsubEvent = onSnapshot(collection(firestore, 'events'), snap => {
      setEvents(snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as Event;
        return { ...data, id: doc.id };
      }));
    });
    const unsubMemory = onSnapshot(collection(firestore, 'memories'), snap => {
      setMemories(snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as Memory;
        return { ...data, id: doc.id };
      }));
    });
    return () => { unsubNotice(); unsubEvent(); unsubMemory(); };
  }, []);

  async function handleDelete(type: 'notice' | 'event' | 'memory', id: string) {
    if (!isAdmin) return;
    await deleteDoc(doc(firestore, type + 's', id));
  }

  if (!isAdmin) {
    return <div className="p-6 text-gray-400">관리자만 접근 가능합니다.</div>;
  }

  return (
    <section className="bg-white p-6 rounded-xl shadow-soft mb-6">
      <h2 className="text-xl font-semibold mb-4 text-accent">관리자 대시보드</h2>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-accent mb-2">공지사항 관리</h3>
        <div className="flex flex-col gap-2">
          {notices.length === 0 ? <div className="text-gray-400">공지 없음</div> : notices.map(n => (
            <div key={n.id} className="bg-softGray rounded p-2 flex justify-between items-center">
              <span>{n.title}</span>
              <button className="px-2 py-1 rounded bg-red-500 text-white text-xs font-bold" onClick={() => handleDelete('notice', n.id)}>삭제</button>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-accent mb-2">이벤트 관리</h3>
        <div className="flex flex-col gap-2">
          {events.length === 0 ? <div className="text-gray-400">이벤트 없음</div> : events.map(e => (
            <div key={e.id} className="bg-softGray rounded p-2 flex justify-between items-center">
              <span>{e.title}</span>
              <button className="px-2 py-1 rounded bg-red-500 text-white text-xs font-bold" onClick={() => handleDelete('event', e.id)}>삭제</button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-accent mb-2">추억 관리</h3>
        <div className="flex flex-col gap-2">
          {memories.length === 0 ? <div className="text-gray-400">추억 없음</div> : memories.map(m => (
            <div key={m.id} className="bg-softGray rounded p-2 flex justify-between items-center">
              <span>{m.text?.slice(0, 30) || '내용 없음'}</span>
              <button className="px-2 py-1 rounded bg-red-500 text-white text-xs font-bold" onClick={() => handleDelete('memory', m.id)}>삭제</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
