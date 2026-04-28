import { reportPages, reportGroups } from "../src/data/reportContent";

const pages = Object.values(reportPages);
const groupOrder = new Map<string, number>(reportGroups.map((g, i) => [g.id, i]));
const orderedPerGroup = new Map<string, number>();
const escape = (s: string) => s.replace(/'/g, "''");

const lines: string[] = [];
for (const p of pages) {
  const groupIdx = groupOrder.get(p.group) ?? 99;
  const intra = orderedPerGroup.get(p.group) ?? 0;
  orderedPerGroup.set(p.group, intra + 1);
  const sortOrder = groupIdx * 100 + intra;
  lines.push(`  ('${escape(p.id)}', '${escape(p.title)}', '${escape(p.group)}', NULL, ${sortOrder}, false)`);
}

console.log("-- Seed page_templates from src/data/reportContent.ts");
console.log(`-- ${pages.length} page definitions. Idempotent via ON CONFLICT (slug) DO NOTHING.`);
console.log("-- Step 2 of the new wizard reads this table to build the available-pages list");
console.log("-- it sends to recommend-report-pages. Empty table = wizard fails at TOC stage.");
console.log("");
console.log("INSERT INTO public.page_templates (slug, name, group_name, sub_group, default_order, is_custom)");
console.log("VALUES");
console.log(lines.join(",\n"));
console.log("ON CONFLICT (slug) DO NOTHING;");
