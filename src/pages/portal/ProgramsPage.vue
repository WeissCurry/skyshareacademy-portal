<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAccessStore } from "@/stores/access";
import { apiClient } from "@/api/client";
import { useAlert } from "@/composables/useAlert";
import AppButton from "@/components/common/AppButton.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppSelect from "@/components/common/AppSelect.vue";
import AppPage from "@/components/common/AppPage.vue";
import type { ProgramItem, ProgramOrder, OrderStatus } from "@/types";
import { animatePageEntrance, animateLedPulse } from "@/utils/animations";
import { resolveAssetUrl } from "@/utils/url";

const router = useRouter();
const accessStore = useAccessStore();
const toast = useAlert();

const containerRef = ref<HTMLElement | null>(null);
const programs = ref<ProgramItem[]>([]);
const isLoading = ref(true);
const pageError = ref<string | null>(null);
const isQrisLoaded = ref<Record<number, boolean>>({});

let abortController: AbortController | null = null;

const selectedCategory = ref<string>("");
const selectedLevel = ref<string>("");
const isEnrolling = ref<Record<number, boolean>>({});

const categoryOptions = [
  { value: "", label: "Semua Kategori" },
  { value: "MAN", label: "Mentor Academy Nusantara (MAN)" },
  { value: "TEACHME_SERIES", label: "TeachMe Series" },
  { value: "PARENT_ACADEMY", label: "Parent Academy" },
];

const levelOptions = [
  { value: "", label: "Semua Jenjang" },
  { value: "BASIC", label: "Jenjang Basic" },
  { value: "INTERMEDIATE", label: "Jenjang Intermediate" },
  { value: "ADVANCE", label: "Jenjang Advance" },
];

const filteredPrograms = computed(() => {
  return programs.value.filter((p) => {
    if (selectedCategory.value && p.category !== selectedCategory.value) {
      return false;
    }
    if (selectedLevel.value && p.level !== selectedLevel.value) {
      return false;
    }
    return true;
  });
});

const isFreeProgram = (program: ProgramItem): boolean => {
  if (program.category === "TEACHME_SERIES" || program.category === "PARENT_ACADEMY") {
    return true;
  }
  return Number(program.price) === 0;
};

const isProgramLocked = (program: ProgramItem): { locked: boolean; reason?: string } => {
  if (program.category === "MAN") {
    if (program.level === "INTERMEDIATE") {
      const hasBasic = accessStore.hasPassedLevel("MAN", "BASIC");
      if (!hasBasic) {
        return {
          locked: true,
          reason: "Wajib lulus jenjang BASIC terlebih dahulu sebelum mendaftar jenjang Intermediate.",
        };
      }
    } else if (program.level === "ADVANCE") {
      const hasInter = accessStore.hasPassedLevel("MAN", "INTERMEDIATE");
      if (!hasInter) {
        return {
          locked: true,
          reason: "Wajib lulus jenjang INTERMEDIATE terlebih dahulu sebelum mendaftar jenjang Advance.",
        };
      }
    }
  }
  return { locked: false };
};

let entranceCtx: { revert: () => void } | null = null;
let ledTweens: any[] = [];

// Order map keyed by program_id
const ordersByProgram = ref<Record<number, ProgramOrder>>({});

// Checkout & Uploading state per program
const isOrdering = ref<Record<number, boolean>>({});
const isUploadingProof = ref<Record<number, boolean>>({});
const proofFiles = ref<Record<number, File>>({});
const proofPreviews = ref<Record<number, string>>({});
const countdowns = ref<Record<number, string>>({});
const copiedOrder = ref<number | null>(null);

let timerInterval: ReturnType<typeof setInterval> | null = null;

const formatRupiah = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null) return "Rp 0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

// Compute status of a program for the current mentor
const getOrderStatus = (programId: number): OrderStatus | null => {
  // 1. If actively enrolled
  const isEnrolled = accessStore.isEnrolledInProgram(programId);
  if (isEnrolled) return "ACTIVE";

  // 2. If order exists locally
  const order = ordersByProgram.value[programId];
  if (order) return order.status;

  // 3. Fallback to accessStore pending orders
  const pending = accessStore.pendingOrders.find((p) => p.program_id === programId);
  if (pending) return pending.status;

  return null;
};

// Countdown timer calculations
const updateCountdowns = () => {
  const now = new Date().getTime();
  for (const programId in ordersByProgram.value) {
    const order = ordersByProgram.value[programId];
    if (order && order.status === "AWAITING_PAYMENT" && order.expires_at) {
      const exp = new Date(order.expires_at).getTime();
      const diff = exp - now;

      if (diff <= 0) {
        countdowns.value[programId] = "00:00:00 (Kedaluwarsa)";
        order.status = "EXPIRED";
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        countdowns.value[programId] = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      }
    }
  }
};

let copyResetTimeout: ReturnType<typeof setTimeout> | null = null;

const copyTotalAmount = async (orderId: number | undefined, amount: number | undefined) => {
  if (!amount) return;
  try {
    await navigator.clipboard.writeText(amount.toString());
    copiedOrder.value = orderId || null;
    toast.success(`Nominal transfer ${formatRupiah(amount)} berhasil disalin.`, "Tersalin");
    if (copyResetTimeout) clearTimeout(copyResetTimeout);
    copyResetTimeout = setTimeout(() => {
      copiedOrder.value = null;
      copyResetTimeout = null;
    }, 3000);
  } catch {
    toast.error("Gagal menyalin nominal ke papan klip.", "Gagal Salin");
  }
};

// File proof selection
const handleProofFileChange = (programId: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    toast.error("Format bukti transfer harus JPG, PNG, atau WebP.", "Format Tidak Sesuai");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error("Ukuran berkas bukti pembayaran maksimal 5 MB.", "Berkas Terlalu Besar");
    return;
  }

  proofFiles.value[programId] = file;
  if (proofPreviews.value[programId]) {
    URL.revokeObjectURL(proofPreviews.value[programId]);
  }
  proofPreviews.value[programId] = URL.createObjectURL(file);
};

const removeProofFile = (programId: number) => {
  delete proofFiles.value[programId];
  if (proofPreviews.value[programId]) {
    URL.revokeObjectURL(proofPreviews.value[programId]);
    delete proofPreviews.value[programId];
  }
};

// Load data
const loadPrograms = async () => {
  // C9: Abort previous in-flight fetch
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  const signal = abortController.signal;

  isLoading.value = true;
  pageError.value = null;

  try {
    // 1. Fetch available programs
    const res = await apiClient.get<{
      status: string;
      data: ProgramItem[];
    }>("/portal/programs", { signal });

    programs.value = res.data?.data || [];

    // 2. Fetch access to sync latest orders
    await accessStore.fetchAccess().catch(() => {});

    if (signal.aborted) return;

    // 3. P1-5 & D9: Fetch real orders from server instead of fabricating them!
    let ordersList: any[] = [];
    try {
      const resOrders = await apiClient.get<{ status: string; data: ProgramOrder[] }>("/portal/orders", { signal });
      ordersList = resOrders.data?.data || [];
    } catch (orderErr: any) {
      if (axios.isCancel(orderErr) || orderErr.name === "CanceledError") return;
      try {
        const resMyOrders = await apiClient.get<{ status: string; data: ProgramOrder[] }>("/portal/my-orders", { signal });
        ordersList = resMyOrders.data?.data || [];
      } catch {
        // Individual fallback below
      }
    }

    if (signal.aborted) return;

    if (Array.isArray(ordersList) && ordersList.length > 0) {
      for (const ord of ordersList) {
        if (ord && ord.program_id) {
          const ordId = ord.id ?? ord.order_id;
          ordersByProgram.value[ord.program_id] = {
            ...ord,
            id: ordId,
            order_id: ordId,
          };
        }
      }
    } else if (accessStore.pendingOrders.length > 0) {
      // Fetch each pending order individually via GET /portal/orders/:id
      for (const pending of accessStore.pendingOrders) {
        if (signal.aborted) return;
        try {
          const res = await apiClient.get<{ status: string; data: ProgramOrder }>(
            `/portal/orders/${pending.order_id}`,
            { signal }
          );
          if (res.data?.data) {
            const ord = res.data.data;
            const ordId = ord.id ?? ord.order_id ?? pending.order_id;
            ordersByProgram.value[pending.program_id] = {
              ...ord,
              id: ordId,
              order_id: ordId,
            };
          }
        } catch {
          // Individual order fetch failure ignored
        }
      }
    }
  } catch (err: any) {
    if (axios.isCancel(err) || err.name === "CanceledError") return;
    pageError.value = err.response?.data?.message || err.message || "Gagal memuat katalog program.";
  } finally {
    if (!signal.aborted) {
      isLoading.value = false;
    }
  }
};

// Free enrollment for TEACHME_SERIES, PARENT_ACADEMY (R5)
const handleFreeEnroll = async (program: ProgramItem) => {
  if (accessStore.kyc?.status !== "APPROVED") {
    toast.error(
      "Pendaftaran program mandiri memerlukan verifikasi KYC yang telah disetujui (APPROVED).",
      "KYC Diperlukan"
    );
    router.push("/kyc");
    return;
  }

  isEnrolling.value[program.id] = true;
  try {
    const res = await apiClient.post<{
      status: string;
      message?: string;
      data: any;
    }>(`/portal/programs/${program.id}/enroll`);

    toast.success(
      res.data?.message || "Pendaftaran program mandiri berhasil. Anda langsung terdaftar aktif!",
      "Pendaftaran Berhasil"
    );

    await accessStore.fetchAccess();
    await loadPrograms();
    await runEntranceAndPulses();
  } catch (err: any) {
    const msg = err.response?.data?.message || "Gagal mendaftar program.";
    toast.error(msg, "Pendaftaran Gagal");
  } finally {
    isEnrolling.value[program.id] = false;
  }
};

// Checkout: Create Order (P0-4: Map order_id to id)
const handleCheckout = async (program: ProgramItem) => {
  // Validate prerequisite lock
  const lockInfo = isProgramLocked(program);
  if (lockInfo.locked) {
    toast.error(lockInfo.reason || "Prasyarat jenjang belum terpenuhi.", "Jenjang Terkunci");
    return;
  }

  // Validate KYC status: cannot create order if REJECTED
  if (accessStore.kyc?.status === "REJECTED") {
    toast.error("Status KYC Anda sedang ditolak. Silakan perbaiki data KYC terlebih dahulu sebelum mendaftar program.", "KYC Ditolak");
    router.push("/kyc");
    return;
  }

  isOrdering.value[program.id] = true;

  try {
    const res = await apiClient.post<{
      status: string;
      message?: string;
      data: any;
    }>(`/portal/programs/${program.id}/orders`);

    const rawOrder = res.data?.data;
    const orderId = rawOrder?.id ?? rawOrder?.order_id;

    ordersByProgram.value[program.id] = {
      ...rawOrder,
      id: orderId,
      order_id: orderId,
      program_id: program.id,
    };

    toast.success(
      "Pesanan berhasil dibuat. Silakan transfer nominal persis sesuai petunjuk QRIS.",
      "Pesanan Siap Dibayar"
    );

    // Refresh access store
    await accessStore.fetchAccess();
    updateCountdowns();
    await runEntranceAndPulses();
  } catch (err: any) {
    const msg = err.response?.data?.message || "Gagal membuat pesanan program.";
    toast.error(msg, "Checkout Gagal");
  } finally {
    isOrdering.value[program.id] = false;
  }
};

// Upload Payment Proof (P0-4: Guard against undefined order.id)
const handleUploadProof = async (programId: number) => {
  const order = ordersByProgram.value[programId];
  if (!order || !order.id) {
    toast.error("ID Pesanan tidak valid. Silakan muat ulang halaman atau buat pesanan baru.", "Pesanan Tidak Valid");
    return;
  }

  const file = proofFiles.value[programId];
  if (!file) {
    toast.error("Silakan pilih gambar struk bukti transfer terlebih dahulu.", "Berkas Kosong");
    return;
  }

  isUploadingProof.value[programId] = true;

  try {
    const formData = new FormData();
    formData.append("payment_proof", file);

    const res = await apiClient.post<{
      status: string;
      message?: string;
      data: { order_id: number; status: OrderStatus };
    }>(`/portal/orders/${order.id}/payment-proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success(
      res.data?.message || "Bukti pembayaran berhasil diunggah. Menunggu review admin.",
      "Bukti Terkirim"
    );

    // Update local order status
    order.status = "PROOF_SUBMITTED";
    removeProofFile(programId);

    // Refresh access store & KYC status
    await accessStore.fetchAccess();
    await runEntranceAndPulses();
  } catch (err: any) {
    const msg = err.response?.data?.message || "Gagal mengunggah bukti pembayaran.";
    toast.error(msg, "Unggah Gagal");
  } finally {
    isUploadingProof.value[programId] = false;
  }
};

const runEntranceAndPulses = async () => {
  await nextTick();
  if (containerRef.value) {
    entranceCtx?.revert();
    entranceCtx = animatePageEntrance(containerRef.value, ".program-card");
  }

  // Tactile LED pulse for pending states and countdown
  ledTweens.forEach((t) => t?.kill());
  ledTweens = [];
  if (containerRef.value) {
    const leds = containerRef.value.querySelectorAll(".order-pending-led, .countdown-led");
    leds.forEach((el) => {
      const tw = animateLedPulse(el as HTMLElement);
      if (tw) ledTweens.push(tw);
    });
  }
};

onMounted(async () => {
  await loadPrograms();
  updateCountdowns();
  timerInterval = setInterval(updateCountdowns, 1000);
  await runEntranceAndPulses();
});

onUnmounted(() => {
  entranceCtx?.revert();
  ledTweens.forEach((t) => t?.kill());
  ledTweens = [];
  if (timerInterval) clearInterval(timerInterval);
  if (copyResetTimeout) clearTimeout(copyResetTimeout);
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  // Clean up any preview object URLs
  for (const key in proofPreviews.value) {
    URL.revokeObjectURL(proofPreviews.value[key]);
  }
});
</script>

<template>
  <AppPage
    width="content"
    title="Katalog Program & Pembayaran"
    subtitle="ENROLLMENT // BOOTCAMP, ACCELERATION & EXCLUSIVE CERTIFICATION"
    status-led="info"
  >
    <!-- User Active Program Count -->
    <template #actions>
      <AppBadge variant="mentor">
        TERDAFTAR // {{ accessStore.activePrograms.length }} PROGRAM AKTIF
      </AppBadge>
    </template>

    <!-- Error & KYC notices -->
    <template #alerts>
      <div v-if="pageError">
        <AppAlert
          variant="error"
          title="Gagal Memuat Data"
          :message="pageError"
          dismissible
          @close="pageError = null"
        />
      </div>

      <!-- KYC Warning if not approved -->
      <div v-if="!accessStore.isApprovedKyc" class="space-y-2">
        <AppAlert
          v-if="accessStore.kyc?.status === 'REJECTED'"
          variant="error"
          title="KYC Ditolak: Perbaiki Identitas Anda"
          message="Anda belum dapat memesan program baru karena verifikasi KYC Anda berstatus REJECTED. Silakan perbaiki data KYC Anda terlebih dahulu."
        >
          <RouterLink to="/kyc" class="mt-2 inline-block">
            <AppButton variant="danger" size="sm">
              Buka Halaman KYC & Perbaiki Berkas &rarr;
            </AppButton>
          </RouterLink>
        </AppAlert>

        <AppAlert
          v-else
          variant="info"
          title="Verifikasi KYC Diperlukan"
          message="Setelah memesan program dan mengunggah bukti transfer, data KYC Anda akan otomatis diverifikasi bersamaan dengan pesanan Anda oleh admin."
        />
      </div>
    </template>

    <div ref="containerRef" class="space-y-6">
      <!-- Industrial Filter Control Console -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#ebf0f7] border border-white/80 shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#b5c2d3]">
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full bg-[#1E5FAD] animate-pulse"></span>
          <span class="font-mono text-xs font-bold text-slate-700 tracking-wider uppercase">
            FILTER // KATALOG:
          </span>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <AppSelect
            v-model="selectedCategory"
            :options="categoryOptions"
            aria-label="Pilih Kategori Program"
            class="w-full sm:w-56"
            @change="runEntranceAndPulses"
          />

          <AppSelect
            v-if="!selectedCategory || selectedCategory === 'MAN'"
            v-model="selectedLevel"
            :options="levelOptions"
            aria-label="Pilih Jenjang Program"
            class="w-full sm:w-48"
            @change="runEntranceAndPulses"
          />
        </div>
      </div>

      <!-- Programs Listing Skeleton State -->
      <div v-if="isLoading" class="space-y-6">
        <div v-for="i in 2" :key="i" class="chassis-panel rounded-3xl p-6 sm:p-8 corner-screws space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-300/80">
            <div class="space-y-2 flex-1">
              <div class="flex items-center gap-2">
                <AppSkeleton variant="line" class="w-28 h-4" />
                <AppSkeleton variant="line" class="w-20 h-5" />
              </div>
              <AppSkeleton variant="line" class="w-3/4 h-7" />
              <AppSkeleton variant="line" class="w-full h-4" />
              <AppSkeleton variant="line" class="w-1/2 h-4" />
            </div>
            <AppSkeleton variant="block" class="w-32 h-10 rounded-xl" />
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <AppSkeleton variant="line" class="w-64 h-4" />
            <AppSkeleton variant="block" class="w-44 h-11 rounded-xl" />
          </div>
        </div>
      </div>

      <div v-else-if="filteredPrograms.length === 0" class="chassis-panel rounded-3xl p-12 text-center">
        <p class="text-sm font-bold text-slate-700">Tidak ada program yang sesuai dengan filter yang dipilih.</p>
      </div>

      <div v-else class="space-y-8">
        <article
          v-for="program in filteredPrograms"
          :key="program.id"
          class="program-card chassis-animate chassis-panel rounded-3xl p-6 sm:p-8 corner-screws space-y-6 relative overflow-hidden"
        >
          <!-- Top Program Header -->
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-300/80">
            <div>
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="font-mono text-xs font-bold text-[#1E5FAD] tracking-wider uppercase">
                  PROGRAM // ID: {{ program.id }}
                </span>
                <AppBadge v-if="program.category" variant="talent">
                  {{ program.category }}
                </AppBadge>
                <AppBadge v-if="program.level" variant="neutral">
                  {{ program.level }}
                </AppBadge>
                <AppBadge v-if="isProgramLocked(program).locked" variant="danger">
                  🔒 TERKUNCI
                </AppBadge>
                <!-- Status Badges -->
                <AppBadge
                  v-if="getOrderStatus(program.id) === 'ACTIVE'"
                  variant="success"
                >
                  TERDAFTAR AKTIF
                </AppBadge>
                <AppBadge
                  v-else-if="getOrderStatus(program.id) === 'PROOF_SUBMITTED'"
                  variant="warning"
                >
                  <span class="order-pending-led size-1.5 rounded-full bg-amber-400 mr-1.5 inline-block shrink-0 shadow-[0_0_6px_#f59e0b]"></span>
                  MENUNGGU VERIFIKASI ADMIN
                </AppBadge>
                <AppBadge
                  v-else-if="getOrderStatus(program.id) === 'AWAITING_PAYMENT'"
                  variant="warning"
                >
                  <span class="order-pending-led size-1.5 rounded-full bg-amber-400 mr-1.5 inline-block shrink-0 shadow-[0_0_6px_#f59e0b]"></span>
                  MENUNGGU PEMBAYARAN
                </AppBadge>
                <AppBadge
                  v-else-if="getOrderStatus(program.id) === 'PAYMENT_REJECTED'"
                  variant="danger"
                >
                  BUKTI DITOLAK
                </AppBadge>
                <AppBadge
                  v-else-if="getOrderStatus(program.id) === 'EXPIRED'"
                  variant="neutral"
                >
                  KEDALUWARSA
                </AppBadge>
              </div>

            <h2 class="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {{ program.title }}
            </h2>
            <p v-if="program.description" class="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-sans leading-relaxed">
              {{ program.description }}
            </p>
          </div>

          <!-- Price Tag -->
          <div class="p-3 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/40 shrink-0 text-right">
            <span class="font-mono text-[10px] text-slate-500 block uppercase">BIAYA ENROLLMENT</span>
            <span
              :class="[
                'font-mono text-base sm:text-lg font-bold',
                isFreeProgram(program) ? 'text-emerald-700' : 'text-[#1E5FAD]'
              ]"
            >
              {{ isFreeProgram(program) ? 'GRATIS' : formatRupiah(program.price) }}
            </span>
          </div>
        </div>

        <!-- Locked Prerequisite Banner -->
        <div
          v-if="isProgramLocked(program).locked && getOrderStatus(program.id) !== 'ACTIVE'"
          class="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-start gap-3"
        >
          <div class="p-2 rounded-xl bg-amber-100 text-amber-800 text-base shrink-0">
            🔒
          </div>
          <div class="space-y-1">
            <p class="font-bold text-xs text-amber-900">Jenjang Program Belum Dapat Diambil</p>
            <p class="text-xs text-amber-800 leading-relaxed font-sans">
              {{ isProgramLocked(program).reason }}
            </p>
          </div>
        </div>

        <!-- STATE 1: ACTIVE ENROLLMENT -->
        <div v-if="getOrderStatus(program.id) === 'ACTIVE'" class="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3">
          <div class="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <span class="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
            <span>Anda telah terdaftar aktif pada program ini! Seluruh modul, event, dan tugas telah terbuka.</span>
          </div>
          <div class="flex items-center gap-3 pt-2">
            <RouterLink to="/materials">
              <AppButton variant="primary" size="sm">
                Buka Modul Materi &rarr;
              </AppButton>
            </RouterLink>
            <RouterLink to="/assignments">
              <AppButton variant="secondary" size="sm">
                Lihat Lembar Tugas
              </AppButton>
            </RouterLink>
          </div>
        </div>

        <!-- STATE 2: PROOF SUBMITTED (Awaiting Admin Review) -->
        <div v-else-if="getOrderStatus(program.id) === 'PROOF_SUBMITTED'" class="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-2">
          <div class="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <span class="size-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse"></span>
            <span>Bukti transfer berhasil diterima oleh sistem!</span>
          </div>
          <p class="text-xs text-amber-800 leading-relaxed font-sans">
            Tim finance admin SkyShare Academy sedang memvalidasi mutasi pembayaran Anda. Begitu disetujui, hak akses program dan materi langsung aktif secara otomatis.
          </p>
        </div>

        <!-- STATE 3: PAYMENT REJECTED (With Re-upload option) -->
        <div v-else-if="getOrderStatus(program.id) === 'PAYMENT_REJECTED'" class="p-5 rounded-2xl bg-rose-50/80 border border-rose-300 space-y-4">
          <div>
            <div class="flex items-center gap-2 text-rose-900 font-bold text-sm mb-1">
              <span class="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
              <span>Bukti Pembayaran Ditolak Admin</span>
            </div>
            <p class="text-xs text-rose-800 font-sans leading-relaxed">
              Catatan Admin: <strong>{{ ordersByProgram[program.id]?.reject_reason || 'Nominal tidak sesuai atau struk tidak terbaca jelas.' }}</strong>
            </p>
          </div>

          <!-- Re-upload Form -->
          <div class="pt-2 border-t border-rose-200 space-y-3">
            <p class="font-mono text-[11px] font-bold text-slate-700">
              Unggah Ulang Bukti Transfer yang Benar:
            </p>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-[#1E5FAD] file:text-white cursor-pointer"
                @change="handleProofFileChange(program.id, $event)"
              />
              <AppButton
                variant="danger"
                size="sm"
                :loading="isUploadingProof[program.id]"
                :disabled="!proofFiles[program.id]"
                @click="handleUploadProof(program.id)"
              >
                Kirim Ulang Bukti
              </AppButton>
            </div>
          </div>
        </div>

        <!-- STATE 4: EXPIRED (Create new order option) -->
        <div v-else-if="getOrderStatus(program.id) === 'EXPIRED'" class="p-5 rounded-2xl bg-slate-200/60 border border-slate-300 space-y-3">
          <div class="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <span>Batas waktu pembayaran 24 jam telah habis. Kode unik pesanan sebelumnya telah kedaluwarsa.</span>
          </div>
          <AppButton
            variant="primary"
            size="sm"
            :loading="isOrdering[program.id]"
            @click="handleCheckout(program)"
          >
            Buat Pesanan Baru & Dapatkan Kode Unik Baru
          </AppButton>
        </div>

        <!-- STATE 5: AWAITING PAYMENT (Interactive Payment Panel) -->
        <div
          v-else-if="getOrderStatus(program.id) === 'AWAITING_PAYMENT' && ordersByProgram[program.id]"
          class="space-y-6 pt-2"
        >
          <div class="p-5 rounded-2xl bg-[#d7e0ec] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] border border-white/50 space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-300/80">
              <span class="font-mono text-xs font-bold text-[#1E5FAD] tracking-wider uppercase flex items-center gap-2">
                <span class="countdown-led size-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]"></span>
                INSTRUKSI PEMBAYARAN QRIS MANUAL
              </span>
              <!-- Realtime Countdown Timer -->
              <div class="font-mono text-xs font-bold text-amber-800 bg-amber-100/90 px-3 py-1 rounded-xl border border-amber-300 flex items-center gap-1.5 self-start sm:self-auto">
                <span>KEDALUWARSA:</span>
                <span class="text-rose-600 tracking-wider">
                  {{ countdowns[program.id] || '24:00:00' }}
                </span>
              </div>
            </div>

            <!-- Split Screen: Left QRIS, Right Breakdown -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <!-- Left: QRIS Image Container (P1-4: resolveAssetUrl) -->
              <div class="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-md border border-slate-200 space-y-3">
                <div class="relative max-w-[280px] sm:max-w-[320px] w-full aspect-square flex items-center justify-center bg-white p-2 border border-slate-300 rounded-xl overflow-hidden">
                  <AppSkeleton
                    v-if="!isQrisLoaded[program.id]"
                    variant="block"
                    class="absolute inset-2 z-10 rounded-lg"
                  />
                  <img
                    :src="resolveAssetUrl(ordersByProgram[program.id]?.qris_url || program.qris_image_url)"
                    alt="Master QRIS Pembayaran"
                    class="w-full h-full object-contain"
                    loading="lazy"
                    @load="isQrisLoaded[program.id] = true"
                  />
                </div>
                <div class="text-center space-y-0.5">
                  <p class="font-mono text-[11px] font-bold text-slate-800">QRIS STANDAR NASIONAL</p>
                  <p class="text-[10px] text-slate-500">Scan via BCA, Mandiri, BRI, GoPay, OVO, Dana, dll.</p>
                </div>
              </div>

              <!-- Right: Exact Total Breakdown & Copy Action -->
              <div class="space-y-4">
                <div class="space-y-2">
                  <span class="font-mono text-[11px] uppercase tracking-wider font-bold text-slate-600 block">
                    RINCIAN NOMINAL TRANSFER PERSIS:
                  </span>

                  <!-- Price Breakdown Rows -->
                  <div class="p-3 bg-white/70 rounded-xl border border-slate-300/80 space-y-2 font-mono text-xs">
                    <div class="flex justify-between items-center text-slate-600">
                      <span>Harga Dasar:</span>
                      <span>{{ formatRupiah(ordersByProgram[program.id]?.base_amount || program.price) }}</span>
                    </div>
                    <div class="flex justify-between items-center text-amber-700 font-bold">
                      <span class="flex items-center gap-1">
                        <span>Kode Unik 3-Digit:</span>
                        <span class="text-[10px] text-slate-400 font-normal">(verifikasi otomatis)</span>
                      </span>
                      <span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                        +{{ ordersByProgram[program.id]?.unique_code }}
                      </span>
                    </div>
                    <div class="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-bold text-slate-900">
                      <span>Total Wajib Transfer:</span>
                      <span class="text-emerald-700 font-extrabold text-base">
                        {{ formatRupiah(ordersByProgram[program.id]?.total_amount) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Copy Exact Button -->
                <AppButton
                  variant="primary"
                  size="md"
                  class-name="w-full justify-between flex-wrap sm:flex-nowrap gap-2"
                  @click="copyTotalAmount(ordersByProgram[program.id]?.id, ordersByProgram[program.id]?.total_amount)"
                >
                  <span class="font-mono font-bold tracking-wider">
                    SALIN NOMINAL PERSIS
                  </span>
                  <span class="font-mono text-xs bg-white/20 px-2 py-0.5 rounded">
                    {{ copiedOrder === ordersByProgram[program.id]?.id ? "TERSALIN! ✓" : ordersByProgram[program.id]?.total_amount }}
                  </span>
                </AppButton>

                <p class="font-mono text-[10px] text-rose-600 font-semibold leading-relaxed">
                  ⚠️ PENTING: Mohon transfer nominal tepat hingga 3 digit terakhir. Perbedaan nominal akan menghambat proses verifikasi otomatis oleh sistem.
                </p>
              </div>
            </div>

            <!-- Upload Transfer Proof Box -->
            <div class="pt-4 border-t border-slate-300/80 space-y-3">
              <label class="font-mono text-xs uppercase tracking-wider font-bold text-[#1E5FAD] flex items-center gap-1.5">
                <span class="size-1.5 rounded-full bg-[#38BDF8]"></span>
                Unggah Bukti Struk Pembayaran QRIS:
              </label>

              <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="w-full min-w-0 max-w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-[#1E5FAD] file:text-white cursor-pointer"
                  @change="handleProofFileChange(program.id, $event)"
                />

                <AppButton
                  variant="primary"
                  size="md"
                  :loading="isUploadingProof[program.id]"
                  :disabled="!proofFiles[program.id]"
                  @click="handleUploadProof(program.id)"
                >
                  Kirim Bukti Transfer
                </AppButton>
              </div>

              <!-- Preview if selected -->
              <div v-if="proofPreviews[program.id]" class="pt-2 flex items-center gap-3">
                <img
                  :src="proofPreviews[program.id]"
                  alt="Preview struk"
                  class="h-16 w-16 object-cover rounded-xl border border-emerald-400 shadow-sm"
                />
                <div class="text-xs">
                  <p class="font-mono text-emerald-700 font-bold">
                    ✓ {{ proofFiles[program.id]?.name }}
                  </p>
                  <button
                    type="button"
                    class="text-rose-600 font-bold hover:underline cursor-pointer font-mono text-[10px]"
                    @click="removeProofFile(program.id)"
                  >
                    [Ganti Berkas]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STATE 6: INITIAL (No order yet) -->
        <div v-else class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <!-- Free program enrollment -->
          <template v-if="isFreeProgram(program)">
            <div class="space-y-0.5">
              <p class="font-mono text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
                PROGRAM GRATIS // PENDAFTARAN MANDIRI
              </p>
              <p class="text-xs text-slate-500 font-sans">
                Wajib verifikasi identitas KYC berstatus disetujui (APPROVED) untuk mendaftar program gratis ini.
              </p>
            </div>
            <AppButton
              variant="primary"
              :loading="isEnrolling[program.id]"
              @click="handleFreeEnroll(program)"
            >
              Daftar Gratis Sekarang &rarr;
            </AppButton>
          </template>

          <!-- Locked MAN Level -->
          <template v-else-if="isProgramLocked(program).locked">
            <p class="font-mono text-[11px] text-amber-700 font-bold">
              STATUS // PRASYARAT KELULUSAN BELUM TERPENUHI
            </p>
            <AppButton
              variant="secondary"
              disabled
            >
              🔒 Prasyarat Belum Terpenuhi
            </AppButton>
          </template>

          <!-- Standard Paid Flow -->
          <template v-else>
            <p class="font-mono text-[10px] text-slate-500">
              SISTEM // REGISTRASI AKAN MENGHASILKAN KODE UNIK QRIS SECARA OTOMATIS.
            </p>
            <AppButton
              variant="primary"
              :loading="isOrdering[program.id]"
              @click="handleCheckout(program)"
            >
              Daftar & Checkout Program Ini
            </AppButton>
          </template>
        </div>
      </article>
    </div>
  </div>
</AppPage>
</template>
