"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyOwnerIdProps {
  ownerId: string;
}

export function CopyOwnerId({ ownerId }: CopyOwnerIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ownerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md bg-[#111] border border-[#1a1a1a] text-gray-500 hover:text-blue-500 hover:border-blue-500/50 transition-all opacity-0 group-hover:opacity-100"
      title="Copy Owner ID"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
