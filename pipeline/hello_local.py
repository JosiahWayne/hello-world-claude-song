"""Local re-alignment of every 'Hello, World' line inside the gap between its (reliable) neighbouring Chinese lines."""
import os
SEP = os.environ.get('SEP_DIR', 'build/sep/htdemucs/Hello, World')   # demucs -n htdemucs output for the Suno track
SONG = os.environ.get('SONG', 'song/Hello, World.mp3')
MVD = os.environ.get('MV_DATA', 'build/mv')                            # words / env / osc / warp / padded audio

import json, numpy as np, soundfile as sf, torch, torchaudio
NEW = json.load(open(f'{MVD}/words7s.json')); RAW = json.load(open(f'{MVD}/words7s_raw.json'))
bundle = torchaudio.pipelines.MMS_FA; model = bundle.get_model(with_star=True).to('cuda').eval(); D = bundle.get_dict(star='*')
y, sr = sf.read(f'{SEP}/vocals.wav'); m = torchaudio.functional.resample(torch.tensor(y.mean(1), dtype=torch.float32)[None], sr, 16000)
words = [['*'], list('hello'), ['*'], list('world'), ['*']]; toks = [D[c] for w in words for c in w]
for i, w in enumerate(NEW):
    if not w['text'].startswith('Hello'): continue
    lo = RAW[i - 1]['chars'][-1]['e'] + 0.05 if i > 0 else 0.0
    hi = RAW[i + 1]['t0'] - 0.02 if i + 1 < len(RAW) else lo + 6
    seg = m[:, int(lo * 16000):int(hi * 16000)]
    with torch.inference_mode(): em, _ = model(seg.cuda())
    fps = em.shape[1] / (seg.shape[1] / 16000)
    ali, sc = torchaudio.functional.forced_align(em.cpu(), torch.tensor([toks]), blank=0)
    sp = torchaudio.functional.merge_tokens(ali[0], sc[0].exp())
    hs, he = sp[1].start / fps + lo, sp[5].end / fps + lo; ws, we = sp[7].start / fps + lo, sp[11].end / fps + lo
    hsc = float(np.mean([s.score for s in sp[1:6]])); wsc = float(np.mean([s.score for s in sp[7:12]]))
    w['chars'][0].update(s=round(hs - 0.03, 3), e=round(he - 0.03, 3)); w['chars'][1].update(s=round(ws - 0.03, 3), e=round(max(we, ws + 0.3) - 0.03, 3)); w['t0'] = w['chars'][0]['s']
    print(f'line {i:2d} gap {lo:7.2f}-{hi:7.2f}  hello {hs:7.2f} ({hsc:.2f})  world {ws:7.2f} ({wsc:.2f})')
json.dump(NEW, open(f'{MVD}/words7s.json', 'w'), ensure_ascii=False)
