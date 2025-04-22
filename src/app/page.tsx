"use client";

import { useState } from "react";
import ReceiptUploader from "@/components/ReceiptUploader";
import ReceiptEditor from "@/components/ReceiptEditor";
import ShareButton from "@/components/ShareButton";
import { Receipt } from "@/types";

export default function Home() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle receipt analysis result
  const handleReceiptAnalyzed = (analyzedReceipt: Receipt) => {
    setReceipt(analyzedReceipt);
    setError(null);
  };

  // Handle receipt analysis error
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setReceipt(null);
  };

  // Handle receipt updates
  const handleReceiptChange = (updatedReceipt: Receipt) => {
    setReceipt(updatedReceipt);
  };

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">ReceiptWiser</h1>
        <p className="text-center text-gray-600">
          Upload a receipt, edit the details, and share with friends
        </p>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Receipt Upload */}
        {!receipt && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Receipt</h2>
            <ReceiptUploader
              onReceiptAnalyzed={handleReceiptAnalyzed}
              onError={handleError}
            />
          </div>
        )}

        {/* Receipt Editor */}
        {receipt && (
          <div className="space-y-8">
            <ReceiptEditor receipt={receipt} onChange={handleReceiptChange} />

            {/* Share Button */}
            <ShareButton receipt={receipt} />
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto mt-12 pt-6 border-t text-center text-gray-500 text-sm">
        <p>ReceiptWiser &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
