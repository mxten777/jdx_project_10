import { useEffect, useState } from 'react';
import { firestore, auth } from '../firebase';
import { doc, getDoc, collection, onSnapshot, addDoc, Timestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

type Memory = {
  id: string;
  text: string;
  tags: string[];
  location: string;
  persons: string[];
  isPublic: boolean;
  urls: string[];
  createdAt?: { seconds: number };
  like?: number;
};

interface MemoryDetailProps {
  id?: string | null;
}

type Comment = {
  id: string;
  name: string;
  text: string;
  createdAt?: { seconds: number };
};

export default function MemoryDetail({ id }: MemoryDetailProps) {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  useEffect(() => {
    // Listen for auth state changes to set admin status
    const unsubAuth = auth.onAuthStateChanged((user: User | null) => {
      setIsAdmin(!!user && user.email === 'admin@email.com');
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!id || typeof id !== 'string') {
      setMemory(null);
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubMem = onSnapshot(doc(firestore, 'memories', id), snap => {
      if (snap.exists()) {
        const data = snap.data() as Memory;
        setMemory({ ...data, id: snap.id });
      } else {
        setMemory(null);
      }
      setLoading(false);
    });

    const unsubComments = onSnapshot(collection(firestore, 'memories', id, 'comments'), snap => {
      setComments(
        snap.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Comment, 'id'>) }))
          .sort((a, b) => (a.createdAt?.seconds ?? 0) < (b.createdAt?.seconds ?? 0) ? 1 : -1)
      );
    });
    return () => {
      unsubMem();
      unsubComments();
    };
  }, [id]);

  async function handleLike() {
    if (!id || likeLoading) return;
    setLikeLoading(true);
    const memRef = doc(firestore, 'memories', id);
    const snap = await getDoc(memRef);
    if (snap.exists()) {
      const curr = (snap.data() as Memory).like ?? 0;
      await updateDoc(memRef, { like: curr + 1 });
    }
    setLikeLoading(false);
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !comment.trim() || commentLoading) return;
    setCommentLoading(true);
    await addDoc(collection(firestore, 'memories', id, 'comments'), {
      name: '익명',
      text: comment.trim(),
      createdAt: Timestamp.now(),
    });
    setComment('');
    setCommentLoading(false);
  }

  function handleShare() {
  if (!id) return;
  const url = window.location.origin + '/?memory=' + id;
  navigator.clipboard.writeText(url);
  setShareCopied(true);
  setTimeout(() => setShareCopied(false), 1200);
  }

  return (
    <section
      className="bg-white p-6 rounded-xl shadow-soft mb-6"
      role="region"
      aria-label="추억 상세 섹션"
    >
      {loading ? (
        <div className="text-gray-400" aria-live="polite">로딩 중...</div>
      ) : !memory ? (
        <div className="text-gray-400" aria-live="polite">추억을 찾을 수 없습니다.</div>
      ) : (
        <>
          <div className="flex gap-4 items-center mb-4">
          {/* 관리자만 삭제 버튼 노출 */}
          {isAdmin && (
            <button
              className="ml-2 px-2 py-1 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600"
              onClick={async () => {
                if (!id) return;
                await deleteDoc(doc(firestore, 'memories', id));
              }}
              aria-label="추억 삭제 버튼"
            >삭제</button>
          )}
            {memory.urls && memory.urls.length > 0 && (
              memory.urls[0].match(/\.mp4|\.webm|\.ogg$/)
                ? <video src={memory.urls[0]} controls className="w-32 h-32 object-cover rounded-lg" />
                : <img src={memory.urls[0]} alt="추억 사진" className="w-32 h-32 object-cover rounded-lg" />
            )}
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">
                {memory.location && <span>{memory.location} · </span>}
                {memory.createdAt ? new Date(memory.createdAt.seconds * 1000).toLocaleDateString() : ''}
                {memory.isPublic ? <span className="ml-2 px-2 py-0.5 rounded bg-accent text-white text-xs">공개</span> : <span className="ml-2 px-2 py-0.5 rounded bg-gray-400 text-white text-xs">비공개</span>}
              </div>
              <div className="text-base text-gray-800 mb-1">{memory.text}</div>
              <div className="text-xs text-gray-500 mb-1">
                {memory.tags && memory.tags.length > 0 && (
                  <span>태그: {memory.tags.join(', ')}</span>
                )}
                {memory.persons && memory.persons.length > 0 && (
                  <span className="ml-2">인물: {memory.persons.join(', ')}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center mb-4" role="group" aria-label="추억 상호작용 버튼 그룹">
            <button
              className={`px-3 py-1 rounded font-bold shadow transition flex items-center gap-1 ${likeLoading ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-pastelBlue text-accent hover:bg-accent hover:text-white'}`}
              onClick={handleLike}
              disabled={likeLoading}
              aria-label="좋아요 버튼"
            >
              ❤️ 좋아요 {memory.like ?? 0}
              {likeLoading && <span className="ml-1 animate-spin">⏳</span>}
            </button>
            <button
              className={`px-3 py-1 rounded font-bold shadow transition flex items-center gap-1 ${shareCopied ? 'bg-accent text-white' : 'bg-softGray text-accent hover:bg-accent hover:text-white'}`}
              onClick={handleShare}
              aria-label="공유 버튼"
            >
              🔗 공유
              {shareCopied && <span className="ml-1">복사됨!</span>}
            </button>
          </div>
          <form
            onSubmit={handleCommentSubmit}
            className="mb-4 flex gap-2"
            aria-label="댓글 작성 폼"
          >
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="flex-1 p-2 border rounded focus:outline-accent"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && comment.trim() && !commentLoading) {
                  e.preventDefault();
                  handleCommentSubmit({
                    preventDefault: () => {},
                  } as React.FormEvent);
                }
              }}
              disabled={commentLoading}
              aria-label="댓글 입력"
            />
            <button
              type="submit"
              className={`px-4 py-2 rounded font-bold shadow transition ${commentLoading ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-accent text-white hover:bg-pastelBlue'}`}
              disabled={!comment.trim() || commentLoading}
              aria-label="댓글 등록 버튼"
            >{commentLoading ? '등록중...' : '등록'}</button>
          </form>
          <div className="mb-2 text-sm text-gray-500 font-semibold" id="comment-list-heading">댓글</div>
          <div className="flex flex-col gap-2" role="list" aria-labelledby="comment-list-heading" aria-live="polite">
            {comments.length === 0 ? (
              <div className="text-gray-400">아직 댓글이 없습니다.</div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="bg-softGray rounded p-2 text-sm" role="listitem" aria-label={`댓글: ${c.text}`}>
                  <span className="font-bold text-accent mr-2">{c.name}</span>
                  <span>{c.text}</span>
                  <span className="ml-2 text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleString() : ''}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}