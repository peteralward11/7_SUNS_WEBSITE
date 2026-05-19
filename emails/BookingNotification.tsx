import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Row, Column,
} from "@react-email/components";

interface Props {
  full_name: string;
  email: string;
  phone: string;
  project_type: string;
  company_name?: string | null;
  appliance_count?: number | null;
  address: string;
  unit_count?: number | null;
  appliances: string[];
  installation: boolean;
  removal: boolean;
  elevator: boolean;
  stair_carry?: boolean;
  preferred_date: string;
  access_notes?: string | null;
  notes?: string | null;
  created_at?: string;
}

export default function BookingNotification({
  full_name = "Jane Smith",
  email = "jane@example.com",
  phone = "(416) 555-0100",
  project_type = "residential",
  company_name,
  appliance_count,
  address = "123 Main St, Toronto, ON",
  unit_count,
  appliances = ["Refrigerator", "Dishwasher"],
  installation = true,
  removal = false,
  elevator = false,
  stair_carry = false,
  preferred_date = "2026-06-01",
  access_notes,
  notes,
  created_at,
}: Props) {
  const timestamp = created_at ?? new Date().toISOString();
  const isBuilder = project_type === "builder";

  return (
    <Html>
      <Head />
      <Preview>New booking: {full_name} — {preferred_date}</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={badge}>NEW BOOKING REQUEST</Text>
            <Heading style={h1}>{full_name}</Heading>
            <Text style={subtitle}>{isBuilder ? "Builder / Commercial" : "Residential"} · {preferred_date}</Text>
          </Section>

          {/* Contact */}
          <Section style={section}>
            <Text style={sectionLabel}>Contact</Text>
            <DataRow label="Name" value={full_name} />
            <DataRow label="Email" value={email} />
            <DataRow label="Phone" value={phone} />
            {isBuilder && company_name && <DataRow label="Company" value={company_name} />}
          </Section>
          <Hr style={divider} />

          {/* Job details */}
          <Section style={section}>
            <Text style={sectionLabel}>Job Details</Text>
            <DataRow label="Address" value={address} />
            {isBuilder && unit_count != null && <DataRow label="Number of Units" value={String(unit_count)} />}
            {!isBuilder && appliance_count != null && <DataRow label="# of Appliances" value={String(appliance_count)} />}
            <DataRow label="Appliances" value={appliances.join(", ")} />
            <DataRow label="Installation" value={installation ? "Yes" : "No"} />
            <DataRow label="Old Unit Removal" value={removal ? "Yes" : "No"} />
            <DataRow label="Elevator Required" value={elevator ? "Yes" : "No"} />
            <DataRow label="Stair Carry" value={stair_carry ? "Yes" : "No"} />
            <DataRow label="Project Type" value={isBuilder ? "Builder / Commercial" : "Residential"} />
          </Section>
          <Hr style={divider} />

          {/* Schedule */}
          <Section style={section}>
            <Text style={sectionLabel}>Schedule</Text>
            <DataRow label="Preferred Date" value={preferred_date} />
            {access_notes && <DataRow label="Access Notes" value={access_notes} />}
            {notes && <DataRow label="Notes" value={notes} />}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Submitted {new Date(timestamp).toLocaleString("en-CA", { timeZone: "America/Toronto" })} EST · 7 Suns Delivery &amp; Logistics
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ marginBottom: "10px" }}>
      <Column style={{ width: "38%", verticalAlign: "top" }}>
        <Text style={cellLabel}>{label}</Text>
      </Column>
      <Column style={{ width: "62%", verticalAlign: "top" }}>
        <Text style={cellValue}>{value}</Text>
      </Column>
    </Row>
  );
}

const body: React.CSSProperties = { backgroundColor: "#F4F5F9", fontFamily: "'Outfit', Helvetica, Arial, sans-serif", margin: 0, padding: "40px 0" };
const container: React.CSSProperties = { backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "580px", margin: "0 auto", overflow: "hidden" };
const header: React.CSSProperties = { backgroundColor: "#1B3A5C", padding: "28px 36px" };
const badge: React.CSSProperties = { fontSize: "10px", fontWeight: 600, color: "#6BBF44", letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px" };
const h1: React.CSSProperties = { fontSize: "22px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 6px" };
const subtitle: React.CSSProperties = { fontSize: "13px", color: "rgba(255,255,255,0.55)", margin: 0 };
const section: React.CSSProperties = { padding: "24px 36px" };
const sectionLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#94A3B8", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 14px" };
const divider: React.CSSProperties = { borderColor: "rgba(12,20,32,0.07)", margin: 0 };
const cellLabel: React.CSSProperties = { fontSize: "13px", color: "#94A3B8", margin: 0 };
const cellValue: React.CSSProperties = { fontSize: "13px", color: "#1B3A5C", fontWeight: 500, margin: 0 };
const footer: React.CSSProperties = { padding: "16px 36px 24px", backgroundColor: "#F8F9FB" };
const footerText: React.CSSProperties = { fontSize: "11px", color: "#94A3B8", textAlign: "center", margin: 0 };
