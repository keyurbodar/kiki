export type CodeLanguage = {
  id: string;
  name: string;
  aliases: ReadonlyArray<string>;
};

export const CODE_LANGUAGES: ReadonlyArray<CodeLanguage> = [
  { id: "ts", name: "TypeScript", aliases: ["typescript", "mts", "cts"] },
  { id: "tsx", name: "TSX", aliases: [] },
  { id: "js", name: "JavaScript", aliases: ["javascript", "mjs", "cjs"] },
  { id: "jsx", name: "JSX", aliases: [] },
  { id: "json", name: "JSON", aliases: [] },
  { id: "jsonc", name: "JSON with comments", aliases: [] },
  { id: "json5", name: "JSON5", aliases: [] },
  { id: "md", name: "Markdown", aliases: ["markdown"] },
  { id: "mdx", name: "MDX", aliases: [] },
  { id: "html", name: "HTML", aliases: [] },
  { id: "css", name: "CSS", aliases: [] },
  { id: "scss", name: "SCSS", aliases: [] },
  { id: "less", name: "Less", aliases: [] },
  { id: "yaml", name: "YAML", aliases: ["yml"] },
  { id: "toml", name: "TOML", aliases: [] },
  { id: "sh", name: "Shell", aliases: ["shell", "shellscript"] },
  { id: "bash", name: "Bash", aliases: [] },
  { id: "zsh", name: "Zsh", aliases: [] },
  { id: "fish", name: "Fish", aliases: [] },
  { id: "powershell", name: "PowerShell", aliases: ["ps1", "pwsh", "ps"] },
  { id: "bat", name: "Batch", aliases: ["batch", "cmd"] },
  { id: "python", name: "Python", aliases: ["py"] },
  { id: "go", name: "Go", aliases: [] },
  { id: "rust", name: "Rust", aliases: ["rs"] },
  { id: "java", name: "Java", aliases: [] },
  { id: "kotlin", name: "Kotlin", aliases: ["kt", "kts"] },
  { id: "swift", name: "Swift", aliases: [] },
  { id: "objective-c", name: "Objective-C", aliases: ["objc"] },
  { id: "c", name: "C", aliases: [] },
  { id: "cpp", name: "C++", aliases: ["c++"] },
  { id: "csharp", name: "C#", aliases: ["cs", "c#"] },
  { id: "fsharp", name: "F#", aliases: ["fs", "f#"] },
  { id: "ruby", name: "Ruby", aliases: ["rb"] },
  { id: "php", name: "PHP", aliases: [] },
  { id: "perl", name: "Perl", aliases: [] },
  { id: "lua", name: "Lua", aliases: [] },
  { id: "r", name: "R", aliases: [] },
  { id: "julia", name: "Julia", aliases: ["jl"] },
  { id: "matlab", name: "MATLAB", aliases: [] },
  { id: "dart", name: "Dart", aliases: [] },
  { id: "elixir", name: "Elixir", aliases: [] },
  { id: "erlang", name: "Erlang", aliases: ["erl"] },
  { id: "gleam", name: "Gleam", aliases: [] },
  { id: "haskell", name: "Haskell", aliases: ["hs"] },
  { id: "scala", name: "Scala", aliases: [] },
  { id: "clojure", name: "Clojure", aliases: ["clj"] },
  { id: "ocaml", name: "OCaml", aliases: [] },
  { id: "elm", name: "Elm", aliases: [] },
  { id: "zig", name: "Zig", aliases: [] },
  { id: "nim", name: "Nim", aliases: [] },
  { id: "crystal", name: "Crystal", aliases: [] },
  { id: "groovy", name: "Groovy", aliases: [] },
  { id: "sql", name: "SQL", aliases: [] },
  { id: "plsql", name: "PL/SQL", aliases: [] },
  { id: "graphql", name: "GraphQL", aliases: ["gql"] },
  { id: "dockerfile", name: "Dockerfile", aliases: ["docker"] },
  { id: "makefile", name: "Makefile", aliases: ["make"] },
  { id: "cmake", name: "CMake", aliases: [] },
  { id: "nix", name: "Nix", aliases: [] },
  { id: "terraform", name: "Terraform", aliases: ["tf", "tfvars"] },
  { id: "hcl", name: "HCL", aliases: [] },
  { id: "proto", name: "Protocol Buffers", aliases: ["protobuf"] },
  { id: "diff", name: "Diff", aliases: [] },
  { id: "xml", name: "XML", aliases: [] },
  { id: "ini", name: "INI", aliases: ["properties"] },
  { id: "dotenv", name: "dotenv", aliases: [] },
  { id: "csv", name: "CSV", aliases: [] },
  { id: "http", name: "HTTP", aliases: [] },
  { id: "nginx", name: "Nginx", aliases: [] },
  { id: "mermaid", name: "Mermaid", aliases: ["mmd"] },
  { id: "latex", name: "LaTeX", aliases: [] },
  { id: "tex", name: "TeX", aliases: [] },
  { id: "svelte", name: "Svelte", aliases: [] },
  { id: "vue", name: "Vue", aliases: [] },
  { id: "astro", name: "Astro", aliases: [] },
  { id: "prisma", name: "Prisma", aliases: [] },
  { id: "solidity", name: "Solidity", aliases: [] },
  { id: "wasm", name: "WebAssembly", aliases: [] },
  { id: "asm", name: "Assembly", aliases: [] },
  { id: "glsl", name: "GLSL", aliases: [] },
  { id: "wgsl", name: "WGSL", aliases: [] },
  { id: "regexp", name: "RegExp", aliases: ["regex"] },
  { id: "handlebars", name: "Handlebars", aliases: ["hbs"] },
  { id: "jinja", name: "Jinja", aliases: [] },
  { id: "twig", name: "Twig", aliases: [] },
  { id: "liquid", name: "Liquid", aliases: [] },
  { id: "pug", name: "Pug", aliases: ["jade"] },
  { id: "vim", name: "Vim script", aliases: ["viml", "vimscript"] },
  { id: "git-commit", name: "Git commit", aliases: [] },
  { id: "log", name: "Log", aliases: [] },
];

export const findCodeLanguage = (language: string) => {
  const needle = language.toLowerCase();
  return CODE_LANGUAGES.find(
    (entry) => entry.id === needle || entry.aliases.includes(needle),
  );
};

export const filterCodeLanguages = (
  query: string,
): Array<CodeLanguage | null> => {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [null, ...CODE_LANGUAGES];
  return [
    ...CODE_LANGUAGES.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        entry.id.startsWith(needle) ||
        entry.aliases.some((alias) => alias.startsWith(needle)),
    ),
    ...("plain text".includes(needle) ? [null] : []),
  ];
};
