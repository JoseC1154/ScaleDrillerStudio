import React, { useRef, useEffect, memo } from 'react';

interface WarpSpeedBackgroundProps {
  bpm: number;
}

const WarpSpeedBackground: React.FC<WarpSpeedBackgroundProps> = ({ bpm }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<any[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const numStars = 500;
    const speed = Math.max(1, bpm / 40); // Base speed on BPM

    // Initialize stars
    if (starsRef.current.length === 0) {
      for (let i = 0; i < numStars; i++) {
        starsRef.current.push({
          x: (Math.random() - 0.5) * width,
          y: (Math.random() - 0.5) * height,
          z: Math.random() * width
        });
      }
    }

    const draw = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.save();
      ctx.translate(width / 2, height / 2);

      for (let i = 0; i < numStars; i++) {
        const star = starsRef.current[i];
        star.z -= speed;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width;
          star.y = (Math.random() - 0.5) * height;
          star.z = width;
        }

        const k = 128 / star.z;
        const px = star.x * k;
        const py = star.y * k;
        const size = (1 - star.z / width) * 4;

        ctx.fillRect(px, py, size, size);
      }
      ctx.restore();
      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [bpm]);

  return (
    <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full z-0"
        aria-hidden="true"
    />
  );
};

export default memo(WarpSpeedBackground);