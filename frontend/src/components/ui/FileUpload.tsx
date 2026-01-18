import { useState, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  currentFile?: string;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
  preview?: boolean;
  className?: string;
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  currentFile,
  accept = "image/*",
  maxSize = 5,
  label = "Upload File",
  description = "Select a file to upload",
  preview = true,
  className = ""
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFile || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      toast.error('Invalid file type');
      return;
    }

    // Create preview URL for images
    if (preview && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    onFileSelect(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileRemove) {
      onFileRemove();
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Preview */}
      {previewUrl && preview && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemove}
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            {accept.includes('image') ? (
              <PhotoIcon className="w-full h-full" />
            ) : (
              <CloudArrowUpIcon className="w-full h-full" />
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {accept.includes('image') ? 'PNG, JPG, GIF' : 'All files'} up to {maxSize}MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}