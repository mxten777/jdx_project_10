import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { firestore, auth } from '../firebase';
import { collection, onSnapshot, QueryDocumentSnapshot, QuerySnapshot, deleteDoc, doc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import type { User } from 'firebase/auth';
// import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveGrid } from './responsive/ResponsiveLayout';
import { SwipeableCard, TouchButton, LongPressMenu } from './responsive/TouchOptimized';
import { cn } from '../utils/cn';

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
          <TouchButton
            variant={showPublicOnly ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowPublicOnly(true)}
            className="!min-h-[44px]"
          >
            공개만 보기
          </TouchButton>
          <TouchButton
            variant={!showPublicOnly ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowPublicOnly(false)}
            className="!min-h-[44px]"
          >
            전체 보기
          </TouchButton>
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
        <ResponsiveGrid 
          cols={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
          gap="md"
          className="mt-6"
        >
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-lg font-medium mb-2">
                {showPublicOnly ? '공개된 추억이 없습니다.' : '아직 등록된 추억이 없습니다.'}
              </p>
              <p className="text-sm">첫 번째 추억을 업로드해보세요!</p>
            </div>
          ) : (
            filtered.map((mem: Memory) => (
              <SwipeableCard
                key={mem.id}
                onSwipeLeft={() => onSelect?.(mem.id)}
                onSwipeRight={isAdmin ? async () => {
                  if (confirm('정말 삭제하시겠습니까?')) {
                    await deleteDoc(doc(firestore, 'memories', mem.id));
                  }
                } : undefined}
                leftAction={isAdmin ? (
                  <div className="flex items-center text-white">
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    삭제
                  </div>
                ) : undefined}
                rightAction={
                  <div className="flex items-center text-white">
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    보기
                  </div>
                }
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <LongPressMenu
                  menuItems={[
                    {
                      id: 'view',
                      label: '상세보기',
                      icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      ),
                      onClick: () => onSelect?.(mem.id)
                    },
                    ...(isAdmin ? [{
                      id: 'delete',
                      label: '삭제',
                      icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      ),
                      onClick: async () => {
                        if (confirm('정말 삭제하시겠습니까?')) {
                          await deleteDoc(doc(firestore, 'memories', mem.id));
                        }
                      },
                      destructive: true
                    }] : [])
                  ]}
                >
                  <motion.div
                    className="p-4 cursor-pointer"
                    onClick={() => onSelect?.(mem.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    role="article"
                    aria-label={`추억: ${mem.text}`}
                  >
                    {/* Media Preview */}
                    {mem.urls && mem.urls.length > 0 && (
                      <div className="mb-3 rounded-lg overflow-hidden">
                        {mem.urls[0].match(/\.mp4|\.webm|\.ogg$/) ? (
                          <video 
                            src={mem.urls[0]} 
                            className="w-full h-48 object-cover" 
                            poster={mem.urls[1] || undefined}
                          />
                        ) : (
                          <img 
                            src={mem.urls[0]} 
                            alt="추억 사진" 
                            className="w-full h-48 object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="space-y-2">
                      {/* Meta info */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          {mem.location && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              <span>{mem.location}</span>
                            </div>
                          )}
                          {mem.createdAt && (
                            <span>{new Date(mem.createdAt.seconds * 1000).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          mem.isPublic 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {mem.isPublic ? '공개' : '비공개'}
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="text-gray-900 font-medium line-clamp-2">
                        {mem.text}
                      </div>

                      {/* Tags and persons */}
                      {(mem.tags?.length > 0 || mem.persons?.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {mem.tags?.map(tag => (
                            <span 
                              key={tag} 
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                          {mem.persons?.map(person => (
                            <span 
                              key={person} 
                              className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              @{person}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </LongPressMenu>
              </SwipeableCard>
            ))
          )}
        </ResponsiveGrid>
      </section>
    );
  }
