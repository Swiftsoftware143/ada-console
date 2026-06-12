import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { EmbedCodeBlockProps } from '@/types';

const COPY_FEEDBACK_MS = 1800;

const EmbedCodeBlock: React.FC<EmbedCodeBlockProps> = ({ code, testId = "embed-code-block" }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Embed code copied to clipboard");
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  return (
    <div data-testid={testId} className="relative">
      <pre className="bg-[#0f1117] border border-[#2e3245] rounded-lg p-4 pr-14 overflow-x-auto text-xs font-mono text-[#94a3b8] leading-relaxed whitespace-pre-wrap break-all">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        data-testid={`${testId}-copy-btn`}
        className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1e2130] border border-[#2e3245] hover:border-[#007bff] text-xs font-medium text-white transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-[#10b981]" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
};

export default EmbedCodeBlock;
