import { useCallback, useRef, useState } from 'react';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_FILES = 8;
const MAX_BYTES = 10 * 1024 * 1024;

export default function PhotoUploader({
  disabled = false,
  uploading = false,
  progress = 0,
  progressPhase = 'upload',
  fileCount = 0,
  onUpload,
  hint = 'JPEG, PNG or WebP · max 10MB each · auto-compressed on the server',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  const pickFiles = useCallback(
    async (fileList) => {
      setLocalError('');
      const files = [...(fileList || [])];
      if (!files.length) return;

      if (files.length > MAX_FILES) {
        setLocalError(`Choose at most ${MAX_FILES} photos at once`);
        return;
      }

      const allowed = [];
      for (const file of files) {
        const mime = String(file.type || '').toLowerCase();
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(mime)) {
          setLocalError(`${file.name}: only JPEG, PNG, or WebP allowed`);
          return;
        }
        if (file.size > MAX_BYTES) {
          setLocalError(`${file.name} is over 10MB`);
          return;
        }
        allowed.push(file);
      }

      await onUpload(allowed);
    },
    [onUpload],
  );

  const onDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    await pickFiles(e.dataTransfer.files);
  };

  const percent = Math.max(0, Math.min(100, Number(progress) || 0));
  const phaseLabel =
    progressPhase === 'processing'
      ? 'Compressing on server…'
      : progressPhase === 'done'
        ? 'Done'
        : 'Uploading…';

  return (
    <div className="photo-uploader">
      <div
        className={`photo-dropzone ${dragging ? 'photo-dropzone--active' : ''} ${
          disabled ? 'photo-dropzone--disabled' : ''
        } ${uploading ? 'photo-dropzone--busy' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !uploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-disabled={disabled || uploading}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled || uploading}
          onChange={async (e) => {
            await pickFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="photo-dropzone__icon" aria-hidden>
          ↑
        </div>
        <p className="photo-dropzone__title">
          {uploading
            ? phaseLabel
            : disabled
              ? 'Save the car first'
              : 'Drop photos here'}
        </p>
        <p className="photo-dropzone__hint">
          {disabled
            ? 'Create the vehicle, then you can add photos safely.'
            : uploading
              ? fileCount > 1
                ? `Uploading ${fileCount} photos`
                : 'Uploading 1 photo'
              : `or click to browse · multiple files · up to ${MAX_FILES}`}
        </p>
        {!disabled && !uploading && <p className="photo-dropzone__meta">{hint}</p>}

        {uploading && (
          <div
            className="photo-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Upload progress"
          >
            <div className="photo-progress__track">
              <span
                className={`photo-progress__bar ${
                  progressPhase === 'processing' ? 'photo-progress__bar--pulse' : ''
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="photo-progress__label">{percent}%</p>
          </div>
        )}
      </div>
      {localError && <p className="photo-uploader__error">{localError}</p>}
      {!disabled && (
        <p className="photo-uploader__note">
          Select several images at once (max {MAX_FILES}). Server compresses each file automatically.
        </p>
      )}
    </div>
  );
}
