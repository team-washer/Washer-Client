import RoleDecryption from "@/shared/lib/role-decryption";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const encryptedRole = cookieStore.get("role")?.value;

    const role = await RoleDecryption(encryptedRole ?? "");

    return NextResponse.json({ role });
  } catch (err) {
    return NextResponse.json(
      { error: "서버에서 토큰 정보를 받아오지 못 했습니다." },
      { status: 500 }
    );
  }
}
