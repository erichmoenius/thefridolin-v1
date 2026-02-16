# Hero Prototype v1 — thefridolin.com

A cinematic, scroll-driven WebGL hero built with Three.js and GLSL.

This is **not** a typical audio visualizer.  
It is a controlled digital atmosphere shaped by scroll, subtle audio energy and spatial depth.

---

## 🌌 Experience Concept

A transformation through visual states:

**Gas → Water → Solid → Fire → Stillness**

Each state evolves physically through scroll.  
Audio acts as an internal life layer.  
Parallax adds spatial presence — never distraction.

### Core Focus

- Volumetric depth
- Restrained cinematic bloom
- Subtle audio reactivity
- Slow camera push-in
- Soft state blending (no hard cuts)

---

## 🎛 Interaction Model

- **Scroll** → timeline progression  
- **Audio** → internal energy modulation  
- **Parallax** → minimal spatial response  

No gimmicks.  
No beat-scaling.  
No flashy transitions.

---

## 🧠 Visual Principles

- Fast-black base (no pure black clipping)
- Blue / Violet core palette
- Warm activation only in final *Fire* state
- Controlled highlight bloom
- No visible noise tiling
- Modular shader layering

---

## 🏗 Architecture

- Scroll-driven state engine
- Uniform-based blending system
- Decoupled audio smoothing
- Modular shader structure (no monolithic fragment)

---

## 🛠 Tech Stack

**Core**
- Three.js
- Web Audio API
- GLSL (Vertex & Fragment)

**Deployment**
- Vercel (auto-deploy via GitHub)

---

## 📦 Installation

```bash
npm install
npm run dev
