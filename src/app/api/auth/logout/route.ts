import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Refresh token not found' }, 
      { status: 401 }
    );
  }

  try {
    const response = await apiClient.post(
      '/auth/logout',
      {},
      {
        headers: {
          'Refresh-Token': `Bearer ${refreshToken}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.error?.message },
      { status: error?.status }
    );
  }
}
