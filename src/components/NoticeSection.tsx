import { useEffect, useState } from 'react';
import { firestore, auth } from '../firebase';
import { collection, addDoc, onSnapshot, QueryDocumentSnapshot, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt?: { seconds: number };
}

export default function NoticeSection() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      // 관리자 이메일을 아래에 등록하세요
      setIsAdmin(!!user && user.email === 'admin@email.com');
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, 'notices'), snap => {
      setNotices(
        snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data() as Notice;
          return { ...data, id: doc.id };
        }).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      );
    });
    return () => unsub();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setLoading(true);
    await addDoc(collection(firestore, 'notices'), {
      ...form,
      createdAt: Timestamp.now(),
    });
    setForm({ title: '', content: '' });
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!isAdmin) return;
    await deleteDoc(doc(firestore, 'notices', id));
  }

  return (
    <section
      className="bg-pastelBlue p-6 rounded-xl shadow-soft mb-6"
      role="region"
      aria-label="공지사항 섹션"
    >
      <h2 className="text-xl font-semibold mb-2 text-accent" id="notice-section-heading">공지사항</h2>
      {isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 flex flex-col gap-2"
          aria-labelledby="notice-section-heading"
        >
          <input
            type="text"
            placeholder="제목"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="p-2 border rounded focus:outline-accent"
            required
            aria-label="공지 제목 입력"
          />
          <textarea
            placeholder="내용"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            className="p-2 border rounded focus:outline-accent"
            rows={2}
            required
            aria-label="공지 내용 입력"
          />
          <button
            type="submit"
            className="bg-accent text-white px-4 py-2 rounded font-bold mt-2"
            disabled={loading}
            aria-label="공지 등록 버튼"
          >
            {loading ? '등록 중...' : '공지 등록'}
          </button>
        </form>
      )}
      <div className="flex flex-col gap-4" aria-live="polite">
        {notices.length === 0 ? (
          <div className="text-gray-400">등록된 공지사항이 없습니다.</div>
        ) : (
          notices.map(notice => (
            <div key={notice.id} className="bg-white rounded-lg shadow p-3 mb-2" role="article" aria-label={`공지: ${notice.title}`} tabIndex={0}>
              <div className="text-base font-bold text-accent mb-1">{notice.title}</div>
              <div className="text-gray-700 mb-1">{notice.content}</div>
              <div className="text-xs text-gray-400">{notice.createdAt ? new Date(notice.createdAt.seconds * 1000).toLocaleString() : ''}</div>
              {isAdmin && (
                <button
                  className="mt-2 px-3 py-1 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                  onClick={() => handleDelete(notice.id)}
                  aria-label={`공지 '${notice.title}' 삭제 버튼`}
                >삭제</button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
