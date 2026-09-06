<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import AppButton from "@/components/common/AppButton.vue";
import AppInput from "@/components/common/AppInput.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import { useAlert } from "@/composables/useAlert";
import { gsap, animateMascotFloat, MECHANICAL_EASE } from "@/utils/animations";

const authStore = useAuthStore();
const toast = useAlert();
const cardRef = ref<HTMLElement | null>(null);
const mascotRef = ref<HTMLElement | null>(null);

const name = ref(authStore.user?.name || "");
const region = ref(authStore.user?.region || "");
const age = ref(authStore.user?.age || 21);
const occupation = ref(authStore.user?.occupation || "");
const isSaving = ref(false);
const saveSuccess = ref(false);
const errorMessage = ref("");

const handleSave = () => {
  errorMessage.value = "";
  isSaving.value = true;
  setTimeout(() => {
    try {
      if (authStore.user) {
        authStore.setUser({
          ...authStore.user,
          name: name.value,
          region: region.value,
          age: Number(age.value),
          occupation: occupation.value,
        });
      }
      isSaving.value = false;
      saveSuccess.value = true;
      toast.success("Perubahan data profil berhasil disinkronkan ke sistem.", "Profil Diperbarui");
      setTimeout(() => {
        saveSuccess.value = false;
      }, 5000);
    } catch (err: any) {
      isSaving.value = false;
      errorMessage.value = err.message || "Gagal menyimpan perubahan data profil.";
      toast.error(errorMessage.value, "Penyimpanan Gagal");
    }
  }, 500);
};

onMounted(() => {
  if (cardRef.value) {
    gsap.from(cardRef.value, {
      y: 25,
      opacity: 0,
      duration: 0.5,
      ease: MECHANICAL_EASE,
    });
  }

  if (mascotRef.value) {
    animateMascotFloat(mascotRef.value);
  }
});
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full bg-cyan-500 shadow-[0_0_6px_#06b6d4] animate-pulse"></span>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Profil & Identitas Anggota</h2>
      </div>
      <p class="font-mono text-[11px] text-slate-500 mt-1">
        CONFIG // USER IDENTITY & PARTICIPANT CREDENTIALS
      </p>
    </div>

    <!-- Bolted Profile Module -->
    <div
      ref="cardRef"
      class="bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-6 sm:p-8 space-y-6"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="size-16 rounded-2xl bg-linear-to-b from-[#2a7bd9] to-[#1E5FAD] text-white font-mono font-bold text-2xl flex items-center justify-center shadow-[3px_3px_8px_#b5c2d3,-2px_-2px_6px_#ffffff] border border-white/40">
            {{ (authStore.user?.name || "U").charAt(0).toUpperCase() }}
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-lg font-bold text-slate-800">{{ authStore.user?.name || "Member" }}</h3>
              <img
                :src="authStore.userRole === 'mentor' ? '/images/Mentor-logo.webp' : '/images/Talent-logo.webp'"
                :alt="authStore.userRole"
                class="h-4 sm:h-5 w-auto object-contain"
              />
              <AppBadge :variant="authStore.userRole === 'mentor' ? 'mentor' : 'talent'" size="sm">
                {{ authStore.userRole === "mentor" ? "Mentor" : "Talent" }}
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
          placeholder="Nama kamu"
          required
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="region"
            label="Asal Daerah / Kota"
            placeholder="Kota asal"
            required
          />
          <AppInput
            v-model="age"
            label="Usia (Tahun)"
            placeholder="Usia"
            type="number"
            required
          />
        </div>

        <AppInput
          v-model="occupation"
          label="Pekerjaan / Instansi Saat Ini"
          placeholder="Mahasiswa / Software Engineer"
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
  </div>
</template>
