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

function groupByYear(memories: Memory[]) {
  const groups: { [year: number]: Memory[] } = {};
  memories.forEach(m => {
    if (!groups[m.year]) groups[m.year] = [];
    groups[m.year].push(m);
  });
  return groups;
}

export default function Timeline() {
  const groups = groupByYear(dummyMemories);
  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

  return (
    <section className="bg-cream p-6 rounded-xl shadow-soft mb-6">
      <h2 className="text-xl font-semibold mb-2 text-accent">추억 타임라인</h2>
      <div className="flex flex-col gap-6">
        {years.map(year => (
          <div key={year}>
            <div className="text-lg font-bold text-accent mb-2">{year}년</div>
            <div className="flex flex-col gap-2 ml-4 border-l-4 border-accent pl-4">
              {groups[Number(year)].map(mem => (
                <div key={mem.id} className="bg-white rounded-lg shadow-soft p-3 flex gap-3 items-center">
                  <img src={mem.image} alt="추억 사진" className="w-16 h-16 object-cover rounded-lg" />
                  <div className="text-gray-800">{mem.text}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
