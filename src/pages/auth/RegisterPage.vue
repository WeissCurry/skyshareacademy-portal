<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute, RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import type { UserRole } from "@/types";
import AppButton from "@/components/common/AppButton.vue";
import AppInput from "@/components/common/AppInput.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import { gsap, animateMascotFloat, MECHANICAL_EASE } from "@/utils/animations";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const cardRef = ref<HTMLElement | null>(null);
const mascotRef = ref<HTMLElement | null>(null);

// Step state: 1 (Destination), 2 (OTP), 3 (Profile details)
const currentStep = ref<1 | 2 | 3>(1);

// Step 1 & 2
const destination = ref("");
const otp = ref("");
const loading = ref(false);
const error = ref("");
const debugOtpMessage = ref("");

// Step 3 (Profile)
const name = ref("");
const region = ref("");
const age = ref<number | "">("");
const occupation = ref("");
const role = ref<UserRole>("talent");

onMounted(() => {
  if (route.query.destination) {
    destination.value = String(route.query.destination);
  }
  if (route.query.step === "3") {
    currentStep.value = 3;
  }

  if (cardRef.value) {
    gsap.from(cardRef.value, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: MECHANICAL_EASE,
    });
  }

  if (mascotRef.value) {
    animateMascotFloat(mascotRef.value);
  }
});

const handleSendOtp = async () => {
  if (!destination.value.trim()) {
    error.value = "Masukkan email atau nomor HP kamu.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const isEmail = destination.value.includes("@");
    const res = await authStore.sendOtp(destination.value.trim(), isEmail ? "email" : "phone");
    currentStep.value = 2;
    if (res?.data?.debugOtp) {
      debugOtpMessage.value = `Kode verifikasi demo: ${res.data.debugOtp}`;
    }
  } catch (err: any) {
    error.value = err.message || "Gagal mengirimkan kode OTP.";
  } finally {
    loading.value = false;
  }
};

const handleVerifyOtp = async () => {
  if (!otp.value.trim() || otp.value.length < 6) {
    error.value = "Masukkan 6 digit kode OTP.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await authStore.verifyOtp(destination.value.trim(), otp.value.trim());
    currentStep.value = 3;
  } catch (err: any) {
    error.value = err.message || "Kode OTP tidak valid atau kedaluwarsa.";
  } finally {
    loading.value = false;
  }
};

const handleCompleteProfile = async () => {
  if (!name.value.trim() || !region.value.trim() || !age.value || !occupation.value.trim()) {
    error.value = "Lengkapi semua data pendaftaran dengan benar.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const isEmail = destination.value.includes("@");
    await authStore.registerProfile({
      destination: destination.value.trim(),
      name: name.value.trim(),
      region: region.value.trim(),
      age: Number(age.value),
      occupation: occupation.value.trim(),
      role: role.value,
      email: isEmail ? destination.value.trim() : undefined,
      phone: !isEmail ? destination.value.trim() : undefined,
    });

    router.push("/dashboard");
  } catch (err: any) {
    error.value = err.message || "Gagal melengkapi profil.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div ref="cardRef" class="bg-[#ebf0f7] rounded-3xl shadow-[8px_8px_18px_#b5c2d3,-8px_-8px_18px_#ffffff] border border-white/80 corner-screws p-6 sm:p-8 pt-8 relative">
    <!-- Top Hardware Vents & System Label -->
    <div class="w-full flex items-center justify-between mb-2 px-1">
      <span class="font-mono text-[10px] font-bold tracking-widest text-[#1E5FAD] uppercase flex items-center gap-1.5">
        <span class="size-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_#06b6d4] animate-pulse"></span>
        REG // 02-ONBOARDING
      </span>

      <!-- Ventilation Slots -->
      <div class="flex gap-1.5 items-center">
        <div class="h-4 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
        <div class="h-4 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
        <div class="h-4 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
      </div>
    </div>

    <!-- Mascot Greeting with GSAP float -->
    <div class="flex justify-center -mt-8 mb-3">
      <div ref="mascotRef" class="relative p-2 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_5px_#b5c2d3,inset_-2px_-2px_5px_#ffffff]">
        <img
          src="/images/mascot-icons/pose=1.webp"
          alt="SkyShare Mascot"
          class="w-20 sm:w-22 h-auto object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
        />
      </div>
    </div>

    <!-- Header -->
    <div class="mb-6 text-center">
      <h2 class="text-xl font-bold text-slate-800 tracking-tight">Daftar Akun Portal</h2>
      <p class="text-xs text-slate-500 mt-1 font-sans">
        Buat akun baru untuk mengakses ekosistem SkyShare Academy
      </p>

      <!-- Mechanical Stepper Track -->
      <div class="flex items-center justify-center gap-2 mt-4">
        <div
          v-for="s in [1, 2, 3]"
          :key="s"
          :class="[
            'h-2 rounded-full transition-all duration-300',
            currentStep === s
              ? 'w-8 bg-[#1E5FAD] shadow-[0_0_8px_rgba(30,95,173,0.6)]'
              : currentStep > s
              ? 'w-4 bg-emerald-500 shadow-[0_0_6px_#10b981]'
              : 'w-4 bg-[#d7e0ec] shadow-[inset_1px_1px_2px_#b5c2d3]'
          ]"
        />
      </div>
      <p class="font-mono text-[10px] font-bold text-[#1E5FAD] tracking-wider uppercase mt-2">
        STEP 0{{ currentStep }} // 03:
        <span v-if="currentStep === 1">KONTAK</span>
        <span v-else-if="currentStep === 2">VERIFIKASI OTP</span>
        <span v-else>DATA PROFIL</span>
      </p>
    </div>

    <!-- Alert Notifications -->
    <div v-if="error" class="mb-4">
      <AppAlert
        variant="error"
        title="Registrasi Gagal"
        :message="error"
        dismissible
        @close="error = ''"
      />
    </div>

    <!-- Step 1: Destination -->
    <form v-if="currentStep === 1" class="space-y-4" @submit.prevent="handleSendOtp">
      <AppInput
        v-model="destination"
        label="Email atau No. WhatsApp"
        placeholder="nama@email.com atau 08123456789"
        required
        hint="Kami akan mengirimkan 6 digit kode OTP verifikasi."
      />

      <AppButton
        type="submit"
        variant="primary"
        :loading="loading"
        class-name="w-full"
      >
        Kirim Kode Verifikasi
      </AppButton>
    </form>

    <!-- Step 2: OTP -->
    <form v-else-if="currentStep === 2" class="space-y-4" @submit.prevent="handleVerifyOtp">
      <!-- Debug Helper -->
      <div v-if="debugOtpMessage">
        <AppAlert
          variant="info"
          title="Kode OTP Demo Tersedia"
          :message="debugOtpMessage"
          dismissible
          @close="debugOtpMessage = ''"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 text-xs font-bold text-[#1E5FAD] hover:underline cursor-pointer mt-1"
            @click="otp = '123456'"
          >
            <span>↳ Klik di sini untuk Isi Otomatis (123456)</span>
          </button>
        </AppAlert>
      </div>

      <div class="text-left">
        <p class="text-xs text-slate-600 font-sans">
          Masukkan 6 digit kode yang dikirim ke
          <strong class="text-slate-800 font-mono">{{ destination }}</strong>
        </p>
      </div>

      <AppInput
        v-model="otp"
        label="Kode OTP (6 Digit)"
        placeholder="123456"
        type="text"
        required
      />

      <div class="flex gap-3">
        <AppButton
          type="button"
          variant="secondary"
          class-name="flex-1"
          @click="currentStep = 1"
        >
          &larr; Kembali
        </AppButton>
        <AppButton
          type="submit"
          variant="primary"
          :loading="loading"
          class-name="flex-1"
        >
          Verifikasi
        </AppButton>
      </div>
    </form>

    <!-- Step 3: Complete Profile Details -->
    <form v-else-if="currentStep === 3" class="space-y-3.5" @submit.prevent="handleCompleteProfile">
      <AppInput
        v-model="name"
        label="Nama Lengkap"
        placeholder="contoh: Muhammad Rizky"
        required
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AppInput
          v-model="region"
          label="Asal Daerah / Kota"
          placeholder="contoh: Bandung"
          required
        />
        <AppInput
          v-model="age"
          label="Usia (Tahun)"
          placeholder="contoh: 21"
          type="number"
          required
        />
      </div>

      <AppInput
        v-model="occupation"
        label="Pekerjaan / Institusi"
        placeholder="contoh: Mahasiswa ITB / Fresh Graduate"
        required
      />

      <!-- Role Selection Mechanical Rockers -->
      <div class="flex flex-col gap-1.5 text-left">
        <label class="font-mono text-[11px] uppercase tracking-wider font-bold text-[#1E5FAD] flex items-center gap-1.5">
          <span class="size-1.5 rounded-full bg-[#38BDF8]"></span>
          Pilih Peran Akun:
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            :class="[
              'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2',
              role === 'talent'
                ? 'bg-[#ebf0f7] border-[#1E5FAD] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] translate-y-[1px]'
                : 'bg-[#ebf0f7] border-white/80 shadow-[4px_4px_9px_#b5c2d3,-4px_-4px_9px_#ffffff] hover:brightness-105 active:translate-y-[1px]'
            ]"
            @click="role = 'talent'"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs font-bold text-[#1E5FAD]">TALENT</span>
              <img src="/images/Talent-logo.webp" alt="Talent" class="h-4 sm:h-5 w-auto object-contain" />
            </div>
            <div class="text-[11px] text-slate-500 font-sans">Peserta event & materi</div>
          </button>

          <button
            type="button"
            :class="[
              'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2',
              role === 'mentor'
                ? 'bg-[#ebf0f7] border-[#1E5FAD] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] translate-y-[1px]'
                : 'bg-[#ebf0f7] border-white/80 shadow-[4px_4px_9px_#b5c2d3,-4px_-4px_9px_#ffffff] hover:brightness-105 active:translate-y-[1px]'
            ]"
            @click="role = 'mentor'"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs font-bold text-[#1E5FAD]">MENTOR</span>
              <img src="/images/Mentor-logo.webp" alt="Mentor" class="h-4 sm:h-5 w-auto object-contain" />
            </div>
            <div class="text-[11px] text-slate-500 font-sans">Pembimbing & reviewer</div>
          </button>
        </div>
      </div>

      <AppButton
        type="submit"
        variant="primary"
        :loading="loading"
        class-name="w-full mt-2"
      >
        Selesaikan & Buka Portal
      </AppButton>
    </form>

    <!-- Bottom link -->
    <div class="mt-6 text-center">
      <p class="text-xs text-slate-500 font-sans">
        Sudah memiliki akun?
        <RouterLink
          to="/login"
          class="font-mono font-bold text-[#1E5FAD] hover:underline ml-1"
        >
          MASUK KE PORTAL &rarr;
        </RouterLink>
      </p>
    </div>
  </div>
</template>
