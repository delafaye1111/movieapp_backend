import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";




// เพิ่มข้อมูลใหม่ลง Supabase (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // อ่าน JSON จาก Request
    const { username , password } = body;

    // ตรวจสอบค่าว่าง
    if (!username) {
      return NextResponse.json(
        { error: "Missing 'username' in request body" },
        { status: 400 }
      );
    }
    if (!username ||!password) {
      return NextResponse.json(
        { error: "Missing required fields: id,password" },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS!));
     


    // เพิ่มข้อมูลลง Supabase
    const { data, error } = await supabase.from("users").insert([
      {  username,password: hashedPassword },
    ]).select("*"); ;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "User created successfully", data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }
}