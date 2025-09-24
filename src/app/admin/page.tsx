"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  RefreshCw,
  Settings,
  Users,
  Calendar,
  AlertTriangle,
  XCircle,
  Trash2,
  UserX,
  UserCheck,
  Wrench,
  BarChart3,
  Filter,
  Clock,
} from "lucide-react";
import { useReservationStore } from "@/shared/lib/reservation-store";
import { useToast } from "@/shared/components/ui/use-toast";
import { securityManager } from "@/shared/lib/auth-utils";
import {
  machineApi,
  reservationApi,
  userApi,
  type Report,
  type OutOfOrderDevice,
  type AdminReservationInfo,
  type AdminUserInfo,
  parseTimeStringToSeconds,
} from "@/shared/lib/api-client";

import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import axios from "axios";
import { set } from "react-hook-form";

// 시간을 포맷팅하는 함수 (초 -> HH:MM:SS)
const formatSecondsToTime = (seconds: number): string => {
  if (seconds <= 0) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean>();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0); // 새로고침 쿨타임

  // 데이터 상태
  const [reports, setReports] = useState<Report[]>([]);
  const [outOfOrderDevices, setOutOfOrderDevices] = useState<
    OutOfOrderDevice[]
  >([]);
  const [adminReservations, setAdminReservations] = useState<
    AdminReservationInfo[]
  >([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserInfo[]>([]);

  // 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState<
    "ALL" | "PENDING" | "IN_PROGRESS" | "RESOLVED"
  >("ALL");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<
    "ALL" | "WASHER" | "DRYER"
  >("ALL");
  const [floorFilter, setFloorFilter] = useState<"ALL" | "3" | "4" | "5">(
    "ALL"
  );
  const [reservationTypeFilter, setReservationTypeFilter] = useState<
    "ALL" | "WASHER" | "DRYER"
  >("ALL");
  const [userGenderFilter, setUserGenderFilter] = useState<
    "ALL" | "MALE" | "FEMALE"
  >("ALL");
  const [userFloorFilter, setUserFloorFilter] = useState<
    "ALL" | "3" | "4" | "5"
  >("ALL");

  // 다이얼로그 상태
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedReportStatus, setSelectedReportStatus] = useState<
    "PENDING" | "IN_PROGRESS" | "RESOLVED"
  >("PENDING");
  const [isReportStatusDialogOpen, setIsReportStatusDialogOpen] =
    useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [restrictionDuration, setRestrictionDuration] = useState<
    "1시간" | "1일" | "7일"
  >("1시간");
  const [isRestrictDialogOpen, setIsRestrictDialogOpen] = useState(false);
  const [isUnrestrictDialogOpen, setIsUnrestrictDialogOpen] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");

  const { machines, fetchMachines } = useReservationStore();

  // Pull-to-refresh 훅 사용
  const { isPulling, isRefreshing: pullRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      if (refreshCooldown > 0) {
        toast({
          title: "새로고침 대기",
          description: `${refreshCooldown}초 후에 다시 시도해주세요.`,
          variant: "destructive",
        });
        return;
      }
      await handleRefreshData();
    },
    threshold: 80,
  });

  // 실시간 카운트다운을 위한 useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setAdminReservations((prevReservations) =>
        prevReservations.map((reservation) => {
          if (reservation.remainingSeconds > 0) {
            return {
              ...reservation,
              remainingSeconds: reservation.remainingSeconds - 1,
              remainingTime: formatSecondsToTime(
                reservation.remainingSeconds - 1
              ),
            };
          }
          return reservation;
        })
      );

      // 정지된 사용자의 남은 시간도 업데이트
      setAdminUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.restrictedUntil) {
            const now = new Date();
            const restrictedUntil = new Date(user.restrictedUntil);
            const diffMs = restrictedUntil.getTime() - now.getTime();

            if (diffMs <= 0) {
              // 정지 시간이 끝났으면 정지 상태 해제
              return {
                ...user,
                restrictedUntil: null,
                restrictionReason: null,
              };
            }
          }
          return user;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data } = await axios.get("/api/auth/role");
      setIsAdmin(data.role === "ROLE_ADMIN");
    };

    checkAdminRole();

    // 보안 검증
    if (!securityManager.validateTokenAndRole()) {
      toast({
        title: "보안 오류",
        description: "인증 정보에 문제가 있습니다. 다시 로그인해주세요.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    // 변조 감지
    if (securityManager.detectTampering()) {
      toast({
        title: "보안 경고",
        description: "권한 정보가 변조되었습니다. 다시 로그인해주세요.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    setIsLoading(false);
  }, [router, toast]);

  // 관리자가 아닌 경우 리다이렉트 처리
  useEffect(() => {
    if (isAdmin === undefined) return;

    if (!isLoading && !isAdmin) {
      toast({
        title: "접근 제한",
        description: "관리자만 접근할 수 있는 페이지입니다.",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [isLoading, isAdmin, router, toast]);

  // 초기 데이터 로드
  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  // 새로고침 쿨타임 타이머
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown(refreshCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);

  // 모든 데이터 로드
  const loadAllData = async () => {
    try {
      await Promise.all([
        loadReports(),
        loadOutOfOrderDevices(),
        loadAdminReservations(),
        loadAdminUsers(),
        fetchMachines(),
      ]);
    } catch (error: any) {
      console.error(error.response.data);
    }
  };

  // 고장 신고 목록 로드
  const loadReports = async () => {
    try {
      const response = await machineApi.getReports();
      setReports(response.data);
    } catch (error: any) {
      console.error(error.response?.data);
    }
  };

  // 고장 기기 목록 로드
  const loadOutOfOrderDevices = async () => {
    try {
      const response = await machineApi.getOutOfOrderDevices();
      setOutOfOrderDevices(response.data);
    } catch (error: any) {
      console.error(error.response?.data);
    }
  };

  // 관리자 예약 목록 로드
  const loadAdminReservations = async () => {
    try {
      const response = await reservationApi.getAdminReservations();
      const processedReservations = response.data.map((reservation) => ({
        ...reservation,
        remainingSeconds: reservation.remainingTime
          ? parseTimeStringToSeconds(reservation.remainingTime)
          : 0,
      }));
      setAdminReservations(processedReservations);
    } catch (error: any) {
      console.error(error.response?.data);
    }
  };

  // 관리자 사용자 목록 로드
  const loadAdminUsers = async () => {
    try {
      const response = await userApi.getUsers();

      setAdminUsers(response.data);
    } catch (error: any) {
      console.error(error.response?.data);
    }
  };

  // 데이터 새로고침
  const handleRefreshData = async () => {
    if (refreshCooldown > 0) {
      toast({
        title: "새로고침 대기",
        description: `${refreshCooldown}초 후에 다시 시도해주세요.`,
        variant: "destructive",
      });
      return;
    }

    setRefreshing(true);
    setRefreshCooldown(5); // 5초 쿨타임 설정

    try {
      await loadAllData();
      toast({
        title: "새로고침 완료",
        description: "모든 데이터가 새로고침되었습니다.",
      });
    } catch (error) {
      toast({
        title: "새로고침 실패",
        description: "데이터를 새로고침하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // 신고 상태 변경
  const handleUpdateReportStatus = async () => {
    if (!selectedReportId) return;

    try {
      const response = await machineApi.updateReportStatus(
        selectedReportId,
        selectedReportStatus
      );
      toast({
        title: "상태 변경 완료",
        description: "신고 상태가 성공적으로 변경되었습니다.",
      });
      await loadReports();
      console.log("Report status updated:", response.data);
    } catch (error: any) {
      toast({
        title: "상태 변경 실패",
        description: error.response?.data?.message || "상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsReportStatusDialogOpen(false);
      setSelectedReportId(null);
    }
  };

  // 기기 고장 상태 토글
  const handleToggleOutOfOrder = async (
    deviceName: string,
    currentStatus: boolean
  ) => {
    setIsLoading(true);
    try {
      const response = await machineApi.updateOutOfOrderStatus(
        deviceName,
        !currentStatus
      );
      toast({
        title: !currentStatus ? "기기 고장 등록" : "기기 수리 완료",
        description: `${deviceName} 기기가 ${!currentStatus ? "고장 상태로 등록" : "수리 완료 상태로 변경"
          }되었습니다.`,
      });
      await loadOutOfOrderDevices();
      await fetchMachines(); // 메인 기기 목록도 새로고침
    } catch (error: any) {
      toast({
        title: "상태 변경 실패",
        description: error.response?.data?.message || "기기 상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }finally { 
      setIsLoading(false);
    }
  };

  // 예약 강제 삭제
  const handleForceDeleteReservation = async (reservationId: number) => {
    setIsLoading(true);
    try {
      const response = await reservationApi.forceDeleteReservation(
        reservationId
      );
      toast({
        title: "예약 삭제 완료",
        description: "예약이 성공적으로 삭제되었습니다.",
      });
      await loadAdminReservations();
    } catch (error: any) {
      toast({
        title: "예약 삭제 실패",
        description: error.response?.data?.message || "예약 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 정지
  const handleRestrictUser = async () => {
    setIsLoading(true);

    if (!selectedUserId || !restrictionReason.trim()) {
      toast({
        title: "입력 오류",
        description: "정지 이유를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await userApi.restrictUser(selectedUserId, {
        period: restrictionDuration,
        restrictionReason: restrictionReason,
      });

      toast({
        title: "사용자 정지 완료",
        description: `사용자가 ${restrictionDuration} 동안 정지되었습니다.`,
      });
      await loadAdminUsers();
    } catch (error: any) {
      toast({
        title: "정지 실패",
        description: error.response?.data?.message || "사용자 정지 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRestrictDialogOpen(false);
      setSelectedUserId(null);
      setRestrictionReason("");
    }
  };

  // 사용자 정지 해제
  const handleUnrestrictUser = async () => {
    setIsLoading(true);
    if (!selectedUserId) return;

    try {
      const response = await userApi.unrestrictUser(selectedUserId);

      toast({
        title: "정지 해제 완료",
        description: "사용자의 정지가 해제되었습니다.",
      });
      await loadAdminUsers();
      console.log("User unrestricted:", response.data);
    } catch (error: any) {
      toast({
        title: "정지 해제 실패",
        description: error.response?.data?.message || "정지 해제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUnrestrictDialogOpen(false);
      setSelectedUserId(null);
      setIsLoading(false);
    }
  };

  // 사용자 정지 상태 확인 (임시 - 실제로는 서버에서 받아야 함)
  const isUserRestricted = (user: AdminUserInfo): boolean => {
    if (!user.restrictedUntil) return false;
    const now = new Date();
    const restrictedUntil = new Date(user.restrictedUntil);
    return restrictedUntil > now;
  };

  // 정지 해제까지 남은 시간 계산
  const getRestrictedTimeRemaining = (restrictedUntil: string): string => {
    const now = new Date();
    const endTime = new Date(restrictedUntil);
    const diffMs = endTime.getTime() - now.getTime();

    if (diffMs <= 0) return "정지 해제됨";

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
    } else {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    }
  };

  // 필터링된 데이터
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedByUserName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      reportStatusFilter === "ALL" || report.status === reportStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredOutOfOrderDevices = outOfOrderDevices.filter((device) => {
    const matchesSearch = device.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      deviceTypeFilter === "ALL" || device.type === deviceTypeFilter;
    const matchesFloor =
      floorFilter === "ALL" || floorFilter.includes(device.floor);

    return matchesSearch && matchesType && matchesFloor;
  });

  const filteredAdminReservations = adminReservations.filter((reservation) => {
    const matchesSearch = reservation.machineLabel
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const machineType = reservation.machineLabel.includes("Washer")
      ? "WASHER"
      : "DRYER";
    const matchesType =
      reservationTypeFilter === "ALL" || machineType === reservationTypeFilter;

    return matchesSearch && matchesType;
  });

  const filteredAdminUsers = adminUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.schoolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roomName.toLowerCase().includes(searchTerm.toLowerCase());

    // 성별 필터링 수정 - MALE/FEMALE을 MALE/female로 변환
    const userGender = user.gender as "MALE" | "FEMALE";
    const matchesGender =
      userGenderFilter === "ALL" || userGender === userGenderFilter;
    const roomFloor = user.roomName.charAt(0);
    const matchesFloor =
      userFloorFilter === "ALL" || roomFloor === userFloorFilter;

    return matchesSearch && matchesGender && matchesFloor;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#86A9FF] mx-auto mb-2"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">접근 제한</CardTitle>
            <CardDescription>
              관리자만 접근할 수 있는 페이지입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => router.push("/")}
              className="bg-[#86A9FF] hover:bg-[#6487DB]"
            >
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-50">
      {/* Pull-to-refresh 인디케이터 */}
      {(isPulling || pullRefreshing) && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border">
          <RefreshCw
            className={`h-5 w-5 text-[#6487DB] ${pullRefreshing ? "animate-spin" : ""
              }`}
          />
        </div>
      )}

      <div className="container mx-auto py-6 px-4">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-[#6487DB] dark:text-[#86A9FF]">
            관리자 페이지
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isLoading || refreshing || refreshCooldown > 0}
            className="border-[#86A9FF] text-[#6487DB] hover:bg-[#EDF2FF]"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing
              ? "새로고침 중..."
              : refreshCooldown > 0
                ? `새로고침 (${refreshCooldown}초)`
                : "새로고침"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-muted p-2 rounded-lg h-12">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-1 rounded-md h-8 text-xs px-2 py-1"
            >
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">개요</span>
            </TabsTrigger>
            <TabsTrigger
              value="devices"
              className="flex items-center gap-1 rounded-md h-8 text-xs px-2 py-1"
            >
              <Settings className="h-3 w-3" />
              <span className="hidden sm:inline">기기 관리</span>
            </TabsTrigger>
            <TabsTrigger
              value="reservations"
              className="flex items-center gap-1 rounded-md h-8 text-xs px-2 py-1"
            >
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">예약 관리</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex items-center gap-1 rounded-md h-8 text-xs px-2 py-1"
            >
              <AlertTriangle className="h-3 w-3" />
              <span className="hidden sm:inline">신고 관리</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex items-center gap-1 rounded-md h-8 text-xs px-2 py-1"
            >
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">사용자 관리</span>
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    총 기기 수
                  </CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{machines.length}</div>
                  <p className="text-xs text-muted-foreground">
                    세탁기 {machines.filter((m) => m.type === "washing").length}
                    대, 건조기{" "}
                    {machines.filter((m) => m.type === "dryer").length}대
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    활성 예약
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminReservations.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    현재 진행 중인 예약
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    고장 신고
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reports.filter((r) => r.status === "PENDING").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    총 {reports.length}건 중 대기 중
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    고장 기기
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {outOfOrderDevices.filter((d) => d.outOfOrder).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    수리가 필요한 기기
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 최근 활동 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>최근 고장 신고</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports.slice(0, 5).map((report) => (
                      <div
                        key={report.reportId}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {report.machineName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.reportedByUserName}
                          </p>
                        </div>
                        <Badge
                          variant={
                            report.status === "PENDING"
                              ? "destructive"
                              : report.status === "IN_PROGRESS"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {report.status === "PENDING"
                            ? "대기"
                            : report.status === "IN_PROGRESS"
                              ? "처리중"
                              : "완료"}
                        </Badge>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        신고가 없습니다.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>현재 활성 예약</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {adminReservations.slice(0, 5).map((reservation) => (
                      <div
                        key={reservation.reservationId}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {reservation.machineLabel}
                          </p>
                          <p className="text-xs text-gray-500">
                            남은 시간:{" "}
                            <span
                              className={`font-mono ${reservation.remainingSeconds <= 300
                                  ? "text-red-600 font-semibold"
                                  : ""
                                }`}
                            >
                              {reservation.remainingTime}
                            </span>
                          </p>
                        </div>
                        <Badge
                          variant={
                            reservation.status === "WAITING"
                              ? "secondary"
                              : reservation.status === "RUNNING"
                                ? "default"
                                : "outline"
                          }
                        >
                          {reservation.status === "WAITING"
                            ? "대기"
                            : reservation.status === "RUNNING"
                              ? "사용중"
                              : reservation.status}
                        </Badge>
                      </div>
                    ))}
                    {adminReservations.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        활성 예약이 없습니다.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 기기 관리 탭 */}
          <TabsContent value="devices" className="space-y-6">
            {/* 필터 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  필터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="device-search">검색</Label>
                    <Input
                      id="device-search"
                      placeholder="기기명 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="device-type">기기 유형</Label>
                    <Select
                      value={deviceTypeFilter}
                      onValueChange={(value) =>
                        setDeviceTypeFilter(value as "ALL" | "WASHER" | "DRYER")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">전체</SelectItem>
                        <SelectItem value="WASHER">세탁기</SelectItem>
                        <SelectItem value="DRYER">건조기</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="device-floor">층</Label>
                    <Select
                      value={floorFilter}
                      onValueChange={(value) =>
                        setFloorFilter(value as "ALL" | "3" | "4" | "5")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">전체</SelectItem>
                        <SelectItem value="3">3층</SelectItem>
                        <SelectItem value="4">4층</SelectItem>
                        <SelectItem value="5">5층</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setDeviceTypeFilter("ALL");
                        setFloorFilter("ALL");
                      }}
                      disabled={isLoading}
                    >
                      필터 초기화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 기기 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>기기 고장 상태 관리</CardTitle>
                <CardDescription>
                  기기의 고장 상태를 관리할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredOutOfOrderDevices.map((device) => (
                    <div
                      key={device.name}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-3 h-3 rounded-full ${device.outOfOrder ? "bg-red-500" : "bg-green-500"
                            }`}
                        />
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-gray-500">
                            {device.type === "WASHER" ? "세탁기" : "건조기"}{" "}
                            {device.floor}층
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            device.outOfOrder ? "destructive" : "secondary"
                          }
                        >
                          {device.outOfOrder ? "고장" : "정상"}
                        </Badge>
                        <Button
                          variant={
                            device.outOfOrder ? "default" : "destructive"
                          }
                          size="sm"
                          onClick={() =>
                            handleToggleOutOfOrder(
                              device.name,
                              device.outOfOrder
                            )
                          }
                          disabled={isLoading}
                        >
                          {device.outOfOrder ? (
                            <>
                              <Wrench className="h-4 w-4 mr-1" />
                              수리 완료
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              고장 등록
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredOutOfOrderDevices.length === 0 && (
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">표시할 기기가 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 예약 관리 탭 */}
          <TabsContent value="reservations" className="space-y-6">
            {/* 필터 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  필터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reservation-search">검색</Label>
                    <Input
                      id="reservation-search"
                      placeholder="기기명 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reservation-type">기기 유형</Label>
                    <Select
                      value={reservationTypeFilter}
                      onValueChange={(value) =>
                        setReservationTypeFilter(
                          value as "ALL" | "WASHER" | "DRYER"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">전체</SelectItem>
                        <SelectItem value="WASHER">세탁기</SelectItem>
                        <SelectItem value="DRYER">건조기</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setReservationTypeFilter("ALL");
                      }}
                    >
                      필터 초기화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 예약 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>활성 예약 관리</CardTitle>
                <CardDescription>
                  현재 진행 중인 모든 예약을 관리할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAdminReservations.map((reservation) => (
                    <div
                      key={reservation.reservationId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                          {reservation.machineLabel.includes("Washer")
                            ? "🧺"
                            : "🌪️"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {reservation.machineLabel}
                          </p>
                          <p className="text-sm text-gray-500">
                            시작:{" "}
                            {new Date(reservation.startTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            남은 시간: {reservation.remainingTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            reservation.status === "WAITING"
                              ? "secondary"
                              : reservation.status === "RUNNING"
                                ? "default"
                                : "outline"
                          }
                        >
                          {reservation.status === "WAITING"
                            ? "대기"
                            : reservation.status === "RUNNING"
                              ? "사용중"
                              : reservation.status}
                        </Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleForceDeleteReservation(
                              reservation.reservationId
                            )
                          }
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          강제 삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredAdminReservations.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">활성 예약이 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 신고 관리 탭 */}
          <TabsContent value="reports" className="space-y-6">
            {/* 필터 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  필터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="report-search">검색</Label>
                    <Input
                      id="report-search"
                      placeholder="기기명, 사용자명, 내용 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="report-status">상태</Label>
                    <Select
                      value={reportStatusFilter}
                      onValueChange={(value) =>
                        setReportStatusFilter(
                          value as
                          | "ALL"
                          | "PENDING"
                          | "IN_PROGRESS"
                          | "RESOLVED"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">전체</SelectItem>
                        <SelectItem value="PENDING">대기</SelectItem>
                        <SelectItem value="IN_PROGRESS">처리중</SelectItem>
                        <SelectItem value="RESOLVED">완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setReportStatusFilter("ALL");
                      }}
                      disabled={isLoading}
                    >
                      필터 초기화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 신고 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>고장 신고 관리</CardTitle>
                <CardDescription>
                  사용자가 신고한 기기 고장을 관리할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.reportId}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle
                            className={`h-5 w-5 ${report.status === "PENDING"
                                ? "text-red-500"
                                : report.status === "IN_PROGRESS"
                                  ? "text-yellow-500"
                                  : "text-green-500"
                              }`}
                          />
                          <div>
                            <p className="font-medium">{report.machineName}</p>
                            <p className="text-sm text-gray-500">
                              신고자: {report.reportedByUserName} (
                              {report.reportedByUserNumber})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              report.status === "PENDING"
                                ? "destructive"
                                : report.status === "IN_PROGRESS"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {report.status === "PENDING"
                              ? "대기"
                              : report.status === "IN_PROGRESS"
                                ? "처리중"
                                : "완료"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReportId(report.reportId);
                              setSelectedReportStatus(report.status);
                              setIsReportStatusDialogOpen(true);
                            }}
                            disabled={isLoading}
                          >
                            상태 변경
                          </Button>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm">{report.description}</p>
                      </div>
                      {report.resolvedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          해결 완료:{" "}
                          {new Date(report.resolvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                  {filteredReports.length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">신고가 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 사용자 관리 탭 */}
          <TabsContent value="users" className="space-y-6">
            {/* 필터 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  필터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="user-search">검색</Label>
                    <Input
                      id="user-search"
                      placeholder="이름, 학번, 호실 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-gender">성별</Label>
                    <Select
                      value={userGenderFilter}
                      onValueChange={(value) =>
                        setUserGenderFilter(value as "ALL" | "MALE" | "FEMALE")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">전체</SelectItem>
                        <SelectItem value="MALE">남성</SelectItem>
                        <SelectItem value="FEMALE">여성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="user-floor">층</Label>
                    <Select
                      value={userFloorFilter}
                      onValueChange={(value) =>
                        setUserFloorFilter(value as "ALL" | "3" | "4" | "5")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">전체</SelectItem>
                        <SelectItem value="3">3층</SelectItem>
                        <SelectItem value="4">4층</SelectItem>
                        <SelectItem value="5">5층</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setUserGenderFilter("ALL");
                        setUserFloorFilter("ALL");
                      }}
                    >
                      필터 초기화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 사용자 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>사용자 관리</CardTitle>
                <CardDescription>
                  사용자의 정지 상태를 관리할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAdminUsers.map((user) => {
                    const restricted = isUserRestricted(user);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">
                              {user.schoolNumber} • {user.roomName}호 •{" "}
                              {user.gender === "MALE" ? "남성" : "여성"}
                            </p>
                            {/* 정지 상태 표시 */}
                            {restricted && (
                              <div className="mt-1">
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  정지 중
                                </Badge>
                                <p className="text-xs text-red-600 mt-1 font-mono">
                                  남은 시간:{" "}
                                  {getRestrictedTimeRemaining(
                                    user.restrictedUntil!
                                  )}
                                </p>
                                {user.restrictionReason && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    사유: {user.restrictionReason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!restricted ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsRestrictDialogOpen(true);
                              }}
                              disabled = {isLoading}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              정지
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsUnrestrictDialogOpen(true);
                              }}
                              disabled = {isLoading}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              정지 해제
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredAdminUsers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">사용자가 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 신고 상태 변경 다이얼로그 */}
        <Dialog
          open={isReportStatusDialogOpen}
          onOpenChange={setIsReportStatusDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>신고 상태 변경</DialogTitle>
              <DialogDescription>
                신고의 처리 상태를 변경합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-status-select">상태</Label>
                <Select
                  value={selectedReportStatus}
                  onValueChange={(value) =>
                    setSelectedReportStatus(
                      value as "PENDING" | "IN_PROGRESS" | "RESOLVED"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">대기</SelectItem>
                    <SelectItem value="IN_PROGRESS">처리중</SelectItem>
                    <SelectItem value="RESOLVED">완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsReportStatusDialogOpen(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button onClick={handleUpdateReportStatus} disabled={isLoading}>
                변경
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 사용자 정지 다이얼로그 */}
        <Dialog
          open={isRestrictDialogOpen}
          onOpenChange={setIsRestrictDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>사용자 정지</DialogTitle>
              <DialogDescription>
                사용자의 서비스 이용을 일시적으로 정지합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="restriction-duration">정지 기간</Label>
                <Select
                  value={restrictionDuration}
                  onValueChange={(value) =>
                    setRestrictionDuration(value as "1시간" | "1일" | "7일")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1시간">1시간</SelectItem>
                    <SelectItem value="1일">1일</SelectItem>
                    <SelectItem value="7일">7일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="restriction-reason">정지 이유</Label>
                <Input
                  id="restriction-reason"
                  placeholder="정지 이유를 입력하세요..."
                  value={restrictionReason}
                  onChange={(e) => setRestrictionReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRestrictDialogOpen(false)}
              >
                취소
              </Button>
              <Button variant="destructive" onClick={handleRestrictUser} disabled={isLoading}>
                정지
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 사용자 정지 해제 다이얼로그 */}
        <Dialog
          open={isUnrestrictDialogOpen}
          onOpenChange={setIsUnrestrictDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>정지 해제</DialogTitle>
              <DialogDescription>
                사용자의 정지 상태를 해제합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUnrestrictDialogOpen(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button onClick={handleUnrestrictUser} disabled={isLoading}>
                해제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
