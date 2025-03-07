import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { verifyToken } from "@/app/api/middleware";
import { JwtPayload } from "jsonwebtoken";

// ดึงรายการที่ชื่นชอบของผู้ใช้
export async function GET(req: NextRequest) {
  const decoded = await verifyToken(req);

  if (!decoded || typeof decoded === "string" || !(decoded as JwtPayload).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (decoded as JwtPayload).id;
  const { data, error } = await supabase
    .from("favoriatelist")
    .select()
    .eq("user_id", userId);

  if (error) {
    console.error("Supabase GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

// เพิ่มหนังโปรดของผู้ใช้
export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || typeof decoded === "string" || !(decoded as JwtPayload).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (decoded as JwtPayload).id;
    const body = await req.json();
    const { tmdbId, tmdbName, tmdbType, rating } = body;

    console.log("Received body:", body);

    if (!tmdbId || !tmdbName || !tmdbType || rating === null || rating === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ตรวจสอบรายการโปรดที่มีอยู่แล้ว
    const { data: existingFavorite, error: existingError } = await supabase
      .from("favoriatelist")
      .select()
      .eq("tmdbid", tmdbId)
      .eq("tmdbtype", tmdbType)
      .eq("user_id", userId);

    if (existingError) {
      console.error("Supabase check existing error:", existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingFavorite && existingFavorite.length > 0) {
      return NextResponse.json({ error: "Already in favorites" }, { status: 409 }); // Conflict
    }

    const { data, error } = await supabase
      .from("favoriatelist")
      .insert([
        {
          tmdbid: tmdbId,
          tmdbname: tmdbName,
          tmdbtype: tmdbType,
          tmdbrating: rating,
          user_id: userId,
        },
      ])
      .select();

    if (error) {
      console.error("Supabase POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Added to favorites", data }, { status: 200 });
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// ลบหนังโปรดของผู้ใช้
export async function DELETE(req: NextRequest) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded || typeof decoded === "string" || !(decoded as JwtPayload).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (decoded as JwtPayload).id;
    const body = await req.json();
    const { tmdbId, tmdbType } = body;

    console.log("Received DELETE body:", body);

    if (!tmdbId || !tmdbType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from("favoriatelist")
      .delete()
      .eq("tmdbid", tmdbId)
      .eq("tmdbtype", tmdbType)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Removed from favorites" }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE request:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}