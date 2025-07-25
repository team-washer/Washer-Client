import { apiClient } from "@/shared/lib/api-request";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) { 
  const body = await request.json();
  const userId = body.userId;

  try {
    const response = await apiClient.post(`/user/admin/${body.userId}/restrict`, body);

    if (response.data && response.data.success) {
      return new Response(response.data.message, { status: 200 });
    } else {
      return new Response(response.data.message, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: '서버에서 사용자 제한 정보를 받아오지 못 했습니다.' },
      { status: 500 }
    );
  }
}