"use client";

import { useState } from "react";
import { FileUpload } from "./file-upload";
import { UploadButton } from "@/lib/uploadthing";
import { useToast } from "@/hooks/use-toast";

interface UploadAdapterProps {
  onUploadComplete?: (urls: string[]) => void;
  onChange?: (files: File[]) => void;
  value?: string | string[];
  maxFiles?: number;
  isMultiple?: boolean;
  accept?: Record<string, string[]>;
  className?: string;
  endpoint?: "imageUploader";
  label?: string;
  helpText?: string;
  imageType?: "product" | "banner";
}

export function UploadAdapter({
  onUploadComplete,
  onChange,
  value,
  maxFiles = 1,
  isMultiple = false,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.webp']
  },
  className,
  endpoint = "imageUploader",
  label = "Upload Image",
  helpText = "Accepted formats: JPG, PNG, WebP",
  imageType = "product"
}: UploadAdapterProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    onChange && onChange(selectedFiles);
    
    // Trigger the upload process when files are selected
    document.getElementById("ut-upload-button")?.click();
  };

  return (
    <div className={className}>
      <div className="relative">
        <FileUpload 
          onChange={handleFileChange}
          value={value}
          maxFiles={maxFiles}
          accept={accept}
        />

        {/* Hidden UploadThing button that gets triggered by FileUpload */}
        <div className="hidden">
          <UploadButton
            endpoint={endpoint}
            content={{
              button({ ready }) {
                return ready ? label : "Loading...";
              },
              allowedContent() {
                return helpText;
              }
            }}
            appearance={{
              button: "bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md font-medium transition-colors",
              container: "w-full flex flex-col items-center gap-2",
              allowedContent: "text-sm text-muted-foreground"
            }}
            className="w-full ut-upload-button:bg-primary ut-upload-button:text-white ut-upload-button:rounded-md ut-upload-button:font-medium ut-upload-button:py-2 ut-allowed-content:text-muted-foreground"
            config={{ mode: "auto" }}
            onBeforeUploadBegin={(files) => {
              setIsUploading(true);
              return files;
            }}
            onClientUploadComplete={(res) => {
              setIsUploading(false);
              if (res && res.length > 0) {
                const urls = res.map(file => file.url);
                onUploadComplete && onUploadComplete(urls);
                toast({
                  description: `${imageType === "banner" ? "Banner" : "Image"}${isMultiple ? "s" : ""} uploaded successfully`,
                });
              }
            }}
            onUploadError={(error: Error) => {
              setIsUploading(false);
              toast({
                variant: 'destructive',
                description: `Error: ${error.message}`,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
} 