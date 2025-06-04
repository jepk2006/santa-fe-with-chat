"use client";
import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";

export default function FileUploadDemo() {
  const [files, setFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  const handleFileUpload = (files: File[]) => {
    setFiles(files);
    console.log(files);
  };

  const handleUploadComplete = (urls: string[]) => {
    setImageUrls(prev => [...prev, ...urls]);
    console.log("Uploaded URLs:", urls);
  };

  return (
    <div className="space-y-6">
      <div className="w-full max-w-4xl mx-auto p-6 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Image Upload Demo</h2>
        <FileUpload 
          onChange={handleFileUpload} 
          onUploadComplete={handleUploadComplete}
          maxFiles={1}
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
        />
        
        {imageUrls.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Uploaded Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="aspect-square relative border rounded-md overflow-hidden">
                  {/* Use Next.js Image component if you have it configured */}
                  <img src={url} alt={`Uploaded image ${index}`} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="w-full max-w-4xl mx-auto flex justify-center">
        <Button onClick={() => setImageUrls([])}>
          Clear All Images
        </Button>
      </div>
    </div>
  );
} 