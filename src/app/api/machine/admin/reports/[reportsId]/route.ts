import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportsId: string } }
) {
  const { searchParams } = new URL(request.url);
  const { reportsId } = params;
  console.log('reportsId:', reportsId);
  const status = searchParams.get('status');
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.patch(
      `/machine/admin/reports/${reportsId}`,
      {},
      { headers, params: { status } }
    );
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: '서버에서 리포트 정보를 받아오지 못 했습니다.' },
      { status: 500 }
    );
  }
}
