import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { loadMatched, patientSummary } from "../data";

export default defineTool({
  name: "search_patients",
  title: "Search patients",
  description:
    "Search pharmacy patients by name, patient ID, medication name, or NDC. Returns each match with its recall status.",
  inputSchema: {
    query: z.string().trim().describe("Name, patient ID, drug name, or NDC to search for."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const q = query.toLowerCase();
    const { matched } = await loadMatched();
    const results = matched
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.patient.id.toLowerCase().includes(q) ||
          m.patient.prescriptions.some(
            (p) => p.drugName.toLowerCase().includes(q) || p.ndc.includes(q),
          ),
      )
      .map(patientSummary);
    return {
      content: [{ type: "text", text: JSON.stringify({ count: results.length, patients: results }, null, 2) }],
      structuredContent: { count: results.length, patients: results },
    };
  },
});
