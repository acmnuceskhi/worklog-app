# Email Standardization System

This directory contains the standardized email system for the Worklog App, providing consistent, accessible, and professional email templates across all invitation and notification systems.

## 📁 Directory Structure

```
lib/email/
├── service.ts          # Email service with standardized sending methods
└── utils.ts            # Email utilities and constants

components/emails/
├── index.ts            # Main exports for email components
├── EmailLayout.tsx     # Base email layout component
├── EmailComponents.tsx # Reusable email UI components
├── TeamInvitationEmail.tsx     # Team invitation template
├── WorklogReviewEmail.tsx      # Worklog review notification template
└── DeadlineReminderEmail.tsx   # Deadline reminder template

lib/validations/
└── email-validations.ts # Email data validation schemas
```

## 🚀 Quick Start

### Sending a Team Invitation Email

```typescript
import { emailService } from "@/lib/email/service";

const result = await emailService.sendTeamInvitation({
  teamName: "Frontend Team",
  inviterName: "John Doe",
  acceptUrl: "https://app.com/invite/accept/abc123",
  rejectUrl: "https://app.com/invite/reject/abc123",
  expiresAt: new Date("2026-03-01"),
  recipientEmail: "user@example.com",
  recipientName: "Jane Smith",
  organizationName: "Tech Corp",
});
```

### Sending a Worklog Review Notification

```typescript
import { emailService } from "@/lib/email/service";

const result = await emailService.sendWorklogReview({
  worklogTitle: "Implement user authentication",
  teamName: "Backend Team",
  reviewerName: "Alice Johnson",
  reviewUrl: "https://app.com/worklogs/123/review",
  recipientEmail: "reviewer@example.com",
  progressStatus: "COMPLETED",
  deadline: new Date("2026-02-28"),
});
```

### Sending a Deadline Reminder

```typescript
import { emailService } from "@/lib/email/service";

const result = await emailService.sendDeadlineReminder({
  worklogTitle: "Database migration",
  teamName: "DevOps Team",
  deadline: new Date("2026-02-25"),
  daysRemaining: 3,
  worklogUrl: "https://app.com/worklogs/456",
  recipientEmail: "member@example.com",
  priority: "high",
});
```

## 🎨 Email Templates

### Team Invitation Email

- **Purpose**: Invite users to join teams
- **Features**: Accept/reject buttons, expiry information, team context
- **Customization**: Organization name, custom expiry dates

### Worklog Review Email

- **Purpose**: Notify team owners of worklogs ready for review
- **Features**: Progress status, deadline info, review guidelines
- **Customization**: Organization context, deadline warnings

### Deadline Reminder Email

- **Purpose**: Remind team members of approaching deadlines
- **Features**: Priority-based styling, urgency indicators, progress links
- **Customization**: Priority levels (low, medium, high, urgent)

## 🛠️ Email Components

### Layout Components

- **EmailLayout**: Base layout with consistent header/footer
- **EmailSection**: Semantic content sections
- **EmailDivider**: Visual separators

### UI Components

- **EmailButton**: Accessible buttons with variants (primary, secondary, outline)
- **EmailText**: Typography with size, weight, and color options
- **EmailLink**: Accessible links with proper styling

## 🔧 Configuration

### Environment Variables

```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Worklog App <noreply@worklog-app.com>
NEXTAUTH_URL=https://yourapp.com
```

### Service Configuration

```typescript
import { EmailService } from "@/lib/email/service";

// Check if email service is configured
if (emailService.isConfigured()) {
  // Send emails
}
```

## 📋 Validation

All email data is validated using Zod schemas:

```typescript
import {
  teamInvitationEmailSchema,
  worklogReviewEmailSchema,
  deadlineReminderEmailSchema,
} from "@/lib/validations/email-validations";

// Validate email data
const validatedData = teamInvitationEmailSchema.parse(emailData);
```

## 🧪 Testing

### Email Template Testing

```typescript
// Render email for testing
import { TeamInvitationEmail } from "@/components/emails";

const emailHtml = TeamInvitationEmail({
  // props
});
```

### Service Testing

```typescript
// Mock email service for testing
const mockEmailService = {
  sendTeamInvitation: jest.fn().mockResolvedValue({ success: true }),
};
```

## 📊 Email Analytics

Track email delivery and engagement:

```typescript
// Email result includes delivery status
const result = await emailService.sendTeamInvitation(data);
if (result.success) {
  console.log("Email sent successfully:", result.emailId);
} else {
  console.error("Email failed:", result.error);
}
```

## 🎯 Best Practices

### Design Principles

- **Mobile-First**: All emails designed for mobile viewing
- **Accessibility**: WCAG-compliant with proper contrast and semantics
- **Consistency**: Use design tokens matching the main application
- **Performance**: Optimized for email client compatibility

### Technical Standards

- **Responsive**: Table-based layouts for maximum compatibility
- **Inline Styles**: All CSS inlined for email client support
- **Fallback Fonts**: Web-safe fonts with fallbacks
- **Alt Text**: Descriptive alt text for all images

### Content Guidelines

- **Clear Subject Lines**: Concise and informative
- **Preview Text**: Compelling summaries under 100 characters
- **Action-Oriented**: Clear calls-to-action
- **Personalization**: Use recipient names when available

## 🔄 Migration Guide

### From Legacy Templates

1. **Replace inline styles** with standardized components
2. **Update component props** to match new interfaces
3. **Add accessibility features** and semantic markup
4. **Test across email clients** and devices
5. **Update email service integration**

### Component Migration Checklist

- [ ] Replace custom styling with EmailLayout
- [ ] Update button components to EmailButton
- [ ] Add proper heading hierarchy
- [ ] Include alt text for images
- [ ] Test responsive design
- [ ] Validate accessibility compliance

## 🚨 Error Handling

```typescript
try {
  const result = await emailService.sendTeamInvitation(data);
  if (!result.success) {
    // Handle email sending failure
    console.error("Email failed:", result.error);
    // Fallback: store notification for later retry
  }
} catch (error) {
  // Handle unexpected errors
  console.error("Unexpected error:", error);
}
```

## 📈 Future Enhancements

- **A/B Testing**: Subject line and content optimization
- **Template Variables**: Dynamic content insertion
- **Email Scheduling**: Delayed sending capabilities
- **Bounce Handling**: Automatic bounce processing
- **Unsubscribe Management**: Automated unsubscribe handling
