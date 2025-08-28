import Razorpay from "razorpay";

const PAYMENT_MODE = process.env.PAYMENT_MODE;

if (!PAYMENT_MODE) {
  throw new Error("Incorrectly configured variables. Contact developer!");
}

const RAZORPAY_KEYID =
  PAYMENT_MODE === "test"
    ? process.env.RZPY_TEST_KEYID
    : process.env.RZPY_LIVE_KEYID;
export const RAZORPAY_KEYSEC =
  PAYMENT_MODE === "test"
    ? process.env.RZPY_TEST_KEYSEC
    : process.env.RZPY_LIVE_KEYSEC;
export const RZPY_WH_SECRET = process.env.RZPY_WH_SECRET;

if (!RAZORPAY_KEYID || !RAZORPAY_KEYSEC || !RZPY_WH_SECRET) {
  throw new Error("Incorrectly configured variables. Contact developer!");
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEYID,
  key_secret: RAZORPAY_KEYSEC,
});
