<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppButton from "@/components/common/AppButton.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import { useAlert } from "@/composables/useAlert";

const toast = useAlert();

const route = useRoute();
const router = useRouter();

const eventId = route.params.id;

// State upload
const isDragging = ref(false);
const selectedFile = ref<File | null>(null);
const uploadProgress = ref(0);
const isUploading = ref(false);
const uploadSuccess = ref(false);
const submissionStatus = ref<"none" | "submitted" | "reviewed">("none");

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    selectedFile.value = e.dataTransfer.files[0];
  }
};

const submitTask = () => {
  if (!selectedFile.value) return;

  isUploading.value = true;
  uploadProgress.value = 20;

  const interval = setInterval(() => {
    uploadProgress.value += 30;
    if (uploadProgress.value >= 100) {
      clearInterval(interval);
      isUploading.value = false;
      uploadSuccess.value = true;
      submissionStatus.value = "submitted";
      toast.success("Tugas Anda berhasil diunggah ke server dan diteruskan ke mentor pendamping.", "Tugas Terkumpul");
    }
  }, 400);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Back Button & Breadcrumbs -->
    <div class="flex items-center gap-2 text-xs font-semibold text-slate-500">
      <button
        class="hover:text-[#1E5FAD] flex items-center gap-1 cursor-pointer"
        @click="router.back()"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        <span>Kembali ke Daftar Event</span>
      </button>
      <span>/</span>
      <span class="text-slate-800">Detail Event & Tugas</span>
    </div>

    <!-- Event Header Card -->
    <div class="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge variant="mentor">Bootcamp Intensive</AppBadge>
        <span class="text-xs text-slate-400">•</span>
        <span class="text-xs font-semibold text-slate-500">ID Event: #{{ eventId }}</span>
      </div>

      <h1 class="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
        AI & Fullstack Engineering Intensive Bootcamp 2026
      </h1>

      <p class="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
        Pelajari cara mengintegrasikan model LLM dan agen AI ke dalam arsitektur modern web aplikasi. Pada modul ini kamu ditugaskan untuk merancang arsitektur sistem dan alur data pengguna.
      </p>

      <div class="flex flex-wrap gap-4 sm:gap-8 pt-4 border-t border-slate-100 text-xs">
        <div>
          <span class="text-slate-400 block">Jadwal Acara</span>
          <span class="font-bold text-slate-700 mt-0.5 block">10 Sep - 25 Okt 2026</span>
        </div>
        <div>
          <span class="text-slate-400 block">Mentor Pendamping</span>
          <span class="font-bold text-slate-700 mt-0.5 block">Rian Pratama (Senior Tech Lead)</span>
        </div>
        <div>
          <span class="text-slate-400 block">Batas Pengumpulan Tugas</span>
          <span class="font-bold text-rose-600 mt-0.5 block">Minggu, 14 September 2026 (23:59 WIB)</span>
        </div>
      </div>
    </div>

    <!-- Task Submission Section -->
    <div class="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Upload Tugas Sesi 1</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Unggah berkas tugas kamu (format: PDF, DOCX, ZIP, atau Gambar maks. 25MB)
          </p>
        </div>
        <span
          :class="[
            'px-3 py-1 rounded-full text-xs font-bold',
            submissionStatus === 'submitted'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          ]"
        >
          {{ submissionStatus === "submitted" ? "Tugas Terkumpul" : "Belum Dikumpulkan" }}
        </span>
      </div>

      <!-- Success Alert -->
      <AppAlert
        v-if="uploadSuccess"
        variant="success"
        title="Tugas Berhasil Diunggah"
        message="Berkas tugas kamu telah berhasil diunggah ke server dan sedang menunggu review dari Mentor."
        dismissible
        @close="uploadSuccess = false"
      />

      <!-- Drag & Drop Area -->
      <div
        :class="[
          'border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all',
          isDragging
            ? 'border-[#1E5FAD] bg-blue-50/60'
            : 'border-slate-300 hover:border-[#1E5FAD] bg-slate-50/40'
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <input
          id="task-upload"
          type="file"
          class="hidden"
          accept=".pdf,.docx,.zip,.png,.jpg"
          @change="handleFileSelect"
        />

        <div class="size-14 rounded-2xl bg-blue-100/70 text-[#1E5FAD] flex items-center justify-center mx-auto mb-3">
          <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" x2="12" y1="3" y2="15"/>
          </svg>
        </div>

        <p class="text-sm font-bold text-slate-800">
          Tarik dan lepas file tugas ke sini, atau
        </p>
        <label
          for="task-upload"
          class="mt-2 inline-block text-xs font-bold text-[#1E5FAD] hover:underline cursor-pointer"
        >
          Pilih File dari Komputer
        </label>
        <p class="text-[11px] text-slate-400 mt-2">
          Format yang didukung: PDF, DOCX, ZIP, JPG, PNG (Maks. 25 MB)
        </p>
      </div>

      <!-- Selected File Preview -->
      <div
        v-if="selectedFile"
        class="p-4 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-lg bg-[#1E5FAD] text-white flex items-center justify-center font-bold text-xs">
            FILE
          </div>
          <div>
            <p class="text-xs font-bold text-slate-800">{{ selectedFile.name }}</p>
            <p class="text-[11px] text-slate-500">
              {{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB
            </p>
          </div>
        </div>

        <button
          type="button"
          class="text-xs text-rose-600 hover:underline cursor-pointer"
          @click="selectedFile = null"
        >
          Batal
        </button>
      </div>

      <!-- Upload Progress Bar -->
      <div v-if="isUploading" class="space-y-1">
        <div class="flex justify-between text-xs font-semibold text-[#1E5FAD]">
          <span>Mengunggah file ke server...</span>
          <span>{{ uploadProgress }}%</span>
        </div>
        <div class="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-[#1E5FAD] transition-all duration-300"
            :style="{ width: `${uploadProgress}%` }"
          />
        </div>
      </div>

      <!-- Action Button -->
      <div class="flex justify-end pt-2">
        <AppButton
          variant="primary"
          :disabled="!selectedFile || isUploading"
          :loading="isUploading"
          @click="submitTask"
        >
          Kumpulkan Tugas Sekarang
        </AppButton>
      </div>
    </div>
  </div>
</template>
