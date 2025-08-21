
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

/**
 * A component that provides a user-friendly interface for uploading files,
 * supporting both drag-and-drop and traditional file selection.
 */
const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  // State to track if a file is being dragged over the drop zone for UI feedback.
  const [isDragging, setIsDragging] = useState(false);

  // --- Drag and Drop Event Handlers ---

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // This must be handled to allow the 'drop' event to fire.
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Process the dropped file(s).
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFileSelect]);

  /**
   * Handles file selection from the standard file input dialog.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragging ? 'border-sky-400 bg-sky-900/20' : 'border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700/50'}`}
      >
        <input
          id="file-upload"
          type="file"
          accept=".json,.xml,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        {/* The label makes the entire area clickable, triggering the file input. */}
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <UploadIcon />
          <p className="mt-4 text-lg font-semibold text-slate-300">
            Drag & drop a file here or <span className="text-sky-400">browse</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Supported formats: JSON, XML, PDF
          </p>
        </label>
      </div>
    </div>
  );
};

export default FileUpload;
