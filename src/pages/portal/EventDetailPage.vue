<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiClient } from "@/api/client";
import { useAlert } from "@/composables/useAlert";
import AppButton from "@/components/common/AppButton.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppPage from "@/components/common/AppPage.vue";
import type { PortalEvent, TaskSubmission } from "@/types";
import { animatePageEntrance } from "@/utils/animations";
import { resolveAssetUrl } from "@/utils/url";

const route = useRoute();
const router = useRouter();
const toast = useAlert();

const containerRef = ref<HTMLElement | null>(null);
const event = ref<PortalEvent | null>(null);
const mySubmission = ref<TaskSubmission | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

// OTP Attendance State
const otpCode = ref("");
const isSubmittingOtp = ref(false);
const otpError = ref<string | null>(null);
const attendanceRecorded = ref(false);
const attendedAt = ref<string | null>(null);
const lockoutSeconds = ref(0);
let lockoutInterval: ReturnType<typeof setInterval> | null = null;

let entranceCtx: { revert: () => void } | null = null;

const formatIndonesianDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return dateStr;
  }
};

const runEntrance = async () => {
  await nextTick();
  if (containerRef.value) {
    entranceCtx?.revert();
    entranceCtx = animatePageEntrance(containerRef.value, ".event-detail-module");
  }
};

const loadEventDetail = async (id: number) => {
  if (!id || isNaN(id)) {
    errorMessage.value = "ID sesi acara tidak valid.";
    isLoading.value = false;
    event.value = null;
    mySubmission.value = null;
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const res = await apiClient.get<any>(`/portal/events/${id}`);

    // P0-5 & D11: Unpack nested event and optional mySubmission
    const envelope = res.data?.data;
    const resolvedEvent = envelope?.event ?? envelope ?? null;

    if (!resolvedEvent || !resolvedEvent.title) {
      errorMessage.value = "Data sesi tidak ditemukan atau Anda belum memiliki hak akses pada program cohort ini.";
      event.value = null;
      mySubmission.value = null;
      return;
    }

    event.value = resolvedEvent;
    mySubmission.value = envelope?.mySubmission ?? envelope?.my_submission ?? null;

    if (resolvedEvent.has_attended || resolvedEvent.attended || envelope?.has_attended) {
      attendanceRecorded.value = true;
      attendedAt.value = resolvedEvent.attended_at || envelope?.attended_at || null;
    }
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message ||
      err.message ||
      "Gagal memuat detail sesi event atau Anda belum memiliki hak akses pada program cohort ini.";
    event.value = null;
    mySubmission.value = null;
  } finally {
    isLoading.value = false;
  }
};

const startLockoutTimer = (seconds: number) => {
  lockoutSeconds.value = seconds;
  if (lockoutInterval) clearInterval(lockoutInterval);
  lockoutInterval = setInterval(() => {
    if (lockoutSeconds.value > 0) {
      lockoutSeconds.value--;
    } else {
      if (lockoutInterval) clearInterval(lockoutInterval);
      lockoutInterval = null;
      otpError.value = null;
    }
  }, 1000);
};

const handleOtpSubmit = async () => {
  const code = otpCode.value.trim();
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    otpError.value = "Kode OTP wajib berupa 6 digit angka numerik.";
    return;
  }

  isSubmittingOtp.value = true;
  otpError.value = null;

  try {
    const res = await apiClient.post<{
      status: string;
      message?: string;
      data?: any;
    }>(`/portal/events/${event.value?.id}/attendance`, {
      otp_code: code,
    });

    attendanceRecorded.value = true;
    attendedAt.value = new Date().toISOString();
    toast.success(res.data?.message || "Presensi kehadiran berhasil dicatat!", "Absensi Berhasil");
  } catch (err: any) {
    const status = err.response?.status;
    const errData = err.response?.data;
    const codeStr = errData?.code;
    const msg = errData?.message;

    if (status === 409 || codeStr === "ALREADY_ATTENDED") {
      attendanceRecorded.value = true;
      otpError.value = null;
      toast.info("Anda sudah tercatat hadir pada sesi acara ini.", "Sudah Absen");
    } else if (status === 429 || codeStr === "TOO_MANY_ATTEMPTS") {
      const wait = errData?.data?.retry_after || errData?.retry_after || 60;
      startLockoutTimer(wait);
      otpError.value = `Terlalu banyak percobaan salah. Silakan tunggu ${wait} detik sebelum mencoba lagi.`;
      toast.error(otpError.value, "Akses Terkunci");
    } else if (status === 403) {
      otpError.value = "Anda tidak terdaftar aktif pada program cohort untuk sesi ini.";
      toast.error(otpError.value, "Akses Ditolak");
    } else if (codeStr === "ATTENDANCE_CLOSED") {
      otpError.value = "Sesi presensi absensi telah ditutup oleh instruktur / admin.";
      toast.warning(otpError.value, "Presensi Ditutup");
    } else if (codeStr === "INVALID_OTP_CODE" || status === 400) {
      otpError.value = "Kode OTP tidak sesuai atau telah berganti. Silakan periksa kode terbaru.";
      toast.error(otpError.value, "Kode Salah");
    } else {
      otpError.value = msg || "Gagal mencatat presensi kehadiran.";
      toast.error(otpError.value || "Gagal mencatat presensi.", "Gagal Absen");
    }
  } finally {
    isSubmittingOtp.value = false;
  }
};

watch(
  () => route.params.id,
  async (newId) => {
    const id = Number(newId);
    await loadEventDetail(id);
    await runEntrance();
  }
);

onMounted(async () => {
  const initialId = Number(route.params.id);
  await loadEventDetail(initialId);
  await runEntrance();
});

onUnmounted(() => {
  entranceCtx?.revert();
  if (lockoutInterval) clearInterval(lockoutInterval);
});
</script>

<template>
  <AppPage
    width="content"
    title="Detail Sesi Kelas"
    :subtitle="`SESSION_SPEC // EVENT_ID #${route.params.id || '-'}`"
    status-led="info"
  >
    <template #actions>
      <button
        type="button"
        class="hover:text-[#1E5FAD] flex items-center gap-1.5 cursor-pointer font-mono text-xs font-bold text-slate-600 min-h-[44px] px-2"
        @click="router.push('/events')"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        <span>&larr; Kembali ke Agenda Timeline</span>
      </button>
    </template>

    <template #alerts>
      <!-- Error Banner -->
      <div v-if="errorMessage">
        <AppAlert
          variant="error"
          title="Sesi Tidak Dapat Diakses"
          :message="errorMessage"
        >
          <div class="mt-3">
            <AppButton variant="secondary" size="sm" @click="router.push('/events')">
              &larr; Kembali ke Timeline
            </AppButton>
          </div>
        </AppAlert>
      </div>
    </template>

    <div ref="containerRef" class="space-y-6">
      <!-- Structured Loading Skeleton (Mirrors Event Detail Card) -->
      <div v-if="isLoading" class="chassis-panel rounded-3xl p-6 sm:p-8 corner-screws space-y-6">
        <div class="space-y-3 pb-6 border-b border-slate-300/80">
          <div class="flex items-center gap-2">
            <AppSkeleton variant="line" class="w-24 h-6 rounded-md" />
            <AppSkeleton variant="line" class="w-28 h-4" />
          </div>
          <AppSkeleton variant="line" class="w-3/4 h-8" />
          <div class="space-y-2">
            <AppSkeleton variant="line" class="w-full h-4" />
            <AppSkeleton variant="line" class="w-2/3 h-4" />
          </div>
        </div>

        <!-- 3 Metadata Spec Cards Skeleton -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/40 space-y-2">
            <AppSkeleton variant="line" class="w-24 h-3 uppercase" />
            <AppSkeleton variant="line" class="w-32 h-4" />
          </div>
        </div>

        <!-- Action / Button Skeleton -->
        <div class="pt-4 border-t border-slate-300/80 flex flex-wrap items-center justify-between gap-3">
          <AppSkeleton variant="block" class="w-44 h-11 rounded-2xl" />
          <AppSkeleton variant="block" class="w-36 h-9 rounded-xl" />
        </div>
      </div>

      <!-- Event Detail Card -->
      <article v-else-if="event" class="event-detail-module chassis-panel rounded-3xl p-6 sm:p-8 corner-screws space-y-6">
      <div class="space-y-3 pb-6 border-b border-slate-300/80">
        <div class="flex items-center gap-2 flex-wrap">
          <AppBadge variant="mentor">
            {{ event.event_type }}
          </AppBadge>
          <span class="font-mono text-xs text-slate-500">
            COHORT // #{{ event.program_id || 'GENERAL' }}
          </span>
        </div>

        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {{ event.title }}
        </h2>

        <p v-if="event.description && event.description.trim() !== ''" class="text-sm text-slate-600 leading-relaxed font-sans max-w-3xl">
          {{ event.description }}
        </p>
        <p v-else class="text-xs text-slate-500 italic font-sans">
          Sesi pertemuan tatap muka dan evaluasi modul kurikulum mentor.
        </p>
      </div>

      <!-- Event Specs Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/40 space-y-1">
          <span class="font-mono text-[10px] text-slate-500 block uppercase">TANGGAL PELAKSANAAN</span>
          <span class="font-bold text-xs text-slate-800">{{ formatIndonesianDate(event.event_date) }}</span>
        </div>

        <div class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/40 space-y-1">
          <span class="font-mono text-[10px] text-slate-500 block uppercase">TARGET PESERTA</span>
          <span class="font-bold text-xs text-slate-800 uppercase">{{ event.target_role }}</span>
        </div>

        <div class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/40 space-y-1">
          <span class="font-mono text-[10px] text-slate-500 block uppercase">STATUS SESI</span>
          <span class="font-bold text-xs text-emerald-700 flex items-center gap-1.5">
            <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            TERJADWAL RESMI
          </span>
        </div>
      </div>

      <!-- Submission status if exists for this event -->
      <div
        v-if="mySubmission"
        class="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <span class="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            TUGAS SESI INI TELAH DIKUMPULKAN
          </span>
          <span class="font-mono text-[11px] text-emerald-700 uppercase">
            STATUS: {{ mySubmission.status }}
          </span>
        </div>
        <p v-if="mySubmission.file_name" class="font-mono text-xs text-slate-600">
          Berkas: {{ mySubmission.file_name }}
        </p>
      </div>

      <!-- Presensi Kehadiran OTP Module (Phase 2) -->
      <div class="p-5 sm:p-7 rounded-3xl bg-[#ebf0f7] border border-white/80 shadow-[inset_1px_1px_2px_#ffffff,4px_4px_10px_#b5c2d3] space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-300/80">
          <div class="flex items-center gap-2">
            <span
              class="size-2.5 rounded-full"
              :class="[
                attendanceRecorded
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : event.attendance_is_open
                  ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse'
                  : 'bg-slate-400'
              ]"
            ></span>
            <span class="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
              PRESENSI KEHADIRAN SESI // VERIFIKASI OTP
            </span>
          </div>

          <AppBadge
            v-if="attendanceRecorded"
            variant="success"
            size="sm"
          >
            ✓ HADIR TERCATAT
          </AppBadge>
          <AppBadge
            v-else-if="event.attendance_is_open"
            variant="warning"
            size="sm"
          >
            SESI ABSENSI DIBUKA
          </AppBadge>
          <AppBadge
            v-else
            variant="neutral"
            size="sm"
          >
            SESI ABSENSI DITUTUP
          </AppBadge>
        </div>

        <!-- If attendance already recorded -->
        <div v-if="attendanceRecorded" class="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 space-y-1">
          <div class="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
            <span>✓ Kehadiran Anda pada sesi ini telah berhasil diverifikasi oleh sistem!</span>
          </div>
          <p v-if="attendedAt" class="font-mono text-[11px] text-emerald-700">
            Waktu Absensi: {{ formatIndonesianDate(attendedAt) }}
          </p>
        </div>

        <!-- If attendance is open and not recorded yet -->
        <div v-else-if="event.attendance_is_open" class="space-y-3">
          <p class="text-xs text-slate-600 font-sans leading-relaxed">
            Instruktur telah membuka sesi absensi. Masukkan 6-digit kode OTP dinamis yang ditampilkan pada layar instruktur untuk mencatat kehadiran Anda.
          </p>

          <form class="space-y-3" @submit.prevent="handleOtpSubmit">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                v-model="otpCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                pattern="[0-9]*"
                maxlength="6"
                placeholder="6-DIGIT OTP"
                :disabled="isSubmittingOtp || lockoutSeconds > 0"
                class="w-full sm:w-48 px-4 py-2.5 rounded-xl bg-white border border-slate-300 font-mono text-center text-lg tracking-[0.3em] font-bold text-slate-800 placeholder:tracking-normal placeholder:font-normal placeholder:text-xs shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] focus:outline-none focus:border-[#1E5FAD]"
              />

              <AppButton
                variant="primary"
                type="submit"
                :loading="isSubmittingOtp"
                :disabled="lockoutSeconds > 0 || otpCode.trim().length !== 6"
              >
                {{ lockoutSeconds > 0 ? `Terkunci (${lockoutSeconds}s)` : "Kirim Absensi &rarr;" }}
              </AppButton>
            </div>

            <!-- OTP Error / Warning -->
            <p v-if="otpError" class="font-mono text-xs text-rose-600 font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{{ otpError }}</span>
            </p>
          </form>
        </div>

        <!-- If attendance closed -->
        <div v-else class="p-4 rounded-2xl bg-slate-100 border border-slate-200">
          <p class="text-xs text-slate-500 font-sans">
            Sesi absensi untuk pertemuan ini saat ini belum dibuka atau telah ditutup oleh instruktur. Kode OTP hanya aktif ketika instruktur mengaktifkan sesi absensi berjalan.
          </p>
        </div>
      </div>

      <!-- Documentation URLs Section if available -->
      <div
        v-if="event.documentation_urls && event.documentation_urls.length > 0"
        class="p-4 bg-white/70 rounded-2xl border border-slate-300/80 space-y-3"
      >
        <span class="font-mono text-xs font-bold text-[#1E5FAD] uppercase tracking-wider flex items-center gap-1.5">
          <svg class="size-4 text-[#1E5FAD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          DOKUMENTASI & TAUTAN REKAMAN SESI:
        </span>

        <div class="flex flex-wrap gap-2.5">
          <a
            v-for="(docUrl, docIdx) in event.documentation_urls"
            :key="docIdx"
            :href="resolveAssetUrl(docUrl)"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ebf0f7] text-[#1E5FAD] border border-white/80 font-mono text-xs font-bold shadow-[2px_2px_5px_#b5c2d3] hover:brightness-105 transition-all"
          >
            <span>🔗 Berkas/Dokumentasi [{{ docIdx + 1 }}]</span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>

      <!-- Action Section -->
      <div class="pt-4 border-t border-slate-300/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <a
            v-if="event.cta_link"
            :href="event.cta_link"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block"
          >
            <AppButton variant="primary">
              {{ event.cta_label || "Buka Tautan Sesi Live" }} &rarr;
            </AppButton>
          </a>
        </div>

        <AppButton variant="secondary" size="sm" @click="router.push('/events')">
          Kembali ke Agenda
        </AppButton>
      </div>
    </article>
  </div>
</AppPage>
</template>
