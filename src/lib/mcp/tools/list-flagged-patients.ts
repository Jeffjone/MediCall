import { defineTool } from "@lovable.dev/mcp-js";

import { loadMatched, patientSummary } from "../data";

export default defineTool({
  name: "list_flagged_patients",
  title: "List flagged patients",
  description:
    "List every pharmacy patient whose filled prescription NDC matches an active FDA drug recall.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { matched, source } = await loadMatched();
    const flagged = matched.filter((m) => m.isFlagged).map(patientSummary);
    return {
      content: [{ type: "text", text: JSON.stringify({ source, count: flagged.length, patients: flagged }, null, 2) }],
      structuredContent: { source, count: flagged.length, patients: flagged },
    };
  },
});
