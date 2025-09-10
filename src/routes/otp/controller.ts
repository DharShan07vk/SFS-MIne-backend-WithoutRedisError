import { Request, RequestHandler, Response } from "express";
import { db } from "../../db/connection";
const nodemailer = require("nodemailer");
import { userOtp } from "../../db/schema/users";
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
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = currentTime + 600; // OTP valid for 10 minutes
        
        const mailOptions = {
            from: "randompurposeuse07@gmail.com",
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
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

        res.json({ message: "OTP verified successfully" });
        
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
        return;
    }
};
