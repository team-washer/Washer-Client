import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const response = await apiClient.post('/auth/pwchange', body);

    if (response.data && response.data.success) {
      return new Response(response.data.message, { status: 200 });
    } else {
      return new Response(response.data.message, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: '서버에서 토큰 정보를 받아오지 못 했습니다.' },
      { status: 500 }
    );
  }
}
