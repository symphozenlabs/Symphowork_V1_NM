import { NextResponse } from "next/server";
import { logout } from "@/modules/identity/auth";
export async function POST() { await logout(); return NextResponse.json({ success: true }); }
