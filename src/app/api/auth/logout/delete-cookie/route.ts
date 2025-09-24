import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({});
    response.cookies.set('accessToken', '', { expires: new Date(0) });
    response.cookies.set('refreshToken', '', { expires: new Date(0) });
    response.cookies.set('role', '', { expires: new Date(0) });
    
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.error?.message },
      { status: error?.status }
    );
  }
}