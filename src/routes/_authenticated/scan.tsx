import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Monitor,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatFdaDate } from "@/lib/recall-matching";
import { scanLabel, type ScanResponse } from "@/lib/scan.functions";
import { useRouteContext } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({
    meta: [
      { title: "Label Scanner — Medicall" },
      {
        name: "description",
        content:
          "Scan a prescription or OTC bottle label with your phone camera to digitise the medication details and check it against active FDA recalls.",
      },
      { property: "og:title", content: "Label Scanner — Medicall" },
      {
        property: "og:description",
        content: "Photograph a medication label and instantly check it against active FDA recalls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScanPage,
});

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value?.trim() || "Not printed"}</span>
    </div>
  );
}

function ScanPage() {
  const { session } = useRouteContext();
  const isMobile = useIsMobile();
  const run = useServerFn(scanLabel);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);

  async function handleFile(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("That photo is too large. Take a new one.");
      return;
    }
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
    setPreview(image);
    setResult(null);
    setBusy(true);
    try {
      const response = await run({ data: { image } });
      setResult(response);
      if (!response.ok) toast.error(response.message);
    } catch {
      toast.error("The scan failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
  }

  return (
    <AppShell
      title="Label scanner"
      subtitle="Photograph a bottle or label to read its details and check active recalls."
      session={session}
    >
      {!isMobile ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Monitor className="h-6 w-6" />
            </div>
            <CardTitle>Open Medicall on your phone</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            The label scanner uses your phone camera, so it is only available on the mobile
            version of Medicall. Open this page on a phone or tablet to scan a bottle.
          </CardContent>
        </Card>
      ) : (
        <div className="mx-auto w-full max-w-md space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              {preview ? (
                <img
                  src={preview}
                  alt="Photographed medication label"
                  className="w-full rounded-lg border object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
                  <Camera className="h-8 w-8" />
                  <p className="px-6 text-center text-xs">
                    Fill the frame with the label and keep the NDC in focus.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading label…
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" /> {preview ? "Scan again" : "Scan label"}
                    </>
                  )}
                </Button>
                {preview ? (
                  <Button variant="outline" size="icon" aria-label="Clear scan" onClick={reset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              <Button
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={() => uploadRef.current?.click()}
              >
                <ImagePlus className="mr-2 h-4 w-4" /> Upload picture
              </Button>
            </CardContent>
          </Card>

          {result?.ok ? (
            <>
              <Card
                className={
                  result.match.status === "active-recall"
                    ? "border-destructive"
                    : result.match.status === "possible-recall"
                      ? "border-warning"
                      : ""
                }
              >
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  {result.match.status === "clear" ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : result.match.status === "active-recall" ? (
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <CardTitle className="text-base">
                    {result.match.status === "active-recall"
                      ? "Active recall match"
                      : result.match.status === "possible-recall"
                        ? "Possible recall — verify"
                        : "No recall match"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {result.match.recall ? (
                    <>
                      <p className="text-muted-foreground">
                        {result.match.matchedOn === "ndc"
                          ? "The NDC on this label matches a recalled product."
                          : "The medication name matches a recall, but the NDC on the label does not. Confirm the exact NDC and lot numbers before acting."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="destructive">{result.match.recall.classification}</Badge>
                        <Badge variant="outline">{result.match.recall.status}</Badge>
                        <Badge variant="outline">{result.match.recall.recallNumber}</Badge>
                      </div>
                      <Field label="Recalled product" value={result.match.recall.drugName} />
                      <Field label="Firm" value={result.match.recall.recallingFirm} />
                      <Field label="Reason" value={result.match.recall.reasonForRecall} />
                      <Field label="Lot numbers" value={result.match.recall.lotNumbers} />
                      <Field
                        label="Initiated"
                        value={formatFdaDate(result.match.recall.recallInitiationDate)}
                      />
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      This label does not match any of the {result.recallsChecked} recalls Medicall
                      is tracking. Recheck if a new recall is published.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Label details</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {!result.label.readable ? (
                    <p className="pb-3 text-sm text-muted-foreground">
                      The photo was hard to read. Retake it in better light for reliable results.
                    </p>
                  ) : null}
                  <Field label="Medication" value={result.label.drugName} />
                  <Field label="Generic" value={result.label.genericName} />
                  <Field label="Strength" value={result.label.strength} />
                  <Field label="Form" value={result.label.dosageForm} />
                  <Field label="NDC" value={result.label.ndc} />
                  <Field label="Lot" value={result.label.lotNumber} />
                  <Field label="Expires" value={result.label.expirationDate} />
                  <Field label="Quantity" value={result.label.quantity} />
                  <Field label="Manufacturer" value={result.label.manufacturer} />
                  <Field label="Prescriber" value={result.label.prescriber} />
                  <Field label="Rx number" value={result.label.rxNumber} />
                  <Field label="Directions" value={result.label.directions} />
                  <Field
                    label="Type"
                    value={
                      result.label.productType === "otc"
                        ? "Over the counter"
                        : result.label.productType === "prescription"
                          ? "Prescription"
                          : "Unknown"
                    }
                  />
                  {result.label.notes ? (
                    <p className="pt-3 text-xs text-muted-foreground">{result.label.notes}</p>
                  ) : null}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
