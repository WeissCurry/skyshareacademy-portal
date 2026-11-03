<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAccessStore } from "@/stores/access";
import { apiClient } from "@/api/client";
import AppButton from "@/components/common/AppButton.vue";
import AppInput from "@/components/common/AppInput.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppPage from "@/components/common/AppPage.vue";
import { useAlert } from "@/composables/useAlert";
import type { PointLedgerData } from "@/types";
import { gsap, animateMascotFloat, MECHANICAL_EASE } from "@/utils/animations";

const authStore = useAuthStore();
const accessStore = useAccessStore();
const toast = useAlert();
const cardRef = ref<HTMLElement | null>(null);
const mascotRef = ref<HTMLElement | null>(null);

let entranceCtx: { revert: () => void } | null = null;
let floatTween: any = null;

const name = ref(authStore.user?.name || "");
const region = ref(authStore.user?.region || "");
const age = ref<number | "">(authStore.user?.age || 21);
const occupation = ref(authStore.user?.occupation || "");
const isLoading = ref(true);
const isSaving = ref(false);
const saveSuccess = ref(false);
const errorMessage = ref("");

// Points Data
const pointsData = ref<PointLedgerData>({
  balance: accessStore.pointsBalance,
  history: [],
});
const isLoadingPoints = ref(false);

const formatIndonesianDate = (dateStr?: string | null): string => {
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

const loadPoints = async () => {
  isLoadingPoints.value = true;
  try {
    const res = await apiClient.get<{ status: string; data: PointLedgerData }>("/portal/me/points");
    if (res.data?.data) {
      pointsData.value = res.data.data;
      accessStore.pointsBalance = res.data.data.balance;
    }
  } catch {
    // Keep local store points balance fallback
  } finally {
    isLoadingPoints.value = false;
  }
};

const loadProfile = async () => {
  isLoading.value = true;
  try {
    const res = await apiClient.get<{
      status: string;
      data: any;
    }>("/student/me");

    if (res.data?.data) {
      const u = res.data.data;
      name.value = u.name || "";
      region.value = u.region || "";
      age.value = u.age || 21;
      occupation.value = u.occupation || "";
      authStore.setUser({ ...authStore.user, ...u });
    }
  } catch (err: any) {
    if (err.response?.status !== 401) {
      errorMessage.value =
        err.response?.data?.message ||
        err.message ||
        "Gagal menyinkronkan data profil dari server.";
    }
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  errorMessage.value = "";

  // Client validation aligned with server schema
  if (!name.value.trim()) {
    errorMessage.value = "Nama lengkap wajib diisi.";
    return;
  }
  const ageNum = Number(age.value);
  if (!age.value || isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
    errorMessage.value = "Usia wajib berupa angka antara 5 sampai 120 tahun.";
    return;
  }
  if (!region.value.trim()) {
    errorMessage.value = "Wilayah / Kota domisili wajib diisi.";
    return;
  }
  if (!occupation.value.trim()) {
    errorMessage.value = "Pekerjaan / profesi saat ini wajib diisi.";
    return;
  }

  isSaving.value = true;
  saveSuccess.value = false;

  try {
    const payload = {
      name: name.value.trim(),
      region: region.value.trim(),
      age: ageNum,
      occupation: occupation.value.trim(),
    };

    const res = await apiClient.put<{
      status: string;
      data?: any;
      message?: string;
    }>("/student/me", payload);

    if (authStore.user) {
      authStore.setUser({
        ...authStore.user,
        ...payload,
      });
    }

    saveSuccess.value = true;
    toast.success(
      res.data?.message || "Perubahan data profil berhasil disinkronkan ke sistem.",
      "Profil Diperbarui"
    );
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || err.message || "Gagal menyimpan perubahan data profil.";
    toast.error(errorMessage.value, "Penyimpanan Gagal");
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  await Promise.allSettled([loadProfile(), loadPoints()]);
  await nextTick();

  if (cardRef.value) {
    entranceCtx = gsap.context(() => {
      gsap.from(cardRef.value, {
        y: 25,
        opacity: 0,
        duration: 0.5,
        ease: MECHANICAL_EASE,
        clearProps: "all",
      });
    }, cardRef.value);
  }

  if (mascotRef.value) {
    floatTween = animateMascotFloat(mascotRef.value);
  }
});

onUnmounted(() => {
  entranceCtx?.revert();
  floatTween?.kill();
});
</script>

<template>
  <AppPage
    width="form"
    title="Profil Akun & Hak Akses"
    subtitle="CONFIG // ACCOUNT IDENTITY, DERIVED ROLES & POINT LEDGER"
    status-led="info"
  >
    <!-- Alert Notifications -->
    <template #alerts>
      <div v-if="saveSuccess">
        <AppAlert
          variant="success"
          title="Profil Berhasil Disimpan"
          message="Informasi identitas profil Anda telah diperbarui di server."
          dismissible
          @close="saveSuccess = false"
        />
      </div>

      <div v-if="errorMessage">
        <AppAlert
          variant="error"
          title="Gagal Memperbarui Profil"
          :message="errorMessage"
          dismissible
          @close="errorMessage = ''"
        />
      </div>
    </template>

    <div class="space-y-6">
      <!-- Contributor Shortcut Banner if authorized -->
      <div
        v-if="accessStore.isContributor"
        class="p-4 sm:p-5 rounded-2xl bg-indigo-50/90 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">✍️</span>
          <div>
            <p class="text-xs font-bold text-indigo-950 font-mono">STATUS // KONTRIBUTOR ARTIKEL AKTIF</p>
            <p class="text-xs text-indigo-800 font-sans">
              Anda memiliki hak istimewa untuk menulis draf dan mempublikasikan artikel materi edukasi.
            </p>
          </div>
        </div>
        <RouterLink to="/articles/manage">
          <AppButton variant="primary" size="sm">
            Buka Ruang Artikel &rarr;
          </AppButton>
        </RouterLink>
      </div>

      <!-- Skeleton Loading State (Mirrors Profile Hardware Card) -->
      <div
        v-if="isLoading"
        class="bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-6 sm:p-8 space-y-6"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <AppSkeleton variant="circle" class="size-16" />
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <AppSkeleton variant="line" class="w-36 h-5" />
                <AppSkeleton variant="line" class="w-16 h-5 rounded-md" />
              </div>
              <AppSkeleton variant="line" class="w-48 h-3.5" />
              <AppSkeleton variant="line" class="w-32 h-3" />
            </div>
          </div>
          <div class="hidden sm:block shrink-0">
            <AppSkeleton variant="block" class="w-20 h-20 rounded-2xl" />
          </div>
        </div>

        <!-- Form Inputs Skeleton -->
        <div class="space-y-4 pt-4 border-t border-slate-300">
          <div class="space-y-2">
            <AppSkeleton variant="line" class="w-28 h-3.5" />
            <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-36 h-3.5" />
              <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
            </div>
            <div class="space-y-2">
              <AppSkeleton variant="line" class="w-24 h-3.5" />
              <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
            </div>
          </div>

          <div class="space-y-2">
            <AppSkeleton variant="line" class="w-44 h-3.5" />
            <AppSkeleton variant="block" class="w-full h-11 rounded-2xl" />
          </div>

          <div class="flex justify-end pt-2">
            <AppSkeleton variant="block" class="w-36 h-11 rounded-2xl" />
          </div>
        </div>
      </div>

      <!-- Bolted Profile Module -->
      <div
        v-else
        ref="cardRef"
        class="bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-6 sm:p-8 space-y-6"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="size-16 rounded-2xl bg-linear-to-b from-[#2a7bd9] to-[#1E5FAD] text-white font-mono font-bold text-2xl flex items-center justify-center shadow-[3px_3px_8px_#b5c2d3,-2px_-2px_6px_#ffffff] border border-white/40">
              {{ (authStore.user?.name || "M").charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg font-bold text-slate-800">{{ authStore.user?.name || "Pengguna" }}</h2>
                <AppBadge
                  v-for="role in accessStore.roles"
                  :key="role"
                  :variant="role === 'mentor' ? 'mentor' : role === 'parent' ? 'warning' : role === 'verified_visitor' ? 'success' : 'neutral'"
                  size="sm"
                >
                  {{ role === 'visitor' ? 'Visitor' : role === 'verified_visitor' ? 'Verified Visitor' : role === 'mentor' ? 'Mentor' : role === 'parent' ? 'Parent' : 'Talent' }}
                </AppBadge>
                <AppBadge v-if="accessStore.isContributor" variant="talent" size="sm">
                  Kontributor
                </AppBadge>
              </div>
              <p class="font-mono text-xs text-slate-500 mt-1">
                {{ authStore.user?.email || authStore.user?.phone || "member@skyshareacademy.id" }}
              </p>
              <div class="flex items-center gap-1.5 mt-2">
                <span class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                <span class="font-mono text-[10px] font-bold text-emerald-700 uppercase">AKUN_TERVERIFIKASI // 200_OK</span>
              </div>
            </div>
          </div>

          <div ref="mascotRef" class="hidden sm:block shrink-0">
            <div class="p-2 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff]">
              <img
                src="/images/mascot-icons/pose=5.webp"
                alt="SkyShare Mascot"
                class="w-18 h-auto object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </div>

        <!-- Form Inputs -->
        <form class="space-y-4 pt-4 border-t border-slate-300" @submit.prevent="handleSave">
          <AppInput
            v-model="name"
            label="Nama Lengkap"
            placeholder="Nama lengkap sesuai identitas resmi"
            required
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput
              v-model="region"
              label="Asal Daerah / Kota"
              placeholder="Kota atau kabupaten domisili saat ini (contoh: Jakarta Selatan)"
              required
            />
            <AppInput
              v-model="age"
              label="Usia (Tahun)"
              placeholder="Usia saat ini dalam tahun (contoh: 24)"
              type="number"
              inputmode="numeric"
              required
            />
          </div>

          <AppInput
            v-model="occupation"
            label="Pekerjaan / Instansi Saat Ini"
            placeholder="Profesi atau instansi saat ini (contoh: Software Engineer / Tech Lead)"
            required
          />

          <div class="flex justify-end pt-2">
            <AppButton
              type="submit"
              variant="primary"
              :loading="isSaving"
            >
              Simpan Perubahan
            </AppButton>
          </div>
        </form>
      </div>

      <!-- Points Balance & Ledger History Module (Phase 2) -->
      <div class="bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-6 sm:p-8 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300">
          <div class="flex items-center gap-2">
            <span class="size-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse"></span>
            <span class="font-mono text-xs font-bold text-slate-800 uppercase tracking-wider">
              POIN GAMIFIKASI // SALDO & MUTASI
            </span>
          </div>

          <div class="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-300 font-mono text-sm font-bold text-amber-900 flex items-center gap-2 shadow-[inset_1px_1px_2px_#ffffff]">
            <span>⭐ SALDO:</span>
            <span class="text-base text-amber-700 font-extrabold">{{ pointsData.balance }} POIN</span>
          </div>
        </div>

        <!-- Ledger List -->
        <div class="space-y-3">
          <span class="font-mono text-[10px] uppercase font-bold text-slate-500 block">
            RIWAYAT PERUBAHAN POIN (READ-ONLY)
          </span>

          <div v-if="isLoadingPoints" class="space-y-2">
            <AppSkeleton v-for="i in 2" :key="i" variant="block" class="w-full h-12 rounded-xl" />
          </div>

          <div v-else-if="pointsData.history.length === 0" class="p-6 rounded-2xl bg-white/50 border border-slate-200 text-center">
            <p class="font-mono text-xs text-slate-500">Belum ada catatan mutasi transaksi poin pada akun ini.</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="entry in pointsData.history"
              :key="entry.id"
              class="p-3.5 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between gap-3 text-xs font-mono shadow-xs"
            >
              <div class="space-y-0.5">
                <span class="font-bold text-slate-800 block">{{ entry.reason_code }}</span>
                <span v-if="entry.note" class="text-slate-600 font-sans block text-[11px]">{{ entry.note }}</span>
                <span class="text-[10px] text-slate-400 block">{{ formatIndonesianDate(entry.created_at) }}</span>
              </div>

              <span
                class="font-bold text-sm px-2.5 py-1 rounded-lg border font-mono"
                :class="entry.delta > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'"
              >
                {{ entry.delta > 0 ? `+${entry.delta}` : entry.delta }} Pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppPage>
</template>
