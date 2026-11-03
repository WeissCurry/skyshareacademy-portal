<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { RouterView, RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAccessStore } from "@/stores/access";
import AppBadge from "@/components/common/AppBadge.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import {
  gsap,
  animateMascotFloat,
  animateDrawerEnter,
  animateDrawerLeave,
  MECHANICAL_EASE,
} from "@/utils/animations";

const authStore = useAuthStore();
const accessStore = useAccessStore();
const route = useRoute();
const router = useRouter();

const isMobileMenuOpen = ref(false);
const drawerPanelRef = ref<HTMLElement | null>(null);
const drawerCloseBtnRef = ref<HTMLButtonElement | null>(null);
let lastFocusedElement: HTMLElement | null = null;
let activeDrawerTimeline: gsap.core.Timeline | null = null;

const headerRef = ref<HTMLElement | null>(null);
const sidebarRef = ref<HTMLElement | null>(null);
const taskbarRef = ref<HTMLElement | null>(null);
const sidebarMascotRef = ref<HTMLElement | null>(null);

const navItems = computed(() => {
  const items: Array<{
    name: string;
    code: string;
    path: string;
    gated?: boolean;
    locked?: boolean;
    badge?: string;
    badgeVariant?: "neutral" | "success" | "warning" | "danger" | "mentor";
    icon: string;
  }> = [];

  let idx = 1;

  // If visitor only (no active mentor/parent/talent access)
  if (accessStore.isVisitorOnly) {
    items.push({
      name: "Program Belajar",
      code: String(idx++).padStart(2, "0"),
      path: "/programs",
      badge: accessStore.hasActivePrograms ? "ACTIVE" : (accessStore.pendingOrders.length > 0 ? "PENDING" : undefined),
      badgeVariant: accessStore.hasActivePrograms ? "success" : "warning",
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M12 8v4M10 10h4"/></svg>`,
    });

    items.push({
      name: "Verifikasi KYC",
      code: String(idx++).padStart(2, "0"),
      path: "/kyc",
      badge: accessStore.kyc?.status === "APPROVED" ? "APPROVED" : (accessStore.kyc?.status || "REGISTERED"),
      badgeVariant: accessStore.kyc?.status === "APPROVED" ? "success" : (accessStore.kyc?.status === "REJECTED" ? "danger" : "warning"),
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M15 9h2M15 13h2M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5"/></svg>`,
    });

    if (accessStore.isContributor) {
      items.push({
        name: "Tulis Artikel",
        code: String(idx++).padStart(2, "0"),
        path: "/articles/manage",
        icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
      });
    }

    items.push({
      name: "Profil Saya",
      code: String(idx).padStart(2, "0"),
      path: "/profile",
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    });

    return items;
  }

  // Full suite for mentor / parent / talent
  items.push(
    {
      name: "Dashboard",
      code: String(idx++).padStart(2, "0"),
      path: "/dashboard",
      gated: true,
      locked: !accessStore.hasFullAccess,
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
    },
    {
      name: "Verifikasi KYC",
      code: String(idx++).padStart(2, "0"),
      path: "/kyc",
      badge: accessStore.kyc?.status === "APPROVED" ? "APPROVED" : (accessStore.kyc?.status || "REGISTERED"),
      badgeVariant: accessStore.kyc?.status === "APPROVED" ? "success" : (accessStore.kyc?.status === "REJECTED" ? "danger" : "warning"),
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M15 9h2M15 13h2M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5"/></svg>`,
    },
    {
      name: "Program Belajar",
      code: String(idx++).padStart(2, "0"),
      path: "/programs",
      badge: accessStore.hasActivePrograms ? "ACTIVE" : (accessStore.pendingOrders.length > 0 ? "PENDING" : undefined),
      badgeVariant: accessStore.hasActivePrograms ? "success" : "warning",
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M12 8v4M10 10h4"/></svg>`,
    },
    {
      name: "Event Program",
      code: String(idx++).padStart(2, "0"),
      path: "/events",
      gated: true,
      locked: !accessStore.hasFullAccess,
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="15" r="2"/></svg>`,
    },
    {
      name: "Materi & Modul",
      code: String(idx++).padStart(2, "0"),
      path: "/materials",
      gated: true,
      locked: !accessStore.hasFullAccess,
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M6 6h10M6 10h10"/></svg>`,
    },
    {
      name: "Tugas & Progress",
      code: String(idx++).padStart(2, "0"),
      path: "/assignments",
      gated: true,
      locked: !accessStore.hasFullAccess,
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1"/><path d="m9 14 2 2 4-4"/></svg>`,
    }
  );

  if (accessStore.isContributor) {
    items.push({
      name: "Tulis Artikel",
      code: String(idx++).padStart(2, "0"),
      path: "/articles/manage",
      icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    });
  }

  items.push({
    name: "Profil Saya",
    code: String(idx).padStart(2, "0"),
    path: "/profile",
    icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  });

  return items;
});

const openMobileMenu = () => {
  lastFocusedElement = (document.activeElement as HTMLElement) || null;
  isMobileMenuOpen.value = true;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const toggleMobileMenu = () => {
  if (isMobileMenuOpen.value) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
};

const handleDrawerEnter = (el: Element, done: () => void) => {
  activeDrawerTimeline?.kill();
  activeDrawerTimeline = animateDrawerEnter(el as HTMLElement, () => {
    activeDrawerTimeline = null;
    done();
    nextTick(() => {
      drawerCloseBtnRef.value?.focus();
    });
  });
};

const handleDrawerLeave = (el: Element, done: () => void) => {
  activeDrawerTimeline?.kill();
  activeDrawerTimeline = animateDrawerLeave(el as HTMLElement, () => {
    activeDrawerTimeline = null;
    done();
    lastFocusedElement?.focus();
    lastFocusedElement = null;
  });
};

// Lock body scroll while drawer is open
watch(isMobileMenuOpen, (isOpen) => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }
});

// Close drawer on route change
watch(
  () => route.path,
  () => {
    if (isMobileMenuOpen.value) {
      closeMobileMenu();
    }
  }
);

// Focus trap & Escape key handling for mobile drawer
const handleDrawerKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    e.preventDefault();
    closeMobileMenu();
    return;
  }

  if (e.key === "Tab" && drawerPanelRef.value) {
    const focusable = drawerPanelRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
};

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && isMobileMenuOpen.value) {
    e.preventDefault();
    closeMobileMenu();
  }
};

const handleLogout = async () => {
  closeMobileMenu();
  await authStore.logout();
  router.push("/login");
};

onMounted(async () => {
  window.addEventListener("keydown", handleGlobalKeydown);

  if (headerRef.value) {
    gsap.from(headerRef.value, {
      y: -25,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  }

  if (sidebarRef.value) {
    gsap.from(sidebarRef.value, {
      x: -30,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.1,
    });
  }

  if (taskbarRef.value) {
    gsap.from(taskbarRef.value, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      ease: MECHANICAL_EASE,
      delay: 0.2,
    });
  }

  if (sidebarMascotRef.value) {
    animateMascotFloat(sidebarMascotRef.value);
  }

  // Load access state from server on app load
  if (!accessStore.isLoaded && authStore.isAuthenticated) {
    await accessStore.fetchAccess().catch(() => {});
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
  activeDrawerTimeline?.kill();
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
});
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#dce3ec] text-slate-800">
    <!-- Top Industrial Chassis Console Header -->
    <header
      ref="headerRef"
      class="h-16 bg-[#ebf0f7] border-b border-white/80 sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between shadow-[0_4px_12px_#b5c2d3,-0_-1px_0_#ffffff_inset]"
    >
      <div class="flex items-center gap-2.5 sm:gap-6">
        <!-- Animated Hamburger Button for Navbar -->
        <button
          type="button"
          class="lg:hidden p-2 rounded-xl bg-[#ebf0f7] text-[#1E5FAD] shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3] flex flex-col justify-center items-center gap-1 w-10 h-10 transition-all cursor-pointer shrink-0"
          :aria-expanded="isMobileMenuOpen"
          title="Toggle Menu Console"
          @click="toggleMobileMenu"
        >
          <span
            :class="[
              'w-5 h-0.5 bg-[#1E5FAD] rounded-full transition-all duration-300',
              isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : '',
            ]"
          ></span>
          <span
            :class="[
              'w-5 h-0.5 bg-[#1E5FAD] rounded-full transition-all duration-300',
              isMobileMenuOpen ? 'opacity-0' : '',
            ]"
          ></span>
          <span
            :class="[
              'w-5 h-0.5 bg-[#1E5FAD] rounded-full transition-all duration-300',
              isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : '',
            ]"
          ></span>
        </button>

        <!-- Brand Logo & Stamped Machine Tag -->
        <RouterLink :to="accessStore.isVisitorOnly ? '/programs' : '/dashboard'" class="flex items-center gap-2 group">
          <img
            src="/images/logo placeholder.webp"
            alt="SkyShare Academy"
            class="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div class="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#d7e0ec] shadow-[inset_1px_1px_2px_#b5c2d3,inset_-1px_-1px_2px_#ffffff] border border-white/50">
            <span class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
            <span class="font-mono text-[10px] font-bold text-[#1E5FAD] tracking-wider">PORTAL SKYSHARE</span>
          </div>
        </RouterLink>
      </div>

      <!-- User Info & Role Badge -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Live KYC Status Pill Indicator -->
        <div
          v-if="!accessStore.isLoaded"
          class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-[#ebf0f7] border border-white/80 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff]"
        >
          <AppSkeleton variant="circle" class="size-2" />
          <AppSkeleton variant="line" class="w-16 h-3" />
        </div>
        <RouterLink
          v-else
          to="/kyc"
          class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-[#ebf0f7] border border-white/80 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff] hover:brightness-105 transition-all"
        >
          <span
            :class="[
              'size-2 rounded-full shrink-0',
              accessStore.isApprovedKyc
                ? 'bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse'
                : accessStore.kyc?.status === 'REJECTED'
                ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                : 'bg-amber-500 shadow-[0_0_6px_#f59e0b] animate-pulse'
            ]"
          />
          <span class="text-[10px] text-slate-600">KYC:</span>
          <span
            :class="[
              'text-[10px] font-bold',
              accessStore.isApprovedKyc
                ? 'text-emerald-700'
                : accessStore.kyc?.status === 'REJECTED'
                ? 'text-rose-600'
                : 'text-amber-700'
            ]"
          >
            {{ accessStore.kyc?.status || "REGISTERED" }}
          </span>
        </RouterLink>

        <!-- Derived Role Badge -->
        <AppBadge :variant="accessStore.displayRoleBadgeVariant" size="sm">
          {{ accessStore.displayRoleLabel }}
        </AppBadge>

        <!-- Points Pill (Phase 2 Gamification) -->
        <RouterLink
          v-if="accessStore.pointsBalance > 0"
          to="/profile"
          class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 font-mono text-[11px] font-bold border border-amber-300 shadow-[inset_1px_1px_2px_#ffffff] hover:brightness-105 transition-all"
          title="Saldo Poin Gamifikasi"
        >
          <span>⭐</span>
          <span>{{ accessStore.pointsBalance }} Poin</span>
        </RouterLink>

        <!-- User Profile Recessed Slot -->
        <div class="flex items-center gap-2 pl-2 border-l border-slate-300">
          <RouterLink
            to="/profile"
            class="size-8 rounded-xl bg-linear-to-b from-[#2a7bd9] to-[#1E5FAD] text-white font-mono font-bold text-xs flex items-center justify-center shadow-[2px_2px_5px_#b5c2d3,-1px_-1px_3px_#ffffff] hover:brightness-105 transition-all cursor-pointer"
            title="Buka Profil"
          >
            {{ (authStore.user?.name || "M").charAt(0).toUpperCase() }}
          </RouterLink>
          <div class="hidden md:block text-left">
            <p class="text-xs font-bold text-slate-800 leading-none">
              {{ authStore.user?.name || "Mentor" }}
            </p>
            <p class="font-mono text-[10px] text-[#1E5FAD] mt-0.5">
              LOC // {{ (authStore.user?.region || "ID").toUpperCase() }}
            </p>
          </div>
        </div>

        <!-- Logout Keycap -->
        <button
          type="button"
          class="p-2 rounded-xl bg-[#ebf0f7] text-slate-400 hover:text-rose-600 shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3] transition-all cursor-pointer"
          title="Keluar dari akun"
          @click="handleLogout"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Main Workspace Container Area -->
    <div class="flex flex-1 relative">
      <!-- Left Bolted Console Sidebar (Desktop) -->
      <aside
        ref="sidebarRef"
        class="hidden lg:flex w-64 bg-[#ebf0f7] border-r border-white/80 shrink-0 flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] shadow-[4px_0_12px_rgba(181,194,211,0.3)] z-30 overflow-y-auto no-scrollbar"
      >
        <div class="p-4 space-y-2">
          <!-- Hardware Title -->
          <div class="px-2 py-1 flex items-center justify-between">
            <span class="font-mono text-[10px] font-bold tracking-widest text-[#1E5FAD] uppercase">
              // NAV-CONSOLE
            </span>
            <!-- Decorative Mini Vent -->
            <div class="flex gap-1">
              <div class="h-3 w-0.5 rounded-full bg-[#b5c2d3]"></div>
              <div class="h-3 w-0.5 rounded-full bg-[#b5c2d3]"></div>
              <div class="h-3 w-0.5 rounded-full bg-[#b5c2d3]"></div>
            </div>
          </div>

          <!-- Tactile Navigation Keys -->
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150',
              route.path === item.path
                ? 'bg-linear-to-b from-[#236fc9] to-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a,inset_-2px_-2px_4px_#2e6fbd] translate-y-[1px]'
                : 'bg-[#ebf0f7] text-slate-700 shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] hover:text-[#1E5FAD] hover:brightness-105 active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3]'
            ]"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="shrink-0" v-html="item.icon" />
              <span class="truncate">{{ item.name }}</span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <span
                v-if="item.locked"
                class="text-[9px] font-mono text-amber-600 bg-amber-100/80 px-1 py-0.5 rounded"
                title="Memerlukan KYC Approved & Program Aktif"
              >
                🔒
              </span>
              <span
                v-else-if="item.badge"
                :class="[
                  'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border',
                  item.badgeVariant === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : item.badgeVariant === 'danger'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                ]"
              >
                {{ item.badge }}
              </span>
              <span class="font-mono text-[10px] opacity-50">[{{ item.code }}]</span>
            </div>
          </RouterLink>
        </div>

        <!-- Sidebar Footer Bolted Support Card with Mascot -->
        <div class="p-4 border-t border-slate-300/60">
          <div class="p-3 bg-[#d7e0ec] rounded-2xl shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] border border-white/50 relative overflow-hidden">
            <div class="flex items-center gap-3">
              <div ref="sidebarMascotRef" class="shrink-0">
                <img
                  src="/images/mascot-icons/pose=9.webp"
                  alt="SkyShare Mascot"
                  class="w-10 h-10 object-contain drop-shadow-md"
                />
              </div>
              <div>
                <p class="font-mono text-[10px] font-bold text-[#1E5FAD] tracking-wider uppercase">STATUS // AKSES</p>
                <div v-if="!accessStore.isLoaded" class="mt-1">
                  <AppSkeleton variant="line" class="w-28 h-3" />
                </div>
                <p v-else class="text-slate-600 text-[11px] leading-tight mt-0.5">
                  {{ accessStore.hasFullAccess ? "Akses Belajar Aktif Penuh" : "Selesaikan KYC & Enrollment" }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile & Tablet Slide-out Drawer Menu (GSAP Animated) -->
      <Transition
        :css="false"
        @enter="handleDrawerEnter"
        @leave="handleDrawerLeave"
      >
        <div
          v-if="isMobileMenuOpen"
          class="drawer-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Konsol Navigasi"
          tabindex="-1"
          @click="closeMobileMenu"
          @keydown="handleDrawerKeydown"
        >
          <div
            ref="drawerPanelRef"
            class="drawer-panel w-4/5 max-w-sm h-full bg-[#ebf0f7] border-r border-white/80 p-5 flex flex-col justify-between shadow-[8px_0_24px_rgba(0,0,0,0.3)] overflow-y-auto no-scrollbar"
            @click.stop
          >
            <div class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-300">
                <div class="flex items-center gap-2">
                  <span class="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
                  <span class="font-mono text-xs font-bold text-[#1E5FAD] tracking-wider">CONSOLE // MENU</span>
                </div>
                <button
                  ref="drawerCloseBtnRef"
                  type="button"
                  class="p-2 rounded-xl bg-[#ebf0f7] text-slate-500 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff] active:translate-y-[1px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  aria-label="Tutup Menu"
                  @click="closeMobileMenu"
                >
                  ✕
                </button>
              </div>

              <!-- KYC Status in Drawer -->
              <div class="drawer-nav-item p-3 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] flex items-center justify-between border border-white/40">
                <div>
                  <span class="font-mono text-[10px] font-bold text-slate-500 block">STATUS KYC:</span>
                  <div v-if="!accessStore.isLoaded" class="mt-1">
                    <AppSkeleton variant="line" class="w-20 h-3" />
                  </div>
                  <span
                    v-else
                    :class="[
                      'font-mono text-xs font-bold',
                      accessStore.isApprovedKyc
                        ? 'text-emerald-700'
                        : accessStore.kyc?.status === 'REJECTED'
                        ? 'text-rose-600'
                        : 'text-amber-700'
                    ]"
                  >
                    {{ accessStore.kyc?.status || "REGISTERED" }}
                  </span>
                </div>
                <RouterLink
                  to="/kyc"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#ebf0f7] text-[#1E5FAD] shadow-[2px_2px_4px_#b5c2d3] active:translate-y-[1px]"
                  @click="closeMobileMenu"
                >
                  LIHAT
                </RouterLink>
              </div>

              <!-- Navigation Links -->
              <div class="space-y-2">
                <RouterLink
                  v-for="item in navItems"
                  :key="item.path"
                  :to="item.path"
                  :class="[
                    'drawer-nav-item flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150',
                    route.path === item.path
                      ? 'bg-linear-to-b from-[#236fc9] to-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
                      : 'bg-[#ebf0f7] text-slate-700 shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] hover:text-[#1E5FAD] active:translate-y-[1px]'
                  ]"
                  @click="closeMobileMenu"
                >
                  <div class="flex items-center gap-2.5">
                    <span v-html="item.icon" />
                    <span>{{ item.name }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span v-if="item.locked" class="text-[9px]">🔒</span>
                    <span class="font-mono text-[10px] opacity-60">[{{ item.code }}]</span>
                  </div>
                </RouterLink>
              </div>
            </div>

            <!-- Drawer Footer -->
            <div class="drawer-nav-item pt-4 border-t border-slate-300 space-y-3">
              <div class="flex items-center gap-3 p-3 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3]">
                <img
                  src="/images/mascot-icons/pose=9.webp"
                  alt="Mascot"
                  class="w-10 h-10 object-contain drop-shadow-sm"
                />
                <div class="text-[11px]">
                  <p class="font-bold text-slate-800">{{ authStore.user?.name || "Mentor" }}</p>
                  <p class="text-slate-500 font-mono text-[10px]">{{ authStore.user?.email || "mentor@skyshareacademy.id" }}</p>
                </div>
              </div>

              <button
                type="button"
                class="w-full py-2.5 rounded-xl bg-[#ebf0f7] text-rose-600 font-mono text-xs font-bold shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3] flex items-center justify-center gap-2 cursor-pointer"
                @click="handleLogout"
              >
                <span>KELUAR DARI AKUN</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Scrollable Main Content -->
      <main class="flex-1 min-w-0 overflow-y-auto overflow-x-hidden no-scrollbar max-h-[calc(100vh-4rem)] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
        <RouterView />
      </main>
    </div>

    <!-- Mobile & Tablet Industrial Bottom Taskbar (Dock) -->
    <nav
      ref="taskbarRef"
      class="fixed bottom-2.5 sm:bottom-3 inset-x-2 sm:inset-x-6 max-w-md sm:max-w-lg mx-auto z-40 lg:hidden pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Bottom Taskbar"
    >
      <div class="bg-[#ebf0f7]/95 backdrop-blur-md border border-white/80 rounded-2xl shadow-[6px_6px_16px_#b5c2d3,-4px_-4px_12px_#ffffff] p-1 sm:p-1.5 flex items-center justify-around gap-1">
        <!-- Tab 01: KYC -->
        <RouterLink
          to="/kyc"
          :class="[
            'flex-1 min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
            route.path === '/kyc'
              ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
              : 'text-slate-600 hover:text-[#1E5FAD]'
          ]"
        >
          <svg class="size-4 sm:size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M15 9h2M15 13h2M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5"/>
          </svg>
          <span class="font-mono text-[9px] font-bold mt-0.5 tracking-tight">KYC</span>
        </RouterLink>

        <!-- Tab 02: Program -->
        <RouterLink
          to="/programs"
          :class="[
            'flex-1 min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
            route.path === '/programs'
              ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
              : 'text-slate-600 hover:text-[#1E5FAD]'
          ]"
        >
          <svg class="size-4 sm:size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M12 8v4M10 10h4"/>
          </svg>
          <span class="font-mono text-[9px] font-bold mt-0.5 tracking-tight">PROGRAM</span>
        </RouterLink>

        <!-- Tab 03: Materials -->
        <RouterLink
          to="/materials"
          :class="[
            'flex-1 min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
            route.path === '/materials'
              ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
              : 'text-slate-600 hover:text-[#1E5FAD]'
          ]"
        >
          <svg class="size-4 sm:size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M6 6h10M6 10h10"/>
          </svg>
          <span class="font-mono text-[9px] font-bold mt-0.5 tracking-tight">MODUL</span>
        </RouterLink>

        <!-- Tab 04: Assignments -->
        <RouterLink
          to="/assignments"
          :class="[
            'flex-1 min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
            route.path === '/assignments'
              ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
              : 'text-slate-600 hover:text-[#1E5FAD]'
          ]"
        >
          <svg class="size-4 sm:size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1"/><path d="m9 14 2 2 4-4"/>
          </svg>
          <span class="font-mono text-[9px] font-bold mt-0.5 tracking-tight">TUGAS</span>
        </RouterLink>

        <!-- Hamburger Taskbar Menu Button (Quick Launcher) -->
        <button
          type="button"
          class="flex-1 min-h-[44px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150 text-[#1E5FAD] bg-[#ebf0f7] shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff] active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3] cursor-pointer"
          :aria-expanded="isMobileMenuOpen"
          @click="toggleMobileMenu"
        >
          <div class="flex items-center gap-0.5">
            <span class="size-1 rounded-full bg-[#38BDF8] animate-pulse"></span>
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </div>
          <span class="font-mono text-[9px] font-bold mt-1 tracking-tight text-[#1E5FAD]">MENU</span>
        </button>
      </div>
    </nav>
  </div>
</template>
