"use client";

import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Receipt } from "@/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface ReceiptUploaderProps {
  onReceiptAnalyzed: (receipt: Receipt) => void;
  onError: (error: string) => void;
}

export default function ReceiptUploader({
  onReceiptAnalyzed,
  onError,
}: ReceiptUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setUploadedImage(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".heic"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsLoading(true);

      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Display the uploaded image and process the receipt
      const reader = new FileReader();
      reader.onload = async () => {
        const imageDataUrl = reader.result as string;
        setUploadedImage(imageDataUrl);

        try {
          // Create form data to send to API
          const formData = new FormData();
          formData.append("image", file);

          console.log("Sending image to API...");

          // Send to our API endpoint
          const response = await fetch("/api/analyze-receipt", {
            method: "POST",
            body: formData,
            signal: abortControllerRef.current?.signal,
          });

          console.log("API response status:", response.status);

          if (!response.ok) {
            let errorMessage = "Failed to analyze receipt";
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              console.error("Failed to parse error response:", e);
            }
            throw new Error(errorMessage);
          }

          // Clone the response before reading it as JSON
          const responseClone = response.clone();
          let data;

          try {
            data = await response.json();
          } catch (e) {
            console.error("Failed to parse response as JSON:", e);
            const text = await responseClone.text();
            console.error("Raw response:", text);
            throw new Error("Invalid response format from server");
          }

          if (!data || !data.data) {
            console.error("Unexpected response structure:", data);
            throw new Error("Invalid response structure from server");
          }

          // Create a receipt with the image URL
          const receiptData: Receipt = {
            items: Array.isArray(data.data.items) ? data.data.items : [],
            subtotal:
              typeof data.data.subtotal === "number" ? data.data.subtotal : 0,
            serviceChargePercent:
              typeof data.data.serviceChargePercent === "number"
                ? data.data.serviceChargePercent
                : 0,
            serviceChargeAmount:
              typeof data.data.serviceChargeAmount === "number"
                ? data.data.serviceChargeAmount
                : 0,
            taxPercent:
              typeof data.data.taxPercent === "number"
                ? data.data.taxPercent
                : 0,
            taxAmount:
              typeof data.data.taxAmount === "number" ? data.data.taxAmount : 0,
            total: typeof data.data.total === "number" ? data.data.total : 0,
            imageUrl: imageDataUrl, // Use the image data URL directly
          };

          onReceiptAnalyzed(receiptData);
        } catch (error) {
          // Don't show error if the request was aborted by the user
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }
          console.error("Error analyzing receipt:", error);
          onError(
            error instanceof Error ? error.message : "Unknown error occurred"
          );
        } finally {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      };

      reader.readAsDataURL(file);
    },
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400"
        }`}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="text-center">
            <p className="mt-2 text-sm text-gray-500 flex items-center justify-center gap-2">
              <Spinner/>Analyzing receipt...</p>
            <p className="mt-1 text-xs text-gray-400">
              May take up to a minute for larger receipts
            </p>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleAbort();
              }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="text-center">
            {uploadedImage ? (
              <div>
                <img
                  src={uploadedImage}
                  alt="Uploaded receipt"
                  className="max-h-48 mx-auto mb-4"
                />
                <p className="text-sm text-gray-500">
                  Drop a new image to replace
                </p>
              </div>
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  Drag & drop a receipt image, or click to select
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Supports JPG, PNG, HEIC
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
