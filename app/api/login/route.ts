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
    .select("id, username")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("❌ GET User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid Content-Type, must be application/json" }, { status: 400 });
    }

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
      .select("id, username, password")
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

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.BCRYPT_SALT!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ message: "Login successful", token, user }, { status: 200 });
  } catch (error) {
    console.error("❌ Login error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "JWT Error" }, { status: 500 });
    } else if (error instanceof Error) {
        return NextResponse.json({error: error.message}, {status: 500})
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}