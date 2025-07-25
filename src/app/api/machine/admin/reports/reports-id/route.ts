import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('id');
  const status = searchParams.get('status');
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.patch(
      `/machine/admin/reports/${reportId}?status=${status}`,
      { headers }
    );
    return NextResponse.json(response.data.data);
  } catch (error) {
    return NextResponse.json(
      { error: '서버에서 리포트 정보를 받아오지 못 했습니다.' },
      { status: 500 }
    );
  }
}
