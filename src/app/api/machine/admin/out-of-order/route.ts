import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const floor = searchParams.get('floor');
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.get('/machine/admin/out-of-order', {
      headers,
      params: { type, floor },
    });
    return NextResponse.json(response.data.data);
  } catch (error) {
    return NextResponse.json(
      { error: '서버에서 리포트 정보를 받아오지 못 했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.patch(
      '/machine/admin/out-of-order',
      body,
      { headers }
    );
    return NextResponse.json(response.data.data);
  } catch (error) {
    return NextResponse.json(
      { error: '서버에서 리포트 정보를 업데이트하지 못 했습니다.' },
      { status: 500 }
    );
  }
}
