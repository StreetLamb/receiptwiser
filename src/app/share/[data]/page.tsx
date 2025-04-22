"use client";

import { useEffect, useState } from "react";
import { decompressFromEncodedURIComponent } from "lz-string";
import Link from "next/link";
import { Receipt } from "@/types";
import ReceiptViewer from "@/components/ReceiptViewer";
import { useParams } from "next/navigation";

export default function SharedReceiptPage() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the data parameter from the URL
  const { data } = useParams();

  useEffect(() => {
    try {
      // First decode the URI component, then decompress
      const decompressedData = decompressFromEncodedURIComponent(
        decodeURIComponent(data as string)
      );

      if (!decompressedData) {
        throw new Error("Invalid receipt data");
      }

      // Parse the decompressed data
      const parsedReceipt = JSON.parse(decompressedData) as Receipt;
      setReceipt(parsedReceipt);
    } catch (error) {
      console.error("Error parsing receipt data:", error);
      setError(
        "Failed to load receipt data. The link may be invalid or corrupted."
      );
    }
  }, [data]);

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">ReceiptWiser</h1>
        <p className="text-center text-gray-600">Shared Receipt</p>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{error}</p>
            <p className="mt-2">
              <Link href="/" className="text-blue-600 underline">
                Return to home page
              </Link>
            </p>
          </div>
        )}

        {/* Loading State */}
        {!receipt && !error && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading receipt data...</p>
          </div>
        )}

        {/* Receipt Viewer */}
        {receipt && (
          <div>
            <ReceiptViewer receipt={receipt} />

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
              >
                Create Your Own Receipt
              </Link>
            </div>
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
