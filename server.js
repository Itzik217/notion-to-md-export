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
    res.json({ markdown: mdString.parent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000);
