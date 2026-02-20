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
    
    // Fix 3 — Clean table cell padding
    md = md.split("\n").map(line => {
      if (!line.startsWith("|")) return line;
      return line.split("|").map(cell => " " + cell.trim() + " ").join("|");
    }).join("\n");
    
    res.json({ markdown: md });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000);
