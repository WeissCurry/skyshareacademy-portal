import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  AccessResponseData,
  ActiveProgramInfo,
  PendingOrderInfo,
  ProgramAssessmentSnapshot,
  KycStatus,
  PortalRole,
} from "@/types";
import { apiClient } from "@/api/client";

export const useAccessStore = defineStore("access", () => {
  // State is purely in-memory: NEVER persisted to localStorage or derived on client
  const roles = ref<PortalRole[]>(["visitor"]);
  const effectiveRole = ref<string>("visitor");
  const isContributor = ref<boolean>(false);
  const pointsBalance = ref<number>(0);
  const assessments = ref<ProgramAssessmentSnapshot[]>([]);

  const kyc = ref<{
    status: KycStatus;
    reject_reason: string | null;
    submitted_at: string | null;
  } | null>(null);

  const activePrograms = ref<ActiveProgramInfo[]>([]);
  const pendingOrders = ref<PendingOrderInfo[]>([]);
  const isLoaded = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const kycStatus = computed<KycStatus>(() => kyc.value?.status || "REGISTERED");
  const isApprovedKyc = computed(() => kyc.value?.status === "APPROVED");
  const hasActivePrograms = computed(() => activePrograms.value.length > 0);
  const hasFullAccess = computed(
    () => isApprovedKyc.value && hasActivePrograms.value
  );
  const activeProgramIds = computed(() =>
    activePrograms.value.map((p) => p.program_id)
  );

  // Derived role checks
  const isMentor = computed(() => roles.value.includes("mentor") || effectiveRole.value === "mentor");
  const isParent = computed(() => roles.value.includes("parent") || effectiveRole.value === "parent");
  const isTalent = computed(() => roles.value.includes("talent") || effectiveRole.value === "talent");
  const isVerifiedVisitor = computed(
    () => roles.value.includes("verified_visitor") || (roles.value.includes("visitor") && isApprovedKyc.value)
  );
  const isVisitorOnly = computed(
    () => !isMentor.value && !isParent.value && !isTalent.value
  );

  const displayRoleLabel = computed(() => {
    if (isMentor.value) return "Mentor";
    if (isParent.value) return "Parent";
    if (isTalent.value) return "Talent";
    if (isVerifiedVisitor.value) return "Verified Visitor";
    return "Visitor";
  });

  const displayRoleBadgeVariant = computed(() => {
    if (isMentor.value) return "mentor" as const;
    if (isParent.value) return "warning" as const;
    if (isTalent.value) return "neutral" as const;
    if (isVerifiedVisitor.value) return "success" as const;
    return "neutral" as const;
  });

  const isEnrolledInProgram = (programId: number) => {
    return activePrograms.value.some((p) => p.program_id === programId);
  };

  const hasPassedLevel = (category: string, level: string) => {
    return assessments.value.some(
      (a) =>
        a.category?.toUpperCase() === category.toUpperCase() &&
        a.level?.toUpperCase() === level.toUpperCase() &&
        a.result === "PASSED"
    );
  };

  let inFlightFetch: Promise<AccessResponseData | null> | null = null;

  const fetchAccess = async (): Promise<AccessResponseData | null> => {
    if (inFlightFetch) {
      return inFlightFetch;
    }

    inFlightFetch = (async () => {
      isLoading.value = true;
      error.value = null;
      try {
        const res = await apiClient.get<{
          status: string;
          errors?: boolean;
          data: AccessResponseData;
        }>("/portal/me/access");

        if (res.data?.data) {
          const d = res.data.data;
          roles.value = d.roles && d.roles.length > 0 ? d.roles : ["visitor"];
          effectiveRole.value = d.effective_role || "visitor";
          isContributor.value = Boolean(d.is_contributor);
          pointsBalance.value = typeof d.points_balance === "number" ? d.points_balance : 0;
          assessments.value = d.assessments || [];

          kyc.value = d.kyc || {
            status: "REGISTERED",
            reject_reason: null,
            submitted_at: null,
          };
          activePrograms.value = d.active_programs || [];
          pendingOrders.value = d.pending_orders || [];
          isLoaded.value = true;
          return d;
        }
        return null;
      } catch (err: unknown) {
        const errorObj = err as {
          response?: { data?: { message?: string }; status?: number };
          message?: string;
        };
        error.value =
          errorObj.response?.data?.message ||
          errorObj.message ||
          "Gagal memuat status akses";
        // If 401 or unauthorized, clear loaded
        if (errorObj.response?.status === 401) {
          reset();
        }
        throw err;
      } finally {
        isLoading.value = false;
        inFlightFetch = null;
      }
    })();

    return inFlightFetch;
  };

  const reset = () => {
    inFlightFetch = null;
    roles.value = ["visitor"];
    effectiveRole.value = "visitor";
    isContributor.value = false;
    pointsBalance.value = 0;
    assessments.value = [];
    kyc.value = null;
    activePrograms.value = [];
    pendingOrders.value = [];
    isLoaded.value = false;
    isLoading.value = false;
    error.value = null;
  };

  return {
    roles,
    effectiveRole,
    isContributor,
    pointsBalance,
    assessments,
    kyc,
    activePrograms,
    pendingOrders,
    isLoaded,
    isLoading,
    error,
    kycStatus,
    isApprovedKyc,
    hasActivePrograms,
    hasFullAccess,
    activeProgramIds,
    isMentor,
    isParent,
    isTalent,
    isVerifiedVisitor,
    isVisitorOnly,
    displayRoleLabel,
    displayRoleBadgeVariant,
    isEnrolledInProgram,
    hasPassedLevel,
    fetchAccess,
    reset,
  };
});
