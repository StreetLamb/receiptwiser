"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
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

  // Create an empty receipt template for manual entry
  const createEmptyReceipt = () => {
    const emptyReceipt: Receipt = {
      items: [
        {
          id: uuidv4(),
          name: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      serviceChargePercent: 0,
      serviceChargeAmount: 0,
      taxPercent: 0,
      taxAmount: 0,
      total: 0,
    };

    setReceipt(emptyReceipt);
    setError(null);
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

        {/* Receipt Upload or Manual Creation */}
        {!receipt && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Receipt</h2>
            <ReceiptUploader
              onReceiptAnalyzed={handleReceiptAnalyzed}
              onError={handleError}
            />

            <div className="mt-6 text-center">
              <p className="text-gray-500 mb-2">- OR -</p>
              <button
                onClick={createEmptyReceipt}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Create Receipt Manually
              </button>
            </div>
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
        <p>
          <a href="https://github.com/StreetLamb/receiptwiser">ReceiptWiser</a>{" "}
          &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
