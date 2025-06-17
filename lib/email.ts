import { Resend } from 'resend';

// Initialize Resend (if you have API key in env vars)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// From email address
const fromEmail = process.env.SENDER_EMAIL || 'no-reply@santafe.com.bo';

/**
 * Send an email confirmation email to a newly registered user
 */
export async function sendConfirmationEmail(
  email: string,
  name: string,
  confirmationLink: string
) {
  // If Resend API key is not configured, just return success with a message
  if (!resend) {
    return { 
      success: true, 
      message: 'Email service not configured, but user was created. Please manually confirm your email in Supabase dashboard.'
    };
  }
  
  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Confirm your Santa Fe account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Santa Fe</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with Santa Fe! Please click the link below to confirm your email address:</p>
          <p style="margin: 20px 0;">
            <a href="${confirmationLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Confirm Email Address
            </a>
          </p>
          <p>This link will expire in 24 hours. If you did not create this account, you can safely ignore this email.</p>
          <p>Thank you,<br>The Santa Fe Team</p>
        </div>
      `,
    });

    return { success: true, message: 'Confirmation email sent successfully' };
  } catch (error) {
    return { 
      success: true, // Return success anyway so user creation continues
      message: 'Failed to send confirmation email, but user was created. Please check your email or contact support.'
    };
  }
}

/**
 * Send a password setup email to a newly created user
 */
export async function sendPasswordSetupEmail(
  email: string,
  name: string,
  resetLink: string
) {
  // If Resend API key is not configured, just return success with a message
  // This allows the user creation process to continue without sending an email
  if (!resend) {
    return { 
      success: true, 
      message: 'Email service not configured, but user was created. '
    };
  }
  
  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Set up your Santa Fe account password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Santa Fe</h2>
          <p>Hello ${name},</p>
          <p>An administrator has created an account for you. Please click the link below to set your password:</p>
          <p style="margin: 20px 0;">
            <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Set Your Password
            </a>
          </p>
          <p>This link will expire in 24 hours. If you did not request this account, you can safely ignore this email.</p>
          <p>Thank you,<br>The Santa Fe Team</p>
        </div>
      `,
    });

    return { success: true, message: 'Password setup email sent successfully' };
  } catch (error) {
    return { 
      success: true, // Return success anyway so user creation continues
      message: 'Failed to send email, but user was created. '
    };
  }
} 