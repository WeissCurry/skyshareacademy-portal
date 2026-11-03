import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { StudentUser, UserRole } from "@/types";
import { apiClient } from "@/api/client";
import { useAccessStore } from "@/stores/access";

const getInitialUser = (): StudentUser | null => {
  const saved = localStorage.getItem("skyshare_portal_user");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

export const useAuthStore = defineStore("auth", () => {
  const user = ref<StudentUser | null>(getInitialUser());

  const isAuthenticated = computed(() => Boolean(user.value && user.value.id));
  const userRole = computed<UserRole>(() => user.value?.role || "mentor");

  const setUser = (newUser: StudentUser | null) => {
    user.value = newUser;
    if (newUser) {
      localStorage.setItem("skyshare_portal_user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("skyshare_portal_user");
    }
  };

  /**
   * Google Identity Services (GIS) Login
   * Sends ONLY the raw ID token credential string to the server.
   * Server validates the token and sets the httpOnly session cookie.
   */
  const loginWithGoogle = async (credential: string) => {
    const res = await apiClient.post<{
      status: string;
      errors?: boolean;
      data: { user: StudentUser };
    }>("/student/google-login", { credential });

    if (res.data?.data?.user) {
      setUser(res.data.data.user);
      const accessStore = useAccessStore();
      await accessStore.fetchAccess().catch(() => {});
    }

    return res.data?.data;
  };

  const logout = async () => {
    try {
      await apiClient.delete("/student/logout");
    } catch {
      // ignore
    } finally {
      setUser(null);
      const accessStore = useAccessStore();
      accessStore.reset();
    }
  };

  return {
    user,
    isAuthenticated,
    userRole,
    setUser,
    loginWithGoogle,
    logout,
  };
});
