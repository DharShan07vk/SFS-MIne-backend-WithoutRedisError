import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";
const nodemailer = require("nodemailer");
import { userOtp, userTable } from "../../db/schema/users";
import { and, eq } from "drizzle-orm";

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "randompurposeuse07@gmail.com",
        pass: "zogc bjhp tqwx pfve",
    },
});

export const sendOTP: RequestHandler = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;
        const phone = req.body.mobile;
        const institutionName = req.body.institutionName;
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = currentTime + 600; // OTP valid for 10 minutes
        
        const mailOptions = {
            from: {
                name: 'STEM for Society',
                address: 'noreply@stemforsociety.com'
            },
            to: email,
            subject: 'Verify Your Email - Institution Registration | STEM for Society',
            html: generateInstitutionRegistrationOTPTemplate(otp, email, phone, institutionName),
            text: `Your OTP for STEM for Society institution registration is: ${otp}. This OTP will expire in 10 minutes.`
        };

        // Check if OTP record already exists for this email
        const [existingOtp] = await db
            .select()
            .from(userOtp)
            .where(eq(userOtp.email, email));

        let otpRecord;
        
        if (existingOtp) {
            // Update existing OTP record with new OTP and expiration time
            [otpRecord] = await db
                .update(userOtp)
                .set({
                    otp: otp,
                    createdAt: currentTime,
                    expiresAt: expirationTime,
                })
                .where(eq(userOtp.email, email))
                .returning();
        } else {
            // Create new OTP record
            [otpRecord] = await db
                .insert(userOtp)
                .values({
                    email: email,
                    otp: otp,
                    createdAt: currentTime,
                    expiresAt: expirationTime,
                })
                .returning();
        }

        // Send email with new OTP
        await transporter.sendMail(mailOptions);
        
        res.json({
            message: "Institution registration OTP sent successfully",
            data: otpRecord
        });
        
        console.log("Institution registration OTP sent successfully");
        
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
        return;
    }
};

export const sendOTPReset: RequestHandler = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }
        
        const isexist = await db.select().from(userTable).where(eq(userTable.email, email));
        if (isexist.length === 0) {
            res.status(400).json({ error: "Email does not exist" });
            return;
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = currentTime + 600; // OTP valid for 10 minutes
        
        const mailOptions = {
            from: {
                name: 'STEM for Society',
                address: 'noreply@stemforsociety.com'
            },
            to: email,
            subject: 'Password Reset Verification - STEM for Society',
            html: generatePasswordResetOTPTemplate(otp, email),
            text: `Your OTP for STEM for Society Account Password Reset is: ${otp}. This OTP will expire in 10 minutes.`
        };

        // Check if OTP record already exists for this email
        const [existingOtp] = await db
            .select()
            .from(userOtp)
            .where(eq(userOtp.email, email));

        let otpRecord;
        
        if (existingOtp) {
            // Update existing OTP record with new OTP and expiration time
            [otpRecord] = await db
                .update(userOtp)
                .set({
                    otp: otp,
                    createdAt: currentTime,
                    expiresAt: expirationTime,
                })
                .where(eq(userOtp.email, email))
                .returning();
        } else {
            // Create new OTP record
            [otpRecord] = await db
                .insert(userOtp)
                .values({
                    email: email,
                    otp: otp,
                    createdAt: currentTime,
                    expiresAt: expirationTime,
                })
                .returning();
        }

        // Send email with new OTP
        await transporter.sendMail(mailOptions);
        
        res.json({
            message: "Password reset OTP sent successfully",
            data: otpRecord
        });
        
        console.log("Password reset OTP sent successfully");
        
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
        return;
    }
};

function maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.charAt(username.length - 1)}`
      : `${username.charAt(0)}*`;
    return `${maskedUsername}@${domain}`;
}

// Template for Institution Registration OTP
function generateInstitutionRegistrationOTPTemplate(otp: number, email?: string, phone?: string, institutionName?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Institution Registration | STEM for Society</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .tagline {
            color: #6b7280;
            font-size: 14px;
          }
          .otp-box {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }
          .otp-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
          }
          .info-section {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info-item {
            margin: 10px 0;
            font-size: 14px;
          }
          .warning {
            background-color: #fef3cd;
            border: 1px solid #fde68a;
            color: #92400e;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .next-steps {
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          .icon {
            font-size: 18px;
            margin-right: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">STEM FOR SOCIETY</div>
            <div class="tagline">Let's innovate, incubate and impact the world together!</div>
          </div>

          <h2>🏫 Welcome! Complete Your Institution Registration</h2>
          <p>Thank you for choosing STEM for Society as your educational partner. We're excited to have your institution join our growing community of innovative educators!</p>
          
          <p>To complete your institution registration process, please verify your email address using the verification code below:</p>

          <div class="otp-box">
            <div class="otp-label">Your Institution Registration Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 14px; opacity: 0.9;">Valid for 10 minutes</div>
          </div>

          ${email ? `
          <div class="info-section">
            <h4><span class="icon">📋</span>Registration Details:</h4>
            <div class="info-item"><strong>Institution Name:</strong> ${institutionName || 'To be provided'}</div>
            <div class="info-item"><strong>Contact Number:</strong> ${phone || 'To be provided'}</div>
            <div class="info-item"><strong>Registration Email:</strong> ${maskEmail(email)}</div>
            <div class="info-item"><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
          ` : ''}

          <div class="next-steps">
            <h4><span class="icon">✅</span>What happens next?</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Enter the verification code to confirm your email</li>
              <li>Complete your institution profile setup</li>
              <li>Upload required documentation</li>
              <li>Our team will review and approve your registration</li>
              <li>Start creating and offering courses to students!</li>
            </ul>
          </div>

          <div class="warning">
            <strong>🔐 Security Notice:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This verification code expires in 10 minutes</li>
              <li>Keep this code confidential - do not share with anyone</li>
              <li>If you didn't request this registration, please contact support</li>
              <li>You can request a new code if this one expires</li>
            </ul>
          </div>

          <div class="footer">
            <p>Need help with registration? Our support team is here to assist you!</p>
            <p><strong>STEM for Society</strong><br>
            Email: support@stemforsociety.com<br>
            Phone: +91-XXXX-XXXXXX<br>
            Website: www.stemforsociety.org</p>
            <p>© ${new Date().getFullYear()} STEM for Society. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
}

// Template for Password Reset OTP
function generatePasswordResetOTPTemplate(otp: number, email: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Verification - STEM for Society</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .tagline {
            color: #6b7280;
            font-size: 14px;
          }
          .otp-box {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }
          .otp-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
          }
          .info-section {
            background-color: #fef3cd;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info-item {
            margin: 10px 0;
            font-size: 14px;
          }
          .warning {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
            color: #dc2626;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .next-steps {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          .icon {
            font-size: 18px;
            margin-right: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">STEM FOR SOCIETY</div>
            <div class="tagline">Let's innovate, incubate and impact the world together!</div>
          </div>

          <h2>🔑 Password Reset Request</h2>
          <p>We received a request to reset the password for your STEM for Society account associated with <strong>${maskEmail(email)}</strong>.</p>
          
          <p>To proceed with resetting your password, please use the verification code below:</p>

          <div class="otp-box">
            <div class="otp-label">Your Password Reset Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 14px; opacity: 0.9;">Valid for 10 minutes</div>
          </div>

          <div class="info-section">
            <h4><span class="icon">📋</span>Reset Details:</h4>
            <div class="info-item"><strong>Account Email:</strong> ${maskEmail(email)}</div>
            <div class="info-item"><strong>Request Time:</strong> ${new Date().toLocaleString()}</div>
          </div>

          <div class="next-steps">
            <h4><span class="icon">🔧</span>How to reset your password:</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Enter the verification code above in the password reset form</li>
              <li>Create a new, strong password</li>
              <li>Confirm your new password</li>
              <li>Your password will be updated immediately</li>
              <li>Sign in with your new password</li>
            </ol>
          </div>

          <div class="warning">
            <strong>🚨 Important Security Information:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email and contact support immediately</li>
              <li><strong>Code expires in 10 minutes</strong> - Use it quickly or request a new one</li>
              <li><strong>Keep it private</strong> - Never share this code with anyone</li>
              <li><strong>One-time use</strong> - This code can only be used once</li>
            </ul>
          </div>

          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>💡 Security Tip:</strong> Choose a strong password that includes uppercase letters, lowercase letters, numbers, and special characters. Avoid using easily guessable information.</p>
          </div>

          <div class="footer">
            <p>If you need assistance with password reset, please contact our support team.</p>
            <p><strong>STEM for Society</strong><br>
            Email: support@stemforsociety.com<br>
            Phone: +91-XXXX-XXXXXX<br>
            Website: www.stemforsociety.org</p>
            <p>© ${new Date().getFullYear()} STEM for Society. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
}

export const verifyOTP: RequestHandler = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ error: "Email and OTP are required" });
            return;
        }

        const [userOtpRecord] = await db
            .select()
            .from(userOtp)
            .where(and(eq(userOtp.email, email), eq(userOtp.otp, otp)));

        if (!userOtpRecord) {
            res.status(400).json({ error: "Invalid OTP" });
            return;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > userOtpRecord.expiresAt) {
            res.status(400).json({ error: "OTP has expired" });
            return;
        }

        // Delete the OTP record after successful verification
        await db.delete(userOtp).where(eq(userOtp.email, email));
        console.log("OTP deleted after verification:", email);
        res.json({ message: "OTP verified successfully" });
        
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
        return;
    }
};