import ReactMarkdown from "react-markdown";
import type { ChatMessage as ChatMsg } from "./useChat";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMsg;
  onNavigateToPage?: (pageTitle: string) => void;
}

/**
 * Renders **[See: Page Title]** citations as clickable links that navigate
 * to the referenced report page in the portal.
 */
function renderWithCitations(
  content: string,
  onNavigate?: (pageTitle: string) => void
) {
  // Match **[See: Page Title]** pattern
  const citationRegex = /\*\*\[See:\s*([^\]]+)\]\*\*/g;
  const parts: (string | { type: "citation"; title: string })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push({ type: "citation", title: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // If no citations found, return null to fall back to standard markdown
  if (parts.length === 1 && typeof parts[0] === "string") return null;

  return parts.map((part, i) => {
    if (typeof part === "string") {
      return (
        <ReactMarkdown key={i} components={{ p: ({ children }) => <span>{children}</span> }}>
          {part}
        </ReactMarkdown>
      );
    }
    return (
      <button
        key={i}
        onClick={() => onNavigate?.(part.title)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/15 text-accent text-xs font-semibold hover:bg-accent/25 transition-colors cursor-pointer border-none font-sans"
        title={`Go to ${part.title}`}
      >
        📄 {part.title}
      </button>
    );
  });
}

const ChatMessage = ({ message, onNavigateToPage }: ChatMessageProps) => {
  const isUser = message.role === "user";

  const citationContent = !isUser
    ? renderWithCitations(message.content, onNavigateToPage)
    : null;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : citationContent ? (
          <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 leading-relaxed">
            {citationContent}
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
