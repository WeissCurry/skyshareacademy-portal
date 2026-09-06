import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import AuthLayout from "@/layouts/AuthLayout.vue";
import PortalLayout from "@/layouts/PortalLayout.vue";

import LoginPage from "@/pages/auth/LoginPage.vue";
import RegisterPage from "@/pages/auth/RegisterPage.vue";

import DashboardPage from "@/pages/portal/DashboardPage.vue";
import EventsPage from "@/pages/portal/EventsPage.vue";
import EventDetailPage from "@/pages/portal/EventDetailPage.vue";
import MaterialsPage from "@/pages/portal/MaterialsPage.vue";
import MaterialDetailPage from "@/pages/portal/MaterialDetailPage.vue";
import ActivityPage from "@/pages/portal/ActivityPage.vue";
import ProfilePage from "@/pages/portal/ProfilePage.vue";

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
        name: "register",
        component: RegisterPage,
        meta: { guestOnly: true },
      },
    ],
  },

  // Protected Portal routes (requires member account)
  {
    path: "/",
    component: PortalLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: DashboardPage,
      },
      {
        path: "events",
        name: "events",
        component: EventsPage,
      },
      {
        path: "events/:id",
        name: "event-detail",
        component: EventDetailPage,
      },
      {
        path: "materials",
        name: "materials",
        component: MaterialsPage,
      },
      {
        path: "materials/:id",
        name: "material-detail",
        component: MaterialDetailPage,
      },
      {
        path: "activity",
        name: "activity",
        component: ActivityPage,
      },
      {
        path: "profile",
        name: "profile",
        component: ProfilePage,
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

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: "login" });
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: "dashboard" });
  } else {
    next();
  }
});

export default router;
