const express = require("express");
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const app = express();

const notion = new Client({ auth: process.env.NOTION_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

app.get("/export", async (req, res) => {
  try {
    const pageId = req.query.page_id;
    const mdblocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdblocks);
    
    let md = mdString.parent;
    
    // Fix 1 — Remove extra blank lines
    md = md.replace(/\n{3,}/g, "\n\n");
    
    // Fix 2 — Remove "plain text" from code blocks
    md = md.replace(/```plain text/g, "```");

    // Fix 3 — Clean tables
    md = md.split("\n").map(line => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("|")) return line;
      // Fix separator rows
      if (trimmed.match(/^\|[\s\-|]+\|$/)) {
        const cols = trimmed.split("|").filter(c => c.trim().replace(/-/g, "").length === 0 && c.trim().length > 0);
        return "|" + cols.map(() => " --- |").join("");
      }
      // Trim each cell, remove trailing spaces
      return "|" + trimmed.split("|").slice(1, -1).map(cell => " " + cell.trim() + " |").join("");
    }).join("\n");
    
    res.json({ markdown: md });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000);
