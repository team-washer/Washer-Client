import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // API 문서에 따라 모든 필드를 문자열로 변환
  const formattedBody = {
    email: String(body.email || ''),
    password: String(body.password || ''),
    name: String(body.name || ''),
    schoolNumber: String(body.schoolNumber || ''),
    gender: String(body.gender || ''),
    room: String(body.room || ''), // 숫자를 문자열로 변환
  };

  // 요청 데이터 로깅 (비밀번호는 숨김)
  console.log('회원가입 요청 데이터:', {
    ...formattedBody,
    password: '[HIDDEN]',
  });

  console.log('API Client baseURL:', apiClient.defaults.baseURL);

  try {
    const response = await apiClient.post('/auth/signup', formattedBody);
    console.log('회원가입 응답:', response.data);

    if (response.data && response.data.success) {
      return NextResponse.json(response.data, { status: 200 });
    } else {
      return NextResponse.json(response.data, { status: 400 });
    }
  } catch (error: any) {
    console.error('=== 회원가입 오류 상세 정보 ===');

    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error(
        '응답 데이터:',
        JSON.stringify(error.response.data, null, 2)
      );

      const errorMessage =
        error.response.data?.error?.message ||
        error.response.data?.message ||
        '회원가입에 실패했습니다.';

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          statusCode: error.response.status,
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      console.error('네트워크 오류 - 응답을 받지 못함');

      return NextResponse.json(
        {
          success: false,
          error:
            '외부 서버와 통신할 수 없습니다. 서버가 실행 중인지 확인해주세요.',
        },
        { status: 503 }
      );
    } else {
      console.error('요청 설정 오류:', error.message);

      return NextResponse.json(
        {
          success: false,
          error: '요청 처리 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }
  }
}
