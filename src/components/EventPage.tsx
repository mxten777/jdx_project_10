import { useEffect, useState } from 'react';
import { firestore, auth } from '../firebase';
import { collection, addDoc, onSnapshot, QueryDocumentSnapshot, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

type Event = {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
  createdAt?: { seconds: number };
};

export default function EventPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState({
    title: '',
    date: '',
    description: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      setIsAdmin(!!user && user.email === 'admin@email.com');
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, 'events'), snap => {
      setEvents(
        snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data() as Event;
          return { ...data, id: doc.id };
        })
        .sort((a, b) => (a.date > b.date ? 1 : -1))
      );
    });
    return () => unsub();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setLoading(true);
    try {
      await addDoc(collection(firestore, 'events'), {
        ...form,
        createdAt: Timestamp.now(),
      });
      setForm({ title: '', date: '', description: '', location: '' });
      setToast({ type: 'success', message: '일정이 성공적으로 등록되었습니다.' });
    } catch {
      setToast({ type: 'error', message: '일정 등록에 실패했습니다.' });
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!isAdmin) return;
    await deleteDoc(doc(firestore, 'events', id));
  }

  return (
    <section
      className="bg-white p-6 rounded-xl shadow-soft mb-6"
      role="region"
      aria-label="동창회 및 행사 일정 섹션"
    >
      <h2 className="text-xl font-semibold mb-2 text-accent" id="event-section-heading">동창회/행사 일정</h2>
      {toast && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg z-50 font-bold text-center transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          role="status"
          aria-live="assertive"
        >
          {toast.message}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col gap-2"
        aria-labelledby="event-section-heading"
      >
        <input
          type="text"
          placeholder="행사명"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="p-2 border rounded focus:outline-accent"
          required
          aria-label="행사명 입력"
        />
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className="p-2 border rounded focus:outline-accent"
          required
          aria-label="행사 날짜 선택"
        />
        <input
          type="text"
          placeholder="장소"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          className="p-2 border rounded focus:outline-accent"
          aria-label="행사 장소 입력"
        />
        <textarea
          placeholder="설명"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="p-2 border rounded focus:outline-accent"
          rows={2}
          aria-label="행사 설명 입력"
        />
        <button
          type="submit"
          className="bg-accent text-white px-4 py-2 rounded font-bold mt-2 flex items-center justify-center gap-2"
          disabled={loading}
          aria-label="일정 등록 버튼"
        >
          {loading ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
          ) : null}
          {loading ? '등록 중...' : '일정 등록'}
        </button>
      </form>
      <div className="flex flex-col gap-4">
        {events.length === 0 ? (
          <div className="text-gray-400" aria-live="polite">등록된 일정이 없습니다.</div>
        ) : (
          events.map(ev => (
            <div
              key={ev.id}
              className="bg-softGray rounded-lg shadow p-3 flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 animate-fadein"
              style={{ animation: 'fadein 0.7s' }}
            >
              <div className="flex-1">
                <div className="text-base text-gray-800 font-bold">{ev.title}</div>
                <div className="text-sm text-gray-500">{ev.date} {ev.location && `· ${ev.location}`}</div>
                {ev.description && <div className="text-xs text-gray-600 mt-1">{ev.description}</div>}
              </div>
              {isAdmin && (
                <button
                  className="px-3 py-1 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                  onClick={() => handleDelete(ev.id)}
                  aria-label={`행사 '${ev.title}' 삭제 버튼`}
                >삭제</button>
              )}
            </div>
          ))
        )}
      </div>
      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}