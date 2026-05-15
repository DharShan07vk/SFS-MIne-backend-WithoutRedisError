import "dotenv/config";

function getArg(flag: string, fallback?: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function getKeys() {
  const mode = (process.env.PAYMENT_MODE || "test").toLowerCase();
  const keyId =
    mode === "live" ? process.env.RZPY_LIVE_KEYID : process.env.RZPY_TEST_KEYID;
  const keySecret =
    mode === "live" ? process.env.RZPY_LIVE_KEYSEC : process.env.RZPY_TEST_KEYSEC;

  if (!keyId || !keySecret) {
    throw new Error(
      `Missing Razorpay keys for PAYMENT_MODE=${mode}. Check .env values.`,
    );
  }

  return { keyId, keySecret, mode };
}

async function main() {
  const orderId = getArg("--orderId");
  if (!orderId) {
    console.error("Missing --orderId <orderId>");
    process.exitCode = 1;
    return;
  }

  const { keyId, keySecret, mode } = getKeys();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const url = `https://api.razorpay.com/v1/orders/${orderId}/payments`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `Razorpay API error (${response.status}) - ${JSON.stringify(payload)}`,
    );
  }

  console.log(`Razorpay mode: ${mode}`);
  console.log(`Order: ${orderId}`);
  console.log("Payments:", payload);
}

main().catch((error) => {
  console.error("Error checking Razorpay order:", error);
  process.exitCode = 1;
});
