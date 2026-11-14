import "server-only";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const HTML_PATTERN =
  /<(p|div|br|h[1-6]|ul|ol|li|strong|em|u|span|blockquote|pre|code|table|a)\b[^>]*>/i;

export function isHtmlContent(value: string) {
  return HTML_PATTERN.test(value);
}

export function contentToHtml(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (isHtmlContent(trimmed)) {
    return trimmed;
  }

  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(trimmed),
  );
}
