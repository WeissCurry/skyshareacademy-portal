import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAccessStore } from "@/stores/access";

import AuthLayout from "@/layouts/AuthLayout.vue";
import PortalLayout from "@/layouts/PortalLayout.vue";

import LoginPage from "@/pages/auth/LoginPage.vue";

import DashboardPage from "@/pages/portal/DashboardPage.vue";
import KycPage from "@/pages/portal/KycPage.vue";
import ProgramsPage from "@/pages/portal/ProgramsPage.vue";
import EventsPage from "@/pages/portal/EventsPage.vue";
import EventDetailPage from "@/pages/portal/EventDetailPage.vue";
import MaterialsPage from "@/pages/portal/MaterialsPage.vue";
import MaterialDetailPage from "@/pages/portal/MaterialDetailPage.vue";
import AssignmentsPage from "@/pages/portal/AssignmentsPage.vue";
import ProfilePage from "@/pages/portal/ProfilePage.vue";
import ManageArticlesPage from "@/pages/portal/ManageArticlesPage.vue";

const routes = [
  // Guest / Auth routes
  {
    path: "/",
    component: AuthLayout,
    children: [
      {
        path: "",
        redirect: "/dashboard",
      },
      {
        path: "login",
        name: "login",
        component: LoginPage,
        meta: { guestOnly: true },
      },
      {
        path: "register",
        redirect: "/login",
      },
    ],
  },

  // Protected Portal routes (requires mentor account)
  {
    path: "/",
    component: PortalLayout,
    meta: { requiresAuth: true },
    children: [
      // Ungated: Always reachable before or after access is granted
      {
        path: "kyc",
        name: "kyc",
        component: KycPage,
      },
      {
        path: "programs",
        name: "programs",
        component: ProgramsPage,
      },
      {
        path: "profile",
        name: "profile",
        component: ProfilePage,
      },

      // Gated Content routes: Require Approved KYC + Active Program Enrollment
      {
        path: "dashboard",
        name: "dashboard",
        component: DashboardPage,
        meta: { requiresAccess: true },
      },
      {
        path: "events",
        name: "events",
        component: EventsPage,
        meta: { requiresAccess: true },
      },
      {
        path: "events/:id",
        name: "event-detail",
        component: EventDetailPage,
        meta: { requiresAccess: true },
      },
      {
        path: "materials",
        name: "materials",
        component: MaterialsPage,
        meta: { requiresAccess: true },
      },
      {
        path: "materials/:id",
        name: "material-detail",
        component: MaterialDetailPage,
        meta: { requiresAccess: true },
      },
      {
        path: "articles/:id",
        name: "article-detail",
        component: MaterialDetailPage,
        meta: { requiresAccess: true },
      },
      {
        path: "assignments",
        name: "assignments",
        component: AssignmentsPage,
        meta: { requiresAccess: true },
      },
      {
        path: "articles/manage",
        name: "manage-articles",
        component: ManageArticlesPage,
        meta: { requiresContributor: true },
      },
    ],
  },

  // Catch-all
  {
    path: "/:pathMatch(.*)*",
    redirect: "/dashboard",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const accessStore = useAccessStore();

  // If redirected to login with expired=1, forcefully clear auth and access to prevent redirect loop (P0-2)
  if (to.path === "/login" && to.query.expired === "1") {
    authStore.setUser(null);
    accessStore.reset();
  }

  // 1. Guest-only routes
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: "dashboard" });
  }

  // 2. Auth required check
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next({ name: "login", query: { redirect: to.fullPath } });
    }

    // 3. Ensure server access state is loaded
    if (!accessStore.isLoaded) {
      try {
        await accessStore.fetchAccess();
      } catch {
        // Handled in access store
      }
    }

    // 4. Server-only access gating:
    // Before access is granted, only KYC and Program pages (+ profile/logout) are reachable.
    // If not approved KYC -> redirect to /kyc
    // If approved KYC but no active programs -> redirect to /programs
    if (to.meta.requiresAccess) {
      if (!accessStore.isApprovedKyc) {
        return next({
          name: "kyc",
          query: { message: "kyc_required" },
        });
      }

      if (!accessStore.hasActivePrograms) {
        return next({
          name: "programs",
          query: { message: "program_required" },
        });
      }
    }

    // 5. Contributor-only routes
    if (to.meta.requiresContributor && !accessStore.isContributor) {
      return next({
        name: accessStore.isVisitorOnly ? "programs" : "dashboard",
      });
    }
  }

  next();
});

export default router;
