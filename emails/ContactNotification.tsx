import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Row, Column,
} from "@react-email/components";

interface Props {
  name: string;
  email: string;
  phone?: string;
  inquiry: string;
  message: string;
}

const inquiryLabels: Record<string, string> = {
  general: "General Inquiry",
  residential: "Residential Project",
  builder: "Builder / Commercial Project",
  partnership: "Partnership Opportunity",
  other: "Other",
};

export default function ContactNotification({
  name = "Jane Smith",
  email = "jane@example.com",
  phone,
  inquiry = "general",
  message = "Hello, I have a question about your services.",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New contact message from {name}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Section style={header}>
            <Text style={badge}>NEW CONTACT MESSAGE</Text>
            <Heading style={h1}>{name}</Heading>
            <Text style={subtitle}>{inquiryLabels[inquiry] ?? inquiry}</Text>
          </Section>

          <Section style={section}>
            <Text style={sectionLabel}>Contact</Text>
            <Row style={row}>
              <Column style={lc}><Text style={cl}>Name</Text></Column>
              <Column style={vc}><Text style={cv}>{name}</Text></Column>
            </Row>
            <Row style={row}>
              <Column style={lc}><Text style={cl}>Email</Text></Column>
              <Column style={vc}><Text style={cv}><a href={`mailto:${email}`} style={{ color: "#6BBF44" }}>{email}</a></Text></Column>
            </Row>
            {phone && (
              <Row style={row}>
                <Column style={lc}><Text style={cl}>Phone</Text></Column>
                <Column style={vc}><Text style={cv}>{phone}</Text></Column>
              </Row>
            )}
            <Row style={row}>
              <Column style={lc}><Text style={cl}>Inquiry Type</Text></Column>
              <Column style={vc}><Text style={cv}>{inquiryLabels[inquiry] ?? inquiry}</Text></Column>
            </Row>
          </Section>

          <Hr style={divider} />

          <Section style={section}>
            <Text style={sectionLabel}>Message</Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Reply directly to this email to respond to {name} · 7 Suns Delivery & Logistics
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
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
const row: React.CSSProperties = { marginBottom: "10px" };
const lc: React.CSSProperties = { width: "38%", verticalAlign: "top" };
const vc: React.CSSProperties = { width: "62%", verticalAlign: "top" };
const cl: React.CSSProperties = { fontSize: "13px", color: "#94A3B8", margin: 0 };
const cv: React.CSSProperties = { fontSize: "13px", color: "#1B3A5C", fontWeight: 500, margin: 0 };
const messageText: React.CSSProperties = { fontSize: "14px", color: "#4A5568", lineHeight: "1.7", margin: 0, whiteSpace: "pre-wrap" };
const footer: React.CSSProperties = { padding: "16px 36px 24px", backgroundColor: "#F8F9FB" };
const footerText: React.CSSProperties = { fontSize: "11px", color: "#94A3B8", textAlign: "center", margin: 0 };
