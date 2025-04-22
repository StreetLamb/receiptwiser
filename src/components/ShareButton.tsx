"use client";

import { useState } from "react";
import { Receipt } from "@/types";
import { compressToEncodedURIComponent } from "lz-string";

interface ShareButtonProps {
  receipt: Receipt;
}

export default function ShareButton({ receipt }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const generateShareableLink = () => {
    try {
      // Compress the receipt data to make the URL shorter
      const compressedData = compressToEncodedURIComponent(
        JSON.stringify(receipt)
      );

      // Create the shareable URL
      const baseUrl = window.location.origin;
      const shareableUrl = `${baseUrl}/share/${compressedData}`;

      return shareableUrl;
    } catch (error) {
      console.error("Error generating shareable link:", error);
      return null;
    }
  };

  const copyToClipboard = async () => {
    const url = generateShareableLink();

    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={copyToClipboard}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {copied ? "Copied to clipboard!" : "Share Receipt"}
      </button>
    </div>
  );
}
