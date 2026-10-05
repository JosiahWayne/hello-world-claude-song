#!/bin/bash
# assemble main7s.js (the published Suno version) from the scene files
cd "$(dirname "$0")"
cat main7s_engine.js scenes7_warp_s.js scenes7_head.js scenes7_a.js scenes7_b.js scenes7_c.js scenes7_d.js scenes7_e.js scenes7_f.js scenes7_z_s.js > main7s.js \
  && node --check --input-type=module < main7s.js && echo built main7s.js $(wc -l < main7s.js) lines
