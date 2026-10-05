#!/bin/bash
# render the MV: 1920x1080, 60 fps, 242.2 s (song + credits tail).  Extra args go to render.mjs (e.g. --pages 8, --preview 30 60).
# On WSL2 the GPU is reached through Mesa's d3d12 driver; elsewhere drop the two env vars.
cd "$(dirname "$0")" && GALLIUM_DRIVER=${GALLIUM_DRIVER:-d3d12} MESA_D3D12_DEFAULT_ADAPTER_NAME=${GPU_NAME:-NVIDIA} \
  exec node render.mjs --page index.html --dur 242.2 --fps 60 --audio assets/song7s.mp3 --out hello_world_mv.mp4 "$@"
