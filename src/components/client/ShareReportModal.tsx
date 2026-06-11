"use client";

import { useState, useRef, useEffect } from "react";

interface ShareReportModalProps {
  sessionId: string;
  roleTitle: string;
}

export function ShareReportModal({ sessionId, roleTitle }: ShareReportModalProps) {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/reports/${sessionId}`
      : `/reports/${sessionId}`;

  const defaultMessage = `I just used the PROFIT method to map out my next strategic hire (${roleTitle}). Take a look and let me know what you think.`;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorText("");

    const recipientList = emails
      .split(/[,;\n]/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipientList.length === 0) {
      setStatus("error");
      setErrorText("Please enter at least one email address.");
      return;
    }

    if (recipientList.length > 5) {
      setStatus("error");
      setErrorText("Maximum 5 recipients per share. For bulk sharing, contact support.");
      return;
    }

    const invalidEmail = recipientList.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalidEmail) {
      setStatus("error");
      setErrorText(`Invalid email address: ${invalidEmail}`);
      return;
    }

    try {
      const res = await fetch(`/api/reports/${sessionId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: recipientList,
          personal_message: message || defaultMessage,
          report_url: shareUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send");
      }

      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorText(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  function handleClose() {
    setOpen(false);
    setStatus("idle");
    setEmails("");
    setMessage("");
    setErrorText("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors"
      >
        Share
      </button>

      {/* Native dialog for accessibility */}
      <dialog
        ref={dialogRef}
        onClose={handleClose}
        className="rounded-2xl shadow-2xl border-0 p-0 max-w-md w-full backdrop:bg-black/40"
      >
        <div className="p-6">
          {status === "sent" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Report shared!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your recipients will receive an email with a link to this report.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Share this report</h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label
                    htmlFor="share-emails"
                    className="block text-xs font-semibold text-gray-600 mb-1"
                  >
                    Recipient email(s)
                  </label>
                  <input
                    id="share-emails"
                    type="text"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="partner@company.com, team@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={status === "sending"}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Separate multiple addresses with commas. Max 5 recipients.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="share-message"
                    className="block text-xs font-semibold text-gray-600 mb-1"
                  >
                    Personal message (optional)
                  </label>
                  <textarea
                    id="share-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={defaultMessage}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={status === "sending"}
                  />
                </div>

                {/* Report link preview */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 font-mono break-all">
                  {shareUrl}
                </div>

                {errorText && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {errorText}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={status === "sending"}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === "sending" || !emails.trim()}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "sending" ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
