import { NextRequest, NextResponse } from "next/server";
import jwt,{ JwtPayload } from "jsonwebtoken";


export async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null; // ❌ ไม่มี Token
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.BCRYPT_SALT!) as JwtPayload;
    return decoded; // ✅ คืนค่าข้อมูลของ User
  } catch (error) {
    return null; // ❌ Token ไม่ถูกต้อง
  }
}

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  return NextResponse.next();
}