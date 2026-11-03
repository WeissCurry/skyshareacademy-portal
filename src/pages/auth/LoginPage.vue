<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppAlert from "@/components/common/AppAlert.vue";
import AppPage from "@/components/common/AppPage.vue";
import { gsap, animateMascotFloat, MECHANICAL_EASE } from "@/utils/animations";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const cardRef = ref<HTMLElement | null>(null);
const mascotRef = ref<HTMLElement | null>(null);
const googleBtnContainer = ref<HTMLElement | null>(null);

let entranceCtx: { revert: () => void } | null = null;
let floatTween: any = null;
let resizeObserver: ResizeObserver | null = null;

const loading = ref(false);
const error = ref("");
const errorCode = ref<string | null>(null);
const isMissingClientId = ref(false);
const isSessionExpired = ref(false);

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

// Official Google Identity Services Script Loader
const loadGisScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      return resolve();
    }
    const existing = document.getElementById("google-gsi-client");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

// Handle credential callback from Google Identity Services
const handleCredentialResponse = async (response: { credential?: string }) => {
  if (!response?.credential) {
    error.value = "Kredensial login Google tidak diterima dari layanan GIS.";
    errorCode.value = "ERR // GIS_NO_CREDENTIAL";
    return;
  }

  loading.value = true;
  error.value = "";
  errorCode.value = null;

  try {
    // Send ONLY the raw ID token to server
    await authStore.loginWithGoogle(response.credential);
    // Route through router guard to dashboard or kyc/program
    router.push("/dashboard");
  } catch (err: any) {
    const status = err.response?.status;
    const code = err.response?.data?.code;
    const msg = err.response?.data?.message;

    if (status === 403 && (code === "ACCOUNT_INACTIVE" || msg?.includes("nonaktif"))) {
      error.value = "Akun Anda berstatus nonaktif. Silakan hubungi dukungan.";
      errorCode.value = "AUTH // 403_ACCOUNT_INACTIVE";
    } else if (status === 409) {
      error.value = "Akun Google tidak sesuai dengan email yang terdaftar pada sistem.";
      errorCode.value = "AUTH // 409_EMAIL_MISMATCH";
    } else if (status === 401) {
      error.value = "Autentikasi gagal atau sesi kedaluwarsa. Silakan coba masuk kembali.";
      errorCode.value = "AUTH // 401_UNAUTHORIZED";
    } else {
      error.value = msg || "Gagal masuk menggunakan Google Identity Services.";
      errorCode.value = code ? `AUTH // ${code}` : "AUTH // 500_FAILED";
    }
  } finally {
    loading.value = false;
  }
};

const renderGoogleButton = () => {
  if (!window.google?.accounts?.id || !googleBtnContainer.value) return;

  const containerWidth = googleBtnContainer.value.clientWidth || 260;
  // Google GIS accepts width between 200 and 400
  const btnWidth = Math.min(Math.max(200, Math.floor(containerWidth)), 320);

  googleBtnContainer.value.innerHTML = "";
  window.google.accounts.id.renderButton(googleBtnContainer.value, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "rectangular",
    logo_alignment: "left",
    width: btnWidth,
    locale: "id",
  });
};

const initGoogleAuth = async () => {
  if (!googleClientId) {
    isMissingClientId.value = true;
    return;
  }

  try {
    await loadGisScript();
    if (window.google?.accounts?.id && googleBtnContainer.value) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      renderGoogleButton();

      if (window.ResizeObserver && googleBtnContainer.value) {
        resizeObserver = new ResizeObserver(() => {
          renderGoogleButton();
        });
        resizeObserver.observe(googleBtnContainer.value);
      }
    }
  } catch {
    error.value = "Gagal memuat skrip Google Identity Services. Periksa koneksi internet Anda.";
    errorCode.value = "ERR // GIS_SCRIPT_LOAD_FAIL";
  }
};

onMounted(async () => {
  if (route.query.expired === "1") {
    isSessionExpired.value = true;
  }

  await nextTick();

  if (cardRef.value) {
    entranceCtx = gsap.context(() => {
      gsap.from(cardRef.value, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: MECHANICAL_EASE,
        clearProps: "all",
      });
    }, cardRef.value);
  }

  if (mascotRef.value) {
    floatTween = animateMascotFloat(mascotRef.value);
  }

  await initGoogleAuth();
});

onUnmounted(() => {
  entranceCtx?.revert();
  floatTween?.kill();
  resizeObserver?.disconnect();
});
</script>

<template>
  <AppPage width="narrow" container-class="!px-1 sm:!px-0 py-0">
    <div
      ref="cardRef"
      class="bg-[#ebf0f7] rounded-3xl shadow-[8px_8px_18px_#b5c2d3,-8px_-8px_18px_#ffffff] border border-white/80 corner-screws p-4 sm:p-7 pt-4 sm:pt-6 relative w-full max-w-sm min-w-0 mx-auto"
    >
      <!-- Top Hardware Vents & System Label -->
      <div class="w-full flex items-center justify-between mb-3 px-1 pointer-events-none">
        <span class="font-mono text-[10px] font-bold tracking-widest text-[#1E5FAD] uppercase flex items-center gap-1.5">
          <span class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
          PORTAL // ACCESS-GATE
        </span>

        <!-- Ventilation Slots -->
        <div class="flex gap-1.5 items-center">
          <div class="h-4 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
          <div class="h-4 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
          <div class="h-4 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
        </div>
      </div>

      <!-- Mascot Greeting in Normal Flow (No negative margins, small on mobile) -->
      <div class="flex justify-center my-2 sm:my-3 pointer-events-none">
        <div
          ref="mascotRef"
          class="p-2 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_5px_#b5c2d3,inset_-2px_-2px_5px_#ffffff]"
        >
          <img
            src="/images/mascot-icons/pose=8.webp"
            alt="SkyShare Mascot"
            class="w-14 sm:w-16 h-auto object-contain drop-shadow-md select-none"
          />
        </div>
      </div>

      <!-- Header Text -->
      <div class="mb-4 text-center space-y-1 relative z-20">
        <h1 class="text-xl font-bold text-slate-800 tracking-tight">
          Masuk Portal SkyShare
        </h1>
        <p class="text-xs text-slate-500 font-sans leading-relaxed">
          Otentikasi tunggal akun resmi SkyShare Academy via Google Workspace
        </p>
      </div>

      <!-- Session Expired Alert Display (P0-2) -->
      <div v-if="isSessionExpired" class="mb-4 relative z-20">
        <AppAlert
          variant="warning"
          title="Sesi Login Berakhir"
          message="Sesi login Anda telah berakhir atau terputus. Silakan masuk kembali dengan akun Google Anda."
          code="AUTH // 401_SESSION_EXPIRED"
          dismissible
          @close="isSessionExpired = false"
        />
      </div>

      <!-- Error Alert Display -->
      <div v-if="error" class="mb-4 relative z-20">
        <AppAlert
          variant="error"
          title="Autentikasi Ditolak"
          :message="error"
          :code="errorCode || 'AUTH // FAILED'"
          dismissible
          @close="error = ''"
        />
      </div>

      <!-- Missing Client ID Dev Warning -->
      <div v-if="isMissingClientId" class="mb-4 relative z-20">
        <AppAlert
          variant="error"
          title="Konfigurasi Client ID Belum Diatur"
          message="VITE_GOOGLE_CLIENT_ID belum didefinisikan pada konfigurasi .env. Silakan sediakan Client ID Google OAuth yang valid pada environment."
          code="CFG // VITE_GOOGLE_CLIENT_ID_MISSING"
        />
      </div>

      <!-- Google Identity Services Button Slot -->
      <div class="p-3 sm:p-5 rounded-2xl bg-[#d7e0ec] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] border border-white/50 flex flex-col items-center justify-center space-y-3 min-h-[85px] relative z-20 min-w-0 w-full overflow-hidden">
        <div v-if="loading" class="flex items-center gap-2 font-mono text-xs text-[#1E5FAD] font-bold">
          <svg
            class="animate-spin h-4 w-4 text-[#1E5FAD]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>MEMVERIFIKASI ID TOKEN KE SERVER...</span>
        </div>

        <!-- Google GIS Button Mounted Here -->
        <div
          v-show="!isMissingClientId"
          ref="googleBtnContainer"
          class="flex justify-center w-full min-h-[44px] relative z-30 min-w-0"
          :class="{ 'opacity-50 pointer-events-none': loading }"
        />
      </div>

      <!-- System Notice -->
      <div class="mt-4 sm:mt-5 text-center space-y-1.5 relative z-20">
        <div class="flex items-center justify-center gap-1.5 font-mono text-[10px] text-slate-500">
          <span class="size-1.5 rounded-full bg-[#1E5FAD]"></span>
          <span>SECURITY // HTTPONLY JWT SESSION</span>
        </div>
        <p class="text-[11px] text-slate-500 font-sans leading-relaxed">
          Gunakan akun Google yang terdaftar untuk mengakses program dan layanan SkyShare Academy.
        </p>
      </div>
    </div>
  </AppPage>
</template>
