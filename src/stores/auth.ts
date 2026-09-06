import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { StudentUser, UserRole } from "@/types";
import { apiClient } from "@/api/client";

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
  const userRole = computed<UserRole>(() => user.value?.role || "talent");

  const setUser = (newUser: StudentUser | null) => {
    user.value = newUser;
    if (newUser) {
      localStorage.setItem("skyshare_portal_user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("skyshare_portal_user");
    }
  };

  const sendOtp = async (destination: string, type: "email" | "phone" = "email") => {
    try {
      const res = await apiClient.post("/student/send-otp", { destination, type });
      return res.data;
    } catch {
      // Offline fallback mock
      console.warn("Backend unavailable, using mock OTP");
      return {
        data: {
          message: "OTP sent (Mock mode)",
          debugOtp: "123456",
        },
      };
    }
  };

  const verifyOtp = async (destination: string, otp: string) => {
    try {
      const res = await apiClient.post("/student/verify-otp", { destination, otp });
      if (res.data?.data?.user && res.data?.data?.isProfileComplete) {
        setUser(res.data.data.user);
      }
      return res.data.data;
    } catch {
      // Mock fallback: jika OTP adalah 123456
      if (otp === "123456") {
        return {
          isProfileComplete: false,
          user: {
            id: 999,
            email: destination.includes("@") ? destination : undefined,
            phone: !destination.includes("@") ? destination : undefined,
            role: "talent" as UserRole,
          },
        };
      }
      throw new Error("Kode OTP salah atau kedaluwarsa.");
    }
  };

  const registerProfile = async (payload: {
    destination: string;
    name: string;
    region: string;
    age: number;
    occupation: string;
    role: UserRole;
    phone?: string;
    email?: string;
  }) => {
    try {
      const res = await apiClient.post("/student/register", payload);
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
      }
      return res.data.data;
    } catch {
      // Mock fallback
      const mockUser: StudentUser = {
        id: Math.floor(Math.random() * 1000) + 1,
        name: payload.name,
        region: payload.region,
        age: payload.age,
        occupation: payload.occupation,
        role: payload.role,
        email: payload.email || (payload.destination.includes("@") ? payload.destination : undefined),
        phone: payload.phone || (!payload.destination.includes("@") ? payload.destination : undefined),
        is_verified: true,
      };
      setUser(mockUser);
      return { user: mockUser };
    }
  };

  const loginGoogle = async (googleData: {
    email: string;
    name: string;
    google_id?: string;
    profile_picture?: string;
  }) => {
    try {
      const res = await apiClient.post("/student/google-login", googleData);
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
      }
      return res.data.data;
    } catch {
      const mockUser: StudentUser = {
        id: 101,
        name: googleData.name,
        email: googleData.email,
        role: "talent",
        region: "Jakarta",
        age: 21,
        occupation: "Mahasiswa",
        profile_picture: googleData.profile_picture,
        is_verified: true,
      };
      setUser(mockUser);
      return { user: mockUser };
    }
  };

  const logout = async () => {
    try {
      await apiClient.delete("/student/logout");
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  };

  const switchRoleForDemo = (newRole: UserRole) => {
    if (user.value) {
      setUser({ ...user.value, role: newRole });
    }
  };

  return {
    user,
    isAuthenticated,
    userRole,
    setUser,
    sendOtp,
    verifyOtp,
    registerProfile,
    loginGoogle,
    logout,
    switchRoleForDemo,
  };
});
