import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { useAccessStore } from "@/stores/access";
import { setFlashAlert } from "@/composables/useAlert";

// 3.3/D7: Remove silent localhost fallback in production builds
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3002" : "");

if (!apiBaseUrl && !import.meta.env.DEV) {
  console.error("FATAL: VITE_API_BASE_URL is not set in production build.");
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// POR-P1-1 / C1: Single-flight access refetch on 403 with cooldown
let accessRefetchPromise: Promise<unknown> | null = null;
let last403HandledAt = 0;
const FORBIDDEN_COOLDOWN_MS = 1500;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    if (status === 401) {
      // Clear identity to prevent redirect loops (P0-2)
      localStorage.removeItem("skyshare_portal_user");

      try {
        const authStore = useAuthStore();
        authStore.setUser(null);
        const accessStore = useAccessStore();
        accessStore.reset();
      } catch {
        // Store may not be initialized if early boot
      }

      // If unauthorized and not on auth pages, redirect to login
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.href = "/login?expired=1";
      }
    } else if (status === 403) {
      // Avoid looping if 403 comes from /portal/me/access itself
      if (!url.includes("/portal/me/access")) {
        const now = Date.now();
        const isInCooldown = now - last403HandledAt < FORBIDDEN_COOLDOWN_MS;
        last403HandledAt = now;

        try {
          const accessStore = useAccessStore();

          // Single-flight refetch: reuse module-level promise while pending
          if (!accessRefetchPromise) {
            accessRefetchPromise = accessStore
              .fetchAccess()
              .catch(() => {})
              .finally(() => {
                accessRefetchPromise = null;
              });
          }
          await accessRefetchPromise;

          // Only alert and redirect if not in rapid cooldown and path differs
          if (!isInCooldown) {
            const message =
              error.response?.data?.message ||
              "Akses ditolak: Verifikasi identitas (KYC) atau enrollment program diperlukan.";
            const code = error.response?.data?.code || "FORBIDDEN";

            // Save flash alert so it survives page navigation (P2-4)
            setFlashAlert({
              variant: "warning",
              title: "Akses Terbatas",
              message,
              code,
            });

            // Route to KYC if not approved, or to Programs if approved but no active program
            const targetPath =
              accessStore.kyc?.status !== "APPROVED" ? "/kyc" : "/programs";

            if (window.location.pathname !== targetPath) {
              window.location.href = targetPath;
            }
          }
        } catch {
          // fallback redirection
          if (
            !isInCooldown &&
            window.location.pathname !== "/kyc" &&
            window.location.pathname !== "/programs"
          ) {
            window.location.href = "/kyc";
          }
        }
      }
    }

    return Promise.reject(error);
  }
);
