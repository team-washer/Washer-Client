import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { machineId: string } }
) {
  const { machineId } = params;
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.post(
      `/reservation/${machineId}`,
      {},
      {
        headers,
      }
    );
    console.log('예약 생성 응답:', response.data);
    if (response.data && response.data.success) {
      return new Response(response.data.message, { status: 200 });
    } else {
      return new Response(response.data.message, { status: 400 });
    }
  } catch (error: any) {
    if (error.status === 403) {
      return NextResponse.json(
        { error: '정지된 사용자입니다.' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: '예약 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
