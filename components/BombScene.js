"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function sparkTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,214,60,0.95)");
  grad.addColorStop(0.6, "rgba(255,90,20,0.45)");
  grad.addColorStop(1, "rgba(255,60,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export default function BombScene() {
  const mount = useRef(null);
  const trigger = useRef(() => {});
  const [presses, setPresses] = useState(0);

  useEffect(() => {
    const el = mount.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.HemisphereLight(0xffb27a, 0x14050a, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(-4, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xff3b1a, 60, 25);
    rim.position.set(5, -1, -3);
    scene.add(rim);
    const flash = new THREE.PointLight(0xffd21f, 0, 40);
    flash.position.set(0, 0, 5);
    scene.add(flash);

    // Bomb
    const bomb = new THREE.Group();
    scene.add(bomb);
    const steel = new THREE.MeshStandardMaterial({ color: 0x1c1c22, metalness: 0.75, roughness: 0.33 });
    bomb.add(new THREE.Mesh(new THREE.SphereGeometry(2, 64, 48), steel));

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.52, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0x2b2b33, metalness: 0.8, roughness: 0.4 })
    );
    neck.position.y = 2.05;
    bomb.add(neck);

    const fuseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.3, 0),
      new THREE.Vector3(0.05, 2.8, 0),
      new THREE.Vector3(0.5, 3.1, 0),
      new THREE.Vector3(0.95, 3.0, 0),
    ]);
    bomb.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(fuseCurve, 32, 0.06, 8),
        new THREE.MeshStandardMaterial({ color: 0xd9b36a, roughness: 0.8 })
      )
    );

    const tex = sparkTexture();
    const spark = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    spark.position.copy(fuseCurve.getPoint(1));
    spark.scale.setScalar(0.9);
    bomb.add(spark);

    // Button, mounted on the front of the bomb
    const dir = new THREE.Vector3(0, 0.3, 1).normalize();
    const btn = new THREE.Group();
    btn.position.copy(dir).multiplyScalar(1.95);
    btn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    bomb.add(btn);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.0, 0.3, 48),
      new THREE.MeshStandardMaterial({ color: 0xf2c400, metalness: 0.2, roughness: 0.5 })
    );
    base.position.y = 0.1;
    btn.add(base);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.06, 12, 48),
      new THREE.MeshStandardMaterial({ color: 0x15100a, roughness: 0.6 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.26;
    btn.add(ring);

    const cap = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xe01616,
      roughness: 0.25,
      metalness: 0.1,
      emissive: 0x4a0000,
    });
    const capBody = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.32, 48), redMat);
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), redMat);
    capTop.scale.y = 0.35;
    capTop.position.y = 0.16;
    cap.add(capBody, capTop);
    const REST = 0.42;
    const DOWN = 0.24;
    cap.position.y = REST;
    btn.add(cap);

    // Explosion particles
    const N = 450;
    const pPos = new Float32Array(N * 3);
    const pVel = new Float32Array(N * 3);
    const pCol = new Float32Array(N * 3);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.35,
      map: tex,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pGeo, pMat);
    points.frustumCulled = false;
    scene.add(points);

    // State
    let phase = "idle"; // idle | boom
    let t0 = 0;
    let shake = 0;
    let burstAt = false;
    const pointer = { x: 0, y: 0 };
    const clock = new THREE.Clock();
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const tmp = new THREE.Vector3();

    function detonate() {
      if (phase !== "idle") return;
      phase = "boom";
      t0 = clock.elapsedTime;
      burstAt = false;
      setPresses((n) => n + 1);
    }
    trigger.current = detonate;

    function burst() {
      cap.getWorldPosition(tmp);
      for (let i = 0; i < N; i++) {
        const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.35, Math.random() * 0.8).normalize();
        const s = 2 + Math.random() * 6;
        pPos.set([tmp.x, tmp.y, tmp.z], i * 3);
        pVel.set([v.x * s, v.y * s, v.z * s], i * 3);
        const hot = Math.random();
        pCol.set([1, 0.35 + hot * 0.6, hot * 0.2], i * 3);
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.color.needsUpdate = true;
      pMat.opacity = 1;
      flash.intensity = 120;
      shake = 1;
    }

    // Pointer interaction
    function setNdc(e) {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    }
    function onMove(e) {
      setNdc(e);
      pointer.x = ndc.x;
      pointer.y = ndc.y;
      ray.setFromCamera(ndc, camera);
      renderer.domElement.style.cursor = ray.intersectObject(cap, true).length ? "pointer" : "default";
    }
    function onDown(e) {
      setNdc(e);
      ray.setFromCamera(ndc, camera);
      if (ray.intersectObject(cap, true).length) detonate();
    }
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);

    // Size
    function resize() {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.position.set(0, 0.3, 11.5 * Math.max(1, 0.95 / camera.aspect));
      camera.lookAt(0, 0.4, 0);
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    // Loop
    let raf;
    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // idle motion
      const bob = reduce ? 0 : Math.sin(t * 1.2) * 0.08;
      const ty = reduce ? 0 : pointer.x * 0.45 + Math.sin(t * 0.4) * 0.12;
      const tx = reduce ? 0 : -pointer.y * 0.2;
      bomb.rotation.y += (ty - bomb.rotation.y) * 0.06;
      bomb.rotation.x += (tx - bomb.rotation.x) * 0.06;
      bomb.position.set(0, bob, 0);
      spark.scale.setScalar(0.7 + Math.random() * 0.4);

      if (phase === "boom") {
        const e = t - t0;
        if (e < 0.15) {
          cap.position.y = THREE.MathUtils.lerp(REST, DOWN, e / 0.15);
        } else {
          cap.position.y = DOWN;
          if (!burstAt) {
            burstAt = true;
            burst();
          }
        }
        if (e > 2.6) {
          phase = "idle";
        }
      } else {
        cap.position.y += (REST - cap.position.y) * 0.15;
      }

      // particles
      if (pMat.opacity > 0) {
        for (let i = 0; i < N; i++) {
          const k = i * 3;
          pPos[k] += pVel[k] * dt;
          pPos[k + 1] += pVel[k + 1] * dt;
          pPos[k + 2] += pVel[k + 2] * dt;
          pVel[k] *= 0.97;
          pVel[k + 1] = pVel[k + 1] * 0.97 - 1.2 * dt;
          pVel[k + 2] *= 0.97;
        }
        pGeo.attributes.position.needsUpdate = true;
        pMat.opacity = Math.max(0, pMat.opacity - dt * 0.55);
      }

      // flash + shake decay
      flash.intensity *= 0.9;
      shake *= 0.92;
      if (!reduce && shake > 0.01) {
        bomb.position.x += (Math.random() - 0.5) * shake * 0.35;
        bomb.position.y += (Math.random() - 0.5) * shake * 0.35;
      }
      bomb.scale.setScalar(1 + (reduce ? 0 : shake * 0.08));

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      tex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="stage">
      <div ref={mount} className="canvas" aria-hidden="true" />
      <button type="button" className="press" onClick={() => trigger.current()}>
        Press the button
      </button>
      <p className="count" aria-live="polite">
        {presses === 0
          ? "It's a meme. Go on, press it."
          : `Detonated ${presses} time${presses === 1 ? "" : "s"}. Nothing real was harmed.`}
      </p>
    </div>
  );
}
