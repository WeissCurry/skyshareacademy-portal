<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppButton from "@/components/common/AppButton.vue";
import AppInput from "@/components/common/AppInput.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import { gsap, animateMascotFloat, MECHANICAL_EASE } from "@/utils/animations";

const authStore = useAuthStore();
const router = useRouter();

const cardRef = ref<HTMLElement | null>(null);
const mascotRef = ref<HTMLElement | null>(null);

const destination = ref("");
const otp = ref("");
const step = ref<"input" | "otp">("input");
const loading = ref(false);
const error = ref("");
const debugOtpMessage = ref("");

onMounted(() => {
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
    error.value = "Masukkan email atau nomor telepon kamu.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const isEmail = destination.value.includes("@");
    const res = await authStore.sendOtp(destination.value.trim(), isEmail ? "email" : "phone");
    step.value = "otp";
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
    const result = await authStore.verifyOtp(destination.value.trim(), otp.value.trim());
    if (!result?.isProfileComplete) {
      // Belum lengkap profil, arahkan ke register step 3
      router.push({
        path: "/register",
        query: { destination: destination.value, step: "3" },
      });
    } else {
      router.push("/dashboard");
    }
  } catch (err: any) {
    error.value = err.message || "Kode OTP tidak valid atau kedaluwarsa.";
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
  loading.value = true;
  try {
    await authStore.loginGoogle({
      email: "student.talent@skyshareacademy.id",
      name: "Budi Pratama",
      google_id: "google_mock_123",
      profile_picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    });
    router.push("/dashboard");
  } catch (err: any) {
    error.value = err.message || "Gagal login dengan Google.";
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
        <span class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
        GATE // 01-AUTH
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
          src="/images/mascot-icons/pose=8.webp"
          alt="SkyShare Mascot"
          class="w-20 sm:w-22 h-auto object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
        />
      </div>
    </div>

    <div class="mb-6 text-center">
      <h2 class="text-xl font-bold text-slate-800 tracking-tight">Masuk ke Portal</h2>
      <p class="text-xs text-slate-500 mt-1 font-sans">
        Akses khusus untuk Mentor dan Talent SkyShare Academy
      </p>
    </div>

    <!-- Alert Notifications -->
    <div v-if="error" class="mb-4">
      <AppAlert
        variant="error"
        title="Autentikasi Gagal"
        :message="error"
        dismissible
        @close="error = ''"
      />
    </div>

    <!-- Info OTP Demo helper -->
    <div v-if="debugOtpMessage" class="mb-4">
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

    <!-- Step 1: Input Email/Phone -->
    <form v-if="step === 'input'" class="space-y-4" @submit.prevent="handleSendOtp">
      <AppInput
        v-model="destination"
        label="Email atau Nomor WhatsApp"
        placeholder="contoh: nama@email.com atau 08123456789"
        required
      />

      <AppButton
        type="submit"
        variant="primary"
        :loading="loading"
        class-name="w-full"
      >
        Kirim Kode OTP
      </AppButton>
    </form>

    <!-- Step 2: Input OTP Code -->
    <form v-else class="space-y-4" @submit.prevent="handleVerifyOtp">
      <div class="text-left mb-2">
        <p class="text-xs text-slate-600 font-sans">
          Kode OTP dikirim ke <strong class="text-slate-800 font-mono">{{ destination }}</strong>
        </p>
        <button
          type="button"
          class="font-mono text-xs text-[#1E5FAD] hover:underline mt-0.5 cursor-pointer"
          @click="step = 'input'"
        >
          &larr; Ganti nomor / email
        </button>
      </div>

      <AppInput
        v-model="otp"
        label="Kode OTP (6 Digit)"
        placeholder="123456"
        type="text"
        required
      />

      <AppButton
        type="submit"
        variant="primary"
        :loading="loading"
        class-name="w-full"
      >
        Verifikasi & Masuk
      </AppButton>
    </form>

    <!-- Divider -->
    <div class="relative my-6 text-center">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-[#b5c2d3]" />
      </div>
      <span class="relative bg-[#ebf0f7] px-3 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
        ATAU METODE LAIN
      </span>
    </div>

    <!-- Google Login Keycap -->
    <button
      type="button"
      class="w-full h-12 rounded-xl border border-white/80 bg-[#ebf0f7] hover:brightness-105 active:translate-y-[2px] active:shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] transition-all flex items-center justify-center gap-2.5 text-xs font-mono font-bold text-slate-700 shadow-[4px_4px_9px_#b5c2d3,-4px_-4px_9px_#ffffff] cursor-pointer"
      :disabled="loading"
      @click="handleGoogleLogin"
    >
      <svg class="size-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span>MASUK DENGAN GOOGLE</span>
    </button>

    <!-- Register Link -->
    <div class="mt-6 text-center">
      <p class="text-xs text-slate-500 font-sans">
        Belum punya akun portal?
        <RouterLink
          to="/register"
          class="font-mono font-bold text-[#1E5FAD] hover:underline ml-1"
        >
          DAFTAR BARU &rarr;
        </RouterLink>
      </p>
    </div>
  </div>
</template>
