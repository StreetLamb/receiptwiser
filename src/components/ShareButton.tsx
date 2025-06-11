"use client";

import { useState } from "react";
import { Receipt } from "@/types";
import { compressToEncodedURIComponent } from "lz-string";
import { FaShareAlt } from "react-icons/fa";

interface ShareButtonProps {
  receipt: Receipt;
}

export default function ShareButton({ receipt }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const generateShareableLink = () => {
    try {
      // Create a minimal version of the receipt with abbreviated keys
      const minimalReceipt = {
        // Items with minimal properties
        i: receipt.items.map((item) => ({
          n: item.name, // name
          q: item.quantity, // quantity
          p: Number(item.unitPrice.toFixed(2)), // price per unit with 2 decimal places
        })),
        // Essential totals and rates
        t: Number(receipt.total.toFixed(2)), // total
        s: Number(receipt.subtotal.toFixed(2)), // subtotal
        d: Number(receipt.discountPercent.toFixed(2)), // discount percent
        tx: Number(receipt.taxPercent.toFixed(2)), // tax percent
        sc: Number(receipt.serviceChargePercent.toFixed(2)), // service charge percent
        // Optional creator info (only if present)
        ...(receipt.creatorName ? { cn: receipt.creatorName } : {}),
        ...(receipt.creatorPhone ? { cp: receipt.creatorPhone } : {}),
      };

      // Compress the minimal receipt data
      const compressedData = compressToEncodedURIComponent(
        JSON.stringify(minimalReceipt)
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
        <FaShareAlt className="mr-2 text-xl" />
        {copied ? "Copied to clipboard!" : "Share Receipt"}
      </button>
    </div>
  );
}
