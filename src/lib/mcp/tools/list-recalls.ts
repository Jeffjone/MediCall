import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { loadMatched } from "../data";

export default defineTool({
  name: "list_recalls",
  title: "List drug recalls",
  description:
    "List current FDA drug recalls tracked by MediCall, with how many pharmacy patients each one affects.",
  inputSchema: {
    affecting_patients_only: z
      .boolean()
      .optional()
      .describe("When true, return only recalls that match at least one patient prescription."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ affecting_patients_only }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { fetchRecalls } = await import("@/lib/recalls.server");
    const { affectedCountByRecall } = await import("@/lib/recall-matching");
    const [{ recalls, source }, { matched }] = await Promise.all([fetchRecalls(), loadMatched()]);
    const counts = affectedCountByRecall(matched);
    let rows = recalls.map((r) => ({
      recallNumber: r.recallNumber,
      drugName: r.drugName,
      classification: r.classification,
      recallingFirm: r.recallingFirm,
      reasonForRecall: r.reasonForRecall,
      status: r.status,
      recallInitiationDate: r.recallInitiationDate,
      ndcCodes: r.ndcCodes,
      affectedPatients: counts.get(r.recallNumber) ?? 0,
    }));
    if (affecting_patients_only) rows = rows.filter((r) => r.affectedPatients > 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ source, count: rows.length, recalls: rows }, null, 2) }],
      structuredContent: { source, count: rows.length, recalls: rows },
    };
  },
});
