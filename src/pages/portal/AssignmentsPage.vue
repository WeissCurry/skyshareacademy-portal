<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAccessStore } from "@/stores/access";
import { apiClient } from "@/api/client";
import { useAlert } from "@/composables/useAlert";
import AppBadge from "@/components/common/AppBadge.vue";
import AppButton from "@/components/common/AppButton.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import AppEmptyState from "@/components/common/AppEmptyState.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppSelect from "@/components/common/AppSelect.vue";
import AppPage from "@/components/common/AppPage.vue";
import type { ProgramAssignment, ProgramProgressData } from "@/types";
import { animatePageEntrance, animateCounter } from "@/utils/animations";

const accessStore = useAccessStore();
const toast = useAlert();
const router = useRouter();
const containerRef = ref<HTMLElement | null>(null);

// Selected program
const activeProgramId = ref<number | null>(null);
const assignments = ref<ProgramAssignment[]>([]);
const progressData = ref<ProgramProgressData | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

let abortController: AbortController | null = null;
let lastLoadedProgramId: number | null = null;

// Animated counter values for HUD
const displayTotalCount = ref(0);
const displayAcceptedCount = ref(0);
const displaySubmittedCount = ref(0);
const displayRevisionCount = ref(0);
const displayProgressPercentage = ref(0);

// GSAP cleanup holders
let entranceCtx: { revert: () => void } | null = null;
let counterTweens: any[] = [];

// Upload state per assignment
const submissionFiles = ref<Record<number, File>>({});
const submissionNotes = ref<Record<number, string>>({});
const isSubmitting = ref<Record<number, boolean>>({});
const openUploadFor = ref<number | null>(null);

// Active programs options
const programs = computed(() => accessStore.activePrograms);

// Progress Summary Computations
const totalCount = computed(() => assignments.value.length);
const acceptedCount = computed(
  () => assignments.value.filter((a) => a.submission?.status === "accepted").length
);
const submittedCount = computed(
  () => assignments.value.filter((a) => a.submission?.status === "submitted").length
);
const revisionCount = computed(
  () => assignments.value.filter((a) => a.submission?.status === "revision").length
);

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((acceptedCount.value / totalCount.value) * 100);
});

const averageGrade = computed(() => {
  const graded = assignments.value.filter(
    (a) => a.submission?.admin_grade !== undefined && a.submission?.admin_grade !== null
  );
  if (graded.length === 0) return null;
  const sum = graded.reduce((acc, curr) => acc + (curr.submission?.admin_grade || 0), 0);
  return Math.round(sum / graded.length);
});

// P2-3: Indonesian date and time formatting
const formatIndonesianDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Load assignments and progress for program
const loadAssignments = async (programId: number, force = false) => {
  // C7: Avoid duplicate fetch on mount if already loaded the same program
  if (!force && lastLoadedProgramId === programId && !errorMessage.value && assignments.value.length > 0) {
    return;
  }

  // C9: Abort previous in-flight fetch
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  const signal = abortController.signal;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const [asgRes, progRes] = await Promise.allSettled([
      apiClient.get<{
        status: string;
        data: any[];
      }>(`/portal/programs/${programId}/assignments`, { signal }),
      apiClient.get<{
        status: string;
        data: ProgramProgressData;
      }>(`/portal/programs/${programId}/progress`, { signal }),
    ]);

    if (signal.aborted) return;

    if (asgRes.status === "fulfilled") {
      const rawList = asgRes.value.data?.data || [];
      assignments.value = rawList.map((a: any) => ({
        ...a,
        submission: a.submission ?? a.my_submission ?? null,
      }));
    } else {
      assignments.value = [];
    }

    if (progRes.status === "fulfilled") {
      progressData.value = progRes.value.data?.data || null;
    } else {
      progressData.value = null;
    }

    lastLoadedProgramId = programId;
  } catch (err: any) {
    if (axios.isCancel(err) || err.name === "CanceledError") {
      return;
    }
    errorMessage.value =
      err.response?.data?.message || err.message || "Gagal memuat tugas program.";
  } finally {
    if (!signal.aborted) {
      isLoading.value = false;
    }
  }
};

const runEntranceAndCounters = async () => {
  await nextTick();
  if (containerRef.value) {
    entranceCtx?.revert();
    entranceCtx = animatePageEntrance(containerRef.value, ".assignment-card");
  }

  // Clear previous counter tweens
  counterTweens.forEach((t) => t?.kill());
  counterTweens = [];

  const totalTarget = { value: displayTotalCount.value };
  const totalTween = animateCounter(
    totalTarget,
    totalCount.value,
    () => {
      displayTotalCount.value = Math.round(totalTarget.value);
    },
    1.0
  );
  if (totalTween) counterTweens.push(totalTween);

  const acceptedTarget = { value: displayAcceptedCount.value };
  const acceptedTween = animateCounter(
    acceptedTarget,
    acceptedCount.value,
    () => {
      displayAcceptedCount.value = Math.round(acceptedTarget.value);
    },
    1.0
  );
  if (acceptedTween) counterTweens.push(acceptedTween);

  const submittedTarget = { value: displaySubmittedCount.value };
  const submittedTween = animateCounter(
    submittedTarget,
    submittedCount.value,
    () => {
      displaySubmittedCount.value = Math.round(submittedTarget.value);
    },
    1.0
  );
  if (submittedTween) counterTweens.push(submittedTween);

  const revisionTarget = { value: displayRevisionCount.value };
  const revisionTween = animateCounter(
    revisionTarget,
    revisionCount.value,
    () => {
      displayRevisionCount.value = Math.round(revisionTarget.value);
    },
    1.0
  );
  if (revisionTween) counterTweens.push(revisionTween);

  const progressTarget = { value: displayProgressPercentage.value };
  const progressTween = animateCounter(
    progressTarget,
    progressPercentage.value,
    () => {
      displayProgressPercentage.value = Math.round(progressTarget.value);
    },
    1.2
  );
  if (progressTween) counterTweens.push(progressTween);
};

// Handle file selection
const handleFileChange = (assignmentId: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const validExtensions = [".pdf", ".zip"];
  const isPdfOrZip =
    validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)) ||
    file.type === "application/pdf" ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed";

  if (!isPdfOrZip) {
    toast.error("Berkas tugas wajib berformat PDF atau ZIP.", "Format Berkas Tidak Sesuai");
    return;
  }

  // Max 25 MB per contract §7.2
  if (file.size > 25 * 1024 * 1024) {
    toast.error("Ukuran berkas tugas maksimal 25 MB.", "Berkas Terlalu Besar");
    return;
  }

  submissionFiles.value[assignmentId] = file;
};

// Submit assignment answer
const handleSubmit = async (assignment: ProgramAssignment) => {
  const file = submissionFiles.value[assignment.id];
  if (!file) {
    toast.error("Silakan pilih berkas PDF atau ZIP tugas terlebih dahulu.", "Pilih Berkas");
    return;
  }

  isSubmitting.value[assignment.id] = true;

  try {
    const formData = new FormData();
    formData.append("file", file);
    if (submissionNotes.value[assignment.id]) {
      formData.append("notes", submissionNotes.value[assignment.id].trim());
    }

    const res = await apiClient.post<{
      status: string;
      message?: string;
      data: any;
    }>(`/portal/assignments/${assignment.id}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success(
      res.data?.message || "Tugas berhasil dikumpulkan. Menunggu evaluasi nilai dari admin.",
      "Tugas Terkumpul"
    );

    // Close upload accordion and reload
    openUploadFor.value = null;
    delete submissionFiles.value[assignment.id];
    delete submissionNotes.value[assignment.id];

    if (activeProgramId.value) {
      await loadAssignments(activeProgramId.value);
      await runEntranceAndCounters();
    }
  } catch (err: any) {
    const msg =
      err.response?.data?.message || err.message || "Gagal mengumpulkan lembar tugas.";
    toast.error(msg, "Pengumpulan Gagal");
  } finally {
    isSubmitting.value[assignment.id] = false;
  }
};

const selectProgram = async (programId: number) => {
  activeProgramId.value = programId;
  await loadAssignments(programId, true);
  await runEntranceAndCounters();
};

onMounted(async () => {
  if (accessStore.activePrograms.length > 0) {
    const initialId = accessStore.activePrograms[0].program_id;
    activeProgramId.value = initialId;
    await loadAssignments(initialId);
    await runEntranceAndCounters();
  } else {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  entranceCtx?.revert();
  counterTweens.forEach((t) => t?.kill());
  counterTweens = [];
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
});
</script>

<template>
  <AppPage
    width="content"
    title="Penugasan & Progres Belajar"
    subtitle="SUBMISSION // ASSIGNMENT EVALUATION & ADMIN FEEDBACK LOG"
    status-led="info"
  >
    <!-- Program Selector Dropdown -->
    <template v-if="programs.length > 1" #actions>
      <AppSelect
        :model-value="activeProgramId"
        label="Filter Program"
        @change="(e) => selectProgram(Number((e.target as HTMLSelectElement).value))"
      >
        <option
          v-for="prog in programs"
          :key="prog.program_id"
          :value="prog.program_id"
        >
          {{ prog.title }}
        </option>
      </AppSelect>
    </template>

    <!-- Error state -->
    <template #alerts>
      <div v-if="errorMessage">
        <AppAlert
          variant="error"
          title="Gagal Memuat Tugas"
          :message="errorMessage"
          dismissible
          @close="errorMessage = null"
        />
      </div>
    </template>

    <!-- Empty State: No active program -->
    <div v-if="programs.length === 0">
      <AppEmptyState
        title="Belum Ada Program Aktif"
        description="Penugasan program hanya dapat diakses setelah pendaftaran program Anda berstatus aktif. Silakan pilih dan daftar program terlebih dahulu."
        action-text="Lihat Katalog Program &rarr;"
        @action="router.push('/programs')"
      />
    </div>

    <!-- Main Content when active programs exist -->
    <div v-else ref="containerRef" class="space-y-6">
      <!-- Loading Skeleton (Mirrors HUD Metrics + Assignment Cards) -->
      <div v-if="isLoading" class="space-y-6">
        <div class="chassis-panel rounded-3xl p-6 sm:p-7 corner-screws space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300/80">
            <div class="flex items-center gap-2">
              <AppSkeleton variant="circle" class="size-2.5" />
              <AppSkeleton variant="line" class="w-64 h-4" />
            </div>
            <AppSkeleton variant="line" class="w-24 h-3" />
          </div>

          <!-- 4 Metric Cards Skeleton -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div v-for="i in 4" :key="i" class="p-3.5 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/40 space-y-2">
              <AppSkeleton variant="line" class="w-20 h-3 uppercase" />
              <AppSkeleton variant="line" class="w-12 h-7" />
            </div>
          </div>

          <!-- Progress Bar Skeleton -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <AppSkeleton variant="line" class="w-48 h-3.5" />
              <AppSkeleton variant="line" class="w-20 h-3.5" />
            </div>
            <AppSkeleton variant="block" class="w-full h-3 rounded-full" />
          </div>
        </div>

        <!-- Assignments Card Skeletons -->
        <div class="space-y-4">
          <div v-for="i in 3" :key="i" class="chassis-panel rounded-3xl p-6 sm:p-8 corner-screws space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-300/80">
              <div class="space-y-2 flex-1">
                <AppSkeleton variant="line" class="w-32 h-5 rounded-md" />
                <AppSkeleton variant="line" class="w-3/5 h-6" />
                <AppSkeleton variant="line" class="w-44 h-3.5" />
              </div>
              <AppSkeleton variant="line" class="w-28 h-4" />
            </div>
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-full h-4" />
              <AppSkeleton variant="line" class="w-4/5 h-4" />
            </div>
            <div class="pt-2 flex justify-start">
              <AppSkeleton variant="block" class="w-36 h-9 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <!-- Real Loaded Content -->
      <div v-else class="space-y-6">
        <!-- Progress Summary Hardware HUD Panel -->
        <section class="chassis-panel rounded-3xl p-6 sm:p-7 corner-screws space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300/80">
            <span class="font-mono text-xs font-bold text-[#1E5FAD] uppercase tracking-wider flex items-center gap-2">
              <span class="size-1.5 rounded-full bg-[#38BDF8]"></span>
              RINGKASAN PROGRES EVALUASI PROGRAM
            </span>
            <span class="font-mono text-[10px] text-slate-400">
              METRICS // HUD-01
            </span>
          </div>

          <!-- 4 Metric Stat Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <!-- Total -->
            <div class="p-3.5 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/40">
              <span class="font-mono text-[10px] text-slate-500 uppercase block">TOTAL TUGAS</span>
              <span class="font-mono text-xl sm:text-2xl font-bold text-slate-800">
                {{ displayTotalCount }}
              </span>
            </div>

            <!-- Accepted / Completed -->
            <div class="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-300 shadow-sm">
              <span class="font-mono text-[10px] text-emerald-700 uppercase block font-bold">LULUS / SELESAI</span>
              <span class="font-mono text-xl sm:text-2xl font-bold text-emerald-800">
                {{ displayAcceptedCount }}
              </span>
            </div>

            <!-- In Review / Submitted -->
            <div class="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 shadow-sm">
              <span class="font-mono text-[10px] text-amber-700 uppercase block font-bold">DALAM REVIEW</span>
              <span class="font-mono text-xl sm:text-2xl font-bold text-amber-800">
                {{ displaySubmittedCount }}
              </span>
            </div>

            <!-- Revision Needed -->
            <div class="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-300 shadow-sm">
              <span class="font-mono text-[10px] text-rose-700 uppercase block font-bold">PERLU REVISI</span>
              <span class="font-mono text-xl sm:text-2xl font-bold text-rose-800">
                {{ displayRevisionCount }}
              </span>
            </div>
          </div>

          <!-- Progress Percentage Bar with Mechanical Ticks -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs font-mono">
              <span class="font-bold text-slate-700">PERSENTASE KELULUSAN TUGAS</span>
              <span class="font-bold text-[#1E5FAD]">{{ displayProgressPercentage }}% SELESAI</span>
            </div>

            <!-- Recessed Progress Track -->
            <div class="h-3 w-full bg-[#d7e0ec] rounded-full shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] p-0.5 overflow-hidden">
              <div
                class="h-full bg-linear-to-r from-[#2a7bd9] to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
                :style="{ width: `${displayProgressPercentage}%` }"
              />
            </div>
          </div>

          <!-- Average Grade if available -->
          <div v-if="averageGrade !== null" class="pt-2 flex items-center justify-between font-mono text-xs">
            <span class="text-slate-500">RATA-RATA NILAI AKHIR (SKALA 0 - 100):</span>
            <span class="text-base font-bold text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-lg border border-emerald-300">
              [ {{ averageGrade }} / 100 ]
            </span>
          </div>
        </section>

        <!-- Presensi Sesi Kehadiran (Phase 2 Progress) -->
        <div v-if="progressData?.attendance" class="chassis-panel rounded-3xl p-5 sm:p-7 corner-screws space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-300/80">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-[#1E5FAD] animate-pulse"></span>
              <span class="font-mono text-xs font-bold text-slate-800 tracking-wider uppercase">
                PRESENSI SESI COHORT // KEHADIRAN
              </span>
            </div>
            <span class="font-mono text-xs font-bold text-[#1E5FAD] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {{ progressData.attendance.attended_sessions }} / {{ progressData.attendance.total_sessions }} SESI HADIR ({{ progressData.attendance.attendance_rate }}%)
            </span>
          </div>

          <!-- Attendance Bar -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center font-mono text-[11px] text-slate-600">
              <span>Tingkat Kehadiran:</span>
              <span class="font-bold text-slate-800">{{ progressData.attendance.attendance_rate }}%</span>
            </div>
            <div class="h-2.5 w-full bg-[#d7e0ec] rounded-full shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] p-0.5 overflow-hidden">
              <div
                class="h-full bg-linear-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                :style="{ width: `${Math.min(100, Math.max(0, progressData.attendance.attendance_rate))}%` }"
              />
            </div>
          </div>

          <!-- Sessions Chips -->
          <div v-if="progressData.attendance.sessions?.length" class="flex flex-wrap gap-2 pt-1">
            <div
              v-for="s in progressData.attendance.sessions"
              :key="s.event_id"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono border"
              :class="[
                s.attended
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              ]"
            >
              <span>{{ s.attended ? '✓' : '○' }}</span>
              <span class="truncate max-w-[160px]">{{ s.title }}</span>
              <span v-if="s.attended" class="text-[9px] text-emerald-700 font-bold">[HADIR]</span>
            </div>
          </div>
        </div>

        <!-- Assessment Result & Kelulusan Jenjang Banner -->
        <div
          v-if="progressData?.assessment"
          class="chassis-panel rounded-3xl p-5 sm:p-7 corner-screws space-y-3 border-2"
          :class="[
            progressData.assessment.status === 'PASSED'
              ? 'border-emerald-400 bg-emerald-50/60 shadow-[0_4px_12px_rgba(16,185,129,0.15)]'
              : progressData.assessment.status === 'FAILED'
              ? 'border-rose-400 bg-rose-50/60 shadow-[0_4px_12px_rgba(244,63,94,0.15)]'
              : 'border-amber-400 bg-amber-50/60 shadow-[0_4px_12px_rgba(245,158,11,0.15)]'
          ]"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300/80">
            <div class="flex items-center gap-2">
              <span
                class="size-2.5 rounded-full"
                :class="[
                  progressData.assessment.status === 'PASSED'
                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                    : progressData.assessment.status === 'FAILED'
                    ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                    : 'bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse'
                ]"
              ></span>
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                EVALUASI KELULUSAN JENJANG // {{ progressData.program?.level || progressData.program?.category || 'PROGRAM' }}
              </span>
            </div>

            <AppBadge
              :variant="
                progressData.assessment.status === 'PASSED'
                  ? 'success'
                  : progressData.assessment.status === 'FAILED'
                  ? 'danger'
                  : 'warning'
              "
              size="md"
            >
              {{
                progressData.assessment.status === 'PASSED'
                  ? 'LULUS JENJANG ✓'
                  : progressData.assessment.status === 'FAILED'
                  ? 'TIDAK LULUS'
                  : 'MENUNGGU PENILAIAN'
              }}
            </AppBadge>
          </div>

          <div class="space-y-1.5 pt-1">
            <p v-if="progressData.assessment.note" class="text-xs sm:text-sm text-slate-800 font-sans leading-relaxed">
              Catatan Evaluator: <strong>{{ progressData.assessment.note }}</strong>
            </p>
            <p v-else class="text-xs text-slate-500 italic font-sans">
              Penilaian kelulusan akhir akan diberikan oleh evaluator/admin setelah seluruh sesi dan tugas dievaluasi.
            </p>

            <p v-if="progressData.assessment.assessed_at" class="font-mono text-[10px] text-slate-500">
              Waktu Evaluasi: {{ formatIndonesianDateTime(progressData.assessment.assessed_at) }}
            </p>
          </div>
        </div>

        <!-- Assignments List -->
        <div v-if="assignments.length === 0">
          <AppEmptyState
            title="Belum Ada Penugasan"
            description="Saat ini belum ada tugas yang dipublikasikan untuk program ini. Silakan periksa kembali nanti."
          />
        </div>

        <div v-else class="space-y-6">
        <article
          v-for="item in assignments"
          :key="item.id"
          class="assignment-card chassis-panel rounded-3xl p-6 sm:p-8 corner-screws space-y-5"
        >
          <!-- Header Bar -->
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-300/80">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Status Badge -->
                <AppBadge
                  v-if="item.submission?.status === 'accepted'"
                  variant="success"
                  size="sm"
                >
                  DISERAHKAN & LULUS
                </AppBadge>
                <AppBadge
                  v-else-if="item.submission?.status === 'submitted'"
                  variant="warning"
                  size="sm"
                >
                  MENUNGGU PENILAIAN
                </AppBadge>
                <AppBadge
                  v-else-if="item.submission?.status === 'revision'"
                  variant="danger"
                  size="sm"
                >
                  PERLU REVISI
                </AppBadge>
                <AppBadge
                  v-else
                  variant="neutral"
                  size="sm"
                >
                  BELUM DIKUMPULKAN
                </AppBadge>

                <span class="font-mono text-[10px] text-slate-400">
                  ID // #{{ item.id }}
                </span>
              </div>

              <h2 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {{ item.title }}
              </h2>
            </div>

            <div v-if="item.due_date" class="font-mono text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 shrink-0 self-start sm:self-auto">
              DEADLINE // {{ formatIndonesianDateTime(item.due_date) }}
            </div>
          </div>

          <!-- Instructions -->
          <div class="p-4 bg-white/60 rounded-2xl border border-slate-200/80 space-y-2">
            <span class="font-mono text-[10px] font-bold text-slate-500 uppercase block">
              INSTRUKSI TUGAS:
            </span>
            <p class="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line">
              {{ item.instructions }}
            </p>
          </div>

          <!-- SUBMISSION STATUS STATES -->
          <!-- State 1: Accepted with Grade & Admin Feedback -->
          <div v-if="item.submission?.status === 'accepted'" class="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-300 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span class="font-mono text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
                EVALUASI ADMIN SELESAI
              </span>

              <!-- Grade Readout -->
              <span class="font-mono text-sm font-extrabold text-emerald-900 bg-emerald-200/80 px-3 py-1 rounded-xl border border-emerald-400">
                NILAI: [ {{ item.submission.admin_grade !== null ? item.submission.admin_grade : '-' }} / 100 ]
              </span>
            </div>

            <!-- Feedback Quote -->
            <div v-if="item.submission.admin_feedback" class="p-3 bg-white/80 rounded-xl border border-emerald-200 font-sans text-xs text-slate-700 leading-relaxed">
              <span class="font-mono text-[10px] font-bold text-emerald-700 block mb-1">CATATAN & FEEDBACK ADMIN:</span>
              "{{ item.submission.admin_feedback }}"
            </div>

            <div class="font-mono text-[10px] text-slate-500 flex justify-between pt-1">
              <span>BERKAS: {{ item.submission.file_name }}</span>
              <span>DIKUMPULKAN: {{ formatIndonesianDateTime(item.submission.submitted_at) }}</span>
            </div>
          </div>

          <!-- State 2: Submitted (In Review) -->
          <div v-else-if="item.submission?.status === 'submitted'" class="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-2">
            <div class="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <span class="size-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b] animate-pulse"></span>
              <span>Lembar tugas telah dikirim ke admin. Menunggu penilaian dan masukan.</span>
            </div>
            <div class="font-mono text-[10px] text-slate-500 flex justify-between">
              <span>BERKAS // {{ item.submission.file_name }}</span>
              <span>WAKTU // {{ formatIndonesianDateTime(item.submission.submitted_at) }}</span>
            </div>
          </div>

          <!-- State 3: Revision Needed (Feedback + Resubmit) -->
          <div v-else-if="item.submission?.status === 'revision'" class="p-5 rounded-2xl bg-rose-50/80 border border-rose-300 space-y-4">
            <div>
              <div class="flex items-center gap-2 text-rose-900 font-bold text-xs mb-1">
                <span class="size-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"></span>
                <span>Tugas Perlu Revisi</span>
              </div>
              <p class="text-xs text-rose-800 font-sans leading-relaxed">
                Catatan Evaluasi Admin: <strong>"{{ item.submission.admin_feedback || 'Mohon sesuaikan dengan kriteria instruksi penugasan.' }}"</strong>
              </p>
            </div>

            <!-- Toggle Re-upload form -->
            <div class="pt-2 border-t border-rose-200">
              <AppButton
                v-if="openUploadFor !== item.id"
                variant="danger"
                size="sm"
                @click="openUploadFor = item.id"
              >
                Buka Form Unggah Lembar Revisi &rarr;
              </AppButton>
            </div>
          </div>

          <!-- State 4: Not submitted yet -->
          <div v-else class="pt-2">
            <AppButton
              v-if="openUploadFor !== item.id"
              variant="primary"
              size="sm"
              @click="openUploadFor = item.id"
            >
              Kumpulkan Tugas Ini &rarr;
            </AppButton>
          </div>

          <!-- Upload Form (Accordion) -->
          <div
            v-if="openUploadFor === item.id"
            class="p-5 rounded-2xl bg-[#d7e0ec] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] border border-white/50 space-y-4"
          >
            <div class="flex items-center justify-between pb-2 border-b border-slate-300">
              <span class="font-mono text-xs font-bold text-[#1E5FAD] uppercase">
                FORMULIR PENGUNGGAHAN BERKAS TUGAS (PDF / ZIP)
              </span>
              <button
                type="button"
                class="text-xs text-slate-500 hover:text-slate-800 font-mono font-bold cursor-pointer"
                @click="openUploadFor = null"
              >
                ✕ Batal
              </button>
            </div>

            <!-- File Input -->
            <div class="space-y-2">
              <label class="font-mono text-[11px] uppercase tracking-wider font-bold text-slate-700 block">
                Pilih Berkas Lembar Kerja:
              </label>
              <input
                type="file"
                accept=".pdf,.zip,application/pdf,application/zip"
                class="w-full min-w-0 max-w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-[#1E5FAD] file:text-white cursor-pointer"
                @change="handleFileChange(item.id, $event)"
              />
              <p class="font-mono text-[10px] text-slate-500">
                Format yang diterima: PDF atau ZIP (Maksimal 25 MB)
              </p>
            </div>

            <!-- Notes Input -->
            <div class="space-y-1.5">
              <label class="font-mono text-[11px] uppercase tracking-wider font-bold text-slate-700 block">
                Catatan Tambahan untuk Admin (Opsional):
              </label>
              <textarea
                v-model="submissionNotes[item.id]"
                rows="2"
                placeholder="Tuliskan catatan pengerjaan, ringkasan, atau tautan repositori tambahan jika ada..."
                class="w-full p-3 rounded-xl bg-white/80 border border-slate-300 text-xs font-sans text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#38BDF8]"
              ></textarea>
            </div>

            <!-- Submit Action -->
            <div class="flex justify-end gap-3 pt-2">
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                @click="openUploadFor = null"
              >
                Batal
              </AppButton>
              <AppButton
                type="button"
                variant="primary"
                size="sm"
                :loading="isSubmitting[item.id]"
                :disabled="!submissionFiles[item.id]"
                @click="handleSubmit(item)"
              >
                Kirim Lembar Tugas
              </AppButton>
            </div>
          </div>
        </article>
      </div>
      </div>
    </div>
  </AppPage>
</template>
