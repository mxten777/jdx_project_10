import { useState } from 'react';

export default function MemoryUpload() {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  return (
    <section className="bg-cream p-6 rounded-xl shadow-soft mb-6 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-2 text-accent">추억 업로드</h2>
      <label className="w-full cursor-pointer mb-2">
        <span className="block mb-1 text-sm text-gray-500">사진 선택</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-full h-40 bg-softGray rounded flex items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt="미리보기" className="object-cover w-full h-full rounded" />
          ) : (
            <span className="text-gray-400">사진을 선택하세요</span>
          )}
        </div>
      </label>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="추억을 남겨보세요..."
        className="w-full p-2 rounded border mb-2 bg-white text-gray-700"
        rows={3}
      />
      <button
        className="bg-accent hover:bg-pastelBlue text-white px-4 py-2 rounded font-bold w-full transition-colors"
        disabled={!file || !text}
      >
        업로드
      </button>
    </section>
  );
}
