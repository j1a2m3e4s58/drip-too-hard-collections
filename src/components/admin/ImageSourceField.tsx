import React, { useId, useRef, useState } from 'react';
import { Loader2, Upload, Link as LinkIcon, Cloud } from 'lucide-react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';
import { normalizeGoogleDriveUrl } from '../../lib/storefront';
import { importGoogleDriveImageAsDataUrl } from '../../lib/googleDriveImport';

type SourceType = 'url' | 'upload' | 'drive';

interface ImageSourceFieldProps {
  label: string;
  value: string;
  sourceType?: SourceType;
  originalUrl?: string;
  storageFolder: string;
  helperText?: string;
  onChange: (payload: {
    image: string;
    imageSourceType: SourceType;
    imageOriginalUrl?: string;
    imageStoragePath?: string;
  }) => void;
}

const ImageSourceField = ({
  label,
  value,
  sourceType = 'url',
  originalUrl,
  storageFolder,
  helperText,
  onChange,
}: ImageSourceFieldProps) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [driveUrl, setDriveUrl] = useState(originalUrl || '');
  const [activeMode, setActiveMode] = useState<SourceType>(sourceType);
  const [driveNotice, setDriveNotice] = useState('');

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBusy(true);
    try {
      const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      const fileRef = ref(storage, `${storageFolder}/${safeName}`);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(fileRef);
      onChange({
        image: downloadUrl,
        imageSourceType: 'upload',
        imageOriginalUrl: downloadUrl,
        imageStoragePath: fileRef.fullPath,
      });
      setActiveMode('upload');
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Image upload failed. Please try again or use an image URL.');
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDriveImport = async (rawDriveUrl: string) => {
    setDriveUrl(rawDriveUrl);
    setDriveNotice('');

    if (!rawDriveUrl.trim()) {
      onChange({
        image: '',
        imageSourceType: 'drive',
        imageOriginalUrl: '',
      });
      return;
    }

    setBusy(true);
    try {
      const imported = await importGoogleDriveImageAsDataUrl(rawDriveUrl);
      onChange({
        image: imported.dataUrl,
        imageSourceType: 'drive',
        imageOriginalUrl: rawDriveUrl,
      });
      setDriveNotice('Google Drive image imported successfully.');
    } catch (error) {
      console.error('Google Drive import failed:', error);
      const fallbackUrl = normalizeGoogleDriveUrl(rawDriveUrl);
      onChange({
        image: fallbackUrl,
        imageSourceType: 'drive',
        imageOriginalUrl: rawDriveUrl,
      });
      setDriveNotice('Drive import failed, so the app saved the direct Drive image URL instead.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-[10px] uppercase tracking-widest font-bold text-white/50">
          {label}
        </label>
        <input
          id={inputId}
          type="url"
          value={activeMode === 'drive' ? driveUrl : value}
          onChange={async (event) => {
            const nextValue = event.target.value;
            if (activeMode === 'drive') {
              await handleDriveImport(nextValue);
            } else {
              setDriveNotice('');
              onChange({
                image: nextValue,
                imageSourceType: 'url',
                imageOriginalUrl: nextValue,
              });
            }
          }}
          placeholder={activeMode === 'drive' ? 'Paste Google Drive share link' : 'https://...'}
          className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm focus:border-yellow-400 outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveMode('url');
            setDriveNotice('');
            onChange({
              image: value,
              imageSourceType: 'url',
              imageOriginalUrl: value,
            });
          }}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
            activeMode === 'url'
              ? 'border-yellow-400 bg-yellow-400 text-black'
              : 'border-yellow-400/60 text-yellow-300 hover:bg-yellow-400/10'
          }`}
        >
          <LinkIcon size={14} />
          Image URL
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode('upload');
            setDriveNotice('');
            fileInputRef.current?.click();
          }}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
            activeMode === 'upload'
              ? 'border-yellow-400 bg-yellow-400 text-black'
              : 'border-yellow-400/60 text-yellow-300 hover:bg-yellow-400/10'
          }`}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload from device
        </button>
        <button
          type="button"
          onClick={async () => {
            setActiveMode('drive');
            await handleDriveImport(driveUrl || originalUrl || value);
          }}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
            activeMode === 'drive'
              ? 'border-yellow-400 bg-yellow-400 text-black'
              : 'border-yellow-400/60 text-yellow-300 hover:bg-yellow-400/10'
          }`}
        >
          <Cloud size={14} />
          Google Drive
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {helperText && <p className="text-xs text-white/45">{helperText}</p>}
      {driveNotice && <p className="text-xs text-white/55">{driveNotice}</p>}

      {value && (
        <div className="rounded-3xl border border-white/10 bg-black/30 p-3">
          <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-950">
            <img src={value} alt={label} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSourceField;
