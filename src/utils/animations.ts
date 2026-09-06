import gsap from "gsap";

/**
 * Industrial Skeuomorphic Mechanical Spring Easing
 * Mimics physical spring-loaded switches and mechanical damped bounce.
 */
export const MECHANICAL_EASE = "back.out(1.5)";
export const MECHANICAL_FAST_EASE = "power2.out";

/**
 * Animate page entrance with staggered hardware modules
 */
export function animatePageEntrance(container: HTMLElement | string, itemSelector = ".chassis-animate") {
  const ctx = gsap.context(() => {
    gsap.from(itemSelector, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: MECHANICAL_EASE,
      clearProps: "all",
    });
  }, container);

  return ctx;
}

/**
 * Digital meter ticker animation for numbers
 */
export function animateCounter(target: { value: number }, endValue: number, onUpdate: () => void, duration = 1.2) {
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
export function animateMascotFloat(el: HTMLElement | string) {
  return gsap.to(el, {
    y: -8,
    rotation: 1.5,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

/**
 * Tactile pulse indicator for active LED status lights
 */
export function animateLedPulse(el: HTMLElement | string) {
  return gsap.to(el, {
    scale: 1.2,
    opacity: 0.8,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
  });
}

export { gsap };
