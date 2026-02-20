import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
} from "@react-email/components";

// Design tokens matching the main application
const colors = {
  primary: "#10B981", // emerald-500
  primaryHover: "#059669", // emerald-600
  secondary: "#EF4444", // red-500
  secondaryHover: "#DC2626", // red-600
  background: "#FFFFFF",
  surface: "#F9FAFB", // gray-50
  text: "#111827", // gray-900
  textSecondary: "#6B7280", // gray-500
  textMuted: "#9CA3AF", // gray-400
  border: "#E5E7EB", // gray-200
  borderLight: "#F3F4F6", // gray-100
};

const fonts = {
  family: '"Inter", "Helvetica Neue", Arial, sans-serif',
  size: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
  },
  weight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

const spacing = {
  xs: "8px",
  sm: "12px",
  md: "16px",
  lg: "20px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "40px",
  "4xl": "48px",
};

export interface EmailLayoutProps {
  children: React.ReactNode;
  title: string;
  previewText?: string;
  recipientName?: string;
  recipientEmail: string;
}

const bodyStyle = {
  backgroundColor: colors.surface,
  fontFamily: fonts.family,
  margin: 0,
  padding: 0,
  width: "100%",
};

const containerStyle = {
  backgroundColor: colors.background,
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
  margin: `${spacing["3xl"]} auto`,
  maxWidth: "600px",
  padding: 0,
};

const headerStyle = {
  backgroundColor: colors.primary,
  borderRadius: "8px 8px 0 0",
  padding: spacing.xl,
  textAlign: "center" as const,
};

const headerTextStyle = {
  color: colors.background,
  fontSize: fonts.size["2xl"],
  fontWeight: fonts.weight.bold,
  margin: 0,
};

const contentStyle = {
  padding: spacing["2xl"],
};

const footerStyle = {
  backgroundColor: colors.surface,
  borderTop: `1px solid ${colors.borderLight}`,
  padding: spacing.xl,
  textAlign: "center" as const,
};

const footerTextStyle = {
  color: colors.textMuted,
  fontSize: fonts.size.xs,
  margin: `${spacing.xs} 0`,
};

const footerLinkStyle = {
  color: colors.primary,
  textDecoration: "none",
};

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  children,
  title,
  previewText,
  recipientName,
  recipientEmail,
}) => {
  const greeting = recipientName ? `Hello ${recipientName}!` : "Hello!";

  return (
    <Html>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={headerTextStyle}>Worklog App</Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            <Text
              style={{
                color: colors.text,
                fontSize: fonts.size.lg,
                fontWeight: fonts.weight.medium,
                marginBottom: spacing.lg,
              }}
            >
              {greeting}
            </Text>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              This email was sent to {recipientEmail}. If you no longer wish to
              receive these emails, you can{" "}
              <Link href="#" style={footerLinkStyle}>
                unsubscribe
              </Link>{" "}
              at any time.
            </Text>
            <Text style={footerTextStyle}>
              © 2026 Worklog App. All rights reserved.
            </Text>
            <Text style={footerTextStyle}>
              <Link
                href="https://worklog-app.com/privacy"
                style={footerLinkStyle}
              >
                Privacy Policy
              </Link>
              {" • "}
              <Link
                href="https://worklog-app.com/terms"
                style={footerLinkStyle}
              >
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
