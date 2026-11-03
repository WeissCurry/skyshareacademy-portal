import gsap from "gsap";

/**
 * Check if user prefers reduced motion for accessibility
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Industrial Skeuomorphic Mechanical Spring Easing
 * Mimics physical spring-loaded switches and mechanical damped bounce.
 */
export const MECHANICAL_EASE = "back.out(1.5)";
export const MECHANICAL_FAST_EASE = "power2.out";

/**
 * Animate page entrance with staggered hardware modules
 */
export function animatePageEntrance(container?: HTMLElement | string | null, itemSelector = ".chassis-animate") {
  if (typeof window === "undefined" || !container) return null;

  const scope = typeof container === "string" ? document.querySelector<HTMLElement>(container) : container;
  if (!scope) return null;

  const targets = scope.querySelectorAll(itemSelector);
  if (targets.length === 0) return null;

  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, clearProps: "all" });
    return null;
  }

  const ctx = gsap.context(() => {
    gsap.from(targets, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: MECHANICAL_EASE,
      clearProps: "all",
      onInterrupt: () => {
        gsap.set(targets, { opacity: 1, clearProps: "all" });
      },
    });
  }, scope);

  return ctx;
}

/**
 * Digital meter ticker animation for numbers
 */
export function animateCounter(target: { value: number }, endValue: number, onUpdate: () => void, duration = 1.2) {
  if (prefersReducedMotion()) {
    target.value = endValue;
    onUpdate();
    return null;
  }

  return gsap.to(target, {
    value: endValue,
    duration,
    ease: "power2.out",
    roundProps: "value",
    onUpdate,
  });
}

/**
 * Subtle organic floating physics for mascot illustrations
 */
export function animateMascotFloat(el: HTMLElement | string | null | undefined) {
  if (prefersReducedMotion() || !el) {
    return null;
  }

  return gsap.to(el, {
    y: -3,
    duration: 2.2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

/**
 * Tactile pulse indicator for active LED status lights
 */
export function animateLedPulse(el: HTMLElement | string | null | undefined) {
  if (prefersReducedMotion() || !el) {
    return null;
  }

  return gsap.to(el, {
    scale: 1.25,
    opacity: 0.75,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
  });
}

/**
 * Animate mobile drawer opening with GSAP:
 * - Backdrop fades in (opacity 0 to 1)
 * - Drawer slides in from left (xPercent -100 to 0)
 * - Nav items stagger in slightly (opacity 0 to 1, x: -14 to 0)
 */
export function animateDrawerEnter(
  container: HTMLElement,
  done: () => void,
  options?: {
    drawerSelector?: string;
    itemSelector?: string;
  }
) {
  if (typeof window === "undefined" || !container) {
    done();
    return null;
  }

  const drawer = options?.drawerSelector
    ? container.querySelector<HTMLElement>(options.drawerSelector)
    : container.querySelector<HTMLElement>(".drawer-panel");
  const items = options?.itemSelector
    ? container.querySelectorAll<HTMLElement>(options.itemSelector)
    : container.querySelectorAll<HTMLElement>(".drawer-nav-item");

  if (prefersReducedMotion()) {
    gsap.set(container, { opacity: 1, clearProps: "all" });
    if (drawer) gsap.set(drawer, { xPercent: 0, clearProps: "all" });
    if (items.length) gsap.set(items, { opacity: 1, x: 0, clearProps: "all" });
    done();
    return null;
  }

  gsap.killTweensOf(container);
  if (drawer) gsap.killTweensOf(drawer);
  if (items.length) gsap.killTweensOf(items);

  const tl = gsap.timeline({
    onComplete: done,
  });

  // 1. Backdrop fades in
  tl.fromTo(
    container,
    { opacity: 0 },
    { opacity: 1, duration: 0.28, ease: "power2.out" },
    0
  );

  // 2. Drawer slides in from left
  if (drawer) {
    tl.fromTo(
      drawer,
      { xPercent: -100 },
      { xPercent: 0, duration: 0.34, ease: "power2.out", clearProps: "transform" },
      0
    );
  }

  // 3. Nav items stagger in
  if (items.length > 0) {
    tl.fromTo(
      items,
      { opacity: 0, x: -14 },
      { opacity: 1, x: 0, duration: 0.22, stagger: 0.035, ease: "power1.out", clearProps: "all" },
      0.1
    );
  }

  return tl;
}

/**
 * Animate mobile drawer closing with GSAP:
 * - Reverse: drawer slides out to left (xPercent -100)
 * - Backdrop fades out (opacity 0)
 * - Invokes done callback when complete
 */
export function animateDrawerLeave(
  container: HTMLElement,
  done: () => void,
  options?: {
    drawerSelector?: string;
  }
) {
  if (typeof window === "undefined" || !container) {
    done();
    return null;
  }

  const drawer = options?.drawerSelector
    ? container.querySelector<HTMLElement>(options.drawerSelector)
    : container.querySelector<HTMLElement>(".drawer-panel");

  if (prefersReducedMotion()) {
    done();
    return null;
  }

  gsap.killTweensOf(container);
  if (drawer) gsap.killTweensOf(drawer);

  const tl = gsap.timeline({
    onComplete: done,
  });

  // 1. Drawer slides out to left
  if (drawer) {
    tl.to(
      drawer,
      { xPercent: -100, duration: 0.24, ease: "power2.in" },
      0
    );
  }

  // 2. Backdrop fades out
  tl.to(
    container,
    { opacity: 0, duration: 0.22, ease: "power2.in" },
    0.04
  );

  return tl;
}

export { gsap };
