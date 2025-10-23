




import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, firestore } from '../firebase';
import { auth } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function MemoryUpload() {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [persons, setPersons] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    setFiles(selectedFiles);
    const previewList: string[] = [];
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        previewList.push(reader.result as string);
        if (previewList.length === selectedFiles.length) {
          setPreviews([...previewList]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (selectedFiles.length === 0) setPreviews([]);
  }

  async function handleUpload() {
    if (files.length === 0 || !text) return;
    setUploading(true);
    const storage = getStorage(app);
    const urls: string[] = [];
    for (const file of files) {
      const storageRef = ref(storage, `memories/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    setUploadedUrls(urls);

    // Firestore에 저장
      try {
        await addDoc(collection(firestore, 'memories'), {
          text,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          location,
          persons: persons.split(',').map(p => p.trim()).filter(Boolean),
          isPublic,
          urls,
          createdAt: Timestamp.now(),
          userEmail: auth.currentUser?.email || '',
        });
    } catch (e) {
      // 에러 처리 (예: alert)
      alert('Firestore 저장 중 오류 발생: ' + (e instanceof Error ? e.message : String(e)));
    }
    setUploading(false);
  }

  return (
    <section className="bg-cream p-6 rounded-xl shadow-soft mb-6 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-2 text-accent">추억 업로드</h2>
      <div className="w-full flex flex-col gap-2">
        <label className="w-full cursor-pointer mb-2">
          <span className="block mb-1 text-sm text-gray-500">사진/동영상 선택</span>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <div className="w-full min-h-40 bg-softGray rounded flex items-center justify-center overflow-x-auto gap-2 p-2">
          {previews.length > 0 ? (
            previews.map((src, idx) =>
              src.startsWith('data:video') ? (
                <video key={idx} src={src} controls className="w-32 h-32 object-cover rounded" />
              ) : (
                <img key={idx} src={src} alt="미리보기" className="w-32 h-32 object-cover rounded" />
              )
            )
          ) : (
            <span className="text-gray-400">사진/동영상을 선택하세요</span>
          )}
        </div>
        <textarea
          className="w-full p-2 mb-2 border rounded focus:outline-accent"
          rows={3}
          placeholder="추억의 내용을 입력하세요"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <input
          className="w-full p-2 mb-2 border rounded focus:outline-accent"
          type="text"
          placeholder="태그 입력 (쉼표로 구분, 예: 졸업,여행,친구)"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
        <input
          className="w-full p-2 mb-2 border rounded focus:outline-accent"
          type="text"
          placeholder="장소 입력 (예: 학교, 카페, 여행지)"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        <input
          className="w-full p-2 mb-2 border rounded focus:outline-accent"
          type="text"
          placeholder="인물 입력 (쉼표로 구분, 예: 홍길동,김철수)"
          value={persons}
          onChange={e => setPersons(e.target.value)}
        />
        <div className="w-full flex items-center mb-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className="mr-2 accent-accent"
            />
            <span className="text-sm">공개 (체크 시 전체 공개, 해제 시 비공개)</span>
          </label>
        </div>
        <button
          className="bg-accent hover:bg-pastelBlue text-white px-4 py-2 rounded font-bold w-full transition-colors"
          disabled={files.length === 0 || !text || uploading}
          onClick={handleUpload}
        >
          {uploading ? '업로드 중...' : '업로드'}
        </button>
        {uploadedUrls.length > 0 && (
          <div className="w-full mt-4">
            <h3 className="text-base font-semibold mb-2 text-accent">업로드 완료!</h3>
            <ul className="list-disc pl-5">
              {uploadedUrls.map((url, idx) => (
                <li key={idx}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">파일 {idx + 1} 보기</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
