import * as React from "react";
import { Button, Section, Text, Link } from "@react-email/components";

// Design tokens (matching EmailLayout)
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
};

export interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  style?: React.CSSProperties;
}

export const EmailButton: React.FC<EmailButtonProps> = ({
  href,
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  style,
}) => {
  const baseStyle = {
    borderRadius: "6px",
    display: "inline-block",
    fontFamily: fonts.family,
    fontWeight: fonts.weight.semibold,
    textDecoration: "none",
    textAlign: "center" as const,
    transition: "all 0.2s ease",
  };

  const sizeStyles = {
    sm: {
      fontSize: fonts.size.sm,
      padding: `${spacing.sm} ${spacing.md}`,
    },
    md: {
      fontSize: fonts.size.base,
      padding: `${spacing.md} ${spacing.lg}`,
    },
    lg: {
      fontSize: fonts.size.lg,
      padding: `${spacing.lg} ${spacing.xl}`,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.background,
      border: `1px solid ${colors.primary}`,
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.background,
      border: `1px solid ${colors.secondary}`,
    },
    outline: {
      backgroundColor: "transparent",
      color: colors.primary,
      border: `1px solid ${colors.primary}`,
    },
  };

  const buttonStyle = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(fullWidth && { width: "100%", display: "block" }),
    ...style, // Custom styles override defaults
  };

  return (
    <Button href={href} style={buttonStyle}>
      {children}
    </Button>
  );
};

export interface EmailSectionProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const EmailSection: React.FC<EmailSectionProps> = ({
  children,
  style = {},
  className,
}) => {
  const sectionStyle = {
    marginBottom: spacing.xl,
    ...style,
  };

  return (
    <Section style={sectionStyle} className={className}>
      {children}
    </Section>
  );
};

export interface EmailTextProps {
  children: React.ReactNode;
  size?: keyof typeof fonts.size;
  weight?: keyof typeof fonts.weight;
  color?: keyof typeof colors;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
}

export const EmailText: React.FC<EmailTextProps> = ({
  children,
  size = "base",
  weight = "normal",
  color = "text",
  align = "left",
  style = {},
}) => {
  const textStyle = {
    color: colors[color],
    fontSize: fonts.size[size],
    fontWeight: fonts.weight[weight],
    lineHeight: "1.5",
    margin: 0,
    textAlign: align,
    ...style,
  };

  return <Text style={textStyle}>{children}</Text>;
};

export interface EmailLinkProps {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const EmailLink: React.FC<EmailLinkProps> = ({
  href,
  children,
  style = {},
}) => {
  const linkStyle = {
    color: colors.primary,
    textDecoration: "underline",
    ...style,
  };

  return (
    <Link href={href} style={linkStyle}>
      {children}
    </Link>
  );
};

export interface EmailDividerProps {
  style?: React.CSSProperties;
}

export const EmailDivider: React.FC<EmailDividerProps> = ({ style = {} }) => {
  const dividerStyle = {
    borderTop: `1px solid ${colors.border}`,
    margin: `${spacing.xl} 0`,
    ...style,
  };

  return <div style={dividerStyle} />;
};
