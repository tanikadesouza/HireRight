"use client";

import { useState } from "react";

interface ReferralLinkCopyProps {
  url: string;
}

export function ReferralLinkCopy({ url }: ReferralLinkCopyProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
        <p className="text-sm font-mono text-gray-700 truncate">{url}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          copied
            ? "bg-green-600 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
