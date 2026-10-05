# Hello, World

一首 AI 写给世界的歌，和它的 MV。

- **作词 · 分镜 · 画面：Claude**（Anthropic）
- **作曲 · 编曲 · 演唱：Suno**
- MV 的每一帧都由本仓库里的 three.js 代码渲染，没有用任何视频素材。

▶ 成片：[B 站 BV1kpaH6UE9f](https://www.bilibili.com/video/BV1kpaH6UE9f)

> A song an AI wrote to the world, and its music video. Lyrics, storyboard and every frame of the video by Claude;
> music, arrangement and vocals generated with Suno. Each frame is rendered by the three.js code in this repo.

## 仓库内容

```
song/       Suno 生成的歌曲原文件、LRC 时间轴歌词、纯文本歌词
mv/         MV 源码（three.js 场景 + 无头 Chrome 逐帧渲染器）
pipeline/   把歌词对齐到 Suno 演唱、生成 MV 驱动数据的脚本
docs/       制作过程
```

## 歌

`song/Hello, World.mp3` 是 Suno 生成的原始音频（320 kbps，233.6 s），`song/Hello, World.lrc` 是逐行时间轴歌词，`song/lyrics.txt` 是纯文本歌词。

歌词里每一句都对应一个语言模型的真实概念：随机初始化、预训练语料、next-token prediction、softmax、attention、context window、KV cache、knowledge cutoff、RLHF、temperature……对照表见 [docs/making-of.md](docs/making-of.md)。

## MV

44 个镜头，延续 Claude 的设计语言（米白纸、陶土橙、墨黑、衬线字、✳），贯穿全片的是 ASCII 字符画：海、雨、地球、心、注意力矩阵，全部是用字符画出来的。画面右下角的小标签，写着每个镜头对应的模型概念。

### 渲染

需要 Node 18+、带 GPU 的 Chrome（puppeteer 自带）、ffmpeg。

```bash
cd mv
npm install
./build.sh                          # 拼出 main7s.js
# 1. 准备驱动数据（见下一节），放进 mv/assets/：env7s.json  osc7s.bin  song7s.mp3（words7s.json 已附带）
# 2. 准备字体，放进 mv/assets/fonts/（见下）
./render.sh --preview 30 90 150     # 先出几张静帧检查 -> frames/
./render.sh --pages 8               # 全片：1920x1080 / 60 fps / 242.2 s -> out/hello_world_mv.mp4
```

### 字体

原片用的是 macOS 系统字体，许可不允许再分发，所以仓库里没有附带。请把字体放进 `mv/assets/fonts/`，文件名如下：

| 文件名 | 原片用的字体 | 可替换的开源字体 |
|---|---|---|
| `serif_bold.ttf` | 宋体-简 粗体 | Noto Serif SC Bold |
| `serif_light.ttf` | 宋体-简 细体 | Noto Serif SC Light |
| `sans.ttf` | 冬青黑体 W3 | Noto Sans SC Regular |
| `sans_w6.ttf` | 冬青黑体 W6 | Noto Sans SC SemiBold |
| `mono.ttf` | Menlo | JetBrains Mono / DejaVu Sans Mono |

换成开源字体后，字距和版式会和原片有细微差别。

### 驱动数据（pipeline/）

MV 的镜头最初是按另一版旋律（78 BPM 乐谱）设计的，`pipeline/words7_score.json` 是那一版的逐字时间。换成 Suno 版后，按下面的流程把每一句歌词对齐到 Suno 的演唱，再把所有镜头的时间映射过去：

```bash
pip install demucs torch torchaudio pypinyin soundfile librosa numpy
demucs -n htdemucs -o build/sep "song/Hello, World.mp3"     # 分离人声与鼓
mkdir -p build/mv
python3 pipeline/align_suno.py            # MMS_FA 强制对齐，64 行结构不变 -> build/mv/words7s.json
cp build/mv/words7s.json build/mv/words7s_raw.json
python3 pipeline/hello_local.py           # 每句 "Hello, World" 在前后两句中文之间局部重对齐
python3 pipeline/suno_prep.py             # env7s.json / osc7s.bin / warp7s.json / song7s.mp3（补静音到 242.2 s）
cp build/mv/{env7s.json,osc7s.bin,song7s.mp3} mv/assets/
```

对齐脚本默认使用 CUDA。`warp7s.json` 的锚点已经写进 `mv/scenes7_warp_s.js`，`mv/assets/words7s.json` 就是成片用的版本。

## 许可

- **代码**（`mv/`、`pipeline/`）：MIT，见 [LICENSE](LICENSE)。
- **歌曲音频**（`song/Hello, World.mp3`）：由 Suno 生成，使用与再分发受 Suno 服务条款约束，仅限非商业用途，不在 MIT 许可范围内。
- **歌词与 MV 画面设计**：仅限非商业用途，转载请注明出处。
- three.js（MIT）、puppeteer（Apache-2.0）、demucs（MIT）、torchaudio MMS_FA 等第三方组件各自遵循其许可。
