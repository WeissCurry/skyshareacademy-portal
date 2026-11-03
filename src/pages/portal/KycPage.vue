<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import axios from "axios";
import { useAccessStore } from "@/stores/access";
import { apiClient } from "@/api/client";
import { useAlert } from "@/composables/useAlert";
import AppButton from "@/components/common/AppButton.vue";
import AppInput from "@/components/common/AppInput.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppPage from "@/components/common/AppPage.vue";
import type { KycStatus, MentorKycData } from "@/types";
import { animatePageEntrance, animateLedPulse } from "@/utils/animations";

const accessStore = useAccessStore();
const toast = useAlert();

const alertRef = ref<HTMLElement | null>(null);
const formRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const pendingLedRef = ref<HTMLElement | null>(null);

let alertCtx: { revert: () => void } | null = null;
let formCtx: { revert: () => void } | null = null;
let ledTween: any = null;
let abortController: AbortController | null = null;

// Form data state
const nik = ref("");
const bankName = ref("");
const bankAccountNumber = ref("");
const bankAccountHolder = ref("");
const instagramHandle = ref("");
const facebookHandle = ref("");

// Masked fields state (P0-3 & D8)
const storedMaskedNik = ref<string | null>(null);
const storedMaskedAccount = ref<string | null>(null);
const isEditingNik = ref(false);
const isEditingAccount = ref(false);

// Upload state
const ktpFile = ref<File | null>(null);
const ktpPreviewUrl = ref<string | null>(null);
const hasExistingKtp = ref(false);

// UI and loading states
const isLoadingData = ref(true);
const isSubmitting = ref(false);
const isWithdrawing = ref(false);
const formError = ref<string | null>(null);
const isEditing = ref(false);

const kycData = ref<MentorKycData | null>(null);
const currentStatus = computed<KycStatus>(() => {
  return kycData.value?.status || accessStore.kyc?.status || "REGISTERED";
});

const isApproved = computed(() => currentStatus.value === "APPROVED");
const isPendingReview = computed(() => currentStatus.value === "PENDING_REVIEW");
const isRejected = computed(() => currentStatus.value === "REJECTED");
const isSubmitted = computed(() => currentStatus.value === "KYC_SUBMITTED");

// Form accessibility / editable
const canEdit = computed(() => {
  if (isApproved.value) return false;
  if (isPendingReview.value) return false;
  return true;
});

// NIK validation (applies only when actively typing or newly setting NIK)
const nikError = computed(() => {
  if (!isEditingNik.value && storedMaskedNik.value) return "";
  if (!nik.value) return "";
  if (!/^\d+$/.test(nik.value)) return "NIK hanya boleh berisi angka.";
  if (nik.value.length !== 16) return `NIK harus tepat 16 digit (saat ini ${nik.value.length} digit).`;
  return "";
});

// Social validation
const socialError = computed(() => {
  if (!instagramHandle.value.trim() && !facebookHandle.value.trim()) {
    return "Minimal salah satu media sosial (Instagram atau Facebook) wajib diisi.";
  }
  return "";
});

// File validation
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    toast.error("Format berkas harus JPG, PNG, atau WebP.", "Format Tidak Sesuai");
    return;
  }

  // Max 5 MB per contract
  if (file.size > 5 * 1024 * 1024) {
    toast.error("Ukuran berkas KTP maksimal 5 MB.", "Berkas Terlalu Besar");
    return;
  }

  ktpFile.value = file;
  if (ktpPreviewUrl.value) {
    URL.revokeObjectURL(ktpPreviewUrl.value);
  }
  ktpPreviewUrl.value = URL.createObjectURL(file);
};

const triggerFileInput = () => {
  if (canEdit.value) {
    fileInputRef.value?.click();
  }
};

const removeSelectedFile = () => {
  ktpFile.value = null;
  if (ktpPreviewUrl.value) {
    URL.revokeObjectURL(ktpPreviewUrl.value);
    ktpPreviewUrl.value = null;
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

// Fetch KYC profile from server
const loadKyc = async () => {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  const signal = abortController.signal;

  isLoadingData.value = true;
  formError.value = null;
  try {
    const res = await apiClient.get<{
      status: string;
      data: MentorKycData;
    }>("/portal/kyc", { signal });

    if (res.data?.data) {
      const data = res.data.data;
      kycData.value = data;

      // Handle masked fields (P0-3 & D8)
      if (data.nik && (data.nik.includes("*") || data.nik.includes("•"))) {
        storedMaskedNik.value = data.nik;
        isEditingNik.value = false;
        nik.value = "";
      } else {
        storedMaskedNik.value = null;
        isEditingNik.value = true;
        nik.value = data.nik || "";
      }

      bankName.value = data.bank_name || "";

      if (data.bank_account_number && (data.bank_account_number.includes("*") || data.bank_account_number.includes("•"))) {
        storedMaskedAccount.value = data.bank_account_number;
        isEditingAccount.value = false;
        bankAccountNumber.value = "";
      } else {
        storedMaskedAccount.value = null;
        isEditingAccount.value = true;
        bankAccountNumber.value = data.bank_account_number || "";
      }

      bankAccountHolder.value = data.bank_account_holder || "";
      instagramHandle.value = data.instagram_handle || "";
      facebookHandle.value = data.facebook_handle || "";

      // D8 & P0-3: has_ktp indicates if a valid KTP file is already securely stored
      hasExistingKtp.value = Boolean(data.has_ktp || data.ktp_file_path);
    }
  } catch (err: any) {
    if (axios.isCancel(err) || err.name === "CanceledError") return;
    // If not found (404), it's REGISTERED state
    if (err.response?.status !== 404) {
      formError.value = err.response?.data?.message || "Gagal memuat profil KYC.";
    }
  } finally {
    if (!signal.aborted) {
      isLoadingData.value = false;
    }
  }
};

// Toggle editing for masked NIK
const startEditNik = () => {
  isEditingNik.value = true;
  nik.value = "";
};

const cancelEditNik = () => {
  if (storedMaskedNik.value) {
    isEditingNik.value = false;
    nik.value = "";
  }
};

// Toggle editing for masked Bank Account
const startEditAccount = () => {
  isEditingAccount.value = true;
  bankAccountNumber.value = "";
};

const cancelEditAccount = () => {
  if (storedMaskedAccount.value) {
    isEditingAccount.value = false;
    bankAccountNumber.value = "";
  }
};

// Submit KYC form
const handleSubmit = async () => {
  formError.value = null;

  // 1. NIK validation
  const nikToSubmit = (isEditingNik.value || !storedMaskedNik.value)
    ? nik.value.trim()
    : (storedMaskedNik.value || "");

  if (isEditingNik.value || !storedMaskedNik.value) {
    if (!nikToSubmit) {
      formError.value = "Nomor Induk Kependudukan (NIK) wajib diisi.";
      return;
    }
    if (!/^\d{16}$/.test(nikToSubmit)) {
      formError.value = "Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka.";
      return;
    }
  }

  // 2. Bank validation
  if (!bankName.value.trim()) {
    formError.value = "Nama bank wajib diisi.";
    return;
  }

  const accountToSubmit = (isEditingAccount.value || !storedMaskedAccount.value)
    ? bankAccountNumber.value.trim()
    : (storedMaskedAccount.value || "");

  if (isEditingAccount.value || !storedMaskedAccount.value) {
    if (!accountToSubmit) {
      formError.value = "Nomor rekening bank wajib diisi.";
      return;
    }
  }

  if (!bankAccountHolder.value.trim()) {
    formError.value = "Nama pemilik rekening wajib diisi.";
    return;
  }

  // 3. Socials validation
  if (!instagramHandle.value.trim() && !facebookHandle.value.trim()) {
    formError.value = "Isi minimal salah satu akun media sosial (Instagram atau Facebook).";
    return;
  }

  // 4. KTP file validation: required ONLY if no existing KTP is stored on server (P0-3 & D8)
  if (!ktpFile.value && !hasExistingKtp.value) {
    formError.value = "Foto KTP fisik asli wajib diunggah.";
    return;
  }

  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append("nik", nikToSubmit);
    formData.append("bank_name", bankName.value.trim());
    formData.append("bank_account_number", accountToSubmit);
    formData.append("bank_account_holder", bankAccountHolder.value.trim());

    if (instagramHandle.value.trim()) {
      formData.append("instagram_handle", instagramHandle.value.trim());
    }
    if (facebookHandle.value.trim()) {
      formData.append("facebook_handle", facebookHandle.value.trim());
    }
    if (ktpFile.value) {
      formData.append("ktp_file", ktpFile.value);
    }

    const res = await apiClient.post<{
      status: string;
      message?: string;
      data: MentorKycData;
    }>("/portal/kyc", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success(
      res.data?.message || "Data KYC Anda berhasil dikirim ke sistem.",
      "KYC Berhasil Dikirim"
    );

    // Refresh KYC data & access store immediately (isolated from submit error boundary)
    isEditing.value = false;
    try {
      await loadKyc();
      await accessStore.fetchAccess();
      await runEntranceAndPulse();
    } catch {
      // Suppress refresh errors so successful POST is not reported as failure (P2)
    }
  } catch (err: any) {
    formError.value =
      err.response?.data?.message ||
      err.message ||
      "Terjadi galat saat mengirimkan berkas KYC.";
    toast.error(formError.value || "Terjadi galat saat mengirimkan berkas KYC.", "Pengajuan KYC Gagal");
  } finally {
    isSubmitting.value = false;
  }
};

// Withdraw KYC submission
const handleWithdraw = async () => {
  if (!confirm("Apakah Anda yakin ingin menarik kembali pengajuan KYC untuk melakukan perbaikan berkas?")) {
    return;
  }

  isWithdrawing.value = true;
  formError.value = null;

  try {
    const res = await apiClient.post<{
      status: string;
      message?: string;
    }>("/portal/kyc/withdraw");

    toast.success(
      res.data?.message || "Pengajuan KYC berhasil ditarik kembali ke status draft.",
      "Berkas Ditarik"
    );

    isEditing.value = true;
    removeSelectedFile();
    try {
      await loadKyc();
      await accessStore.fetchAccess();
      await runEntranceAndPulse();
    } catch {
      // Suppress refresh errors
    }
  } catch (err: any) {
    formError.value =
      err.response?.data?.message ||
      err.message ||
      "Gagal menarik berkas KYC.";
    toast.error(formError.value || "Gagal menarik berkas KYC.", "Gagal Menarik Berkas");
  } finally {
    isWithdrawing.value = false;
  }
};

const runEntranceAndPulse = async () => {
  await nextTick();
  if (alertRef.value) {
    alertCtx?.revert();
    alertCtx = animatePageEntrance(alertRef.value, ".chassis-animate");
  }
  if (formRef.value) {
    formCtx?.revert();
    formCtx = animatePageEntrance(formRef.value, ".chassis-animate");
  }

  // Tactile LED pulse for pending states
  if (pendingLedRef.value && (isPendingReview.value || isSubmitted.value)) {
    ledTween?.kill();
    ledTween = animateLedPulse(pendingLedRef.value);
  }
};

onMounted(async () => {
  await loadKyc();
  await runEntranceAndPulse();
});

onUnmounted(() => {
  alertCtx?.revert();
  formCtx?.revert();
  ledTween?.kill();
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  if (ktpPreviewUrl.value) {
    URL.revokeObjectURL(ktpPreviewUrl.value);
    ktpPreviewUrl.value = null;
  }
});
</script>

<template>
  <AppPage
    width="form"
    title="Verifikasi Identitas Mentor (KYC)"
    subtitle="LEGAL_COMPLIANCE // KNOW_YOUR_CUSTOMER PROTOCOL V2.0"
    :status-led="isApproved ? 'success' : isRejected ? 'danger' : isPendingReview ? 'warning' : 'info'"
  >
    <template #actions>
      <AppBadge
        :variant="
          isApproved
            ? 'success'
            : isRejected
            ? 'danger'
            : isPendingReview
            ? 'warning'
            : 'neutral'
        "
      >
        <span
          v-if="isPendingReview || isSubmitted"
          ref="pendingLedRef"
          class="size-1.5 rounded-full bg-amber-400 mr-1.5 inline-block shrink-0 shadow-[0_0_6px_#f59e0b]"
        />
        STATUS // {{ currentStatus }}
      </AppBadge>
    </template>

    <template #alerts>
      <div v-if="isLoadingData" class="space-y-4">
        <AppSkeleton variant="block" class="w-full h-24 rounded-2xl" />
      </div>
      <div v-else ref="alertRef" class="space-y-4">
        <!-- Approved State -->
        <div v-if="isApproved" class="chassis-animate space-y-4">
          <AppAlert
            variant="success"
            title="Identitas Legal Terverifikasi"
            message="Selamat! Identitas Anda telah disetujui sebagai Mentor Resmi SkyShare Academy. Anda memiliki akses penuh ke fitur program yang Anda ikuti."
            code="KYC // 200_VERIFIED_LEGAL"
          />
        </div>

        <!-- Rejected State -->
        <div v-else-if="isRejected" class="chassis-animate space-y-4">
          <AppAlert
            variant="error"
            title="Pengajuan KYC Ditolak Admin"
            :message="`Alasan Penolakan: ${kycData?.reject_reason || accessStore.kyc?.reject_reason || 'KTP tidak jelas atau data tidak sesuai.'}`"
            code="KYC // 403_REJECTED"
          >
            <div class="mt-3">
              <AppButton
                variant="danger"
                size="sm"
                @click="isEditing = true"
              >
                Perbaiki & Kirim Ulang Berkas
              </AppButton>
            </div>
          </AppAlert>
        </div>

        <!-- Pending Review State -->
        <div v-else-if="isPendingReview" class="chassis-animate space-y-4">
          <AppAlert
            variant="warning"
            title="Sedang Dalam Peninjauan Admin"
            message="Berkas KYC dan bukti pembayaran Anda telah masuk ke dalam antrean review admin. Proses verifikasi membutuhkan waktu maksimal 1x24 jam kerja."
            code="KYC // 102_PENDING_REVIEW"
          >
            <div class="mt-3 flex items-center gap-3">
              <AppButton
                variant="secondary"
                size="sm"
                :loading="isWithdrawing"
                @click="handleWithdraw"
              >
                Tarik Berkas (Withdraw untuk Revisi)
              </AppButton>
            </div>
          </AppAlert>
        </div>

        <!-- KYC Submitted (Waiting for Order Proof) State -->
        <div v-else-if="isSubmitted" class="chassis-animate space-y-4">
          <AppAlert
            variant="info"
            title="Data KYC Tersimpan di Sistem"
            message="Data profil KYC Anda telah tersimpan. Langkah berikutnya: Buka halaman 'Program Belajar' untuk memesan program dan unggah bukti transfer QRIS agar pengajuan Anda segera diproses admin."
            code="KYC // 201_SUBMITTED_OK"
          >
            <div class="mt-3 flex items-center gap-3">
              <RouterLink to="/programs">
                <AppButton variant="primary" size="sm">
                  Buka Halaman Program & Pembayaran &rarr;
                </AppButton>
              </RouterLink>
            </div>
          </AppAlert>
        </div>

        <!-- Registered State -->
        <div v-else class="chassis-animate space-y-4">
          <AppAlert
            variant="info"
            title="Lengkapi Identitas Mentor"
            message="Sesuai kebijakan kepatuhan SkyShare Academy, setiap mentor wajib melengkapi identitas legal dan foto KTP sebelum dapat mengakses materi pembelajaran."
            code="KYC // 001_REQUIRED"
          />
        </div>

        <!-- Error Banner -->
        <div v-if="formError">
          <AppAlert
            variant="error"
            title="Gagal Memproses Data"
            :message="formError"
            dismissible
            @close="formError = null"
          />
        </div>
      </div>
    </template>

    <!-- Skeleton Loading State (Mirrors KYC Bolted Panel) -->
    <div v-if="isLoadingData" class="chassis-panel rounded-3xl p-6 sm:p-8 corner-screws relative space-y-6">
      <div class="flex items-center justify-between pb-3 border-b border-slate-300/80">
        <div class="flex items-center gap-2">
          <AppSkeleton variant="circle" class="size-2.5" />
          <AppSkeleton variant="line" class="w-56 h-5" />
        </div>
        <AppSkeleton variant="line" class="w-24 h-3" />
      </div>

      <div class="space-y-6">
        <!-- Section 1 Skeleton -->
        <div class="space-y-4">
          <AppSkeleton variant="line" class="w-48 h-4" />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-40 h-3.5" />
              <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
              <AppSkeleton variant="line" class="w-24 h-3" />
            </div>
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-36 h-3.5" />
              <AppSkeleton variant="block" class="w-full h-32 rounded-2xl" />
            </div>
          </div>
        </div>

        <!-- Section 2 Skeleton -->
        <div class="space-y-4 pt-4 border-t border-slate-300/80">
          <AppSkeleton variant="line" class="w-64 h-4" />
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-24 h-3.5" />
              <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
            </div>
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-28 h-3.5" />
              <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
            </div>
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-36 h-3.5" />
              <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
            </div>
          </div>
        </div>

        <!-- Section 3 Skeleton -->
        <div class="space-y-4 pt-4 border-t border-slate-300/80">
          <div class="flex items-center justify-between">
            <AppSkeleton variant="line" class="w-52 h-4" />
            <AppSkeleton variant="line" class="w-28 h-4 rounded" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-32 h-3.5" />
              <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
            </div>
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-32 h-3.5" />
              <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
            </div>
          </div>
        </div>

        <!-- Button Skeleton -->
        <div class="pt-6 border-t border-slate-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <AppSkeleton variant="line" class="w-60 h-3" />
          <AppSkeleton variant="block" class="w-44 h-11 rounded-2xl" />
        </div>
      </div>
    </div>

    <!-- Main Bolted Form Card -->
    <div v-else ref="formRef">
      <section class="chassis-animate chassis-panel rounded-3xl p-6 sm:p-8 corner-screws relative space-y-6">
        <div class="flex items-center justify-between pb-3 border-b border-slate-300/80">
          <div class="flex items-center gap-2">
            <span class="size-2 rounded-full bg-[#1E5FAD] shadow-[0_0_6px_#1E5FAD]"></span>
            <h2 class="text-base font-bold text-slate-800">
              Formulir Data Legal & Rekening Mentor
            </h2>
          </div>
          <span class="font-mono text-[10px] text-slate-400">
            DOC // SECURE_STORAGE
          </span>
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Section 1: KTP & NIK -->
          <div class="space-y-4">
            <h3 class="font-mono text-xs font-bold text-[#1E5FAD] uppercase tracking-wider flex items-center gap-2">
              <span>[01]</span> IDENTITAS KEPENDUDUKAN (KTP)
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <!-- NIK Input or Masked Readout -->
              <div class="space-y-2">
                <label class="font-mono text-[11px] uppercase tracking-wider font-bold text-[#1E5FAD] flex items-center justify-between">
                  <span class="flex items-center gap-1.5">
                    <span class="size-1.5 rounded-full bg-[#38BDF8] inline-block shadow-[0_0_6px_#38BDF8]"></span>
                    Nomor Induk Kependudukan (NIK)
                    <span class="text-rose-500 font-bold">*</span>
                  </span>
                  <button
                    v-if="!isEditingNik && storedMaskedNik && canEdit"
                    type="button"
                    class="text-xs text-[#1E5FAD] hover:underline font-mono font-bold cursor-pointer min-h-[44px] inline-flex items-center"
                    @click="startEditNik"
                  >
                    [Ubah NIK]
                  </button>
                  <button
                    v-else-if="isEditingNik && storedMaskedNik && canEdit"
                    type="button"
                    class="text-xs text-slate-500 hover:underline font-mono cursor-pointer min-h-[44px] inline-flex items-center"
                    @click="cancelEditNik"
                  >
                    [Batal Ubah]
                  </button>
                </label>

                <!-- Masked display if already stored and not editing -->
                <div
                  v-if="!isEditingNik && storedMaskedNik"
                  class="p-3.5 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/50 flex items-center justify-between font-mono text-sm text-slate-700"
                >
                  <div class="flex items-center gap-2">
                    <svg class="size-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span class="tracking-widest font-bold">{{ storedMaskedNik }}</span>
                  </div>
                  <span class="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    TERSALIN AMAN
                  </span>
                </div>

                <!-- Input if entering new NIK -->
                <div v-else class="space-y-1">
                  <AppInput
                    v-model="nik"
                    inputmode="numeric"
                    placeholder="16 digit sesuai KTP (contoh: 3201234567890001)"
                    :disabled="!canEdit"
                    :required="true"
                    :error="nikError"
                    hint="Wajib tepat 16 digit sesuai e-KTP fisik"
                  />
                  <div class="flex justify-between items-center px-1 font-mono text-[10px] text-slate-500">
                    <span>DIGIT COUNTER:</span>
                    <span :class="nik.length === 16 ? 'text-emerald-600 font-bold' : 'text-slate-600'">
                      {{ nik.length }} / 16 DIGIT
                    </span>
                  </div>
                </div>
              </div>

              <!-- KTP Photo Upload Zone -->
              <div class="space-y-2">
                <label class="font-mono text-[11px] uppercase tracking-wider font-bold text-[#1E5FAD] flex items-center gap-1.5">
                  <span class="size-1.5 rounded-full bg-[#38BDF8] inline-block shadow-[0_0_6px_#38BDF8]"></span>
                  Foto e-KTP Fisik Asli
                  <span v-if="!hasExistingKtp" class="text-rose-500 font-bold">*</span>
                </label>

                <!-- Hidden input -->
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  :disabled="!canEdit"
                  @change="handleFileChange"
                />

                <!-- Upload Drag-Drop Frame -->
                <div
                  :class="[
                    'relative rounded-2xl border-2 border-dashed p-4 transition-all duration-150 flex flex-col items-center justify-center text-center',
                    canEdit
                      ? 'border-[#1E5FAD]/40 bg-[#d7e0ec] hover:bg-[#d0dbe9] cursor-pointer'
                      : 'border-slate-300 bg-slate-200/60 cursor-not-allowed opacity-80',
                    ktpFile || ktpPreviewUrl ? 'border-emerald-400 bg-emerald-50/20' : ''
                  ]"
                  @click="triggerFileInput"
                >
                  <!-- Image Preview if selected -->
                  <div v-if="ktpPreviewUrl" class="w-full flex flex-col items-center space-y-2">
                    <div class="relative max-w-xs overflow-hidden rounded-xl border border-emerald-400 shadow-md">
                      <img
                        :src="ktpPreviewUrl"
                        alt="Pratinjau KTP"
                        class="max-h-36 w-auto object-cover"
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[10px] text-emerald-700 font-bold">
                        ✓ {{ ktpFile?.name }} ({{ Math.round((ktpFile?.size || 0) / 1024) }} KB)
                      </span>
                      <button
                        v-if="canEdit"
                        type="button"
                        class="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                        @click.stop="removeSelectedFile"
                      >
                        [Hapus]
                      </button>
                    </div>
                  </div>

                  <!-- Existing file notice if already uploaded previously (P0-3: hasExistingKtp) -->
                  <div v-else-if="hasExistingKtp" class="w-full flex flex-col items-center space-y-1.5">
                    <div class="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-mono text-xs font-bold flex items-center gap-2">
                      <svg class="size-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>FOTO KTP TERSIMPAN DI STORAGE PRIVAT</span>
                    </div>
                    <p v-if="canEdit" class="text-[11px] text-slate-500 font-sans">
                      Klik di sini jika ingin mengganti foto KTP dengan berkas baru
                    </p>
                  </div>

                  <!-- Empty prompt -->
                  <div v-else class="space-y-1">
                    <div class="size-10 rounded-xl bg-[#ebf0f7] text-[#1E5FAD] shadow-[2px_2px_4px_#b5c2d3,-2px_-2px_4px_#ffffff] mx-auto flex items-center justify-center">
                      <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p class="text-xs font-bold text-slate-700">
                      Pilih Berkas atau Tarik Foto KTP
                    </p>
                    <p class="font-mono text-[10px] text-slate-500">
                      JPG, PNG, atau WebP (Maksimal 5 MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Bank Information -->
          <div class="space-y-4 pt-4 border-t border-slate-300/80">
            <h3 class="font-mono text-xs font-bold text-[#1E5FAD] uppercase tracking-wider flex items-center gap-2">
              <span>[02]</span> INFORMASI REKENING BANK (PENGIRIMAN HONOR MENTOR)
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AppInput
                v-model="bankName"
                label="Nama Bank"
                placeholder="Nama bank (contoh: BCA, Mandiri, BNI, BRI, BSI)"
                :disabled="!canEdit"
                :required="true"
              />

              <!-- Bank Account Number with Masked Toggle -->
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <label class="font-mono text-[11px] uppercase tracking-wider font-bold text-[#1E5FAD] flex items-center gap-1.5">
                    <span class="size-1.5 rounded-full bg-[#38BDF8]"></span>
                    Nomor Rekening
                    <span class="text-rose-500 font-bold">*</span>
                  </label>
                  <button
                    v-if="!isEditingAccount && storedMaskedAccount && canEdit"
                    type="button"
                    class="text-xs text-[#1E5FAD] hover:underline font-mono font-bold cursor-pointer min-h-[44px] inline-flex items-center"
                    @click="startEditAccount"
                  >
                    [Ubah]
                  </button>
                  <button
                    v-else-if="isEditingAccount && storedMaskedAccount && canEdit"
                    type="button"
                    class="text-xs text-slate-500 hover:underline font-mono cursor-pointer min-h-[44px] inline-flex items-center"
                    @click="cancelEditAccount"
                  >
                    [Batal]
                  </button>
                </div>

                <!-- Masked display -->
                <div
                  v-if="!isEditingAccount && storedMaskedAccount"
                  class="p-2.5 rounded-xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/50 flex items-center justify-between font-mono text-xs text-slate-700"
                >
                  <span class="tracking-wider font-bold">{{ storedMaskedAccount }}</span>
                  <span class="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                    TERSIMPAN
                  </span>
                </div>

                <!-- Input if editing -->
                <AppInput
                  v-else
                  v-model="bankAccountNumber"
                  inputmode="numeric"
                  placeholder="Nomor rekening tanpa spasi (contoh: 5220304901)"
                  :disabled="!canEdit"
                  :required="true"
                />
              </div>

              <AppInput
                v-model="bankAccountHolder"
                label="Nama Pemilik Rekening"
                placeholder="Nama lengkap sesuai buku rekening (contoh: Budi Santoso)"
                :disabled="!canEdit"
                :required="true"
              />
            </div>
          </div>

          <!-- Section 3: Social Media Handles -->
          <div class="space-y-4 pt-4 border-t border-slate-300/80">
            <div class="flex items-center justify-between">
              <h3 class="font-mono text-xs font-bold text-[#1E5FAD] uppercase tracking-wider flex items-center gap-2">
                <span>[03]</span> AKUN MEDIA SOSIAL (PROFIL PROFESIONAL)
              </h3>
              <span class="font-mono text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                MINIMAL SALAH SATU
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppInput
                v-model="instagramHandle"
                label="Instagram Username"
                placeholder="@username atau https://instagram.com/username"
                :disabled="!canEdit"
              >
                <template #prefix>
                  <span class="font-mono text-xs text-slate-400 font-bold">IG //</span>
                </template>
              </AppInput>

              <AppInput
                v-model="facebookHandle"
                label="Facebook Profile"
                placeholder="Nama akun atau https://facebook.com/username"
                :disabled="!canEdit"
              >
                <template #prefix>
                  <span class="font-mono text-xs text-slate-400 font-bold">FB //</span>
                </template>
              </AppInput>
            </div>

            <p v-if="socialError" class="font-mono text-[11px] text-rose-500 font-semibold">
              ERR // {{ socialError }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div v-if="canEdit" class="pt-6 border-t border-slate-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p class="font-mono text-[10px] text-slate-500">
              SISTEM // DENGAN MENGIRIMKAN FORMULIR, ANDA MENJAMIN KEABSAHAN DATA LEGAL.
            </p>

            <div class="flex items-center gap-3">
              <AppButton
                type="submit"
                variant="primary"
                :loading="isSubmitting"
              >
                {{ isRejected ? "Kirim Ulang Berkas KYC" : "Simpan & Ajukan KYC" }}
              </AppButton>
            </div>
          </div>

          <!-- Read-Only Notice for Approved -->
          <div v-else-if="isApproved" class="pt-4 border-t border-slate-300/80 flex items-center justify-between font-mono text-xs text-emerald-700">
            <span>STATUS: DATA KYC TELAH DIKUNCI OLEH SISTEM (VERIFIED IMMUTABLE)</span>
            <span>APPROVED // 200</span>
          </div>
        </form>
      </section>
    </div>
  </AppPage>
</template>
