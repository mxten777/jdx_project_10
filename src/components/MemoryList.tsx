type Memory = {
  id: number;
  year: number;
  text: string;
  image: string;
};

const dummyMemories: Memory[] = [
  {
    id: 1,
    year: 2010,
    text: '운동회에서 친구들과 함께한 즐거운 하루!',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    year: 2012,
    text: '수학여행에서 찍은 단체사진',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 3,
    year: 2011,
    text: '졸업식의 감동적인 순간',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
  },
];

export default function MemoryList() {
  // 연도순 정렬 (최신순)
  const memories = [...dummyMemories].sort((a, b) => b.year - a.year);

  return (
    <section className="bg-white p-6 rounded-xl shadow-soft mb-6">
      <h2 className="text-xl font-semibold mb-2 text-accent">추억 목록</h2>
      <div className="flex flex-col gap-4">
        {memories.map(mem => (
          <div key={mem.id} className="bg-softGray rounded-lg shadow p-3 flex gap-3 items-center">
            <img src={mem.image} alt="추억 사진" className="w-20 h-20 object-cover rounded-lg" />
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">{mem.year}년</div>
              <div className="text-base text-gray-800">{mem.text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
