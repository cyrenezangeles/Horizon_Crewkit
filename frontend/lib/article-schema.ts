import { defaultSchema, type Options } from "rehype-sanitize";

const stylePattern =
  /^(?:(?:color|font-size|font-weight|font-style|text-decoration)\s*:\s*[#a-z0-9(),.%\s-]+;?\s*)+$/i;

const styleAttribute: [string, RegExp] = ["style", stylePattern];

export const articleSanitizeSchema: Options = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u", "font"],
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), styleAttribute],
    p: [...(defaultSchema.attributes?.p ?? []), styleAttribute],
    div: [...(defaultSchema.attributes?.div ?? []), styleAttribute],
    font: ["color", "size", "face"],
  },
};
