<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <div class="min-h-screen bg-[#dce3ec] flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden">
    <!-- Diffuse Lighting Spotlights (Top Left Origin) -->
    <div class="absolute -top-24 -left-24 size-96 bg-white/40 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-24 -right-24 size-96 bg-[#1E5FAD]/10 rounded-full blur-3xl pointer-events-none" />

    <!-- Brand Header Console -->
    <header class="w-full max-w-5xl mx-auto flex items-center justify-between py-4 relative z-10">
      <div class="flex items-center gap-3">
        <img
          src="/images/logo placeholder.webp"
          alt="SkyShare Academy"
          class="h-8 sm:h-9 w-auto object-contain"
        />
        <div class="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#d7e0ec] shadow-[inset_1px_1px_2px_#b5c2d3,inset_-1px_-1px_2px_#ffffff] border border-white/50">
          <span class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
          <span class="font-mono text-[10px] font-bold text-[#1E5FAD] tracking-wider">AUTH // PORTAL</span>
        </div>
      </div>

      <a
        href="https://skyshareacademy.id"
        target="_blank"
        rel="noopener noreferrer"
        class="px-3.5 py-1.5 rounded-xl bg-[#ebf0f7] text-[#1E5FAD] font-mono text-xs font-bold shadow-[3px_3px_6px_#b5c2d3,-3px_-3px_6px_#ffffff] hover:brightness-105 active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3] transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <span>WEBSITE UTAMA</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 17l9.2-9.2M17 17V8H8"/>
        </svg>
      </a>
    </header>

    <!-- Main Container Card -->
    <main class="w-full max-w-md my-auto py-6 relative z-10">
      <RouterView />
    </main>

    <!-- Footer Hardware Info -->
    <footer class="w-full text-center py-4 font-mono text-[11px] text-slate-500 tracking-wider relative z-10 flex items-center justify-center gap-3">
      <span>&copy; 2026 SKYSHARE ACADEMY</span>
      <span class="size-1 rounded-full bg-slate-400"></span>
      <span>SYS // SECURED WITH OTP</span>
    </footer>
  </div>
</template>
