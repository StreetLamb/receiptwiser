"use client";

import { useState } from "react";
import { Receipt } from "@/types";
import { FaShareAlt } from "react-icons/fa";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  receipt: Receipt;
}

export default function ShareButton({ receipt }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateShareableLink = async () => {
    try {
      setIsLoading(true);

      // Save receipt to database
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receipt),
      });

      if (!response.ok) {
        throw new Error("Failed to save receipt");
      }

      const { id } = await response.json();

      // Create the shareable URL
      const baseUrl = window.location.origin;
      const shareableUrl = `${baseUrl}/share/${id}`;

      return shareableUrl;
    } catch (error) {
      console.error("Error generating shareable link:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const url = await generateShareableLink();

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
      <Button
        onClick={copyToClipboard}
        disabled={isLoading}
        className="bg-green-500 hover:bg-green-600 flex items-center"
      >
        <FaShareAlt className="mr-2 text-xl" />
        {isLoading
          ? "Saving..."
          : copied
          ? "Copied to clipboard!"
          : "Share Receipt"}
      </Button>
    </div>
  );
}
