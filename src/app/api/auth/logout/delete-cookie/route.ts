import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const res = NextResponse.next();
  res.cookies.delete('accessToken');
  res.cookies.delete('refreshToken');
  res.cookies.delete('role');
  return res;
}
