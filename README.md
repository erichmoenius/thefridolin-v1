Hero Prototype v1 – thefridolin.com

A cinematic, scroll-driven WebGL hero experience built with Three.js and GLSL.

Not a visualizer.
A controlled digital atmosphere.

🌌 Concept
A transformation through visual states:

Gas → Water → Solid → Fire → Stillness

  Each state evolves physically through scroll.
  Audio acts as a subtle life layer.
  Parallax adds presence — never distraction.

Focus:
  volumetric depth
  restrained bloom
  subtle audio response
  slow camera push-in
  state blending without hard cuts

🎛 Interaction Model
  Scroll = timeline
  Audio = internal energy
  Parallax = spatial response

  No gimmicks.
  No beat-scaling.
  No flashy transitions.

🧠 Visual Principles
  Fast-black base (no pure black clipping)
  Blue / Violet core palette
  Warm activation only in final Fire state
  Controlled cinematic bloom
  No visible noise tiling
  Modular state blending

🛠 Tech Stack
Core:
  Three.js
  Web Audio API
  GLSL (modular shader structure)

Architecture:
  Scroll-driven state engine
  Uniform-based blending
  Decoupled audio smoothing

Hosting:
  Vercel (auto-deploy via GitHub)

📦 Installation
  npm install
  npm run dev
  
