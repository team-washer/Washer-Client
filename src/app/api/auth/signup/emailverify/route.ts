import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    const response = await apiClient.post('/auth/signup/emailverify', body);
    console.log('이메일 인증 응답:', response.data);
    if (response.data && response.data.success) {
      return NextResponse.json(response.data, { status: 200 });
    } else {
      return NextResponse.json(response.data, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.error?.message },
      { status: error?.status }
    );
  }
}
