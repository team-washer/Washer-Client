import { apiClient } from "@/shared/lib/api-request";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.get('/user/me', { headers });
    return NextResponse.json(response.data.data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.error?.message },
      { status: error?.status }
    );
  }
}
