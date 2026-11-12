import React, { useState } from 'react';
import { UploadCloud, FileText, AlertCircle, X } from 'lucide-react';

interface Props {
  onFileSelect: (file: File | null) => void;
  maxSizeMB?: number;
}

export const FileUploadZone: React.FC<Props> = ({ onFileSelect, maxSizeMB = 25 }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`Tệp vượt quá ${maxSizeMB}MB (${sizeMB.toFixed(1)}MB). Vui lòng chọn tệp nhỏ hơn!`);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Hồ sơ minh chứng đính kèm (≤ {maxSizeMB}MB) *
      </label>
      
      {!selectedFile ? (
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-sky-300 rounded-2xl cursor-pointer bg-sky-50/40 hover:bg-sky-50 transition">
          <UploadCloud className="w-8 h-8 text-sky-600 mb-2" />
          <p className="text-sm text-slate-600">Kéo thả tệp hoặc <span className="text-sky-600 font-semibold underline">Duyệt từ máy</span></p>
          <p className="text-xs text-slate-400 mt-1">Định dạng PDF, ZIP, RAR (Dung lượng tối đa {maxSizeMB}MB)</p>
          <input type="file" className="hidden" accept=".pdf,.zip,.rar" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
          <button type="button" onClick={handleRemove} className="text-slate-400 hover:text-rose-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-rose-600 text-xs font-medium mt-2 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
};