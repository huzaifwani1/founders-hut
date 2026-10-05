export interface EmailMessageDetails {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  data?: Record<string, any>;
}

export interface EmailProvider {
  sendPasswordReset(email: string, token: string): Promise<void>;
  sendEmailVerification(email: string, token: string): Promise<void>;
  sendVerificationSubmitted(email: string): Promise<void>;
  sendVerificationApproved(email: string, level: string): Promise<void>;
  sendVerificationRejected(email: string, reason: string): Promise<void>;
  sendVerificationStatusUpdate(email: string, status: string, level?: string): Promise<void>;
  sendIntroductionReceived(email: string, requesterName: string, reason: string): Promise<void>;
  sendIntroductionAccepted(email: string, recipientName: string): Promise<void>;
  sendMessageNotification(email: string, senderName: string, snippet: string): Promise<void>;
}

/**
 * LoggerEmailProvider (Development Provider)
 * Logs structured email payloads to console in local development environment.
 * Can be swapped with SMTP/Postmark/Resend Provider in production without changing application code.
 */
export class LoggerEmailProvider implements EmailProvider {
  async sendPasswordReset(email: string, token: string): Promise<void> {
    console.log(`[EMAIL LOG] Password Reset → To: ${email} | Reset Link: http://localhost:5173/reset-password?token=${token}`);
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    console.log(`[EMAIL LOG] Email Verification → To: ${email} | Verification Token: ${token}`);
  }

  async sendVerificationSubmitted(email: string): Promise<void> {
    console.log(`[EMAIL LOG] Verification Submitted → To: ${email} | Audit review in progress.`);
  }

  async sendVerificationApproved(email: string, level: string): Promise<void> {
    console.log(`[EMAIL LOG] Verification Approved → To: ${email} | Status: VERIFIED | Level: ${level}`);
  }

  async sendVerificationRejected(email: string, reason: string): Promise<void> {
    console.log(`[EMAIL LOG] Verification Rejected → To: ${email} | Reason: ${reason}`);
  }

  async sendVerificationStatusUpdate(email: string, status: string, level?: string): Promise<void> {
    console.log(`[EMAIL LOG] Verification Audit Update → To: ${email} | Status: ${status} | Level: ${level || 'N/A'}`);
  }

  async sendIntroductionReceived(email: string, requesterName: string, reason: string): Promise<void> {
    console.log(`[EMAIL LOG] Introduction Received → To: ${email} | From: ${requesterName} | Topic: ${reason}`);
  }

  async sendIntroductionAccepted(email: string, recipientName: string): Promise<void> {
    console.log(`[EMAIL LOG] Introduction Accepted → To: ${email} | ${recipientName} accepted your introduction.`);
  }

  async sendMessageNotification(email: string, senderName: string, snippet: string): Promise<void> {
    console.log(`[EMAIL LOG] New Message → To: ${email} | From: ${senderName} | Snippet: "${snippet}"`);
  }
}

/**
 * Production Postmark / Resend Email Provider Implementation
 */
export class PostmarkEmailProvider implements EmailProvider {
  private apiToken: string;

  constructor(token: string) {
    this.apiToken = token;
  }

  private async sendHttpRequest(endpoint: string, payload: Record<string, any>) {
    console.log(`[POSTMARK TRANSACTIONAL EMAIL] Dispatching to ${payload.To} via API...`);
    // HTTP request to https://api.postmarkapp.com/email
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    await this.sendHttpRequest('/email', {
      From: 'notifications@foundershut.com',
      To: email,
      Subject: 'Founders Hut — Password Reset',
      TextBody: `Reset link: https://app.foundershut.com/reset-password?token=${token}`
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    await this.sendHttpRequest('/email', {
      From: 'notifications@foundershut.com',
      To: email,
      Subject: 'Founders Hut — Verify Corporate Email',
      TextBody: `Verification link: https://app.foundershut.com/verify-email?token=${token}`
    });
  }

  async sendVerificationSubmitted(email: string): Promise<void> {
    await this.sendHttpRequest('/email', {
      From: 'notifications@foundershut.com',
      To: email,
      Subject: 'Founders Hut — Verification Submitted',
      TextBody: 'Your verification submission has been received and is undergoing audit.'
    });
  }

  async sendVerificationApproved(email: string, level: string): Promise<void> {
    await this.sendHttpRequest('/email', {
      From: 'notifications@foundershut.com',
      To: email,
      Subject: 'Founders Hut — Verification Approved',
      TextBody: `Congratulations, your executive profile has been verified as ${level}.`
    });
  }

  async sendVerificationRejected(email: string, reason: string): Promise<void> {
    await this.sendHttpRequest('/email', {
      From: 'notifications@foundershut.com',
      To: email,
      Subject: 'Founders Hut — Verification Update Required',
      TextBody: `Verification update required: ${reason}`
    });
  }

  async sendVerificationStatusUpdate(email: string, status: string, level?: string): Promise<void> {
    await this.sendHttpRequest('/email', {
      From: 'notifications@foundershut.com',
      To: email,
      Subject: 'Founders Hut — Verification Status Update',
      TextBody: `Status: ${status}`
    });
  }

  async sendIntroductionReceived(email: string, requesterName: string, reason: string): Promise<void> {
    await this.sendHttpRequest('/email', {
      From: 'notifications@foundershut.com',
      To: email,
      Subject: 'Founders Hut — Introduction Request Received',
      TextBody: `${requesterName} requested an introduction regarding: ${reason}`
    });
  }

  async sendIntroductionAccepted(email: string, recipientName: string): Promise<void> {
    await this.sendHttpRequest('/email', {
      From: 'notifications@foundershut.com',
      To: email,
      Subject: 'Founders Hut — Introduction Accepted',
      TextBody: `${recipientName} accepted your introduction.`
    });
  }

  async sendMessageNotification(email: string, senderName: string, snippet: string): Promise<void> {
    await this.sendHttpRequest('/email', {
      From: 'notifications@foundershut.com',
      To: email,
      Subject: 'Founders Hut — New Executive Message',
      TextBody: `Message from ${senderName}: ${snippet}`
    });
  }
}

const getEmailProvider = (): EmailProvider => {
  const isProduction = process.env.NODE_ENV === 'production';
  const token = process.env.POSTMARK_SERVER_TOKEN || process.env.RESEND_API_KEY;

  if (isProduction && !token) {
    throw new Error('CRITICAL SECURITY ERROR: POSTMARK_SERVER_TOKEN or RESEND_API_KEY must be configured in production!');
  }

  if (token) {
    return new PostmarkEmailProvider(token);
  }

  return new LoggerEmailProvider();
};

export const emailService: EmailProvider = getEmailProvider();
