import RoleDecryption from '@/shared/lib/role-decryption';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const encryptedRole = cookieStore.get('role')?.value;

    const role = await RoleDecryption({
      role: encryptedRole ?? '',
    });

    return NextResponse.json({ role });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.error?.message },
      { status: error?.status }
    );
  }
}
