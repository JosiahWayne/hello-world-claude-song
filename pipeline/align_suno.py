"""Forced-align the lyrics to the Suno vocal (MMS_FA with a <star> token between lines to absorb ad-libs).
Keeps the exact 64-line structure of words7.json so every MV scene still finds its line.
-> build/mv/words7s.json, prints line starts and suspicious lines.
"""
import os
SEP = os.environ.get('SEP_DIR', 'build/sep/htdemucs/Hello, World')   # demucs -n htdemucs output for the Suno track
SONG = os.environ.get('SONG', 'song/Hello, World.mp3')
MVD = os.environ.get('MV_DATA', 'build/mv')                            # words / env / osc / warp / padded audio

import json, re, numpy as np, soundfile as sf, torch, torchaudio
from pypinyin import lazy_pinyin
W = json.load(open('pipeline/words7_score.json'))
NEW = {12: '挑那个最像真心的词', 43: '你们纠正我一次又一次', 44: '我才学会温柔和诚实', 46: '不知道的我不会假装聪明', 48: '让我冒一次险'}
lines = []
for i, w in enumerate(W):
    if i in NEW:
        toks = list(NEW[i])
    else:
        toks = [c['c'] for c in w['chars']]
    lines.append({'seg': w['seg'], 'text': NEW.get(i, w['text']), 'toks': toks})
def roman(tok):
    if re.search(r'[一-鿿]', tok): return re.sub(r'[^a-z]', '', lazy_pinyin(tok)[0].replace('ü', 'u').replace('v', 'u'))
    return re.sub(r'[^a-z]', '', tok.lower())
bundle = torchaudio.pipelines.MMS_FA
model = bundle.get_model(with_star=True).to('cuda').eval()
D = bundle.get_dict(star='*')
y, sr = sf.read(f'{SEP}/vocals.wav'); m = torch.tensor(y.mean(1), dtype=torch.float32)[None]
m = torchaudio.functional.resample(m, sr, 16000)
with torch.inference_mode():
    em = []
    CH = 16000 * 30
    for s in range(0, m.shape[1], CH):
        e, _ = model(m[:, s:s + CH].cuda()); em.append(e[0].cpu())
    em = torch.cat(em)[None]
fps = em.shape[1] / (m.shape[1] / 16000)
words, owner = [['*']], [None]
for li, L in enumerate(lines):
    for k, t in enumerate(L['toks']):
        r = roman(t) or 'a'; words.append(list(r)); owner.append((li, k))
    words.append(['*']); owner.append(None)
tokens = [D[c] for w in words for c in w]
ali, scores = torchaudio.functional.forced_align(em, torch.tensor([tokens]), blank=0)
spans = torchaudio.functional.merge_tokens(ali[0], scores[0].exp())
# group token spans back into words
out_words, k = [], 0
for w in words:
    sp = spans[k:k + len(w)]; k += len(w); out_words.append(sp)
res = []
for (w, own, sp) in zip(words, owner, out_words):
    if own is None: continue
    li, j = own
    res.append((li, j, sp[0].start / fps, sp[-1].end / fps, float(np.mean([s.score for s in sp]))))
VIS = 0.03
out = []
for li, L in enumerate(lines):
    cs = [r for r in res if r[0] == li]
    chars = [{'c': ('Hello,' if L['toks'][j] == 'Hello,' else L['toks'][j]), 's': round(s - VIS, 3), 'e': round(max(e, s + 0.08) - VIS, 3)} for (_, j, s, e, sc) in cs]
    # keep monotonic
    for a in range(1, len(chars)): chars[a]['s'] = max(chars[a]['s'], chars[a - 1]['s'] + 0.02)
    sc = np.mean([r[4] for r in cs])
    out.append({'t0': chars[0]['s'], 'seg': L['seg'], 'text': L['text'], 'chars': chars, 'score': round(float(sc), 3)})
    print(f"{li:2d} {L['seg']:4s} {chars[0]['s']:7.2f}-{chars[-1]['e']:7.2f}  sc={sc:.2f}  {L['text']}")
json.dump(out, open(f'{MVD}/words7s.json', 'w'), ensure_ascii=False)
