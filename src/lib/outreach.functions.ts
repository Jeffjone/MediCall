import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CallInput = z.object({
  patientName: z.string().min(1),
  patientId: z.string().min(1),
  drugName: z.string().min(1),
  strength: z.string(),
  ndc: z.string(),
  recallNumber: z.string(),
  recallReason: z.string(),
  classification: z.string(),
  pharmacyName: z.string().default("Riverside Pharmacy"),
});

export type CallResult = {
  ok: boolean;
  message: string;
  conversationId?: string;
  dialed?: string;
};

/**
 * Places a real outbound AI voice call through an ElevenLabs conversational
 * agent. For the demo every call dials the single verified test number in
 * DEMO_CALL_NUMBER, never the fake patient's number.
 */
export const placeOutreachCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CallInput.parse(input))
  .handler(async ({ data }): Promise<CallResult> => {
    const apiKey = process.env["ELEVENLABS_API_KEY"];
    const agentId = process.env["ELEVENLABS_AGENT_ID"];
    const phoneNumberId = process.env["ELEVENLABS_PHONE_NUMBER_ID"];
    const toNumber = process.env["DEMO_CALL_NUMBER"];

    const missing = [
      !apiKey && "the ElevenLabs connection",
      !agentId && "the voice agent ID",
      !phoneNumberId && "the ElevenLabs phone number ID",
      !toNumber && "the demo phone number to dial",
    ].filter(Boolean);

    if (missing.length > 0) {
      return {
        ok: false,
        message: `Calling is not set up yet — still missing ${missing.join(", ")}.`,
      };
    }

    const summary =
      `${data.patientName} (patient ${data.patientId}) is currently prescribed ` +
      `${data.drugName} ${data.strength}, NDC ${data.ndc}. The FDA has issued a ` +
      `${data.classification} recall (${data.recallNumber}). Reason: ${data.recallReason}`;

    try {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey as string,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: agentId,
            agent_phone_number_id: phoneNumberId,
            to_number: toNumber,
            conversation_initiation_client_data: {
              dynamic_variables: {
                patient_name: data.patientName,
                patient_id: data.patientId,
                drug_name: data.drugName,
                drug_strength: data.strength,
                ndc: data.ndc,
                recall_number: data.recallNumber,
                recall_reason: data.recallReason,
                recall_classification: data.classification,
                pharmacy_name: data.pharmacyName,
                recall_summary: summary,
              },
            },
          }),
        },
      );

      const bodyText = await response.text();

      if (!response.ok) {
        console.error(`ElevenLabs outbound call failed [${response.status}]: ${bodyText}`);
        return {
          ok: false,
          message: `The calling service refused the call (${response.status}). ${bodyText.slice(0, 300)}`,
        };
      }

      let conversationId: string | undefined;
      try {
        const parsed = JSON.parse(bodyText) as {
          conversation_id?: string;
          callSid?: string;
        };
        conversationId = parsed.conversation_id ?? parsed.callSid;
      } catch {
        conversationId = undefined;
      }

      return {
        ok: true,
        message: `Call placed to the demo number about ${data.drugName}.`,
        dialed: toNumber as string,
        ...(conversationId ? { conversationId } : {}),
      };
    } catch (error) {
      console.error("ElevenLabs outbound call error", error);
      return {
        ok: false,
        message: "Could not reach the calling service. Please try again.",
      };
    }
  });
