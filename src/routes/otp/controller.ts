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
            //from: "randompurposeuse07@gmail.com",
            from: {
                name: 'STEM for Society',
                address: 'noreply@stemforsociety.com'
            },
            to: email,
            subject: 'Verify Your Email - OTP for Institution Registration',
            html: generateOTPEmailTemplate(otp, email, phone , institutionName),
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
            message: "OTP sent successfully",
            data: otpRecord
        });
        
        console.log("OTP sent successfully");
        
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
        return;
    }
    
};

export const sendOTPReset : RequestHandler = async (req: Request, res: Response) => {
try {
        const email = req.body.email;
        const phone = req.body.mobile;
        const institutionName = req.body.institutionName;
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }
        const isexist = await db.select().from(userTable).where(eq(userTable.email,email));
        if(isexist.length === 0){
            res.status(400).json({ error: "Email does not exist" });
            return;
        }
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = currentTime + 600; // OTP valid for 10 minutes
        
        const mailOptions = {
            //from: "randompurposeuse07@gmail.com",
            from: {
                name: 'STEM for Society',
                address: 'noreply@stemforsociety.com'
            },
            to: email,
            subject: 'Verify Your Email - OTP for Institution Registration',
            //html: generateOTPEmailTemplate(otp, email, phone , institutionName),
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
            message: "OTP sent successfully for reset password",
            data: otpRecord
        });
        
        console.log("OTP sent successfully");
        
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
        return;
    }
}

function maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.charAt(username.length - 1)}`
      : `${username.charAt(0)}*`;
    return `${maskedUsername}@${domain}`;
  }
function generateOTPEmailTemplate(otp: number, email?: string ,  phone?: string , institutionName?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - STEM for Society</title>
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
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
            background-color: #f1f5f9;
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
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">STEM FOR SOCIETY</div>
            <div class="tagline">Let's innovate, incubate and impact the world together!</div>
          </div>

          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering your institution with STEM for Society. To complete your registration process, please verify your email address using the OTP below:</p>

          <div class="otp-box">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 14px; opacity: 0.9;">Valid for 10 minutes</div>
          </div>

          ${email ? `
          <div class="info-section">
            <h4>Registration Details:</h4>
            <div class="info-item"><strong>Institution Name:</strong> ${institutionName || 'N/A'}</div>
            <div class="info-item"><strong>Contact Number:</strong> ${phone || 'N/A'}</div>
            <div class="info-item"><strong>Verification Email:</strong> ${maskEmail(email)}</div>
          </div>
          ` : ''}

          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>


          <div class="footer">
            <p>If you have any questions or need assistance, please contact our support team.</p>
            <p><strong>STEM for Society</strong><br>
            Email: support@stemforsociety.com<br>
            Website: www.stemforsociety.com</p>
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

        // Optional: Delete the OTP record after successful verification
        // This prevents the same OTP from being used multiple times
        await db.delete(userOtp).where(eq(userOtp.email, email));
        console.log("Otp Deleted after verification:", email);
        res.json({ message: "OTP verified successfully" });
        
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
        return;
    }
};