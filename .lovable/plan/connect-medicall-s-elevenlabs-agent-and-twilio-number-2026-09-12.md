# Connect Medicall’s ElevenLabs agent and Twilio number

## Goal
Use your existing ElevenLabs agent and Twilio number for Medicall’s demo calls, keeping the 40 demo patients and 10 affected patients unchanged.

## Setup
1. Check the linked ElevenLabs account and verify that it can access your existing agent. If the agent belongs to another account, reconnect ElevenLabs to the correct account rather than creating a duplicate agent.
2. Guide you through importing your existing voice-capable Twilio number in ElevenLabs Agents → Phone Numbers. Enter your Twilio Account SID and Auth Token directly into ElevenLabs, never into chat. Review any warning about replacing the number’s existing routing before proceeding.
3. Assign the imported number to your existing agent where required. Configure the voice and permit the first-message and system-prompt overrides used by Medicall’s shared recall script. Verify current ElevenLabs settings and instructions before making changes.
4. Save the real agent ID and the imported **ElevenLabs phone-number ID** through secure settings. This phone-number ID is not the Twilio SID or the phone number itself. Confirm the existing demo destination remains your intended test number.
5. Check agent and number access without placing a call. Then, with your confirmation, place one test call and verify the shared script receives the selected demo patient’s details.

## Important details
- All demo outreach continues to dial only the configured test destination, never the fictional patients’ numbers.
- ElevenLabs and Twilio usage may incur charges. A Twilio trial may require the destination to be verified.
- No separate Twilio connection in Medicall is needed for this path: ElevenLabs manages the imported Twilio number.
- Keep this test limited to fictional patient information and a consenting recipient.

## Technical details
Medicall currently calls ElevenLabs’ `/v1/convai/twilio/outbound-call` endpoint using `ELEVENLABS_AGENT_ID`, `ELEVENLABS_PHONE_NUMBER_ID`, and `DEMO_CALL_NUMBER`. Preserve this flow and the existing per-call script overrides; change code only if configuration verification identifies a compatibility issue.

## Completion check
The connected ElevenLabs account resolves both configured IDs, and an explicitly approved test call reaches the demo destination with the selected patient’s recall details.