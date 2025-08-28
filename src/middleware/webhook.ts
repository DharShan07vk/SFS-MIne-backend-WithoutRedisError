import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { RZPY_WH_SECRET } from "../razporpay";

// Custom middleware to capture raw body for webhook verification
export const webhookBodyParser = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/verify") {
    let data = "";
    let rawData = Buffer.alloc(0);

    req.setEncoding("utf8");
    
    req.on("data", (chunk) => {
      data += chunk;
      rawData = Buffer.concat([rawData, Buffer.from(chunk)]);
    });

    req.on("end", () => {
      try {
        // Store both string and buffer versions
        (req as any).rawBody = rawData;
        (req as any).bodyString = data;
        req.body = JSON.parse(data);
        
        console.log("[WH Middleware]: Raw body captured");
        console.log("[WH Middleware]: Data length:", data.length);
        console.log("[WH Middleware]: Buffer length:", rawData.length);
        
        next();
      } catch (error) {
        console.error("[WH Middleware]: Error parsing body:", error);
        res.status(400).json({ error: "Invalid JSON" });
      }
    });

    req.on("error", (error) => {
      console.error("[WH Middleware]: Request error:", error);
      res.status(400).json({ error: "Request error" });
    });
  } else {
    next();
  }
};

// Alternative verification function
export const verifyRazorpaySignature = (
  body: string | Buffer,
  signature: string,
  secret: string
): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    
    console.log("[Custom Verify]: Expected:", expectedSignature);
    console.log("[Custom Verify]: Received:", signature);
    console.log("[Custom Verify]: Match:", expectedSignature === signature);
    
    return expectedSignature === signature;
  } catch (error) {
    console.error("[Custom Verify]: Error:", error);
    return false;
  }
};
