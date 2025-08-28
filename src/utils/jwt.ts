import { jwtVerify, SignJWT } from "jose";
import { AuthCookieType } from "./validation";

export async function signJWT(
  payload: AuthCookieType,
  secret: string,
  expiresIn: string = "6h",
): Promise<string> {
  const encoder = new TextEncoder();
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .setNotBefore("0s")
    .sign(encoder.encode(secret));

  return jwt;
}

/** Return type is just a hinting and there is not guarantee that the return shape follows the payload type */
export async function verifyJWT(
  token: string,
  secret: string,
): Promise<AuthCookieType> {
  const encoder = new TextEncoder();
  try {
    const { payload } = await jwtVerify<AuthCookieType>(
      token,
      encoder.encode(secret),
    );
    return payload;
  } catch (err) {
    throw new Error("Invalid or expired JWT");
  }
}
