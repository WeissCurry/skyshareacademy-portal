<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { RouterView, RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppBadge from "@/components/common/AppBadge.vue";
import { gsap, animateMascotFloat, MECHANICAL_EASE } from "@/utils/animations";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const isMobileMenuOpen = ref(false);

const headerRef = ref<HTMLElement | null>(null);
const sidebarRef = ref<HTMLElement | null>(null);
const taskbarRef = ref<HTMLElement | null>(null);
const sidebarMascotRef = ref<HTMLElement | null>(null);

const navItems = computed(() => [
  {
    name: "Dashboard",
    code: "01",
    path: "/dashboard",
    icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
  },
  {
    name: "Event Terbaru",
    code: "02",
    path: "/events",
    icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="15" r="2"/></svg>`,
  },
  {
    name: "Materi & Modul",
    code: "03",
    path: "/materials",
    icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M6 6h10M6 10h10"/></svg>`,
  },
  {
    name: "Log Aktivitas",
    code: "04",
    path: "/activity",
    icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  {
    name: "Profil Saya",
    code: "05",
    path: "/profile",
    icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  },
]);

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

const toggleRole = () => {
  const nextRole = authStore.userRole === "mentor" ? "talent" : "mentor";
  authStore.switchRoleForDemo(nextRole);
};

onMounted(() => {
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
          @click="isMobileMenuOpen = !isMobileMenuOpen"
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
        <RouterLink to="/dashboard" class="flex items-center gap-2 group">
          <img
            src="/images/logo placeholder.webp"
            alt="SkyShare Academy"
            class="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div class="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#d7e0ec] shadow-[inset_1px_1px_2px_#b5c2d3,inset_-1px_-1px_2px_#ffffff] border border-white/50">
            <span class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
            <span class="font-mono text-[10px] font-bold text-[#1E5FAD] tracking-wider">PORTAL // V0.1</span>
          </div>
        </RouterLink>
      </div>

      <!-- User Info & Role Rocker Switcher -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Demo Role Rocker Button (Desktop & Tablet) -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#ebf0f7] text-[#1E5FAD] border border-white/80 shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] hover:brightness-105 active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3] transition-all cursor-pointer"
          title="Klik untuk simulasi ganti role (Demo)"
          @click="toggleRole"
        >
          <span class="size-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8] animate-pulse"></span>
          <span>MODE: {{ authStore.userRole === "mentor" ? "MENTOR" : "TALENT" }}</span>
          <span class="text-[10px] text-slate-400 font-mono">[SWITCH]</span>
        </button>

        <AppBadge :variant="authStore.userRole === 'mentor' ? 'mentor' : 'talent'" size="sm">
          {{ authStore.userRole === "mentor" ? "Mentor" : "Talent" }}
        </AppBadge>

        <!-- User Profile Recessed Slot -->
        <div class="flex items-center gap-2 pl-2 border-l border-slate-300">
          <RouterLink
            to="/profile"
            class="size-8 rounded-xl bg-linear-to-b from-[#2a7bd9] to-[#1E5FAD] text-white font-mono font-bold text-xs flex items-center justify-center shadow-[2px_2px_5px_#b5c2d3,-1px_-1px_3px_#ffffff] hover:brightness-105 transition-all cursor-pointer"
            title="Buka Profil"
          >
            {{ (authStore.user?.name || "U").charAt(0).toUpperCase() }}
          </RouterLink>
          <div class="hidden md:block text-left">
            <p class="text-xs font-bold text-slate-800 leading-none">
              {{ authStore.user?.name || "Member" }}
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
        class="hidden lg:flex w-64 bg-[#ebf0f7] border-r border-white/80 shrink-0 flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] shadow-[4px_0_12px_rgba(181,194,211,0.3)] z-30"
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
              'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150',
              route.path === item.path
                ? 'bg-linear-to-b from-[#236fc9] to-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a,inset_-2px_-2px_4px_#2e6fbd] translate-y-[1px]'
                : 'bg-[#ebf0f7] text-slate-700 shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] hover:text-[#1E5FAD] hover:brightness-105 active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3]'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <span v-html="item.icon" />
              <span>{{ item.name }}</span>
            </div>
            <span class="font-mono text-[10px] opacity-60">[{{ item.code }}]</span>
          </RouterLink>
        </div>

        <!-- Sidebar Footer Bolted Support Card with Mascot -->
        <div class="p-4 border-t border-slate-300/60">
          <div class="p-3.5 bg-[#d7e0ec] rounded-2xl shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] border border-white/50 relative overflow-hidden">
            <div class="flex items-center gap-3">
              <div ref="sidebarMascotRef" class="shrink-0">
                <img
                  src="/images/mascot-icons/pose=9.webp"
                  alt="SkyShare Mascot"
                  class="w-10 h-10 object-contain drop-shadow-md"
                />
              </div>
              <div>
                <p class="font-mono text-[10px] font-bold text-[#1E5FAD] tracking-wider uppercase">SUPPORT // COMM</p>
                <p class="text-slate-600 text-[11px] leading-tight mt-0.5">
                  Butuh bantuan materi atau event?
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile & Tablet Slide-out Drawer Menu -->
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 lg:hidden transition-opacity"
        @click="isMobileMenuOpen = false"
      >
        <div
          class="w-4/5 max-w-sm h-full bg-[#ebf0f7] border-r border-white/80 p-5 flex flex-col justify-between shadow-[8px_0_24px_rgba(0,0,0,0.3)]"
          @click.stop
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-300">
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
                <span class="font-mono text-xs font-bold text-[#1E5FAD] tracking-wider">CONSOLE // MENU</span>
              </div>
              <button
                type="button"
                class="p-2 rounded-xl bg-[#ebf0f7] text-slate-500 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff] active:translate-y-[1px]"
                @click="isMobileMenuOpen = false"
              >
                ✕
              </button>
            </div>

            <!-- Role Switcher in Drawer -->
            <div class="p-3 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] flex items-center justify-between border border-white/40">
              <div>
                <span class="font-mono text-[10px] font-bold text-slate-500 block">ROLE AKTIF:</span>
                <span class="font-mono text-xs font-bold text-[#1E5FAD]">
                  {{ authStore.userRole === "mentor" ? "MENTOR" : "TALENT" }}
                </span>
              </div>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#ebf0f7] text-[#1E5FAD] shadow-[2px_2px_4px_#b5c2d3] active:translate-y-[1px]"
                @click="toggleRole"
              >
                GANTI ROLE
              </button>
            </div>

            <!-- Navigation Links -->
            <div class="space-y-2">
              <RouterLink
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                :class="[
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150',
                  route.path === item.path
                    ? 'bg-linear-to-b from-[#236fc9] to-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
                    : 'bg-[#ebf0f7] text-slate-700 shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] hover:text-[#1E5FAD] active:translate-y-[1px]'
                ]"
                @click="isMobileMenuOpen = false"
              >
                <div class="flex items-center gap-2.5">
                  <span v-html="item.icon" />
                  <span>{{ item.name }}</span>
                </div>
                <span class="font-mono text-[10px] opacity-60">[{{ item.code }}]</span>
              </RouterLink>
            </div>
          </div>

          <!-- Drawer Footer -->
          <div class="pt-4 border-t border-slate-300 space-y-3">
            <div class="flex items-center gap-3 p-3 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3]">
              <img
                src="/images/mascot-icons/pose=9.webp"
                alt="Mascot"
                class="w-10 h-10 object-contain drop-shadow-sm"
              />
              <div class="text-[11px]">
                <p class="font-bold text-slate-800">{{ authStore.user?.name || "Member" }}</p>
                <p class="text-slate-500 font-mono text-[10px]">{{ authStore.user?.email || "student@skyshareacademy.id" }}</p>
              </div>
            </div>

            <button
              type="button"
              class="w-full py-2.5 rounded-xl bg-[#ebf0f7] text-rose-600 font-mono text-xs font-bold shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3] flex items-center justify-center gap-2"
              @click="handleLogout"
            >
              <span>KELUAR DARI AKUN</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Scrollable Main Content -->
      <main class="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div class="max-w-6xl mx-auto">
          <RouterView />
        </div>
      </main>
    </div>

    <!-- Mobile & Tablet Industrial Bottom Taskbar (Dock) -->
    <nav
      ref="taskbarRef"
      class="fixed bottom-3 inset-x-3 sm:inset-x-8 max-w-md sm:max-w-lg mx-auto z-40 lg:hidden"
      aria-label="Bottom Taskbar"
    >
      <div class="bg-[#ebf0f7]/95 backdrop-blur-md border border-white/80 rounded-2xl shadow-[6px_6px_16px_#b5c2d3,-4px_-4px_12px_#ffffff] p-1.5 flex items-center justify-around gap-1">
        <!-- Quick Tab 01: Dashboard -->
        <RouterLink
          to="/dashboard"
          :class="[
            'flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
            route.path === '/dashboard'
              ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
              : 'text-slate-600 hover:text-[#1E5FAD]'
          ]"
        >
          <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
          <span class="font-mono text-[9px] font-bold mt-1 tracking-tight">DASH</span>
        </RouterLink>

        <!-- Quick Tab 02: Events -->
        <RouterLink
          to="/events"
          :class="[
            'flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
            route.path === '/events'
              ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
              : 'text-slate-600 hover:text-[#1E5FAD]'
          ]"
        >
          <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="15" r="2"/>
          </svg>
          <span class="font-mono text-[9px] font-bold mt-1 tracking-tight">EVENT</span>
        </RouterLink>

        <!-- Quick Tab 03: Materials -->
        <RouterLink
          to="/materials"
          :class="[
            'flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
            route.path === '/materials'
              ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
              : 'text-slate-600 hover:text-[#1E5FAD]'
          ]"
        >
          <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <span class="font-mono text-[9px] font-bold mt-1 tracking-tight">MODUL</span>
        </RouterLink>

        <!-- Quick Tab 04: Activity -->
        <RouterLink
          to="/activity"
          :class="[
            'flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
            route.path === '/activity'
              ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a] translate-y-[1px]'
              : 'text-slate-600 hover:text-[#1E5FAD]'
          ]"
        >
          <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span class="font-mono text-[9px] font-bold mt-1 tracking-tight">LOG</span>
        </RouterLink>

        <!-- Hamburger Taskbar Menu Button (Quick Launcher) -->
        <button
          type="button"
          class="flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150 text-[#1E5FAD] bg-[#ebf0f7] shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff] active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3] cursor-pointer"
          :aria-expanded="isMobileMenuOpen"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
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
