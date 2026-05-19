import {
  Body, Container, Head, Heading, Hr, Html, Img,
  Preview, Section, Text, Row, Column,
} from "@react-email/components";

interface Props {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  appliances: string[];
  installation: boolean;
  removal: boolean;
  elevator: boolean;
  project_type: string;
  preferred_date: string;
  alternate_date?: string;
  notes?: string;
}

export default function BookingConfirmation({
  full_name = "Jane Smith",
  address = "123 Main St, Toronto, ON",
  appliances = ["Fridge / Refrigerator", "Dishwasher"],
  installation = true,
  removal = false,
  elevator = false,
  project_type = "residential",
  preferred_date = "2026-06-01",
  alternate_date,
  notes,
}: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://7suns.ca";

  return (
    <Html>
      <Head />
      <Preview>Your booking request has been received — 7 Suns Delivery & Logistics</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Logo */}
          <Section style={logoSection}>
            <Img src={`${siteUrl}/logo-dark.png`} width="140" height="50" alt="7 Suns Delivery & Logistics" style={logo} />
          </Section>

          {/* Green accent bar */}
          <Section style={accentBar} />

          {/* Heading */}
          <Section style={contentSection}>
            <Heading style={h1}>Booking request received.</Heading>
            <Text style={intro}>
              Hi {full_name}, thanks for reaching out. We&apos;ve received your booking request
              and our team will confirm your delivery date within <strong>one business day</strong>.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Booking Summary */}
          <Section style={contentSection}>
            <Text style={sectionLabel}>Booking Summary</Text>

            <Row style={row}>
              <Column style={labelCol}><Text style={cellLabel}>Address</Text></Column>
              <Column style={valueCol}><Text style={cellValue}>{address}</Text></Column>
            </Row>
            <Row style={row}>
              <Column style={labelCol}><Text style={cellLabel}>Appliances</Text></Column>
              <Column style={valueCol}><Text style={cellValue}>{appliances.join(", ")}</Text></Column>
            </Row>
            <Row style={row}>
              <Column style={labelCol}><Text style={cellLabel}>Installation</Text></Column>
              <Column style={valueCol}><Text style={cellValue}>{installation ? "Yes" : "No"}</Text></Column>
            </Row>
            <Row style={row}>
              <Column style={labelCol}><Text style={cellLabel}>Old Unit Removal</Text></Column>
              <Column style={valueCol}><Text style={cellValue}>{removal ? "Yes" : "No"}</Text></Column>
            </Row>
            <Row style={row}>
              <Column style={labelCol}><Text style={cellLabel}>Elevator Required</Text></Column>
              <Column style={valueCol}><Text style={cellValue}>{elevator ? "Yes" : "No"}</Text></Column>
            </Row>
            <Row style={row}>
              <Column style={labelCol}><Text style={cellLabel}>Project Type</Text></Column>
              <Column style={valueCol}><Text style={cellValue}>{project_type === "builder" ? "Builder / Commercial" : "Residential"}</Text></Column>
            </Row>
            <Row style={row}>
              <Column style={labelCol}><Text style={cellLabel}>Preferred Date</Text></Column>
              <Column style={valueCol}><Text style={cellValue}>{preferred_date}</Text></Column>
            </Row>
            {alternate_date && (
              <Row style={row}>
                <Column style={labelCol}><Text style={cellLabel}>Alternate Date</Text></Column>
                <Column style={valueCol}><Text style={cellValue}>{alternate_date}</Text></Column>
              </Row>
            )}
            {notes && (
              <Row style={row}>
                <Column style={labelCol}><Text style={cellLabel}>Notes</Text></Column>
                <Column style={valueCol}><Text style={cellValue}>{notes}</Text></Column>
              </Row>
            )}
          </Section>

          <Hr style={divider} />

          {/* What's next */}
          <Section style={contentSection}>
            <Text style={sectionLabel}>What happens next</Text>
            <Text style={body2}>
              Our team will review your request and reach out to confirm your delivery window.
              If you have any questions in the meantime, reply to this email or contact us directly.
            </Text>
            <Text style={contactLine}>
              <strong style={{ color: "#6BBF44" }}>info@7Suns.ca</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} 7 Suns Delivery & Logistics Inc. · Ontario&apos;s Appliance Specialists Since 2009
            </Text>
            <Text style={footerText}>
              <a href={siteUrl} style={{ color: "#6BBF44", textDecoration: "none" }}>7suns.ca</a>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

/* ─── Styles ─────────────────────────────────────────── */
const body: React.CSSProperties = { backgroundColor: "#F4F5F9", fontFamily: "'Outfit', Helvetica, Arial, sans-serif", margin: 0, padding: "40px 0" };
const container: React.CSSProperties = { backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "580px", margin: "0 auto", overflow: "hidden" };
const logoSection: React.CSSProperties = { padding: "28px 36px 20px" };
const logo: React.CSSProperties = { display: "block" };
const accentBar: React.CSSProperties = { backgroundColor: "#6BBF44", height: "3px", margin: "0" };
const contentSection: React.CSSProperties = { padding: "28px 36px" };
const h1: React.CSSProperties = { fontSize: "24px", fontWeight: 700, color: "#1B3A5C", letterSpacing: "-0.02em", margin: "0 0 12px" };
const intro: React.CSSProperties = { fontSize: "15px", color: "#4A5568", lineHeight: "1.7", margin: "0" };
const sectionLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#94A3B8", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 16px" };
const divider: React.CSSProperties = { borderColor: "rgba(12,20,32,0.07)", margin: "0" };
const row: React.CSSProperties = { marginBottom: "10px" };
const labelCol: React.CSSProperties = { width: "38%", verticalAlign: "top" };
const valueCol: React.CSSProperties = { width: "62%", verticalAlign: "top" };
const cellLabel: React.CSSProperties = { fontSize: "13px", color: "#94A3B8", fontWeight: 400, margin: 0 };
const cellValue: React.CSSProperties = { fontSize: "13px", color: "#1B3A5C", fontWeight: 500, margin: 0 };
const body2: React.CSSProperties = { fontSize: "14px", color: "#4A5568", lineHeight: "1.7", margin: "0 0 10px" };
const contactLine: React.CSSProperties = { fontSize: "14px", margin: "0" };
const footer: React.CSSProperties = { padding: "20px 36px 28px", backgroundColor: "#F8F9FB" };
const footerText: React.CSSProperties = { fontSize: "12px", color: "#94A3B8", textAlign: "center", margin: "4px 0" };
