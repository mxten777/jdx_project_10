import { useState } from 'react';

const dummyMessages = [
  { id: 1, name: '민수', text: '안녕~ 다들 잘 지내?' },
  { id: 2, name: '지영', text: '오랜만이다! 반가워~' },
];

export default function ChatRoom() {
  const [messages, setMessages] = useState(dummyMessages);
  const [msg, setMsg] = useState('');

  function handleSend() {
    if (msg.trim()) {
      setMessages([...messages, { id: Date.now(), name: '익명', text: msg }]);
      setMsg('');
    }
  }

  return (
    <section className="bg-white p-6 rounded-xl shadow-soft mb-6 flex flex-col">
      <h2 className="text-xl font-semibold mb-2 text-accent">동창 채팅방</h2>
      <div className="flex-1 flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
        {messages.map(m => (
          <div key={m.id} className="bg-softGray rounded p-2 text-gray-700 shadow-soft">
            <span className="font-bold text-accent mr-2">{m.name}</span>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-auto">
        <input
          type="text"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="메시지 입력..."
          className="flex-1 p-2 rounded border"
        />
        <button
          className="bg-accent text-white px-3 py-1 rounded font-bold"
          onClick={handleSend}
          disabled={!msg.trim()}
        >
          전송
        </button>
      </div>
    </section>
  );
}
