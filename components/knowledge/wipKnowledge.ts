type KnowledgeDoc = {
  id: string;
  path: string;
  title: string;
  section: string;
  raw: string;
  markdown: string;
};

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function stripFrontmatter(raw: string): { markdown: string; title?: string } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { markdown: raw };

  const frontmatterBody = match[1] || '';
  const titleLine = frontmatterBody
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.toLowerCase().startsWith('title:'));

  const title = titleLine ? titleLine.split(':').slice(1).join(':').trim().replace(/^"(.*)"$/, '$1') : undefined;
  const markdown = raw.replace(FRONTMATTER_RE, '');
  return { markdown, title };
}

function titleFromFilename(path: string): string {
  const base = path.split('/').pop() || path;
  const noExt = base.replace(/\.md$/i, '');
  return noExt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Vite will inline these markdown files as raw strings at build time.
// NOTE: The leading "/" is relative to the project root.
const rawModules = import.meta.glob('/WIP_CFO_Knowledge/**/*.md', { as: 'raw', eager: true }) as Record<string, string>;

export const wipKnowledgeDocs: KnowledgeDoc[] = Object.entries(rawModules)
  .map(([path, raw]) => {
    const rel = path.replace(/^\/WIP_CFO_Knowledge\//, '');
    const id = rel.replace(/\.md$/i, '');
    const section = rel.split('/')[0] || 'WIP_CFO_Knowledge';
    const { markdown, title } = stripFrontmatter(raw);
    return {
      id,
      path: rel,
      section,
      raw,
      markdown,
      title: title || titleFromFilename(rel),
    };
  })
  .sort((a, b) => (a.section + a.title).localeCompare(b.section + b.title));

export function getWipKnowledgeDoc(id: string): KnowledgeDoc | undefined {
  return wipKnowledgeDocs.find((d) => d.id === id);
}


