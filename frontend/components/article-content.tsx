import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { articleSanitizeSchema } from "@/frontend/lib/article-schema";

export function ArticleContent({ content }: { content: string }) {
  return (
    <div className="article-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, articleSanitizeSchema]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
