import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { loadMatched, patientSummary } from "../data";

export default defineTool({
  name: "get_patient",
  title: "Get patient",
  description: "Get one patient's full prescription list and any FDA recall matches, by patient ID.",
  inputSchema: {
    patient_id: z.string().trim().describe("Patient ID, for example PT-1075."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ patient_id }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { matched } = await loadMatched();
    const found = matched.find(
      (m) => m.patient.id.toLowerCase() === patient_id.trim().toLowerCase(),
    );
    if (!found) throw new ToolError(`No patient with ID ${patient_id}.`);
    const summary = patientSummary(found);
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
