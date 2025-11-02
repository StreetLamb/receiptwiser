"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt } from "@/types";
import ReceiptViewer from "@/components/ReceiptViewer";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function SharedReceiptPage() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get the id parameter from the URL
  const { id } = useParams();

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/receipts/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Receipt not found");
          }
          throw new Error("Failed to load receipt");
        }

        const data = await response.json();
        setReceipt(data);
      } catch (error) {
        console.error("Error fetching receipt:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load receipt data. The link may be invalid or expired."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchReceipt();
    }
  }, [id]);

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
        {isLoading && !error && (
          <div className="text-center py-12">
            <p className="mt-4 text-gray-600 flex items-center justify-center gap-2">
              <Spinner />Loading receipt data...
            </p>
          </div>
        )}

        {/* Receipt Viewer */}
        {receipt && !isLoading && (
          <div>
            <ReceiptViewer receipt={receipt} />

            <div className="mt-8 text-center">
              <Button asChild>
                <Link href="/">
                  Create Your Own Receipt
                </Link>
              </Button>
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
