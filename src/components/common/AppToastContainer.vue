<script setup lang="ts">
import { useAlert } from "@/composables/useAlert";
import AppAlert from "./AppAlert.vue";

const { activeAlerts, dismiss } = useAlert();
</script>

<template>
  <div
    class="fixed top-4 right-4 sm:top-6 sm:right-6 z-9999 flex flex-col gap-3 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
  >
    <TransitionGroup
      name="toast-slide"
      tag="div"
      class="flex flex-col gap-3"
    >
      <div
        v-for="alert in activeAlerts"
        :key="alert.id"
        class="pointer-events-auto shadow-2xl transition-all duration-300"
      >
        <AppAlert
          :variant="alert.variant"
          :title="alert.title"
          :message="alert.message"
          :code="alert.code"
          dismissible
          @close="dismiss(alert.id)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}
</style>
