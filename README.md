# AI 算法可视化教程

面向零基础学习者的一套交互式 AI 入门教程：从「什么是 AI」到「一个最小的可训练模型」，再到「主流架构的核心运算」，最后把出现过的每个参数逐一讲清；另有两条支线专题——训练前的直方图与范围筛选、无监督的聚类算法。

**核心特点**：把模型真正在算的东西画出来，而不是堆公式。所有页面**零第三方依赖、可离线打开**，数值计算在浏览器本地完成；另附纯 Python 标准库实现作为可核对的数值基准。

---

## 快速开始

无需安装、无需构建、无需联网。

```bash
# 方式一：直接用浏览器打开入口
#   双击 index.html 即可

# 方式二：可选的本地静态服务器
python -m http.server 8000
#   然后访问 http://localhost:8000/
```

Python 数值基准（Python 3.x，仅标准库）：

```bash
python perceptron.py     # 打印感知机 4 轮收敛过程
python attention.py      # 先执行断言自检，再打印注意力矩阵示例
python cluster.py        # K-Means：收敛 / inertia 单调 / 肘部法
python histogram.py      # 直方图 / 范围筛选 / Otsu 阈值自检
```

> `ai_helper.js` 通过相对路径被各页面引用，请与 HTML 文件保持在同一目录。

---

## 学习路径

主线四页按难度递进；另有两条**支线专题**挂在知识地图 L2 之后，可任选顺序（建议先 A 后 B：先看数据，再让算法找组）。

| 步骤 | 页面 | 你会看到什么 | 难度 |
| --- | --- | --- | --- |
| 1 | [`ai_basics.html`](ai_basics.html) | AI 定义、机器学习怎么学、从神经元到深度网络、注意力与大模型；含 **15 个节点的发展历程时间线**与知识关联图 | 入门 |
| 2 | [`perceptron_visual.html`](perceptron_visual.html) | 决策边界随训练逐步移动、每轮误差柱状图；切到 XOR 可观察「永远学不会」 | 基础 |
| 3 | [`attention_visual.html`](attention_visual.html) | 3 组中文句子 × 2 个注意力头；注意力 / `QKᵀ` / logits 三视图；温度、因果掩码、多头对比 | 进阶 |
| 4 | [`params_guide.html`](params_guide.html) | 25 个参数逐一讲解（含义 / 作用 / 常见取值 / 通俗举例 / 调大调小）、速查表、3 个可动手数值实验 | 查阅 |
| A | [`histogram_visual.html`](histogram_visual.html) | 直方图分箱、双端范围筛选、筛选前后统计对比、Otsu 自动阈值与类间方差曲线 | 入门 |
| B | [`cluster_visual.html`](cluster_visual.html) | K-Means 单步看「分配 → 更新」、K 值与初始化、inertia 曲线、肘部法、圆环/双月牙失效反例 | 基础 |

第 2、3 步与两条支线的四个可视化页面都带「零基础导读」折叠卡片与常见疑问，公式和专业说明放在后层，可以先跳过数学只看现象；第 1 步的知识地图本身就是零基础起点，其 L2 新增「⓪ 先看数据」与「无监督 → 聚类」两处衔接，末节含「常见误区与下一步」。七个页面右下角的 **AI** 按钮是本地答疑浮窗。

---

## 文件结构

```
.
├── index.html                 # 入口：四页主线 + 两条支线专题
├── ai_basics.html             # 第 1 步：AI 入门知识地图（8 节 + 发展历程时间线）
├── perceptron_visual.html     # 第 2 步：感知机训练过程可视化
├── attention_visual.html      # 第 3 步：自注意力可视化
├── params_guide.html          # 第 4 步：参数图鉴与数值实验
├── histogram_visual.html      # 支线 A：直方图、范围筛选与 Otsu 自动阈值
├── cluster_visual.html        # 支线 B：K-Means 聚类、肘部法与非凸反例
├── ai_helper.js               # 七页共用的本地答疑浮窗（知识库 + 关键词匹配 + UI）
├── perceptron.py              # 感知机 Python 实现，零第三方依赖
├── attention.py               # 自注意力 Python 数值基准，含 verify() 断言
├── histogram.py               # 直方图 / 筛选 / Otsu 数值基准，含 verify() 断言
├── cluster.py                 # K-Means Python 数值基准，含 verify() 断言
├── .nojekyll                  # 让 GitHub Pages 跳过 Jekyll，直接托管静态文件
├── README.md
├── LICENSE                    # MIT
└── .gitignore                 # 排除本地私有数据与临时文件
```

**技术构成**：原生 HTML / CSS / JavaScript，Canvas 绘图；四份 Python 实现只使用标准库。浏览器与 Python 两端使用同一份确定性生成的数据（三角函数加固定扰动，不用随机数）与同一套公式，便于逐项交叉校验：注意力最大差约 `7e-18`、K-Means 21 组组合最大差约 `3.4e-13`、直方图/Otsu 最大差约 `9.3e-10`（Otsu 类间方差量级较大，属浮点舍入）。

---

## 准确性边界（请务必了解）

这是一套**教学演示**，不是生产模型，也不是真实大模型的复现：

1. **演示数据是手工设定的**。8 维词嵌入、打分矩阵 `M`、位置先验均为人工设计，用于呈现可解释的「训练后」注意力模式，并非训练所得。勾选「随机权重」可看到未训练时注意力接近均匀。
2. **温度默认值 0.6 是演示值**。低维稀疏嵌入下 `√d_k` 缩放会把 logits 压得过平，取 0.6 用于放大差异；**标准 Transformer 缩放对应 `temperature = 1.0`**，页面滑块可随时调回。
3. **只实现了单层自注意力**，未包含 `W_O` 输出投影、残差连接、LayerNorm、FFN 与位置编码，不是完整的 Transformer Block。
4. **感知机只能解线性可分问题**，对 XOR 不收敛——页面用这个反例说明为何需要隐藏层与非线性。
5. **答疑浮窗是本地规则引擎**，不是大语言模型。答案来自仓库自带的 38 条知识条目，超出范围会提示暂未覆盖；它**不发起任何网络请求**，界面已明确标注「本地版 · 未连接云端大模型」。
6. 页面中的「真实模型常见取值」是工业界与教材的经验范围，会随任务和优化器变化，不是硬性规定。
7. **两个支线专题的数据同样是确定性公式生成的演示数据**，不是真实采集的数据集。K-Means 只实现批量交替迭代版，「最远点」初始化是 k-means++ 的确定性简化（非其随机化版本）；它假设簇近似凸形且大小相近，圆环/月牙页正是用来展示失效。Otsu 在一维直方图上求阈值，假设分布大致双峰；两峰间存在空箱时会出现并列最优，本实现取平台中点。直方图柱子的高亮按箱中心判断，统计数字按每个样本真实值精确计算，边界附近可能略有出入。

---

## 自检

```bash
python attention.py    # 内置 verify()：softmax 行和、因果掩码、语义与权重断言
python perceptron.py   # OR 门 4 轮收敛，误差序列 2 → 2 → 1 → 0
python cluster.py      # 收敛 / inertia 单调 / 质心=簇均值 / 肘部法单调
python histogram.py    # 频数守恒 / 筛选端点 / 统计量 / Otsu 最大性
```

感知机与可视化页的训练逻辑是等价实现：OR 数据集下两者均得到 `w = [0.1, 0.1]`、`b = -0.1`，决策边界 `x1 + x2 = 1`。两条支线同样有等价实现：三团数据 K=3 时 2 轮收敛、最终 inertia ≈ 43.69；图像灰度双峰数据 32 箱的 Otsu 阈值 ≈ 111.56。

---

## 部署到 GitHub Pages

本仓库已按 GitHub Pages 就绪配置：`index.html` 位于根目录，页面之间全部使用**相对路径**引用，因此部署到项目页的子路径 `https://<用户名>.github.io/<仓库名>/` 时**无需改动任何代码**。根目录的 `.nojekyll` 用于让 Pages 跳过 Jekyll 构建、直接托管静态文件。

纯静态站点没有构建步骤，**不需要配置 GitHub Actions**。

**首次发布**

1. 在 GitHub 新建一个**公开（Public）**仓库（私有仓库使用 Pages 需付费计划）。创建时**不要**勾选 “Add a README file”、LICENSE 或 .gitignore，以免与本地已有文件冲突。
2. 关联远端并推送（把 `<用户名>` / `<仓库名>` 换成实际值）：

   ```bash
   git remote add origin https://github.com/<用户名>/<仓库名>.git
   git push -u origin main
   ```

3. 打开仓库的 **Settings → Pages**，在 *Build and deployment* 下把 **Source** 设为 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，点击 Save。
4. 等待约 1–2 分钟，访问 `https://<用户名>.github.io/<仓库名>/`。此后每次 `git push` 到 `main` 都会自动更新。

**注意事项**

- HTTPS 推送需要 GitHub 个人访问令牌（PAT）或已登录的凭证助手；也可改用 SSH 地址 `git@github.com:<用户名>/<仓库名>.git`。
- 若把仓库命名为 `<用户名>.github.io`，网址将是根域名 `https://<用户名>.github.io/`，其余步骤相同。
- 自定义域名可在同一 Pages 设置页添加，并需按提示配置 DNS 记录。

---

## 许可证

[MIT](LICENSE)。`LICENSE` 中的版权持有人写的是中性的 “contributors”；若要改为个人或组织名称，编辑该文件第 3 行即可。

欢迎提 Issue 或 PR 补充知识点、修正表述或增加新的可视化对照。
