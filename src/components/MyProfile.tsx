import { useEffect, useState } from 'react';
import { auth, firestore } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';

interface Memory {
  id: string;
  text: string;
  tags: string[];
  location: string;
  persons: string[];
  isPublic: boolean;
  urls: string[];
  createdAt?: { seconds: number };
  userEmail?: string;
  like?: number;
  commentCount?: number;
}

export default function MyProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [myMemories, setMyMemories] = useState<Memory[]>([]);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.email) {
      setMyMemories([]);
      return;
    }
    // Firestore에서 내 추억만 가져오기 (userEmail 필드 기준)
    const q = query(collection(firestore, 'memories'), where('userEmail', '==', user.email));
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      setMyMemories(
        snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data() as Memory;
          return { ...data, id: doc.id };
        })
      );
    });
    return () => unsub();
  }, [user]);

  return (
    <section className="bg-white p-6 rounded-xl shadow-soft mb-6">
      <h2 className="text-xl font-semibold mb-2 text-accent">내 프로필</h2>
      {user ? (
        <div className="flex items-center gap-4 mb-4">
          <img src={editing ? editPhoto || user.photoURL || '' : user.photoURL || ''} alt="프로필" className="w-16 h-16 rounded-full" />
          <div>
            {editing ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="border rounded px-2 py-1 mb-2 w-40"
                  placeholder="이름 변경"
                />
                <input
                  type="text"
                  value={editPhoto}
                  onChange={e => setEditPhoto(e.target.value)}
                  className="border rounded px-2 py-1 mb-2 w-40"
                  placeholder="프로필 사진 URL"
                />
                <button
                  className="px-3 py-1 rounded bg-accent text-white font-bold mr-2"
                  onClick={() => { setEditing(false); }}
                >저장(로컬)</button>
                <button
                  className="px-3 py-1 rounded bg-gray-300 text-accent font-bold"
                  onClick={() => { setEditing(false); setEditName(user.displayName || ''); setEditPhoto(user.photoURL || ''); }}
                >취소</button>
              </>
            ) : (
              <>
                <div className="font-bold text-accent text-lg">{user.displayName || user.email}</div>
                <div className="text-gray-500 text-sm">{user.email}</div>
                <button
                  className="mt-2 px-3 py-1 rounded bg-accent text-white font-bold"
                  onClick={() => { setEditing(true); setEditName(user.displayName || ''); setEditPhoto(user.photoURL || ''); }}
                >프로필 편집</button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-400">로그인 후 내 프로필을 볼 수 있습니다.</div>
      )}

      <h3 className="text-base font-semibold mb-2 text-accent">내 활동 내역</h3>
      <div className="mb-4 flex flex-col gap-2">
        <div className="text-sm text-gray-700">최근 등록한 추억: <span className="font-bold text-accent">{myMemories[0]?.text?.slice(0, 20) || '없음'}</span></div>
        <div className="text-sm text-gray-700">총 등록 추억: <span className="font-bold text-accent">{myMemories.length}</span></div>
        {/* 댓글/좋아요 내역은 Firestore 구조상 별도 쿼리 필요. 데모로 최근 추억의 댓글/좋아요 수만 표시 */}
        {myMemories[0] && (
          <>
            <div className="text-sm text-gray-700">최근 추억 좋아요: <span className="font-bold text-accent">{myMemories[0].like ?? 0}</span></div>
            <div className="text-sm text-gray-700">최근 추억 댓글: <span className="font-bold text-accent">{myMemories[0].commentCount ?? 'N/A'}</span></div>
          </>
        )}
      </div>

      <h3 className="text-base font-semibold mb-2 text-accent">내가 등록한 추억</h3>
      <div className="flex flex-col gap-3">
        {myMemories.length === 0 ? (
          <div className="text-gray-400">아직 등록한 추억이 없습니다.</div>
        ) : (
          myMemories.map(mem => (
            <div key={mem.id} className="bg-softGray rounded-lg shadow p-3 flex gap-3 items-center">
              {mem.urls && mem.urls.length > 0 ? (
                mem.urls[0].match(/\.mp4|\.webm|\.ogg$/)
                  ? <video src={mem.urls[0]} controls className="w-16 h-16 object-cover rounded-lg" />
                  : <img src={mem.urls[0]} alt="추억 사진" className="w-16 h-16 object-cover rounded-lg" />
              ) : null}
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">
                  {mem.location && <span>{mem.location} · </span>}
                  {mem.createdAt ? new Date(mem.createdAt.seconds * 1000).toLocaleDateString() : ''}
                  {mem.isPublic ? <span className="ml-2 px-2 py-0.5 rounded bg-accent text-white text-xs">공개</span> : <span className="ml-2 px-2 py-0.5 rounded bg-gray-400 text-white text-xs">비공개</span>}
                </div>
                <div className="text-base text-gray-800 mb-1">{mem.text}</div>
                <div className="text-xs text-gray-500 mb-1">
                  {mem.tags && mem.tags.length > 0 && (
                    <span>태그: {mem.tags.join(', ')}</span>
                  )}
                  {mem.persons && mem.persons.length > 0 && (
                    <span className="ml-2">인물: {mem.persons.join(', ')}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
