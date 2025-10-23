import { useState } from 'react';

const memory = {
  id: 1,
  year: 2010,
  text: '운동회에서 친구들과 함께한 즐거운 하루!',
  image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
};
const dummyComments = [
  { id: 1, name: '민수', text: '진짜 재밌었지!' },
  { id: 2, name: '지영', text: '사진 보니까 그때 생각난다~' },
];

export default function MemoryDetail() {
  const [like, setLike] = useState(0);
  const [comments, setComments] = useState(dummyComments);
  const [comment, setComment] = useState('');

  function handleAddComment() {
    if (comment.trim()) {
      setComments([...comments, { id: Date.now(), name: '익명', text: comment }]);
      setComment('');
    }
  }

  return (
    <section className="bg-cream p-6 rounded-xl shadow-soft mb-6">
      <h2 className="text-xl font-semibold mb-2 text-accent">추억 상세보기</h2>
      <div className="flex flex-col items-center mb-4">
        <img src={memory.image} alt="추억 사진" className="w-48 h-48 object-cover rounded-xl mb-2 shadow" />
        <div className="text-sm text-gray-500 mb-1">{memory.year}년</div>
        <div className="text-base text-gray-800 mb-2">{memory.text}</div>
        <button
          className="bg-accent hover:bg-pastelBlue text-white px-4 py-2 rounded font-bold transition-colors"
          onClick={() => setLike(like + 1)}
        >
          ❤️ 좋아요 {like}
        </button>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2 text-accent">댓글</h3>
        <div className="flex flex-col gap-2 mb-2">
          {comments.map(c => (
            <div key={c.id} className="bg-white rounded p-2 text-gray-700 shadow-soft">
              <span className="font-bold text-accent mr-2">{c.name}</span>
              {c.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="flex-1 p-2 rounded border"
          />
          <button
            className="bg-accent text-white px-3 py-1 rounded font-bold"
            onClick={handleAddComment}
            disabled={!comment.trim()}
          >
            등록
          </button>
        </div>
      </div>
    </section>
  );
}
