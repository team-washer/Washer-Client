import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.post('/machine/report', body, { headers });
    return NextResponse.json(response.data.data);
  } catch (error) {
    return NextResponse.json(
      { error: '서버에서 리포트 정보를 받아오지 못 했습니다.' },
      { status: 500 }
    );
  }
}
