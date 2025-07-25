'use client';

import type React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useToast } from '@/shared/components/ui/use-toast';
import { Shirt, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    emailPrefix: '',
    password: '',
    rememberMe: false,
  });

  const validatePassword = (password: string) => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('8자리 이상');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('영문 소문자');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('영문 대문자');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('숫자');
    }
    if (!/(?=.*[\W_])/.test(password)) {
      errors.push('특수문자');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRememberMeChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, rememberMe: checked }));
  };

  const getDetailedErrorMessage = (error): string => {
    // 네트워크 오류 체크
    if (!navigator.onLine) {
      return '인터넷 연결을 확인해주세요.';
    }

    // TypeError나 fetch 관련 오류 (실제 네트워크 문제)
    if (error instanceof TypeError || error?.name === 'TypeError') {
      return '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
    }

    // API 응답 오류 (서버에서 온 응답)
    if (error?.status) {
      switch (error.status) {
        case 400:
          return '입력 정보가 올바르지 않습니다.';
        case 401:
          return '이메일 또는 비밀번호가 잘못되었습니다.';
        case 403:
          return '계정이 차단되었습니다. 관리자에게 문의하세요.';
        case 404:
          return '존재하지 않는 계정입니다.';
        case 422:
          return '입력한 정보를 다시 확인해주세요.';
        case 429:
          return '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.';
        case 500:
          return '서버에 문제가 발생했습니다. (500)';
        case 502:
          return '서버가 일시적으로 사용할 수 없습니다. (502)';
        case 503:
          return '서버가 점검 중입니다. (503)';
        case 504:
          return '서버 응답 시간이 초과되었습니다. (504)';
        default:
          return `서버 오류가 발생했습니다. (${error.status})`;
      }
    }

    // 메시지가 있는 경우 더 자세히 분석
    if (error?.message) {
      const message = error.message.toLowerCase();

      if (
        message.includes('failed to fetch') ||
        message.includes('network error')
      ) {
        return '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
      }
      if (message.includes('timeout')) {
        return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
      }
      if (message.includes('unauthorized') || message.includes('401')) {
        return '이메일 또는 비밀번호가 잘못되었습니다.';
      }
      if (message.includes('not found') || message.includes('404')) {
        return '존재하지 않는 계정입니다.';
      }
      if (message.includes('서버')) {
        return error.message;
      }

      // 원본 메시지가 한국어면 그대로 사용
      if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(error.message)) {
        return error.message;
      }

      return `로그인 실패: ${error.message}`;
    }

    // 기본 오류 메시지
    return '로그인 중 알 수 없는 오류가 발생했습니다.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 8자리 미만이면 여기서 걸러짐 (버튼이 비활성화되어 있어야 함)
    if (formData.password.length < 8) {
      return;
    }

    // 전체 비밀번호 검증
    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      toast({
        title: '비밀번호 오류',
        description: `비밀번호는 ${validation.errors.join(
          ', '
        )}을(를) 포함해야 합니다.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('/api/auth/signin', {
        email: `${formData.emailPrefix}@gsm.hs.kr`,
        password: formData.password,
      });
      toast({
        title: '로그인 성공',
        description: '환영합니다!',
      });

      router.push('/');
    } catch (error) {
      const errorMessage = getDetailedErrorMessage(error);

      toast({
        title: '로그인 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-screen flex items-center justify-center bg-white p-4 overflow-hidden'>
      <Card className='w-full max-w-md border-[#EDF2FF] shadow-lg'>
        <CardHeader className='space-y-1 text-center'>
          <div className='flex justify-center mb-2'>
            <div className='flex items-center justify-center h-12 w-12 rounded-full bg-[#86A9FF]'>
              <Shirt className='h-6 w-6 text-white' />
            </div>
          </div>
          <CardTitle className='text-2xl font-bold text-[#6487DB]'>
            Washer
          </CardTitle>
          <CardDescription className='text-center px-2'>
            기숙사 세탁기 · 건조기 예약 시스템에 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent className='px-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='emailPrefix'>이메일</Label>
              <div className='relative'>
                <Input
                  id='emailPrefix'
                  name='emailPrefix'
                  placeholder=''
                  required
                  value={formData.emailPrefix}
                  onChange={handleChange}
                  className='border-[#A8C2FF] focus-visible:ring-[#86A9FF] pr-24 text-base'
                  disabled={isLoading}
                />
                <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500'>
                  @gsm.hs.kr
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>비밀번호</Label>
              <div className='relative'>
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='비밀번호를 입력하세요'
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className='border-[#A8C2FF] focus-visible:ring-[#86A9FF] pr-12 text-base'
                  disabled={isLoading}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4 text-gray-400' />
                  ) : (
                    <Eye className='h-4 w-4 text-gray-400' />
                  )}
                  <span className='sr-only'>
                    {showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  </span>
                </Button>
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='rememberMe'
                checked={formData.rememberMe}
                onCheckedChange={handleRememberMeChange}
                className='border-[#A8C2FF] data-[state=checked]:bg-[#86A9FF] data-[state=checked]:border-[#86A9FF] h-4 w-4 md:h-4 md:w-4'
                disabled={isLoading}
              />
              <Label htmlFor='rememberMe' className='text-sm cursor-pointer'>
                로그인 유지
              </Label>
            </div>

            <Button
              type='submit'
              className='w-full bg-[#86A9FF] hover:bg-[#6487DB] text-base py-2.5 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={
                isLoading ||
                !formData.emailPrefix ||
                formData.password.length < 8
              }
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex flex-col space-y-3 px-6 pb-6'>
          <p className='text-sm text-gray-500 text-center'>
            계정이 없으신가요?{' '}
            <Link
              href='/register'
              className='text-[#6487DB] hover:underline font-medium'
            >
              회원가입
            </Link>
          </p>
          <p className='text-sm text-gray-500 text-center'>
            비밀번호를 잊으셨나요?{' '}
            <Link
              href='/forgot-password'
              className='text-[#6487DB] hover:underline font-medium'
            >
              비밀번호 찾기
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
