import { useEffect, useState } from 'react';
import { firestore, auth } from '../firebase';
import { collection, onSnapshot, QueryDocumentSnapshot, QuerySnapshot, deleteDoc, doc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
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
};

interface MemoryListProps {
  onSelect?: (id: string) => void;
}

export default function MemoryList({ onSelect }: MemoryListProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showPublicOnly, setShowPublicOnly] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Import auth and Firestore deleteDoc/doc
  // (add to top imports if not present)
  // import { firestore, auth } from '../firebase';
  // import { deleteDoc, doc } from 'firebase/firestore';

  useEffect(() => {
    // Listen for auth state changes to set admin status
    const unsubAuth = auth.onAuthStateChanged((user: User | null) => {
      setIsAdmin(!!user && user.email === 'admin@email.com');
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, 'memories'),
      (snap: QuerySnapshot<DocumentData>) => {
        setMemories(
          snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as Memory;
            return { ...data, id: doc.id };
          })
        );
      }
    );
    return () => unsub();
  }, []);

    // 전체 태그 목록 추출
    const allTags: string[] = Array.from(new Set(memories.flatMap((m: Memory) => m.tags ?? []))).filter(Boolean) as string[];
    // 전체 장소 목록 추출
    const allLocations: string[] = Array.from(new Set(memories.map((m: Memory) => m.location).filter(Boolean))) as string[];
    // 전체 인물 목록 추출
    const allPersons: string[] = Array.from(new Set(memories.flatMap((m: Memory) => m.persons ?? []))).filter(Boolean) as string[];

    let filtered = showPublicOnly ? memories.filter((m: Memory) => m.isPublic) : memories;
    if (selectedTag) {
      filtered = filtered.filter((m: Memory) => m.tags?.includes(selectedTag));
    }
    if (selectedLocation) {
      filtered = filtered.filter((m: Memory) => m.location === selectedLocation);
    }
    if (selectedPerson) {
      filtered = filtered.filter((m: Memory) => m.persons?.includes(selectedPerson));
    }
    filtered = [...filtered].sort((a: Memory, b: Memory) => {
      const aTime = a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? 0;
      return sortDesc ? bTime - aTime : aTime - bTime;
    });

    return (
      <section
        className="bg-white p-6 rounded-xl shadow-soft mb-6"
        role="region"
        aria-label="추억 목록 섹션"
      >
        <h2 className="text-xl font-semibold mb-2 text-accent" id="memory-list-heading">추억 목록</h2>
        <div className="mb-4 flex gap-2 flex-wrap" role="group" aria-label="추억 목록 필터 그룹">
          <button
            className={`px-3 py-1 rounded font-bold ${sortDesc ? 'bg-accent text-white' : 'bg-softGray text-accent'} transition`}
            onClick={() => setSortDesc(true)}
            aria-label="최신순 정렬"
            aria-pressed={sortDesc}
          >최신순</button>
          <button
            className={`px-3 py-1 rounded font-bold ${!sortDesc ? 'bg-accent text-white' : 'bg-softGray text-accent'} transition`}
            onClick={() => setSortDesc(false)}
            aria-label="오래된순 정렬"
            aria-pressed={!sortDesc}
          >오래된순</button>
          <button
            className="px-3 py-1 rounded font-bold bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
            onClick={() => {
              setShowPublicOnly(true);
              setSelectedTag('');
              setSelectedLocation('');
              setSelectedPerson('');
            }}
            aria-label="필터 초기화"
          >필터 초기화</button>
          <button
            className={`px-3 py-1 rounded font-bold transition-colors ${showPublicOnly ? 'bg-accent text-white' : 'bg-softGray text-accent'}`}
            onClick={() => setShowPublicOnly(true)}
            aria-label="공개만 보기"
            aria-pressed={showPublicOnly}
          >공개만 보기</button>
          <button
            className={`px-3 py-1 rounded font-bold transition-colors ${!showPublicOnly ? 'bg-accent text-white' : 'bg-softGray text-accent'}`}
            onClick={() => setShowPublicOnly(false)}
            aria-label="전체 보기"
            aria-pressed={!showPublicOnly}
          >전체 보기</button>
          {allTags.length > 0 && <span className="ml-2 text-sm text-gray-500">| 태그별 보기:</span>}
          {allTags.map((tag: string) => (
            <button
              key={tag}
              className={`px-2 py-1 rounded text-xs font-bold border ${selectedTag === tag ? 'bg-accent text-white border-accent' : 'bg-softGray text-accent border-gray-300'}`}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              aria-label={`태그 '${tag}'로 필터링`}
              aria-pressed={selectedTag === tag}
            >{tag}</button>
          ))}
          {allLocations.length > 0 && <span className="ml-2 text-sm text-gray-500">| 장소별 보기:</span>}
          {allLocations.map((loc: string) => (
            <button
              key={loc}
              className={`px-2 py-1 rounded text-xs font-bold border ${selectedLocation === loc ? 'bg-accent text-white border-accent' : 'bg-softGray text-accent border-gray-300'}`}
              onClick={() => setSelectedLocation(selectedLocation === loc ? '' : loc)}
              aria-label={`장소 '${loc}'로 필터링`}
              aria-pressed={selectedLocation === loc}
            >{loc}</button>
          ))}
          {allPersons.length > 0 && <span className="ml-2 text-sm text-gray-500">| 인물별 보기:</span>}
          {allPersons.map((person: string) => (
            <button
              key={person}
              className={`px-2 py-1 rounded text-xs font-bold border ${selectedPerson === person ? 'bg-accent text-white border-accent' : 'bg-softGray text-accent border-gray-300'}`}
              onClick={() => setSelectedPerson(selectedPerson === person ? '' : person)}
              aria-label={`인물 '${person}'로 필터링`}
              aria-pressed={selectedPerson === person}
            >{person}</button>
          ))}
        </div>
        <div className="flex flex-col gap-4" aria-live="polite">
          {filtered.length === 0 ? (
            <div className="text-gray-400">{showPublicOnly ? '공개된 추억이 없습니다.' : '아직 등록된 추억이 없습니다.'}</div>
          ) : (
            filtered.map((mem: Memory) => (
              <div
                key={mem.id}
                className="bg-softGray rounded-lg shadow p-3 flex gap-3 items-center cursor-pointer hover:bg-pastelBlue transition"
                onClick={() => onSelect?.(mem.id)}
                role="article"
                aria-label={`추억: ${mem.text}`}
                tabIndex={0}
              >
                {mem.urls && mem.urls.length > 0 && (
                  mem.urls[0].match(/\.mp4|\.webm|\.ogg$/)
                    ? <video src={mem.urls[0]} controls className="w-20 h-20 object-cover rounded-lg" />
                    : <img src={mem.urls[0]} alt="추억 사진" className="w-20 h-20 object-cover rounded-lg" />
                )}
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
                {/* 관리자만 삭제 버튼 노출 */}
                {isAdmin && (
                  <button
                    className="ml-2 px-2 py-1 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteDoc(doc(firestore, 'memories', mem.id));
                    }}
                    aria-label={`추억 '${mem.text}' 삭제 버튼`}
                  >삭제</button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    );
  }
