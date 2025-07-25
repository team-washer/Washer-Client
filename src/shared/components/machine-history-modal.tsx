'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import {
  History,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
} from 'lucide-react';
import { machineApi, type MachineHistoryItem } from '@/shared/lib/api-client';
import { useToast } from '@/shared/components/ui/use-toast';

interface MachineHistoryModalProps {
  machineId: number;
  machineName: string;
}

export function MachineHistoryModal({
  machineId,
  machineName,
}: MachineHistoryModalProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState<MachineHistoryItem[]>([]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await machineApi.getHistory(machineId);
      if (response.success) {
        setHistoryData(response.data);
      }
    } catch (error) {
      console.error('❌ Failed to load machine history:', error);
      toast({
        title: '히스토리 로드 실패',
        description:
          error.message || '기기 히스토리를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadHistory();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return (
          <Badge
            variant='secondary'
            className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          >
            <Clock className='h-3 w-3 mr-1' />
            대기 중
          </Badge>
        );
      case 'reserved':
        return (
          <Badge
            variant='default'
            className='bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          >
            <CheckCircle className='h-3 w-3 mr-1' />
            예약됨
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge
            variant='default'
            className='bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
          >
            <Loader2 className='h-3 w-3 mr-1 animate-spin' />
            확정됨
          </Badge>
        );
      case 'running':
        return (
          <Badge
            variant='default'
            className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          >
            <Play className='h-3 w-3 mr-1' />
            사용 중
          </Badge>
        );
      case 'completed':
        return (
          <Badge
            variant='default'
            className='bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
          >
            <CheckCircle className='h-3 w-3 mr-1' />
            완료됨
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge
            variant='destructive'
            className='bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          >
            <XCircle className='h-3 w-3 mr-1' />
            취소됨
          </Badge>
        );
      default:
        return <Badge variant='outline'>알 수 없음</Badge>;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimelineEvents = (item: MachineHistoryItem) => {
    const events = [];

    if (item.createdAt) {
      events.push({ time: item.createdAt, label: '예약 생성', icon: Calendar });
    }
    if (item.confirmedAt) {
      events.push({
        time: item.confirmedAt,
        label: '예약 확정',
        icon: CheckCircle,
      });
    }
    if (item.startedAt) {
      events.push({ time: item.startedAt, label: '작업 시작', icon: Play });
    }
    if (item.completedAt) {
      events.push({
        time: item.completedAt,
        label: '작업 완료',
        icon: CheckCircle,
      });
    }
    if (item.cancelledAt) {
      events.push({
        time: item.cancelledAt,
        label: '예약 취소',
        icon: XCircle,
      });
    }

    return events.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='flex items-center gap-2 bg-transparent'
        >
          <History className='h-4 w-4' />
          <p className='max-xl:hidden'>히스토리</p>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <History className='h-5 w-5' />
            {machineName} 사용 히스토리
          </DialogTitle>
          <DialogDescription>
            최근 사용 기록을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-center'>
                <Loader2 className='h-8 w-8 animate-spin mx-auto mb-2 text-[#86A9FF]' />
                <p className='text-gray-500'>히스토리를 불러오는 중...</p>
              </div>
            </div>
          ) : historyData.length === 0 ? (
            <div className='text-center py-8'>
              <History className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <p className='text-gray-500'>사용 기록이 없습니다.</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {historyData.map((item, index) => {
                const timelineEvents = getTimelineEvents(item);

                return (
                  <Card key={index} className='border-l-4 border-l-[#86A9FF]'>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>
                            {item.machineLabel}
                          </span>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      <Separator className='my-3' />

                      {/* 타임라인 */}
                      <div className='space-y-3'>
                        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          진행 과정
                        </h4>
                        <div className='space-y-2'>
                          {timelineEvents.map((event, eventIndex) => {
                            const IconComponent = event.icon;
                            return (
                              <div
                                key={eventIndex}
                                className='flex items-center gap-3 text-sm'
                              >
                                <div className='flex-shrink-0'>
                                  <IconComponent className='h-4 w-4 text-[#86A9FF]' />
                                </div>
                                <div className='flex-1 flex justify-between items-center'>
                                  <span className='text-gray-600 dark:text-gray-400'>
                                    {event.label}
                                  </span>
                                  <span className='text-gray-500 dark:text-gray-500 text-xs'>
                                    {formatDateTime(event.time)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 완료된 경우 완료 시간 강조 표시 */}
                      {item.status === 'completed' && item.completedAt && (
                        <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800'>
                          <div className='flex items-center gap-2'>
                            <CheckCircle className='h-4 w-4 text-green-600' />
                            <span className='text-sm font-medium text-green-800 dark:text-green-400'>
                              완료 시간: {formatDateTime(item.completedAt)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 취소된 경우 취소 시간 표시 */}
                      {item.status === 'cancelled' && item.cancelledAt && (
                        <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800'>
                          <div className='flex items-center gap-2'>
                            <XCircle className='h-4 w-4 text-red-600' />
                            <span className='text-sm font-medium text-red-800 dark:text-red-400'>
                              취소 시간: {formatDateTime(item.cancelledAt)}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
