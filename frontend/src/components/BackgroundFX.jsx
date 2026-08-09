import { useEffect, useRef } from "react";

/**
 * Purely decorative background - the mountain/sky scene behind every page.
 * Listens for mouse movement and updates some CSS variables so the
 * different layers (far mountains, near mountains, the sun) shift by
 * different amounts, giving a fake parallax/3D feel. Throttled with
 * requestAnimationFrame so it doesn't fire a state update on every single
 * mousemove event.
 */
export default function BackgroundFX() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let raf = null;
    function handleMove(e) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--fx-shift-far", `${(x * 6).toFixed(2)}px`);
        el.style.setProperty("--fx-shift-mid", `${(x * 14).toFixed(2)}px`);
        el.style.setProperty("--fx-shift-near", `${(x * 24).toFixed(2)}px`);
        el.style.setProperty("--fx-tilt", `${(y * -3).toFixed(2)}deg`);
        raf = null;
      });
    }
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fx-scene" ref={wrapRef} aria-hidden="true">
      <div className="fx-sky" />
      <span className="fx-sun" />
      <span className="fx-particle fx-particle-1" />
      <span className="fx-particle fx-particle-2" />
      <span className="fx-particle fx-particle-3" />
      <div className="fx-ridge fx-ridge-far" />
      <div className="fx-ridge fx-ridge-mid" />
      <div className="fx-ridge fx-ridge-near" />
    </div>
  );
}