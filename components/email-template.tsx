import * as React from "react";
import { EmailLayout, EmailText } from "./emails";

interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
}) => (
  <EmailLayout
    title={`Welcome ${firstName}!`}
    previewText={`Welcome to Worklog App, ${firstName}!`}
    recipientName={firstName}
    recipientEmail="" // This would be passed in real usage
  >
    <EmailText size="lg" weight="medium">
      Welcome to Worklog App!
    </EmailText>

    <EmailText style={{ marginTop: "12px" }}>
      We&apos;re excited to have you join our community. Worklog App helps teams
      track and manage member contributions efficiently.
    </EmailText>

    <EmailText style={{ marginTop: "16px" }}>
      Get started by exploring your dashboard and connecting with your team.
    </EmailText>
  </EmailLayout>
);

export default EmailTemplate;
