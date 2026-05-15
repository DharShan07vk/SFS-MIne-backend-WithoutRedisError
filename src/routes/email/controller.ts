import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";
const nodemailer = require("nodemailer");
import { userOtp, userTable } from "../../db/schema/users";
import { and, eq } from "drizzle-orm";
import * as path from "path";
const { randomInt } = require("crypto");

const email = process.env.EMAIL;
const pass = process.env.APP_PASS;

const BRAND_PRIMARY = "#2f8ef7";
const BRAND_DARK = "#0b3f8c";
const BRAND_BG = "#f6f9fc";
const logoCid = "sfs-logo";
const logoPath = path.join(__dirname, "..", "..", "assets", "logo.png");

function getLogoAttachment() {
    return {
        filename: "logo.png",
        path: logoPath,
        cid: logoCid,
    };
}

function renderBrandHeader(subtitle?: string) {
    return `
        <div class="header">
            <img class="logo-img" src="cid:${logoCid}" alt="STEM for Society" style="width:84px;height:auto;display:block;margin:0 auto 12px;" />
            <div class="brand-title" style="font-size:20px;font-weight:700;color:${BRAND_DARK};letter-spacing:0.8px;">STEM FOR SOCIETY</div>
            ${subtitle ? `<div class="tagline" style="color:#5f6b7a;font-size:13px;margin-top:4px;">${escapeHtml(subtitle)}</div>` : ""}
        </div>
    `;
}

type EmailShellOptions = {
        title: string;
        subtitle?: string;
        preheader?: string;
        contentHtml: string;
        footerHtml?: string;
};

function renderEmailShell({ title, subtitle, preheader, contentHtml, footerHtml }: EmailShellOptions) {
        const safePreheader = escapeHtml(preheader || title);
        const safeTitle = escapeHtml(title);
        const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";
        const footer = footerHtml || `
                <div class="footer">
                        <div>Need help? Contact us at support@stemforsociety.com</div>
                        <div>STEM for Society · www.stemforsociety.org</div>
                        <div>© ${new Date().getFullYear()} STEM for Society. All rights reserved.</div>
                </div>
        `;

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${safeTitle}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: "Helvetica Neue", Helvetica, Arial, "Segoe UI", sans-serif;
                        background-color: ${BRAND_BG};
                        color: #1f2937;
                    }
                    .preheader {
                        display: none !important;
                        visibility: hidden;
                        opacity: 0;
                        height: 0;
                        width: 0;
                        overflow: hidden;
                    }
                    .wrapper {
                        width: 100%;
                        padding: 24px 12px 40px;
                        background-color: ${BRAND_BG};
                    }
                    .card {
                        max-width: 640px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 16px;
                        padding: 32px 36px;
                        box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .logo-img {
                        width: 72px;
                        height: auto;
                        display: block;
                        margin: 0 auto 10px;
                    }
                    .brand-title {
                        font-size: 13px;
                        font-weight: 700;
                        color: ${BRAND_DARK};
                        letter-spacing: 3px;
                    }
                    .subtitle {
                        font-size: 13px;
                        color: #64748b;
                        margin-top: 6px;
                    }
                    .title {
                        font-size: 22px;
                        font-weight: 700;
                        margin: 8px 0 16px;
                        text-align: center;
                        color: #0f172a;
                    }
                    .lead {
                        font-size: 15px;
                        color: #334155;
                    }
                    .section {
                        background: #f8fafc;
                        border: 1px solid #e5e7eb;
                        border-radius: 12px;
                        padding: 16px 18px;
                        margin: 16px 0;
                    }
                    .section-title {
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 0.14em;
                        color: #64748b;
                        margin: 0 0 10px;
                    }
                    .kv-row {
                        font-size: 14px;
                        margin: 6px 0;
                    }
                    .kv-label {
                        color: #64748b;
                    }
                    .kv-value {
                        font-weight: 600;
                        color: #111827;
                    }
                    .otp-box {
                        text-align: center;
                        background: #eef5ff;
                        border: 1px solid #cfe1ff;
                        border-radius: 14px;
                        padding: 18px 16px;
                        margin: 18px 0;
                    }
                    .otp-label {
                        font-size: 12px;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.18em;
                    }
                    .otp-code {
                        font-size: 32px;
                        letter-spacing: 6px;
                        font-weight: 700;
                        color: ${BRAND_DARK};
                        margin: 8px 0 6px;
                    }
                    .muted {
                        color: #64748b;
                        font-size: 13px;
                    }
                    .btn {
                        background: ${BRAND_PRIMARY};
                        color: #ffffff !important;
                        text-decoration: none;
                        border-radius: 10px;
                        padding: 12px 18px;
                        display: inline-block;
                        font-weight: 600;
                    }
                    .divider {
                        height: 1px;
                        background: #e5e7eb;
                        margin: 22px 0;
                    }
                    .footer {
                        text-align: center;
                        font-size: 12px;
                        color: #94a3b8;
                        margin-top: 22px;
                    }
                    .footer a {
                        color: ${BRAND_PRIMARY};
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <span class="preheader">${safePreheader}</span>
                <div class="wrapper">
                    <div class="card">
                        <div class="header">
                            <img class="logo-img" src="cid:${logoCid}" alt="STEM for Society" />
                            <div class="brand-title">STEM FOR SOCIETY</div>
                            ${subtitle ? `<div class="subtitle">${safeSubtitle}</div>` : ""}
                        </div>
                        <div class="title">${safeTitle}</div>
                        ${contentHtml}
                        ${footer}
                    </div>
                </div>
            </body>
            </html>
        `;
}


let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: email,
        pass: pass, 
    },
});

type TrainingCancellationNoticeInput = {
    userEmail: string;
    userName?: string | null;
    courseName: string;
    startDate?: string | Date | null;
};

function generateTrainingCancellationEmail(details: TrainingCancellationNoticeInput) {
    const { userEmail, userName, courseName, startDate } = details;
    const startDateText = startDate
        ? new Date(startDate).toLocaleString()
        : "To be announced";

    const contentHtml = `
        <p class="lead">Dear ${escapeHtml(userName || "Student")},</p>
        <p class="lead">Your course <strong>${escapeHtml(courseName)}</strong> is currently discontinued.</p>
        <div class="section">
          <div class="section-title">What happens next</div>
          <p class="lead" style="margin: 0;">We may continue on the same day, reschedule, or process a refund. We will update you shortly.</p>
        </div>
        <div class="section">
          <div class="section-title">Course details</div>
          <div class="kv-row"><span class="kv-label">Course</span> <span class="kv-value">${escapeHtml(courseName)}</span></div>
          <div class="kv-row"><span class="kv-label">Start date</span> <span class="kv-value">${escapeHtml(startDateText)}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Need help?</div>
          <p class="lead" style="margin: 0;">Please contact support@stemforsociety.com for assistance.</p>
        </div>
    `;

    return {
        from: {
            name: "STEM for Society",
            address: "noreply@stemforsociety.com",
        },
        to: userEmail,
        subject: `Course update: ${courseName} | STEM for Society`,
        html: renderEmailShell({
            title: "Course update",
            subtitle: "Course discontinued",
            preheader: `Update for ${courseName}`,
            contentHtml,
        }),
        text: `Course update: ${courseName} is currently discontinued. It may continue on the same day, be rescheduled, or be refunded.`,
        attachments: [getLogoAttachment()],
    };
}

export async function sendTrainingCancellationNotice(
    details: TrainingCancellationNoticeInput,
) {
    const mailOptions = generateTrainingCancellationEmail(details);
    await transporter.sendMail(mailOptions);
}


export const sendOTP: RequestHandler = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;
        const phone = req.body.mobile;
        const institutionName = req.body.institutionName;
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }
        
        const otp = randomInt(100000, 1000000);
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
            text: `Your OTP for STEM for Society institution registration is: ${otp}. This OTP will expire in 10 minutes.`,
            attachments: [getLogoAttachment()]
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
        
        const otp = randomInt(100000, 1000000);
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
            text: `Your OTP for STEM for Society Account Password Reset is: ${otp}. This OTP will expire in 10 minutes.`,
            attachments: [getLogoAttachment()]
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

function escapeHtml(value: unknown): string {
    if (value === null || value === undefined) return "";
    const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };
    return String(value).replace(/[&<>"']/g, (char) => map[char]);
}

// Template for Institution Registration OTP
function generateInstitutionRegistrationOTPTemplate(otp: number, email?: string, phone?: string, institutionName?: string): string {
        const detailsSection = email
                ? `
                    <div class="section">
                        <div class="section-title">Registration details</div>
                        <div class="kv-row"><span class="kv-label">Institution</span> <span class="kv-value">${escapeHtml(institutionName || "To be provided")}</span></div>
                        <div class="kv-row"><span class="kv-label">Contact number</span> <span class="kv-value">${escapeHtml(phone || "To be provided")}</span></div>
                        <div class="kv-row"><span class="kv-label">Email</span> <span class="kv-value">${escapeHtml(maskEmail(email))}</span></div>
                        <div class="kv-row"><span class="kv-label">Date</span> <span class="kv-value">${new Date().toLocaleDateString()}</span></div>
                    </div>
                `
                : "";

        const contentHtml = `
                <p class="lead">Thank you for choosing STEM for Society. Use the verification code below to confirm your email and continue your institution registration.</p>
                <div class="otp-box">
                    <div class="otp-label">Verification code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="muted">Expires in 10 minutes</div>
                </div>
                ${detailsSection}
                <div class="section">
                    <div class="section-title">Next steps</div>
                    <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 14px;">
                        <li>Enter the code to verify your email</li>
                        <li>Complete your institution profile</li>
                        <li>Upload required documentation</li>
                        <li>Our team will review and approve your registration</li>
                    </ul>
                </div>
                <div class="section">
                    <div class="section-title">Security notice</div>
                    <div class="muted">If you did not request this registration, please ignore this email or contact support.</div>
                </div>
        `;

        const footerHtml = `
                <div class="footer">
                    <div>Need help with registration? support@stemforsociety.com</div>
                    <div>STEM for Society · www.stemforsociety.org</div>
                    <div>© ${new Date().getFullYear()} STEM for Society. All rights reserved.</div>
                </div>
        `;

        return renderEmailShell({
                title: "Verify your email",
                subtitle: "Institution registration",
                preheader: "Use this code to verify your institution registration email",
                contentHtml,
                footerHtml,
        });
}

// Template for Password Reset OTP
function generatePasswordResetOTPTemplate(otp: number, email: string): string {
        const contentHtml = `
                <p class="lead">We received a request to reset the password for your account associated with <strong>${escapeHtml(maskEmail(email))}</strong>.</p>
                <p class="lead">Use the verification code below to continue.</p>
                <div class="otp-box">
                    <div class="otp-label">Password reset code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="muted">Expires in 10 minutes</div>
                </div>
                <div class="section">
                    <div class="section-title">Reset details</div>
                    <div class="kv-row"><span class="kv-label">Account email</span> <span class="kv-value">${escapeHtml(maskEmail(email))}</span></div>
                    <div class="kv-row"><span class="kv-label">Request time</span> <span class="kv-value">${new Date().toLocaleString()}</span></div>
                </div>
                <div class="section">
                    <div class="section-title">How to reset</div>
                    <ol style="margin: 0; padding-left: 18px; color: #334155; font-size: 14px;">
                        <li>Enter the code in the reset form</li>
                        <li>Create a new, strong password</li>
                        <li>Confirm and save your new password</li>
                    </ol>
                </div>
                <div class="section">
                    <div class="section-title">Security notice</div>
                    <div class="muted">If you did not request this reset, please ignore this email or contact support.</div>
                </div>
        `;

        const footerHtml = `
                <div class="footer">
                    <div>Need assistance? support@stemforsociety.com</div>
                    <div>STEM for Society · www.stemforsociety.org</div>
                    <div>© ${new Date().getFullYear()} STEM for Society. All rights reserved.</div>
                </div>
        `;

        return renderEmailShell({
                title: "Password reset verification",
                subtitle: "Secure your account",
                preheader: "Use this code to reset your password",
                contentHtml,
                footerHtml,
        });
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
        // schedule reminders 24 hours and 1 hour before the class if startDate provided
        try {
            const startISO = startDate || additionalDetailsStartFromBody(req.body);
            if (startISO) {
                scheduleCourseReminders({ userEmail, userName, courseName, startISO });
            }
        } catch (sErr) {
            console.error('Error scheduling reminders:', sErr);
        }
        
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
    // Attempt to collect a meeting link and meeting start/end for .ics
    const meetLink = additionalDetails?.meet_link || additionalDetails?.meetLink || '';
    const startISO = additionalDetails?.start_date || transactionDate.toISOString();
    const startObj = new Date(startISO);
    const durationMinutes = Number(additionalDetails?.durationMinutes || 60);
    const endObj = new Date(startObj.getTime() + durationMinutes * 60 * 1000);
    const startUTC = formatDateToICS(startObj);
    const endUTC = formatDateToICS(endObj);
    const icsContent = generateICS({ courseName, startUTC, endUTC, meetLink, userName });

    const meetSection = meetLink
        ? `
            <div class="section">
              <div class="section-title">Join live class</div>
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;">Use the button below to join the session at the scheduled time.</p>
              <a class="btn" href="${escapeHtml(meetLink)}">Join the session</a>
              <div class="muted" style="margin-top: 10px;">A calendar invite (.ics) is attached to this email.</div>
            </div>
        `
        : "";

    const contentHtml = `
        <p class="lead">Dear ${escapeHtml(userName || "Student")},</p>
        <p class="lead">Your registration for <strong>${escapeHtml(courseName)}</strong> is confirmed. We are excited to have you join the course.</p>
        <div class="section">
          <div class="section-title">Course details</div>
          <div class="kv-row"><span class="kv-label">Course</span> <span class="kv-value">${escapeHtml(courseName)}</span></div>
          <div class="kv-row"><span class="kv-label">Duration</span> <span class="kv-value">${escapeHtml(courseDuration)}</span></div>
          <div class="kv-row"><span class="kv-label">Start date</span> <span class="kv-value">${escapeHtml(startDate)}</span></div>
          <div class="kv-row"><span class="kv-label">Registration date</span> <span class="kv-value">${transactionDate.toLocaleDateString()}</span></div>
        </div>
        ${meetSection}
        <div class="section">
          <div class="section-title">Payment details</div>
          <div class="kv-row"><span class="kv-label">Amount paid</span> <span class="kv-value">${escapeHtml(currency.toUpperCase())} ${escapeHtml(amount)}</span></div>
          <div class="kv-row"><span class="kv-label">Payment ID</span> <span class="kv-value">${escapeHtml(paymentId)}</span></div>
          <div class="kv-row"><span class="kv-label">Transaction date</span> <span class="kv-value">${transactionDate.toLocaleString()}</span></div>
          <div class="kv-row"><span class="kv-label">Status</span> <span class="kv-value">Successful</span></div>
        </div>
        <div class="section">
          <div class="section-title">Next steps</div>
          <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 14px;">
            <li>Check your dashboard for course materials</li>
            <li>Join the course community group when you receive the invite</li>
            <li>Download the course schedule and syllabus</li>
          </ul>
        </div>
    `;

    const footerHtml = `
        <div class="footer">
          <div>Questions? support@stemforsociety.com</div>
          <div>STEM for Society · www.stemforsociety.org</div>
          <div>© ${new Date().getFullYear()} STEM for Society. All rights reserved.</div>
        </div>
    `;

    return {
        from: {
            name: 'STEM for Society',
            address: 'noreply@stemforsociety.com'
        },
        to: userEmail,
        subject: `Course Registration Confirmed - ${courseName} | STEM for Society`,
        html: renderEmailShell({
            title: "Course registration confirmed",
            subtitle: "Course enrollment",
            preheader: `Your registration for ${courseName} is confirmed`,
            contentHtml,
            footerHtml,
        }),
        text: `Course Registration Confirmed - ${courseName}. Payment of ${currency.toUpperCase()} ${amount} successful. Payment ID: ${paymentId}`,
        attachments: [
            getLogoAttachment(),
            {
                filename: `${courseName.replace(/[^a-z0-9]/gi, '_')}.ics`,
                content: icsContent,
                contentType: 'text/calendar; method=REQUEST; charset=UTF-8'
            }
        ]
    };
}

// Helper: format JS Date to ICS UTC timestamp (YYYYMMDDTHHMMSSZ)
function formatDateToICS(date: Date) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const yyyy = date.getUTCFullYear();
        const mm = pad(date.getUTCMonth() + 1);
        const dd = pad(date.getUTCDate());
        const hh = pad(date.getUTCHours());
        const min = pad(date.getUTCMinutes());
        const ss = pad(date.getUTCSeconds());
        return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

function generateICS({
    courseName,
    startUTC,
    endUTC,
    meetLink,
    userName
}: {
    courseName: string;
    startUTC: string;
    endUTC: string;
    meetLink?: string;
    userName?: string;
}) {
    return `
BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@yourdomain.com
SUMMARY:${courseName} – Live Class
DTSTART:${startUTC}
DTEND:${endUTC}
DESCRIPTION:Hi ${userName || ''},\\n\\nJoin the live class using Google Meet:\\n${meetLink}
LOCATION:Online
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
`.trim();
}

// Mental Wellbeing Booking Email Template
function generateMentalWellbeingEmail(details: any) {
    const { userEmail, userName, amount, currency, paymentId, transactionDate, additionalDetails } = details;
    const sessionType = additionalDetails?.session_type || 'Mental Wellbeing Session';
    const sessionDate = additionalDetails?.session_date || 'To be scheduled';
    
    const contentHtml = `
        <p class="lead">Dear ${escapeHtml(userName || "Guest")},</p>
        <p class="lead">Your mental wellbeing session is confirmed. We are here to support you throughout this journey.</p>
        <div class="section">
          <div class="section-title">Session details</div>
          <div class="kv-row"><span class="kv-label">Session type</span> <span class="kv-value">${escapeHtml(sessionType)}</span></div>
          <div class="kv-row"><span class="kv-label">Session date</span> <span class="kv-value">${escapeHtml(sessionDate)}</span></div>
          <div class="kv-row"><span class="kv-label">Booking date</span> <span class="kv-value">${transactionDate.toLocaleDateString()}</span></div>
          <div class="kv-row"><span class="kv-label">Amount paid</span> <span class="kv-value">${escapeHtml(currency.toUpperCase())} ${escapeHtml(amount)}</span></div>
          <div class="kv-row"><span class="kv-label">Payment ID</span> <span class="kv-value">${escapeHtml(paymentId)}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Preparing for your session</div>
          <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 14px;">
            <li>Choose a quiet, comfortable space</li>
            <li>Have a notebook ready for insights</li>
            <li>Come with an open mind and heart</li>
          </ul>
        </div>
        <div class="section">
          <div class="section-title">Before the session</div>
          <div class="muted">Our coordinator will contact you 24 hours before the session with links and instructions.</div>
        </div>
    `;

    const footerHtml = `
        <div class="footer">
          <div>Wellness support: wellness@stemforsociety.com</div>
          <div>STEM for Society · www.stemforsociety.org</div>
          <div>© ${new Date().getFullYear()} STEM for Society. Your mental health matters.</div>
        </div>
    `;

    return {
        from: {
            name: 'STEM for Society - Wellness',
            address: 'wellness@stemforsociety.com'
        },
        to: userEmail,
        subject: `Mental Wellbeing Session Confirmed | STEM for Society`,
        html: renderEmailShell({
            title: "Session booked successfully",
            subtitle: "Mental wellbeing",
            preheader: "Your session is confirmed",
            contentHtml,
            footerHtml,
        }),
        text: `Mental Wellbeing Session Booked - ${sessionType}. Payment of ${currency.toUpperCase()} ${amount} successful. Session Date: ${sessionDate}`,
        attachments: [getLogoAttachment()]
    };
}

// Career Counseling Email Template
function generateCareerCounselingEmail(details: any) {
    const { userEmail, userName, amount, currency, paymentId, transactionDate, additionalDetails } = details;
    const counselingType = additionalDetails?.counseling_type || 'Career Guidance Session';
    const sessionDate = additionalDetails?.session_date || 'To be scheduled';
    
    const contentHtml = `
        <p class="lead">Dear ${escapeHtml(userName || "Guest")},</p>
        <p class="lead">Your career counseling session is confirmed. We look forward to supporting your next step.</p>
        <div class="section">
          <div class="section-title">Session details</div>
          <div class="kv-row"><span class="kv-label">Counseling type</span> <span class="kv-value">${escapeHtml(counselingType)}</span></div>
          <div class="kv-row"><span class="kv-label">Session date</span> <span class="kv-value">${escapeHtml(sessionDate)}</span></div>
          <div class="kv-row"><span class="kv-label">Booking date</span> <span class="kv-value">${transactionDate.toLocaleDateString()}</span></div>
          <div class="kv-row"><span class="kv-label">Investment</span> <span class="kv-value">${escapeHtml(currency.toUpperCase())} ${escapeHtml(amount)}</span></div>
          <div class="kv-row"><span class="kv-label">Payment ID</span> <span class="kv-value">${escapeHtml(paymentId)}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Prepare for the session</div>
          <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 14px;">
            <li>Bring your updated resume or portfolio</li>
            <li>List your top career questions</li>
            <li>Reflect on your goals and strengths</li>
          </ul>
        </div>
    `;

    const footerHtml = `
        <div class="footer">
          <div>Career services: careers@stemforsociety.com</div>
          <div>STEM for Society · www.stemforsociety.org</div>
          <div>© ${new Date().getFullYear()} STEM for Society. Empowering your career journey.</div>
        </div>
    `;

    return {
        from: {
            name: 'STEM for Society - Career Services',
            address: 'careers@stemforsociety.com'
        },
        to: userEmail,
        subject: `Career Counseling Confirmed | STEM for Society`,
        html: renderEmailShell({
            title: "Career counseling confirmed",
            subtitle: "Career guidance",
            preheader: "Your career counseling session is confirmed",
            contentHtml,
            footerHtml,
        }),
        text: `Career Counseling Session Confirmed - ${counselingType}. Payment of ${currency.toUpperCase()} ${amount} successful. Session Date: ${sessionDate}`,
        attachments: [getLogoAttachment()]
    };
}

// Institution Booking Email Template
function generateInstitutionBookingEmail(details: any) {
    const { userEmail, userName, amount, currency, paymentId, transactionDate, additionalDetails } = details;
    const serviceType = additionalDetails?.service_type || 'Institution Partnership';
    const institutionName = additionalDetails?.institution_name || 'Your Institution';
    const sessionDate = additionalDetails?.session_date || 'To be scheduled';
    const contentHtml = `
        <p class="lead">Dear ${escapeHtml(userName || "Institution Representative")},</p>
        <p class="lead">Your institution partnership is confirmed. We look forward to building impactful programs together.</p>
        <div class="section">
          <div class="section-title">Partnership details</div>
          <div class="kv-row"><span class="kv-label">Institution</span> <span class="kv-value">${escapeHtml(institutionName)}</span></div>
          <div class="kv-row"><span class="kv-label">Service type</span> <span class="kv-value">${escapeHtml(serviceType)}</span></div>
          <div class="kv-row"><span class="kv-label">Session date</span> <span class="kv-value">${escapeHtml(sessionDate)}</span></div>
          <div class="kv-row"><span class="kv-label">Partnership date</span> <span class="kv-value">${transactionDate.toLocaleDateString()}</span></div>
          <div class="kv-row"><span class="kv-label">Investment</span> <span class="kv-value">${escapeHtml(currency.toUpperCase())} ${escapeHtml(amount)}</span></div>
          <div class="kv-row"><span class="kv-label">Payment ID</span> <span class="kv-value">${escapeHtml(paymentId)}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Next steps</div>
          <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 14px;">
            <li>Our partnership team will contact you within 24 hours</li>
            <li>Schedule onboarding and set goals</li>
            <li>Receive access to the institution dashboard</li>
          </ul>
        </div>
    `;

    const footerHtml = `
        <div class="footer">
          <div>Partnerships: partnerships@stemforsociety.com</div>
          <div>STEM for Society · www.stemforsociety.org/institutions</div>
          <div>© ${new Date().getFullYear()} STEM for Society. Building educational partnerships.</div>
        </div>
    `;

    return {
        from: {
            name: 'STEM for Society - Partnerships',
            address: 'partnerships@stemforsociety.com'
        },
        to: userEmail,
        subject: `Institution Partnership Confirmed | ${institutionName}`,
        html: renderEmailShell({
            title: "Partnership confirmed",
            subtitle: "Institutional partnerships",
            preheader: `Partnership confirmed for ${institutionName}`,
            contentHtml,
            footerHtml,
        }),
        text: `Institution Partnership Confirmed - ${serviceType} for ${institutionName}. Payment of ${currency.toUpperCase()} ${amount} successful.`,
        attachments: [getLogoAttachment()]
    };
}

// General Payment Email Template (fallback)
function generateGeneralPaymentEmail(details: any) {
    const { userEmail, userName, amount, currency, paymentId, transactionDate } = details;
    
    const contentHtml = `
        <p class="lead">Dear ${escapeHtml(userName || "Customer")},</p>
        <p class="lead">Your payment has been successfully processed.</p>
        <div class="section">
          <div class="section-title">Payment details</div>
          <div class="kv-row"><span class="kv-label">Amount</span> <span class="kv-value">${escapeHtml(currency.toUpperCase())} ${escapeHtml(amount)}</span></div>
          <div class="kv-row"><span class="kv-label">Payment ID</span> <span class="kv-value">${escapeHtml(paymentId)}</span></div>
          <div class="kv-row"><span class="kv-label">Date</span> <span class="kv-value">${transactionDate.toLocaleString()}</span></div>
          <div class="kv-row"><span class="kv-label">Status</span> <span class="kv-value">Successful</span></div>
        </div>
    `;

    return {
        from: {
            name: 'STEM for Society',
            address: 'noreply@stemforsociety.com'
        },
        to: userEmail,
        subject: `Payment Successful | STEM for Society`,
        html: renderEmailShell({
            title: "Payment successful",
            subtitle: "Payment confirmation",
            preheader: `Payment received: ${currency.toUpperCase()} ${amount}`,
            contentHtml,
        }),
        text: `Payment Successful! Amount: ${currency.toUpperCase()} ${amount}, Payment ID: ${paymentId}`,
        attachments: [getLogoAttachment()]
    };
}

// Try to read a start ISO string from different possible request body shapes
function additionalDetailsStartFromBody(body: any): string | null {
    if (!body) return null;
    if (body.startDate) return body.startDate;
    if (body.start_date) return body.start_date;
    if (body.additionalDetails && (body.additionalDetails.start_date || body.additionalDetails.startDate)) {
        return body.additionalDetails.start_date || body.additionalDetails.startDate;
    }
    return null;
}

// Generate a lightweight reminder email (used for both 24h and 1h reminders)
function generateCourseReminderEmail({ userEmail, userName, courseName, startISO, whenLabel }: any) {
    const startPretty = startISO ? new Date(startISO).toLocaleString() : 'Scheduled time';
    return {
        from: {
            name: 'STEM for Society',
            address: 'noreply@stemforsociety.com'
        },
        to: userEmail,
        subject: `Reminder: ${courseName} starts ${whenLabel}`,
                html: renderEmailShell({
                        title: "Course reminder",
                        subtitle: "Upcoming session",
                        preheader: `Reminder: ${courseName} starts ${whenLabel}`,
                        contentHtml: `
                                <p class="lead">Hi ${escapeHtml(userName || "Student")},</p>
                                <p class="lead">This is a reminder that <strong>${escapeHtml(courseName)}</strong> starts <strong>${escapeHtml(whenLabel)}</strong> at <strong>${escapeHtml(startPretty)}</strong>.</p>
                                <div class="section">
                                    <div class="section-title">Be ready</div>
                                    <div class="muted">Please be prepared to join the class on time.</div>
                                </div>
                        `,
                }),
                text: `Reminder: ${courseName} starts ${whenLabel} at ${startPretty}`,
                attachments: [getLogoAttachment()]
    };
}

// Schedule two reminders: 24 hours and 1 hour before the given ISO start time.
// Uses in-process timers; for production consider persistent job queues (BullMQ, agenda, etc.).
function scheduleCourseReminders({ userEmail, userName, courseName, startISO }: { userEmail: string; userName?: string; courseName: string; startISO: string; }) {
    const start = new Date(startISO);
    if (isNaN(start.getTime())) {
        console.warn('Invalid startISO for scheduling reminders:', startISO);
        return;
    }

    const now = Date.now();
    const startTs = start.getTime();

    const reminders = [
        { whenLabel: 'in 24 hours', msBefore: 24 * 60 * 60 * 1000 },
        { whenLabel: 'in 1 hour', msBefore: 60 * 60 * 1000 }
    ];

    for (const r of reminders) {
        const sendAt = startTs - r.msBefore;
        const delay = sendAt - now;
        if (delay <= 0) {
            // time passed — send immediately
            const mail = generateCourseReminderEmail({ userEmail, userName, courseName, startISO, whenLabel: r.whenLabel });
                transporter.sendMail(mail).then(() => console.log(`Sent immediate ${r.whenLabel} reminder to ${userEmail}`)).catch((err: any) => console.error('Reminder send error:', err));
        } else if (delay > 0) {
            // Protect against setTimeout limits (~24.8 days) and extremely long delays
            const MAX_TIMEOUT = 0x7FFFFFFF; // ~24.8 days
            if (delay > MAX_TIMEOUT) {
                // If too far in future, schedule a shorter interim timer to re-evaluate later
                // Here we schedule a timer for MAX_TIMEOUT and then recursively call scheduleCourseReminders again
                setTimeout(() => scheduleCourseReminders({ userEmail, userName, courseName, startISO }), MAX_TIMEOUT);
            } else {
                setTimeout(() => {
                    const mail = generateCourseReminderEmail({ userEmail, userName, courseName, startISO, whenLabel: r.whenLabel });
                    transporter.sendMail(mail).then(() => console.log(`Sent ${r.whenLabel} reminder to ${userEmail}`)).catch((err: any) => console.error('Reminder send error:', err));
                }, delay);
                console.log(`Scheduled ${r.whenLabel} reminder for ${userEmail} (in ${Math.round(delay / 1000)}s)`);
            }
        }
    }
}