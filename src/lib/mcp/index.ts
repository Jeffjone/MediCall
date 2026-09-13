import { auth, defineMcp } from "@lovable.dev/mcp-js";

import getPatient from "./tools/get-patient";
import listFlaggedPatients from "./tools/list-flagged-patients";
import listRecalls from "./tools/list-recalls";
import searchPatients from "./tools/search-patients";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "medicall",
  title: "MediCall",
  version: "0.1.0",
  instructions:
    "Pharmacy recall-readiness tools for MediCall. Use `list_recalls` for current FDA drug recalls, " +
    "`list_flagged_patients` for patients taking recalled medication, `search_patients` to find a patient " +
    "by name, ID, drug, or NDC, and `get_patient` for one patient's full record. Read-only; outbound " +
    "patient calls are placed in the MediCall app.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listRecalls, listFlaggedPatients, searchPatients, getPatient],
});
