import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const ResultLookupPage: React.FC = () => {
  const [searchKey, setSearchKey] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (searchKey.trim() === '0892' || searchKey.trim() === '089201000123') {
      setSearchResult({
        id: 'THS-2026-0892',
        name: 'Nguyễn Thị Ngân Huệ',
        idCard: '089201000123',
        major: 'Kỹ thuật Phần mềm (Chương trình Thạc sĩ Khóa 2026)',
        status: 'Trúng Tuyển Chính Thức',
        note: 'Đã hoàn tất hồ sơ xét tuyển. Giấy báo trúng tuyển đã gửi qua Email đăng ký.'
      });
    } else {
      setSearchResult(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-12 px-4">
      <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">Tra Cứu Hồ Sơ & Kết Quả Tuyển Sinh</h1>
      <p className="text-center text-slate-500 text-sm mb-6">
        Nhập số CCCD hoặc Mã hồ sơ (Thử nghiệm với mã: <code className="bg-sky-100 px-2 py-0.5 rounded text-sky-700 font-mono">0892</code>)
      </p>

      <form onSubmit={handleSearch} className="relative mb-8">
        <input 
          type="text" placeholder="Nhập CCCD hoặc Mã hồ sơ..."
          value={searchKey} onChange={e => setSearchKey(e.target.value)}
          className="w-full pl-5 pr-28 py-4 rounded-2xl border border-slate-300 outline-none text-sm focus:ring-2 focus:ring-sky-500 shadow-sm"
        />
        <button type="submit" className="absolute right-2 top-2 bottom-2 px-6 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl text-sm flex items-center space-x-1">
          <Search className="w-4 h-4" /> <span>Tra cứu</span>
        </button>
      </form>

      {hasSearched && (
        searchResult ? (
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">Trúng Tuyển Chính Thức</span>
                <h3 className="text-xl font-bold text-slate-800 mt-2">{searchResult.name}</h3>
              </div>
              <p className="font-mono font-bold text-slate-700 text-sm">{searchResult.id}</p>
            </div>
            <div className="my-4 text-sm space-y-1">
              <p><span className="text-slate-400">Ngành:</span> <strong className="text-slate-700">{searchResult.major}</strong></p>
              <p><span className="text-slate-400">CCCD:</span> <strong className="text-slate-700">{searchResult.idCard}</strong></p>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl text-sky-800 text-xs">
              {searchResult.note}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-500">
            <p className="font-medium text-rose-600">Không tìm thấy thông tin hồ sơ!</p>
            <p className="text-xs mt-1 text-slate-400">Vui lòng kiểm tra lại số CCCD hoặc mã hồ sơ dự tuyển.</p>
          </div>
        )
      )}
    </div>
  );
};