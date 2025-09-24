'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { AlertTriangle, Send } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import { machineApi } from '@/shared/lib/api-client';

interface ReportMachineModalProps {
  machineName: string;
  machineType: 'washing' | 'dryer';
}

export function ReportMachineModal({
  machineName,
  machineType,
}: ReportMachineModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: '신고 실패',
        description: '고장 내용을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 새로운 API 명세에 맞게 machineName과 description 전달
      await machineApi.reportMachine(machineName, description.trim());

      toast({
        title: '신고 접수 완료',
        description:
          '고장 신고가 접수되었습니다. 빠른 시일 내에 처리하겠습니다.',
      });

      setDescription('');
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: '신고 실패',
        description: error.response.data.message || '신고 접수 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-600 dark:border-orange-700 dark:text-orange-500 dark:hover:bg-orange-900/20'
        >
          <AlertTriangle className='h-4 w-4 mr-1' />
          <p className='max-[400px]:hidden'>고장 신고</p>
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center'>
            <AlertTriangle className='h-5 w-5 mr-2 text-orange-500' />
            기기 고장 신고
          </DialogTitle>
          <DialogDescription>
            {machineName} {machineType === 'washing' ? '세탁기' : '건조기'}의
            고장을 신고합니다.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <label htmlFor='machine-name' className='text-sm font-medium'>
              기기명
            </label>
            <Input
              id='machine-name'
              value={machineName}
              disabled
              className='bg-gray-50'
            />
          </div>

          <div className='grid gap-2'>
            <label htmlFor='description' className='text-sm font-medium'>
              고장 내용 <span className='text-red-500'>*</span>
            </label>
            <Textarea
              id='description'
              placeholder='고장 증상을 자세히 설명해주세요...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className='resize-none'
            />
            <p className='text-xs text-gray-500'>
              예: 세탁기가 돌아가지 않아요, 물이 빠지지 않아요, 이상한 소리가
              나요 등
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
          >
            {isSubmitting ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                신고 중...
              </>
            ) : (
              <>
                <Send className='h-4 w-4 mr-2' />
                신고하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
