import { load } from "cheerio";
import { cleanText } from "./cleanText";

export function inspectCandidateNodes(html: string) {
  const $ = load(html);

  const interesting: Array<{
    tag: string;
    className: string;
    text: string;
  }> = [];

  $("li, div, article, section").each((_, el) => {
    const text = cleanText($(el).text());
    if (
      text.includes("Seller") &&
      text.includes("Quantity") &&
      text.includes("Type")
    ) {
      interesting.push({
        tag: el.tagName,
        className: ($(el).attr("class") || "").trim(),
        text: text.slice(0, 500),
      });
    }
  });

  console.log("=== CANDIDATE NODES ===");
  for (const node of interesting.slice(0, 20)) {
    console.log(JSON.stringify(node, null, 2));
  }
}
