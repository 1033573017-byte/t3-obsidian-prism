# T3 Code × Obsidian Prism · 黑曜棱镜（非官方 T3 Code 移植版）

> **原作者署名与非官方移植声明（GPL-3.0-only + NOTICE）**
>
> 本项目是基于开源项目 **[Obsidian Prism（黑曜棱镜）](https://github.com/RMvdesi/obsidian-prism)**（原作者：**[RMvdesi](https://github.com/RMvdesi)**，`GPL-3.0-only`）制作的 **T3 Code 非官方社区移植版**（移植与适配日期：`2026-11-25`）。
>
> - 原项目与核心视觉/物理引擎原作者：**RMvdesi**（[`RMvdesi/obsidian-prism`](https://github.com/RMvdesi/obsidian-prism)）
> - 推理等级星空滑块上游原作者：**月上寒 / LLYSH-HANNARI**（[`LLYSH-HANNARI/antigravity-Codex-Claude-effort-slider`](https://github.com/LLYSH-HANNARI/antigravity-Codex-Claude-effort-slider)，MIT）
> - 其余上游致谢与完整许可文本详见仓库内 [`LICENSE`](./LICENSE)、[`NOTICE`](./NOTICE) 与 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)。
> - 本项目与 RMvdesi、T3 Tools 及 Google LLC 均无官方隶属关系。

---

## 两种使用方式

### 方式一：纯原生皮肤（零脚本，导入即用）

直接将本仓库内的 [`themes/obsidian-prism.json`](./themes/obsidian-prism.json) 导入 T3 Code：
1. 打开 T3 Code → **设置 (Settings) → 外观 (Appearance) → 导入主题 (Import theme)**；
2. 拖入或粘贴 `themes/obsidian-prism.json` 即可（支持**深空黑曜 Dark** 与**白昼冷晶 Light** 双模式、烟熏切面与纯 CSS 像素双宠）。

### 方式二：完整动态光学套件（推荐 · 复刻 WebGL2 波纹、物理双宠与星空滑块）

完整版通过 Electron 原生本地 CDP 调试端口（`127.0.0.1`，**不修改 `app.asar`**）直接运行原版核心引擎：

- **WebGL2 字符波纹矩阵 + 蓝紫地平线极光**（`ripple-core.js` + `home-ripple-host.js`）
- **像素伙伴完整物理引擎**（`dual-mascot-rig.js`：Clawd 小橘蟹、Gemini 小紫猫、三只迷你蟹、龙/鲸鱼彩蛋，支持鼠标拖拽叠叠乐与对话状态联动）
- **模型菜单内置推理等级星空滑块 & Orchestrator 切工水晶条**（`effort-slider-upstream.js` + `crystal-prism-core.js`）
- **输入框近场指针彩虹棱镜边框光**（`prism-rim-canvas.js`）
- **FastDOM 丝滑发光光标**（`smooth-caret.js`）
- **五级水墨流式吐字淡入**（`CSS.highlights` 零 DOM 篡改）
- **内置外观面板（`Alt+P` 或点击左下角 `◆`）**：一键切换四套配色（深空黑曜 / 暖炭玄岩 / 白昼冷晶 / 暖白画册）、五档强调色光谱、宠物阵容、环境光浓度及各引擎开关。

#### 快速安装（Windows · 需 Node.js >= 22，零 npm 依赖）

```bash
git clone https://github.com/1033573017-byte/t3-obsidian-prism.git
cd t3-obsidian-prism

# 1. 自动为 T3 Code 快捷方式补齐 --remote-debugging-port=0、注册用户级静默开机自启并启动后台守护
node inject-t3.mjs --install
```

安装完成后，**完全退出并通过桌面/开始菜单快捷方式重开一次 T3 Code**，3 秒内自动生效。

#### 常用维护命令

```bash
node inject-t3.mjs --status          # 查看守护进程、CDP 连接与各引擎实时挂载状态
node inject-t3.mjs --inject --force  # 立即热重载注入当前窗口（无需重启 T3 Code）
node inject-t3.mjs --uninstall       # 一键停止守护、清理开机自启并还原快捷方式参数
```

---

## 开源协议

本项目整套衍生作品遵循 **[GNU General Public License v3.0 (`GPL-3.0-only`)](./LICENSE)** 与 [`NOTICE`](./NOTICE) 附加署名条款发布。
