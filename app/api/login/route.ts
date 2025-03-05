import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyToken } from "@/app/api/middleware";
import { JwtPayload } from "jsonwebtoken";

export async function GET(req: NextRequest) {
  const decoded = await verifyToken(req);
  console.log("✅ Decoded Token:", decoded);

  if (!decoded || typeof decoded === "string" || !(decoded as JwtPayload).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (decoded as JwtPayload).id;

  const { data, error } = await supabase
    .from("users")
    .select("id, username") // เลือกเฉพาะคอลัมน์ที่จำเป็น
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    console.log("✅ Request received:", body);

    if (!username || !password) {
      return NextResponse.json(
        { error: "Missing 'username' or 'password'" },
        { status: 400 }
      );
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, password") // เลือกเฉพาะคอลัมน์ที่ใช้
      .eq("username", username)
      .limit(1);

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.BCRYPT_SALT!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ message: "Login successful", token, user }, { status: 200 });
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }
}
