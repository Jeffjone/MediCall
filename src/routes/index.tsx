import { createFileRoute } from "@tanstack/react-router";
import {
  Pill,
  AlertTriangle,
  Users,
  PhoneCall,
  Activity,
  Search,
  Bell,
  Settings,
  LayoutDashboard,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecallGuard — Pharmacy Recall Dashboard" },
      {
        name: "description",
        content:
          "Dashboard for pharmacies to track patients on recalled medications and trigger AI outreach calls.",
      },
      { property: "og:title", content: "RecallGuard — Pharmacy Recall Dashboard" },
      {
        property: "og:description",
        content:
          "Dashboard for pharmacies to track patients on recalled medications and trigger AI outreach calls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Patients", active: false },
  { icon: AlertTriangle, label: "Recalls", active: false },
  { icon: PhoneCall, label: "Outreach", active: false },
  { icon: FileText, label: "Reports", active: false },
];

const stats = [
  {
    icon: Users,
    label: "Active Patients",
    value: "1,284",
    hint: "across all locations",
  },
  {
    icon: AlertTriangle,
    label: "Recalled Medications",
    value: "7",
    hint: "currently flagged",
  },
  {
    icon: Activity,
    label: "Patients Affected",
    value: "43",
    hint: "on a recalled drug",
  },
  {
    icon: PhoneCall,
    label: "Outreach Calls Sent",
    value: "12",
    hint: "this week",
  },
];

// Static sample rows — no data layer yet. These stand in for the real
// patient + medication join that the backend will provide later.
const patients = [
  {
    name: "Maria Gonzalez",
    id: "PT-1042",
    med: "Lisinopril 10mg",
    recalled: true,
    recallNote: "Lot #A21 — contamination",
    status: "Pending",
  },
  {
    name: "James Whitfield",
    id: "PT-1043",
    med: "Metformin 500mg",
    recalled: false,
    recallNote: "",
    status: "—",
  },
  {
    name: "Priya Nair",
    id: "PT-1044",
    med: "Atorvastatin 20mg",
    recalled: true,
    recallNote: "Lot #B07 — mislabeling",
    status: "Called",
  },
  {
    name: "Robert Chen",
    id: "PT-1045",
    med: "Amoxicillin 250mg",
    recalled: false,
    recallNote: "",
    status: "—",
  },
  {
    name: "Susan Delacroix",
    id: "PT-1046",
    med: "Lisinopril 10mg",
    recalled: true,
    recallNote: "Lot #A21 — contamination",
    status: "Pending",
  },
];

function Index() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Pill className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">RecallGuard</span>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b bg-card px-6 py-4">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Pill className="h-4 w-4" />
            </div>
            <span className="font-semibold">RecallGuard</span>
          </div>
          <div className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients, medications, or recall lots…"
              className="max-w-md pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                RP
              </div>
              <span className="hidden text-sm font-medium sm:inline">Riverside Pharmacy</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 space-y-6 p-6">
          {/* Page heading */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Monitor patients on recalled medications and coordinate outreach.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{s.value}</div>
                  <p className="text-xs text-muted-foreground">{s.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recall alert banner */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Active recall: Lisinopril 10mg — Lot #A21
                </p>
                <p className="text-sm text-muted-foreground">
                  2 patients currently prescribed. Review and initiate outreach.
                </p>
              </div>
              <Button variant="destructive" size="sm">
                View recall
              </Button>
            </CardContent>
          </Card>

          {/* Patients table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Patients & Prescriptions</CardTitle>
              <Button variant="outline" size="sm">
                Filter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Recall Status</TableHead>
                      <TableHead>Outreach</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((p) => (
                      <TableRow key={p.id} className={p.recalled ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.id}</div>
                        </TableCell>
                        <TableCell>{p.med}</TableCell>
                        <TableCell>
                          {p.recalled ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Recalled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Clear</Badge>
                          )}
                          {p.recallNote && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {p.recallNote}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.recalled ? (
                            <Badge variant="outline">{p.status}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">{p.status}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.recalled ? (
                            <Button size="sm" className="gap-1">
                              <PhoneCall className="h-4 w-4" />
                              Initiate Call
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No action</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Base layout — no live data or functionality connected yet.
          </p>
        </main>
      </div>
    </div>
  );
}
