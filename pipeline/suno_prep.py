"""Everything the MV needs to follow the Suno track.
- refine 'Hello, World' lines from vocal onsets (MMS alignment is weak on them)
- env7s.json / osc7s.bin from the Suno stems
- warp7s.json: old-song time -> new-song time anchors (line starts/ends), so every scene keeps its place
- song7s.mp3: the Suno audio padded with silence for the credits tail
"""
import os
SEP = os.environ.get('SEP_DIR', 'build/sep/htdemucs/Hello, World')   # demucs -n htdemucs output for the Suno track
SONG = os.environ.get('SONG', 'song/Hello, World.mp3')
MVD = os.environ.get('MV_DATA', 'build/mv')                            # words / env / osc / warp / padded audio

import json, subprocess, numpy as np, soundfile as sf, librosa
FPS = 60
OLD = json.load(open('pipeline/words7_score.json')); NEW = json.load(open(f'{MVD}/words7s.json'))
sep = SEP
v, sr = sf.read(f'{sep}/vocals.wav'); vm = v.mean(1)
h = int(sr * 0.02); env = np.sqrt(np.convolve(vm ** 2, np.ones(h) / h, 'same'))[::h]; te = np.arange(len(env)) * 0.02
HELLO = [i for i, w in enumerate(NEW) if w['text'].startswith('Hello')]
for i in HELLO:
    lo = (NEW[i - 1]['chars'][-1]['e'] + 0.18) if i > 0 else 0.3
    hi = NEW[i + 1]['t0'] - 0.15 if i + 1 < len(NEW) else lo + 4
    sel = (te >= lo) & (te <= hi)
    if sel.sum() < 5: continue
    e = env[sel]; t = te[sel]; thr = 0.3 * e.max()
    k0 = int(np.argmax(e > thr)); s_hello = t[k0]
    d = np.diff(np.log(e + 1e-5), prepend=np.log(e[0] + 1e-5)); cand = (t > s_hello + 0.45) & (t < min(hi, s_hello + 2.5))
    s_world = t[cand][np.argmax(d[cand])] if cand.any() else s_hello + 0.6
    e_world = min(hi, s_world + 1.4)
    old = (NEW[i]['chars'][0]['s'], NEW[i]['chars'][1]['s'])
    NEW[i]['chars'][0].update(s=round(s_hello - 0.03, 3), e=round(s_world - 0.05, 3)); NEW[i]['chars'][1].update(s=round(s_world - 0.03, 3), e=round(e_world, 3))
    NEW[i]['t0'] = NEW[i]['chars'][0]['s']
    print(f'hello line {i:2d}: aligned {old[0]:.2f}/{old[1]:.2f} -> onset {s_hello:.2f}/{s_world:.2f}')
json.dump(NEW, open(f'{MVD}/words7s.json', 'w'), ensure_ascii=False)
# ---- env + osc
m, _ = librosa.load(SONG, sr=sr, mono=True)
AUD = len(m) / sr; DURV = round(NEW[-1]['chars'][-1]['e'] + 9.5, 2)
dr, _ = librosa.load(f'{sep}/drums.wav', sr=sr, mono=True)
lowd = librosa.effects.preemphasis(dr, coef=-0.97)
on = librosa.onset.onset_detect(y=lowd, sr=sr, units='time', backtrack=False, delta=0.25)
tempo, beats = librosa.beat.beat_track(y=m, sr=sr, units='time')
nf = int(DURV * FPS) + 1
def envf(x):
    hh = sr // FPS; e = np.sqrt(np.convolve(x ** 2, np.ones(hh * 2) / (hh * 2), 'same')[::hh]); e = e / (np.percentile(e, 99) + 1e-9)
    out = np.zeros(nf); out[:min(nf, len(e))] = e[:nf]; return out.clip(0, 1.5)
ENV = {'fps': FPS, 'beats': [round(float(b), 3) for b in beats], 'kicks': [round(float(x), 3) for x in on], 'snares': [], 'hats': [],
       'loud': [round(float(x), 3) for x in envf(m)], 'vox': [round(float(x), 3) for x in envf(vm)], 'dur': DURV, 'tempo': float(np.atleast_1d(tempo)[0])}
json.dump(ENV, open(f'{MVD}/env7s.json', 'w'))
hh = sr // FPS; osc = np.zeros((nf, 128), np.int8); pk = np.percentile(np.abs(vm), 99.5) + 1e-9
for i in range(nf):
    seg = vm[i * hh:i * hh + 2 * hh]
    if len(seg) < 256: break
    osc[i] = np.clip(seg[::len(seg) // 128][:128] / pk * 110, -127, 127).astype(np.int8)
osc.tofile(f'{MVD}/osc7s.bin')
# ---- warp anchors (old -> new), strictly increasing in both
pts = [(0.0, 0.0)]
for a, b in zip(OLD, NEW):
    for (x, y) in ((a['chars'][0]['s'], b['chars'][0]['s']), (a['chars'][-1]['e'], b['chars'][-1]['e'])):
        if x > pts[-1][0] + 0.05 and y > pts[-1][1] + 0.05: pts.append((round(x, 3), round(y, 3)))
pts.append((250.65, DURV))
json.dump({'pts': pts, 'dur': DURV}, open(f'{MVD}/warp7s.json', 'w'))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', SONG, '-af', f'apad=whole_dur={DURV}', '-c:a', 'libmp3lame', '-b:a', '320k', f'{MVD}/song7s.mp3'], check=True)
print('audio', round(AUD, 2), 'video dur', DURV, 'tempo', ENV['tempo'], 'kicks', len(on), 'anchors', len(pts))
