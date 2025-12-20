import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";
const nodemailer = require("nodemailer");
import { userOtp, userTable } from "../../db/schema/users";
import { and, eq } from "drizzle-orm";
const crypto = require('crypto');

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

          <h2> Password Reset Request</h2>
          <p>We received a request to reset the password for your STEM for Society account associated with <strong>${maskEmail(email)}</strong>.</p>
          
          <p>To proceed with resetting your password, please use the verification code below:</p>

          <div class="otp-box">
            <div class="otp-label">Your Password Reset Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 14px; opacity: 0.9;">Valid for 10 minutes</div>
          </div>

          <div class="info-section">
            <h4><span class="icon"></span>Reset Details:</h4>
            <div class="info-item"><strong>Account Email:</strong> ${maskEmail(email)}</div>
            <div class="info-item"><strong>Request Time:</strong> ${new Date().toLocaleString()}</div>
          </div>

          <div class="next-steps">
            <h4><span class="icon"></span>How to reset your password:</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Enter the verification code above in the password reset form</li>
              <li>Create a new, strong password</li>
              <li>Confirm your new password</li>
              <li>Your password will be updated immediately</li>
              <li>Sign in with your new password</li>
            </ol>
          </div>

          <div class="warning">
            <strong> Important Security Information:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email and contact support immediately</li>
              <li><strong>Code expires in 10 minutes</strong> - Use it quickly or request a new one</li>
              <li><strong>Keep it private</strong> - Never share this code with anyone</li>
              <li><strong>One-time use</strong> - This code can only be used once</li>
            </ul>
          </div>

          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong> Security Tip:</strong> Choose a strong password that includes uppercase letters, lowercase letters, numbers, and special characters. Avoid using easily guessable information.</p>
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

// Manual Email Sending Endpoints

// Course Registration Success Email
export const sendCourseRegistrationEmail: RequestHandler = async (req: Request, res: Response) => {
  console.log("Course Registration Email Request Body:", req.body);  
  try {
        const {
            userEmail,
            userName,
            courseName,
            amount,
            currency,
            paymentId,
            courseDuration,
            startDate,
            phoneNumber
        } = req.body;

        if (!userEmail || !courseName || !amount || !paymentId) {
            res.status(400).json({ error: "Required fields: userEmail, courseName, amount, paymentId" });
            return;
        }

        const mailOptions = generateCourseRegistrationEmail({
            userEmail,
            userName,
            amount,
            currency: currency || 'INR',
            paymentId,
            transactionDate: new Date(),
            additionalDetails: {
                course_name: courseName,
                duration: courseDuration,
                start_date: startDate
            }
        });
        console.log("Generated Mail Options:", mailOptions);
        await transporter.sendMail(mailOptions);
        
        res.json({
            message: "Course registration email sent successfully",
            recipient: userEmail
        });
        
        console.log(`Course registration email sent to ${userEmail}`);
        
    } catch (error) {
        console.error("Error sending course registration email:", error);
        res.status(500).json({ error: "Failed to send course registration email" });
    }
};

// Mental Wellbeing Session Email
export const sendMentalWellbeingEmail: RequestHandler = async (req: Request, res: Response) => {
    try {
        const {
            userEmail,
            userName,
            sessionType,
            amount,
            currency,
            paymentId,
            sessionDate,
        } = req.body;

        if (!userEmail || !sessionType || !amount || !paymentId) {
            res.status(400).json({ error: "Required fields: userEmail, sessionType, amount, paymentId" });
            return;
        }

        const mailOptions = generateMentalWellbeingEmail({
            userEmail,
            userName,
            amount,
            currency: currency || 'INR',
            paymentId,
            transactionDate: new Date(),
            additionalDetails: {
                session_type: sessionType,
                session_date: sessionDate
            }
        });

        await transporter.sendMail(mailOptions);
        
        res.json({
            message: "Mental wellbeing email sent successfully",
            recipient: userEmail
        });
        
        console.log(`Mental wellbeing email sent to ${userEmail}`);
        
    } catch (error) {
        console.error("Error sending mental wellbeing email:", error);
        res.status(500).json({ error: "Failed to send mental wellbeing email" });
    }
};

// Career Counseling Email
export const sendCareerCounselingEmail: RequestHandler = async (req: Request, res: Response) => {
    try {
        const {
            userEmail,
            userName,
            counselingType,
            amount,
            currency,
            paymentId,
            sessionDate,
        } = req.body;

        if (!userEmail || !counselingType || !amount || !paymentId) {
            res.status(400).json({ error: "Required fields: userEmail, counselingType, amount, paymentId" });
            return;
        }

        const mailOptions = generateCareerCounselingEmail({
            userEmail,
            userName,
            amount,
            currency: currency || 'INR',
            paymentId,
            transactionDate: new Date(),
            additionalDetails: {
                counseling_type: counselingType,
                session_date: sessionDate
            }
        });

        await transporter.sendMail(mailOptions);
        
        res.json({
            message: "Career counseling email sent successfully",
            recipient: userEmail
        });
        
        console.log(`Career counseling email sent to ${userEmail}`);
        
    } catch (error) {
        console.error("Error sending career counseling email:", error);
        res.status(500).json({ error: "Failed to send career counseling email" });
    }
};

// Institution Partnership Email
export const sendInstitutionPartnershipEmail: RequestHandler = async (req: Request, res: Response) => {
    try {
        const {
            userEmail,
            userName,
            institutionName,
            serviceType,
            amount,
            currency,
            paymentId,
            sessionDate,
        } = req.body;

        if (!userEmail || !institutionName || !amount || !paymentId) {
            res.status(400).json({ error: "Required fields: userEmail, institutionName, amount, paymentId" });
            return;
        }

        const mailOptions = generateInstitutionBookingEmail({
            userEmail,
            userName,
            amount,
            currency: currency || 'INR',
            paymentId,
            transactionDate: new Date(),
            additionalDetails: {
                institution_name: institutionName,
                service_type: serviceType,
                session_date : sessionDate
            }
        });

        await transporter.sendMail(mailOptions);
        
        res.json({
            message: "Institution partnership email sent successfully",
            recipient: userEmail
        });
        
        console.log(`Institution partnership email sent to ${userEmail}`);
        
    } catch (error) {
        console.error("Error sending institution partnership email:", error);
        res.status(500).json({ error: "Failed to send institution partnership email" });
    }
};

// General Payment Success Email
export const sendGeneralPaymentEmail: RequestHandler = async (req: Request, res: Response) => {
    try {
        const {
            userEmail,
            userName,
            amount,
            currency,
            paymentId,
            description
        } = req.body;

        if (!userEmail || !amount || !paymentId) {
            res.status(400).json({ error: "Required fields: userEmail, amount, paymentId" });
            return;
        }

        const mailOptions = generateGeneralPaymentEmail({
            userEmail,
            userName,
            amount,
            currency: currency || 'INR',
            paymentId,
            transactionDate: new Date(),
            additionalDetails: {
                description: description
            }
        });

        await transporter.sendMail(mailOptions);
        
        res.json({
            message: "General payment email sent successfully",
            recipient: userEmail
        });
        
        console.log(`General payment email sent to ${userEmail}`);
        
    } catch (error) {
        console.error("Error sending general payment email:", error);
        res.status(500).json({ error: "Failed to send general payment email" });
    }
};

// Course Registration Email Template
function generateCourseRegistrationEmail(details: any) {
    const { userEmail, userName, amount, currency, paymentId, transactionDate, additionalDetails } = details;
    const courseName = additionalDetails?.course_name || 'Selected Course';
    const courseDuration = additionalDetails?.duration || 'To be confirmed';
    const startDate = additionalDetails?.start_date || 'To be announced';
    
    return {
        from: {
            name: 'STEM for Society',
            address: 'noreply@stemforsociety.com'
        },
        to: userEmail,
        subject: `🎉 Course Registration Confirmed - ${courseName} | STEM for Society`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Course Registration Confirmed</title>
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
                    .success-badge {
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .course-details {
                        background-color: #f0f9ff;
                        border-left: 4px solid #3b82f6;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .payment-details {
                        background-color: #f0fdf4;
                        border-left: 4px solid #10b981;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .next-steps {
                        background-color: #fef3cd;
                        border-left: 4px solid #f59e0b;
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
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">STEM FOR SOCIETY</div>
                        <div style="color: #6b7280; font-size: 14px;">Let's innovate, incubate and impact the world together!</div>
                    </div>

                    <div class="success-badge">
                        <h2 style="margin: 0; font-size: 24px;">🎉 Registration Successful!</h2>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to ${courseName}</p>
                    </div>

                    <p>Dear ${userName || 'Student'},</p>
                    <p>Congratulations! Your registration for <strong>${courseName}</strong> has been confirmed. We're excited to have you join our learning community!</p>

                    <div class="course-details">
                        <h4>📚 Course Details:</h4>
                        <p><strong>Course Name:</strong> ${courseName}</p>
                        <p><strong>Duration:</strong> ${courseDuration}</p>
                        <p><strong>Start Date:</strong> ${startDate}</p>
                        <p><strong>Registration Date:</strong> ${transactionDate.toLocaleDateString()}</p>
                    </div>

                    <div class="payment-details">
                        <h4>💳 Payment Details:</h4>
                        <p><strong>Amount Paid:</strong> ${currency.toUpperCase()} ${amount}</p>
                        <p><strong>Payment ID:</strong> ${paymentId}</p>
                        <p><strong>Transaction Date:</strong> ${transactionDate.toLocaleString()}</p>
                        <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">✅ Successful</span></p>
                    </div>

                    <div class="next-steps">
                        <h4>📋 What's Next?</h4>
                        <ul>
                            <li>Check your dashboard for course materials</li>
                            <li>Join the course WhatsApp/Discord group (link will be shared)</li>
                            <li>Download the course schedule and syllabus</li>
                            <li>Prepare for an amazing learning journey!</li>
                        </ul>
                    </div>

                    <div class="footer">
                        <p>Need help? Contact us at support@stemforsociety.com</p>
                        <p><strong>STEM for Society</strong><br>
                        Email: support@stemforsociety.com<br>
                        Website: www.stemforsociety.org</p>
                        <p>© ${new Date().getFullYear()} STEM for Society. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Course Registration Confirmed - ${courseName}. Payment of ${currency.toUpperCase()} ${amount} successful. Payment ID: ${paymentId}`
    };
}

// Mental Wellbeing Booking Email Template
function generateMentalWellbeingEmail(details: any) {
    const { userEmail, userName, amount, currency, paymentId, transactionDate, additionalDetails } = details;
    const sessionType = additionalDetails?.session_type || 'Mental Wellbeing Session';
    const sessionDate = additionalDetails?.session_date || 'To be scheduled';
    
    return {
        from: {
            name: 'STEM for Society - Wellness',
            address: 'wellness@stemforsociety.com'
        },
        to: userEmail,
        subject: `🌱 Mental Wellbeing Session Booked - Your Journey to Wellness Begins | STEM for Society`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mental Wellbeing Session Confirmed</title>
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
                        color: #8b5cf6;
                        margin-bottom: 10px;
                    }
                    .success-badge {
                        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .session-details {
                        background-color: #faf5ff;
                        border-left: 4px solid #8b5cf6;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .wellness-tips {
                        background-color: #ecfdf5;
                        border-left: 4px solid #10b981;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">STEM FOR SOCIETY</div>
                        <div style="color: #8b5cf6; font-size: 16px; font-weight: 600;">Mental Wellbeing & Wellness</div>
                    </div>

                    <div class="success-badge">
                        <h2 style="margin: 0; font-size: 24px;">🌱 Session Booked Successfully!</h2>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Your mental wellness journey begins here</p>
                    </div>

                    <p>Dear ${userName || 'Friend'},</p>
                    <p>Thank you for taking this important step towards your mental wellbeing. Your session has been successfully booked, and we're here to support you on this journey.</p>

                    <div class="session-details">
                        <h4>🧠 Session Details:</h4>
                        <p><strong>Session Type:</strong> ${sessionType}</p>
                        <p><strong>Session Date:</strong> ${sessionDate}</p>
                        <p><strong>Booking Date:</strong> ${transactionDate.toLocaleDateString()}</p>
                        <p><strong>Amount Paid:</strong> ${currency.toUpperCase()} ${amount}</p>
                        <p><strong>Payment ID:</strong> ${paymentId}</p>
                    </div>

                    <div class="wellness-tips">
                        <h4>💡 Preparing for Your Session:</h4>
                        <ul>
                            <li>Find a quiet, comfortable space for your session</li>
                            <li>Have a notebook ready to jot down insights</li>
                            <li>Come with an open mind and heart</li>
                            <li>Remember, this is your safe space to share and grow</li>
                        </ul>
                    </div>

                    <div style="background-color: #fef3cd; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>📞 Before Your Session:</h4>
                        <p>Our wellness coordinator will contact you 24 hours before your scheduled session to confirm details and provide any necessary links or instructions.</p>
                    </div>

                    <div class="footer" style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Questions about your session? Contact our wellness team at wellness@stemforsociety.com</p>
                        <p><strong>STEM for Society - Mental Wellness</strong><br>
                        Email: wellness@stemforsociety.com<br>
                        Crisis Helpline: +91-XXXX-XXXXXX (24/7)</p>
                        <p>© ${new Date().getFullYear()} STEM for Society. Your mental health matters.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Mental Wellbeing Session Booked - ${sessionType}. Payment of ${currency.toUpperCase()} ${amount} successful. Session Date: ${sessionDate}`
    };
}

// Career Counseling Email Template
function generateCareerCounselingEmail(details: any) {
    const { userEmail, userName, amount, currency, paymentId, transactionDate, additionalDetails } = details;
    const counselingType = additionalDetails?.counseling_type || 'Career Guidance Session';
    const sessionDate = additionalDetails?.session_date || 'To be scheduled';
    
    return {
        from: {
            name: 'STEM for Society - Career Services',
            address: 'careers@stemforsociety.com'
        },
        to: userEmail,
        subject: `🚀 Career Counseling Session Confirmed - Shape Your Future | STEM for Society`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Career Counseling Confirmed</title>
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
                        color: #f59e0b;
                        margin-bottom: 10px;
                    }
                    .success-badge {
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .session-details {
                        background-color: #fffbeb;
                        border-left: 4px solid #f59e0b;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">STEM FOR SOCIETY</div>
                        <div style="color: #f59e0b; font-size: 16px; font-weight: 600;">Career Guidance & Counseling</div>
                    </div>

                    <div class="success-badge">
                        <h2 style="margin: 0; font-size: 24px;">🚀 Session Confirmed!</h2>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Your career transformation starts now</p>
                    </div>

                    <p>Dear ${userName || 'Future Leader'},</p>
                    <p>Congratulations on taking this important step towards your career growth! Your career counseling session has been successfully booked.</p>

                    <div class="session-details">
                        <h4>💼 Session Details:</h4>
                        <p><strong>Counseling Type:</strong> ${counselingType}</p>
                        <p><strong>Session Date:</strong> ${sessionDate}</p>
                        <p><strong>Booking Date:</strong> ${transactionDate.toLocaleDateString()}</p>
                        <p><strong>Investment:</strong> ${currency.toUpperCase()} ${amount}</p>
                        <p><strong>Payment ID:</strong> ${paymentId}</p>
                    </div>

                    <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>📋 Prepare for Success:</h4>
                        <ul>
                            <li>Bring your updated resume/CV</li>
                            <li>Prepare questions about your career goals</li>
                            <li>Think about your interests, skills, and values</li>
                            <li>Be ready to discuss your career aspirations</li>
                        </ul>
                    </div>

                    <div class="footer" style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Questions? Contact our career services team at careers@stemforsociety.com</p>
                        <p><strong>STEM for Society - Career Services</strong><br>
                        Email: careers@stemforsociety.com<br>
                        Website: www.stemforsociety.org/careers</p>
                        <p>© ${new Date().getFullYear()} STEM for Society. Empowering your career journey.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Career Counseling Session Confirmed - ${counselingType}. Payment of ${currency.toUpperCase()} ${amount} successful. Session Date: ${sessionDate}`
    };
}

// Institution Booking Email Template
function generateInstitutionBookingEmail(details: any) {
    const { userEmail, userName, amount, currency, paymentId, transactionDate, additionalDetails } = details;
    const serviceType = additionalDetails?.service_type || 'Institution Partnership';
    const institutionName = additionalDetails?.institution_name || 'Your Institution';
    const sessionDate = additionalDetails?.session_date || 'To be scheduled';
    return {
        from: {
            name: 'STEM for Society - Partnerships',
            address: 'partnerships@stemforsociety.com'
        },
        to: userEmail,
        subject: `🏫 Institution Partnership Confirmed - Welcome to STEM for Society | ${institutionName}`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Institution Partnership Confirmed</title>
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
                        color: #d5eb9aff;
                        margin-bottom: 10px;
                    }
                    .success-badge {
                        background: linear-gradient(135deg, #aac287ff, #da7474ff);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .partnership-details {
                        background-color: #fef2f2;
                        border-left: 4px solid #26dc5dff;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">STEM FOR SOCIETY</div>
                        <div style="color: #1d36d6ff; font-size: 16px; font-weight: 600;">Institutional Partnerships</div>
                    </div>

                    <div class="success-badge">
                        <h2 style="margin: 0; font-size: 24px;">🏫 Partnership Confirmed!</h2>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to the STEM for Society family</p>
                    </div>

                    <p>Dear ${userName || 'Institution Representative'},</p>
                    <p>Welcome to STEM for Society! We're thrilled to confirm your institution's partnership with us. Together, we'll create amazing learning opportunities for students.</p>

                    <div class="partnership-details">
                        <h4>🤝 Partnership Details:</h4>
                        <p><strong>Institution:</strong> ${institutionName}</p>
                        <p><strong>Service Type:</strong> ${serviceType}</p>
                        <p><strong>Session Date:</strong> ${sessionDate}</p>
                        <p><strong>Partnership Date:</strong> ${transactionDate.toLocaleDateString()}</p>
                        <p><strong>Investment:</strong> ${currency.toUpperCase()} ${amount}</p>
                        <p><strong>Payment ID:</strong> ${paymentId}</p>
                    </div>

                    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>📋 Next Steps:</h4>
                        <ul>
                            <li>Our partnership team will contact you within 24 hours</li>
                            <li>Schedule a detailed onboarding session</li>
                            <li>Access to institution dashboard and resources</li>
                            <li>Begin planning your first program</li>
                        </ul>
                    </div>

                    <div class="footer" style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Partnership questions? Contact us at partnerships@stemforsociety.com</p>
                        <p><strong>STEM for Society - Institutional Partnerships</strong><br>
                        Email: partnerships@stemforsociety.com<br>
                        Website: www.stemforsociety.org/institutions</p>
                        <p>© ${new Date().getFullYear()} STEM for Society. Building educational partnerships.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Institution Partnership Confirmed - ${serviceType} for ${institutionName}. Payment of ${currency.toUpperCase()} ${amount} successful.`
    };
}

// General Payment Email Template (fallback)
function generateGeneralPaymentEmail(details: any) {
    const { userEmail, userName, amount, currency, paymentId, transactionDate } = details;
    
    return {
        from: {
            name: 'STEM for Society',
            address: 'noreply@stemforsociety.com'
        },
        to: userEmail,
        subject: `✅ Payment Successful - Thank You! | STEM for Society`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Successful</title>
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
                    .success-badge {
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 30px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-badge">
                        <h2 style="margin: 0; font-size: 24px;">✅ Payment Successful!</h2>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your payment</p>
                    </div>

                    <p>Dear ${userName || 'Valued Customer'},</p>
                    <p>Your payment has been successfully processed. Thank you for choosing STEM for Society!</p>

                    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>💳 Payment Details:</h4>
                        <p><strong>Amount:</strong> ${currency.toUpperCase()} ${amount}</p>
                        <p><strong>Payment ID:</strong> ${paymentId}</p>
                        <p><strong>Date:</strong> ${transactionDate.toLocaleString()}</p>
                        <p><strong>Status:</strong> <span style="color: #10b981;">✅ Successful</span></p>
                    </div>

                    <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                        <p>Need help? Contact us at support@stemforsociety.com</p>
                        <p>© ${new Date().getFullYear()} STEM for Society. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Payment Successful! Amount: ${currency.toUpperCase()} ${amount}, Payment ID: ${paymentId}`
    };
}