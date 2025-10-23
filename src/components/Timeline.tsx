
import { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import { collection, onSnapshot, QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

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

function groupByYearMonth(memories: Memory[]) {
  const groups: { [year: string]: { [month: string]: Memory[] } } = {};
  memories.forEach(m => {
    if (!m.createdAt) return;
    const date = new Date(m.createdAt.seconds * 1000);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    if (!groups[year]) groups[year] = {};
    if (!groups[year][month]) groups[year][month] = [];
    groups[year][month].push(m);
  });
  return groups;
}

export default function Timeline() {
  const [memories, setMemories] = useState<Memory[]>([]);
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

  const groups = groupByYearMonth(memories);
  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

  return (
    <section
      className="bg-cream p-6 rounded-xl shadow-soft mb-6"
      role="region"
      aria-label="추억 타임라인 섹션"
    >
      <h2 className="text-xl font-semibold mb-2 text-accent" id="timeline-section-heading">추억 타임라인</h2>
      <div className="flex flex-col gap-6" aria-labelledby="timeline-section-heading" aria-live="polite">
        {years.map(year => (
          <div key={year} role="group" aria-label={`${year}년 그룹`}>
            <div className="text-lg font-bold text-accent mb-2">{year}년</div>
            {Object.keys(groups[year]).sort((a, b) => Number(b) - Number(a)).map(month => (
              <div key={month} role="group" aria-label={`${year}년 ${month}월 그룹`}>
                <div className="text-base font-semibold text-accent mb-1 ml-2">{month}월</div>
                <div className="flex flex-col gap-2 ml-6 border-l-4 border-accent pl-4" role="list" aria-label={`${year}년 ${month}월 추억 리스트`}>
                  {groups[year][month].map(mem => (
                    <div key={mem.id} className="bg-white rounded-lg shadow-soft p-3 flex gap-3 items-center" role="listitem" aria-label={`추억: ${mem.text}`} tabIndex={0}>
                      {mem.urls && mem.urls.length > 0 ? (
                        mem.urls[0].match(/\.mp4|\.webm|\.ogg$/)
                          ? <video src={mem.urls[0]} controls className="w-16 h-16 object-cover rounded-lg" />
                          : <img src={mem.urls[0]} alt="추억 사진" className="w-16 h-16 object-cover rounded-lg" />
                      ) : null}
                      <div className="text-gray-800">{mem.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
