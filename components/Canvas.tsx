/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { SimulationConfig, GlobalSettings, Ball, Vector2 } from '../types';
import { generatePolygon, generateStar, add, mult, dot, sub, normalize, mag } from '../utils/math';

interface TouchRipple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

interface CanvasProps {
  config: SimulationConfig;
  globalSettings: GlobalSettings;
  interactive?: boolean;
  tiltGravity?: Vector2 | null;
}

const Canvas: React.FC<CanvasProps> = ({
  config,
  globalSettings,
  interactive = false,
  tiltGravity = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const globalSettingsRef = useRef<GlobalSettings>(globalSettings);
  const configRef = useRef<SimulationConfig>(config);
  const tiltGravityRef = useRef<Vector2 | null>(tiltGravity);

  const stateRef = useRef<{
    balls: Ball[];
    rotation: number;
    ripples: TouchRipple[];
  }>({
    balls: [],
    rotation: 0,
    ripples: [],
  });

  useEffect(() => {
    globalSettingsRef.current = globalSettings;
  }, [globalSettings]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    tiltGravityRef.current = tiltGravity;
  }, [tiltGravity]);

  // Initialize / re-initialize balls when structural preset properties change
  useEffect(() => {
    const balls: Ball[] = [];
    const count = Math.max(1, Math.floor(config.ballCount));

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 30;
      const speed = config.initialSpeed * (0.5 + Math.random());
      const velAngle = Math.random() * Math.PI * 2;

      balls.push({
        id: `${config.id}-${i}`,
        pos: { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist },
        vel: { x: Math.cos(velAngle) * speed, y: Math.sin(velAngle) * speed },
        radius: config.ballSize,
        color: '#FACC15',
      });
    }

    stateRef.current = {
      balls,
      rotation: 0,
      ripples: [],
    };
  }, [config.id, config.ballCount, config.initialSpeed, config.ballSize]);

  const applyImpulseAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const localX = clientX - rect.left - rect.width / 2;
    const localY = clientY - rect.top - rect.height / 2;
    const scale = interactive ? Math.max(1, Math.min(rect.width, rect.height) / 320) : 1;

    stateRef.current.ripples.push({
      x: localX,
      y: localY,
      radius: 6 * scale,
      alpha: 0.9,
    });

    const impulseRadius = 110 * scale;
    stateRef.current.balls.forEach((ball) => {
      const diff = sub(ball.pos, { x: localX, y: localY });
      const d = mag(diff);
      if (d < impulseRadius) {
        const dir = d < 1 ? { x: Math.random() - 0.5, y: -1 } : normalize(diff);
        const strength = (1 - d / impulseRadius) * 8 * scale;
        ball.vel = add(ball.vel, mult(dir, strength));
      }
    });
  };

  const updatePhysics = (width: number, height: number) => {
    const state = stateRef.current;
    const currentConfig = configRef.current;
    const { gravityMultiplier, timeScale, rotationMultiplier, bouncinessMultiplier } =
      globalSettingsRef.current;

    if (timeScale <= 0) {
      return;
    }

    const shapeRadius = Math.min(width, height) * 0.45;
    const scale = interactive ? Math.max(1, Math.min(width, height) / 320) : 1;

    // 1. Update Rotation
    state.rotation += currentConfig.rotationSpeed * rotationMultiplier * timeScale;

    // 2. Generate Shape Vertices (Local Space)
    const localVertices: Vector2[] =
      currentConfig.shapeType === 'star'
        ? generateStar(
            currentConfig.vertexCount || 5,
            shapeRadius,
            shapeRadius * 0.4,
            { x: 0, y: 0 },
            state.rotation
          )
        : generatePolygon(
            currentConfig.vertexCount || 4,
            shapeRadius,
            { x: 0, y: 0 },
            state.rotation
          );

    // Determine gravity vector (supports Android device tilt sensor)
    const activeTilt = tiltGravityRef.current;
    let gx = 0;
    let gy = currentConfig.gravity * gravityMultiplier * timeScale;
    if (activeTilt) {
      const baseGravityMag =
        (Math.abs(currentConfig.gravity) > 0.01 ? Math.abs(currentConfig.gravity) : 0.18) *
        gravityMultiplier *
        timeScale;
      gx = activeTilt.x * baseGravityMag;
      gy = activeTilt.y * baseGravityMag;
    }

    // 3. Update Balls
    const restitution = currentConfig.restitution * bouncinessMultiplier;
    state.balls.forEach((ball) => {
      const effectiveRadius = ball.radius * scale;

      ball.vel.x += gx;
      ball.vel.y += gy;
      ball.vel = mult(ball.vel, Math.max(0, 1 - currentConfig.friction * timeScale));
      ball.pos = add(ball.pos, mult(ball.vel, timeScale));

      // Collision with Walls
      for (let i = 0; i < localVertices.length; i++) {
        const p1 = localVertices[i];
        const p2 = localVertices[(i + 1) % localVertices.length];
        const edge = sub(p2, p1);

        const edgeNormal = normalize({ x: -edge.y, y: edge.x });
        if (dot(edgeNormal, mult(p1, -1)) < 0) {
          edgeNormal.x *= -1;
          edgeNormal.y *= -1;
        }

        const relPos = sub(ball.pos, p1);
        const dist = dot(relPos, edgeNormal);

        if (dist < effectiveRadius) {
          const penetration = effectiveRadius - dist;
          ball.pos = add(ball.pos, mult(edgeNormal, penetration));

          const velDotNormal = dot(ball.vel, edgeNormal);
          if (velDotNormal < 0) {
            const reflect = mult(edgeNormal, 2 * velDotNormal);
            ball.vel = sub(ball.vel, reflect);
            ball.vel = mult(ball.vel, restitution);
            ball.vel = add(ball.vel, mult(edgeNormal, 0.1));
          }
        }
      }
    });

    // 4. Ball-to-Ball Collisions
    const balls = state.balls;
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const ballA = balls[i];
        const ballB = balls[j];

        const distVec = sub(ballB.pos, ballA.pos);
        const distance = mag(distVec);
        const totalRadius = (ballA.radius + ballB.radius) * scale;

        if (distance < totalRadius) {
          const overlap = totalRadius - distance;
          const correctionNormal = distance === 0 ? { x: 1, y: 0 } : normalize(distVec);
          ballA.pos = add(ballA.pos, mult(correctionNormal, -overlap / 2));
          ballB.pos = add(ballB.pos, mult(correctionNormal, overlap / 2));

          const relativeVelocity = sub(ballB.vel, ballA.vel);
          const speedAlongNormal = dot(relativeVelocity, correctionNormal);

          if (speedAlongNormal < 0) {
            const v1nScalar = dot(ballA.vel, correctionNormal);
            const v2nScalar = dot(ballB.vel, correctionNormal);

            const v1nVec = mult(correctionNormal, v1nScalar);
            const v2nVec = mult(correctionNormal, v2nScalar);

            const v1tVec = sub(ballA.vel, v1nVec);
            const v2tVec = sub(ballB.vel, v2nVec);

            ballA.vel = add(v1tVec, v2nVec);
            ballB.vel = add(v2tVec, v1nVec);
          }
        }
      }
    }

    // Hard limit to keep inside container
    balls.forEach((ball) => {
      if (mag(ball.pos) > shapeRadius + 50) {
        ball.pos = { x: 0, y: 0 };
        ball.vel = { x: 0, y: 0 };
      }
    });

    // Update touch ripples
    state.ripples = state.ripples
      .map((r) => ({ ...r, radius: r.radius + 3.5 * scale, alpha: r.alpha - 0.04 }))
      .filter((r) => r.alpha > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    const center = { x: width / 2, y: height / 2 };
    const state = stateRef.current;
    const currentConfig = configRef.current;
    const shapeRadius = Math.min(width, height) * 0.45;
    const scale = interactive ? Math.max(1, Math.min(width, height) / 320) : 1;

    // Draw Shape
    const points: Vector2[] =
      currentConfig.shapeType === 'star'
        ? generateStar(
            currentConfig.vertexCount || 5,
            shapeRadius,
            shapeRadius * 0.4,
            center,
            state.rotation
          )
        : generatePolygon(
            currentConfig.vertexCount || 4,
            shapeRadius,
            center,
            state.rotation
          );

    ctx.beginPath();
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
    }

    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = interactive ? 3.5 : 3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
    ctx.fill();

    // Draw Touch Ripples
    state.ripples.forEach((ripple) => {
      ctx.beginPath();
      ctx.arc(center.x + ripple.x, center.y + ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${ripple.alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw Balls
    state.balls.forEach((ball) => {
      const screenX = center.x + ball.pos.x;
      const screenY = center.y + ball.pos.y;

      ctx.beginPath();
      ctx.arc(screenX, screenY, ball.radius * scale, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const tick = () => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;
      const ctx = currentCanvas.getContext('2d');
      if (!ctx) return;

      if (isVisibleRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const { clientWidth, clientHeight } = currentCanvas;
        const targetW = Math.floor(clientWidth * dpr);
        const targetH = Math.floor(clientHeight * dpr);

        if (currentCanvas.width !== targetW || currentCanvas.height !== targetH) {
          currentCanvas.width = targetW;
          currentCanvas.height = targetH;
        }

        if (clientWidth > 0 && clientHeight > 0) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          updatePhysics(clientWidth, clientHeight);
          draw(ctx, clientWidth, clientHeight);
        }
      }

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={
        interactive
          ? (e) => {
              applyImpulseAt(e.clientX, e.clientY);
            }
          : undefined
      }
      className={`w-full h-full block ${interactive ? 'touch-none cursor-pointer' : ''}`}
    />
  );
};

export default Canvas;