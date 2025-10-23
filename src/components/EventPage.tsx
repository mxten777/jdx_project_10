import { useState } from 'react';

type Event = {
  id: number;
  title: string;
  date: string;
};

const dummyEvents: Event[] = [
  { id: 1, title: '2025년 동창회', date: '2025-11-15' },
  { id: 2, title: '2026년 봄 소풍', date: '2026-04-10' },
];

export default function EventPage() {
  const [attend, setAttend] = useState<{ [id: number]: boolean }>({});

  function toggleAttend(id: number) {
    setAttend(a => ({ ...a, [id]: !a[id] }));
  }

  return (
    <section className="bg-white p-6 rounded-xl shadow-soft mb-6">
      <h2 className="text-xl font-semibold mb-2 text-accent">동창회 일정</h2>
      <div className="flex flex-col gap-4">
        {dummyEvents.map(ev => (
          <div key={ev.id} className="bg-softGray rounded-lg shadow p-3 flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
            <div className="flex-1">
              <div className="text-base text-gray-800 font-bold">{ev.title}</div>
              <div className="text-sm text-gray-500">{ev.date}</div>
            </div>
            <button
              className={`px-4 py-2 rounded font-bold transition-colors ${attend[ev.id] ? 'bg-accent text-white' : 'bg-pastelBlue text-accent'}`}
              onClick={() => toggleAttend(ev.id)}
            >
              {attend[ev.id] ? '참석 취소' : '참석하기'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
