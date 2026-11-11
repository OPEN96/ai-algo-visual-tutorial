/*
 * AI 答疑（本地版）— 共享脚本
 * 说明：因云端大模型服务未开启，本功能以「本地实现」交付（工具返回 useLocalImplementation=true）。
 * 答案全部来自本教程自带内容（感知机 / 自注意力 / 参数图鉴 / 聚类 / 直方图 / FAQ），
 * 不连接任何云端模型、不发起任何网络请求。界面已明确标注「本地版」。
 */
(function () {
  "use strict";

  // ---- 本地知识库：每条 = 关键词 + 答案 + 出处页 ----
  var KB = [
    {
      k: ["感知机", "perceptron", "神经元", "最小", "入门"],
      a: "感知机（Perceptron，1957）是公认最小、可训练的 AI 单元：它从全零权重出发，用「预测错了就改一点点」反复修正参数，学到一条决策边界。它和硬编码 if 判断的最大区别是——规则由数据学出，而不是人写死。先看 perceptron_visual.html 用「自动播放」观察红线如何移动。",
      page: "感知机可视化"
    },
    {
      k: ["怎么学", "学习", "学不会", "改", "误差", "修正", "收敛"],
      a: "训练就是「猜错→改→再猜」的循环：每轮遍历样本，若预测 y_hat 与标准答案 y 不符，就按 d = y − y_hat 调整权重 w 和偏置 b（w += 学习率·d·x，b += 学习率·d）。一轮下来一次都不用改，就是「收敛 / 学会了」。",
      page: "感知机可视化"
    },
    {
      k: ["学习率", "步子", "eta", "η", "lr"],
      a: "学习率 η 决定每次改多大的步子。注意一个反直觉事实：在本教程的感知机里，η 从 0.01 调到 2.0，收敛轮数和误差序列都不变（一律 4 轮、[2,2,1,0]），只是 w、b 按 η 等比缩放，红线始终是 x1 + x2 = 1——因为感知机只看加权和的正负号。「步子大小」的类比要在梯度下降（如 f(w)=(w−2)²）里才成立：η<0.5 单调收敛，0.5<η<1 震荡收敛，η=1 来回跳，η>1 发散。详见 params_guide.html 的「两个实验」。",
      page: "参数图鉴"
    },
    {
      k: ["权重", "偏置", "w", "b"],
      a: "权重 w 表示「每个输入有多重要」，偏置 b 是整体门槛（及格线）。它们是模型唯一学到的东西，初始为 0，训练后发生变化（例如 OR 门学到 w=[0.1,0.1]、b=−0.1，边界恰为 x1 + x2 = 1）。",
      page: "参数图鉴"
    },
    {
      k: ["or", "与门", "或门", "and", "逻辑门"],
      a: "OR（或）：0,0 输出 0，其余输出 1；AND（与）：只有 1,1 输出 1。两者都能用一条直线分开，所以感知机学得会（OR 4 轮、AND 4 轮收敛）。",
      page: "感知机可视化"
    },
    {
      k: ["xor", "异或", "为什么学不会", "学不会", "线性可分"],
      a: "XOR（异或）的 0 和 1 交叉分布像棋盘格，一条直线怎么摆都会切错。单层感知机只会画直线，所以永远学不会——这就是 1969 年 Minsky 指出的经典结论，也是后来人们加「隐藏层」的原因。在 perceptron_visual.html 切到 XOR 点「跑完」，会看到误差柱子始终不归零。",
      page: "感知机可视化"
    },
    {
      k: ["自注意力", "attention", "transformer", "主流", "大模型"],
      a: "自注意力是 Transformer（GPT 等大模型的底座）的核心运算：让句子里每个词环顾一圈，决定「该听谁、听多少」，再把别人的信息按比例重新组合。它和感知机一样，关键都在于「参数由数据改出，而非人写死规则」。详见 attention_visual.html。",
      page: "自注意力可视化"
    },
    {
      k: ["q", "k", "v", "查询", "键", "值", "query", "key", "value"],
      a: "Q（查询）是「我想找什么信息」；K（键）是「我能提供什么」——挂在每个词上的标签；V（值）是「我实际要说的内容」，最后被按比例抄进笔记。做法是拿 Q 去和每个词的 K 做点积（匹配度），再 softmax 成 100% 的注意力分布，最后用这个分布对 V 做加权求和得到新的表示。",
      page: "自注意力可视化"
    },
    {
      k: ["softmax", "百分比", "归一化", "归一", "100%", "分布"],
      a: "softmax 把一串分数改写成「加起来正好 100%」的百分比（注意力预算怎么分）。每行都凑够 100%，不代表某个词「有多重要」的绝对分数——它权重低也可能是被别的词挤掉了。温度越低分布越尖锐（偏心），越高越平均。",
      page: "自注意力可视化"
    },
    {
      k: ["温度", "tau", "τ", "偏不偏", "尖锐", "平均"],
      a: "温度 τ 控制注意力分布是「偏心」还是「平均」：τ 调小→只突出一两个词（分布尖锐）；τ 调大→大家差不多（分布平均）。本教程演示默认 0.6 是为了在低维下放大差异，标准缩放对应 τ=1.0（分数 [2,1,0.5,0.1] 在 τ=1.0 时最高占比约 57.5%，τ=0.3 时约 95.8%，τ=2.0 时约 40.6%）。",
      page: "参数图鉴"
    },
    {
      k: ["因果", "掩码", "mask", "gpt", "不能看后面", "解码"],
      a: "因果掩码让每个词「只能看自己及之前的位置」，不能偷看后面的词——这正是 GPT 这类解码器生成时的约束（写作文不能抄自己还没写的下一句）。在 attention_visual.html 打开「因果掩码」，热力图右上半会变成灰色（被屏蔽）。",
      page: "自注意力可视化"
    },
    {
      k: ["多头", "head", "分工", "头"],
      a: "多头 = 同时开几场「会」，每场关注不同关系。本教程 Head 1 看语义关系（如「它」看「猫/老鼠」），Head 2 主要关心附近的词（|i−j|≤1 的局部权重约占 60%）。两个头分工不同，拼起来模型才更全能。",
      page: "自注意力可视化"
    },
    {
      k: ["颜色", "深", "浅", "关系", "相关", "代表"],
      a: "不能把颜色深理解为「两个词有关」或「置信度高」。它只表示在这一层、这个注意力头里，这个词分到的权重高。权重是「注意力预算怎么分」，不是因果解释，也不是绝对重要性。",
      page: "自注意力可视化"
    },
    {
      k: ["维度", "dim", "嵌入", "词向量", "768", "8维"],
      a: "词向量维度 DIM 表示「用几个数字描述一个词」。真实大模型常用 768~12288 维；本教程为可解释性只用了 8 维手工设定的稀疏嵌入，因此不是真实训练所得，勾选「随机权重」可看到未训练时注意力接近均匀。",
      page: "参数图鉴"
    },
    {
      k: ["超参数", "学习所得", "分类", "三类", "有哪些参数"],
      a: "参数分三类：① 模型自己学出来的（w、b、打分矩阵 M）；② 你开工前定好的超参数（学习率 η、最大轮数、维度 DIM、温度 τ、头数 h）；③ 只能看不能拧的只读结果（误差曲线、注意力 A、输出 O）。params_guide.html 把出现过的 25 个参数逐一拆解。",
      page: "参数图鉴"
    },
    {
      k: ["随机权重", "训练", "未训练", "均匀", "学出来的"],
      a: "勾选「随机权重」后，注意力会接近均匀（最大权重约 0.16），而「训练后」会明显偏向语义相关词（最大约 0.375）。这说明你看到的语义关联来自训练，不是架构天生就有——这正是「参数由数据学出」的直观证据。",
      page: "自注意力可视化"
    },
    {
      k: ["怎么用", "怎么看", "教程", "顺序", "先看", "路径", "路线图"],
      a: "建议顺序：第1步 感知机可视化（自动播放看红线移动、柱子降到 0，再切 XOR 看学不会）；第2步 自注意力可视化（只看颜色深浅与弧线粗细，切 Head1/Head2、开因果掩码、勾随机权重）；第3步 参数图鉴（按名词查、玩两个实验）。公式看不懂没关系，先动手看现象。",
      page: "首页"
    },
    {
      k: ["这是什么", "关于", "教程", "介绍"],
      a: "这是一套「零基础看懂 AI 是如何学习的」可视化教程：从最小的 AI（感知机）讲到主流架构的核心（Transformer 自注意力），再把所有参数逐一讲透。全部零依赖、可离线打开。",
      page: "首页"
    },
    {
      k: ["背", "背诵", "查表", "记住", "课外题"],
      a: "模型不是把题背下来。感知机用训练集之外的点（如 [0.5,0.8]）也能判对，靠的是学到的边界而非查表——这正是「学习」与「背诵」的区别。",
      page: "感知机可视化"
    },
    {
      k: ["什么是人工智能", "什么是ai", "人工智能是什么", "ai是什么", "弱ai", "强ai", "agi", "通用人工智能"],
      a: "人工智能（AI）是让机器完成「本需人的智能才能做」的任务的总称——目标是「让机器表现出智能」，不是某个具体技术。三者是包含关系：AI ⊃ 机器学习 ⊃ 深度学习。只擅长一件事的是弱 AI（今天的商用系统都是）；像人一样能迁移到任意任务的是强 AI（AGI），目前尚未实现。详见「AI 入门」页 L1。",
      page: "AI 入门 · 知识地图"
    },
    {
      k: ["发展历程", "ai历史", "人工智能历史", "时间线", "几次浪潮", "两次寒冬", "图灵测试", "达特茅斯", "alexnet", "chatgpt"],
      a: "AI 经历了三次浪潮、两次寒冬：1950 图灵测试 → 1956 达特茅斯会议正式提出「人工智能」→ 1957 感知机 → 1969 指出感知机解不了 XOR（第一次寒冬）→ 1980s 专家系统（第二次浪潮）→ 1986 反向传播 → 1987–1993 第二次寒冬 → 1990s–2000s 统计机器学习（深蓝 1997）→ 2012 AlexNet 开启深度学习 → 2016 AlphaGo → 2017 Transformer → 2018–2020 GPT/BERT 大模型 → 2022 ChatGPT → 2023 至今多模态与智能体。两次寒冬都源于「期望过高 + 落地不足」，近十年爆发靠数据·算力·算法三要素。详见「AI 入门」页 L5。",
      page: "AI 入门 · 发展历程"
    },
    {
      k: ["机器学习", "监督学习", "无监督学习", "强化学习", "三种学习", "有标签"],
      a: "机器学习按「有没有标准答案」分三类：① 监督学习——数据带标签（如分类、预测），感知机就属于这类；② 无监督学习——只有数据、没有标签（如聚类分群）；③ 强化学习——没有标签但有奖励信号（如下棋、机器人控制）。本教程的感知机是监督学习。详见「AI 入门」页 L2。",
      page: "AI 入门 · 知识地图"
    },
    {
      k: ["损失函数", "损失", "梯度下降", "下山", "优化器"],
      a: "损失（Loss）是衡量「预测离标准答案差多远」的数字，训练就是想把它压到最小。梯度下降是最常用的办法：沿着让损失下降最快的方向小步移动。学习率决定步子大小——太小则学得慢，太大会震荡甚至发散。像蒙眼下山：用脚感受哪边更陡（梯度），往低处迈一步（学习率定步长）。参数图鉴里有可动手的实验。",
      page: "参数图鉴 / AI 入门"
    },
    {
      k: ["过拟合", "泛化", "测试集", "训练集", "背题"],
      a: "学习的目标不是把训练题做满分，而是在新题上也做对，这叫泛化。如果模型把训练集背得滚瓜烂熟、换新数据就崩，叫过拟合——像学生死记答案却不懂原理。所以要把数据分成训练集（用来学）和测试集（用来考，学的时候不给看）。训练集满分而测试集崩，就是过拟合的典型信号。",
      page: "AI 入门 · 知识地图"
    },
    {
      k: ["深度学习", "神经网络", "隐藏层", "激活函数", "非线性", "反向传播", "多层感知机"],
      a: "深度学习是用「多层神经网络」来学习的机器学习分支。单个感知机只能画一条直线（解不了 XOR）；加上隐藏层并用非线性激活函数（ReLU、Sigmoid 等），多层叠加才能画出弯曲边界。「深度」指的就是多层堆叠；1986 年反向传播让「如何调整每一层参数」有了可行方法。详见「AI 入门」页 L3。",
      page: "AI 入门 · 从一个神经元到深度网络"
    },
    {
      k: ["预训练", "微调", "大模型发展", "大模型时代", "gpt", "bert"],
      a: "大模型的通用套路是「预训练 + 微调」：先在海量文本上自学语言规律（预训练），再针对具体任务调一调（微调）。2017 年 Transformer（《Attention Is All You Need》）用自注意力取代循环结构，能并行、能建模长程依赖、可深可大，成为 GPT、BERT 等几乎所有大模型的底座。详见「AI 入门」页 L4。",
      page: "AI 入门 · 注意力与大模型"
    },
    {
      k: ["聚类", "clustering", "分群", "无标签分组"],
      a: "聚类是无监督学习的代表任务：数据没有标准答案，只按「谁跟谁像」分成几堆（簇）。它和分类不一样——分类有标签可以对答案，聚类没有，堆的名字要人事后结合业务贴上去。最经典的 K-Means 由 MacQueen 于 1967 年命名。打开 cluster_visual.html，单步就能看到质心怎么挪。",
      page: "聚类可视化"
    },
    {
      k: ["k-means", "kmeans", "质心", "centroid", "分配更新", "交替"],
      a: "K-Means 只重复两步：① 分配——每个点归到欧氏距离最近的质心；② 更新——把质心移到本簇所有点的平均值。反复交替，直到质心几乎不动（收敛）。它和感知机一样靠反复改参数，但感知机有标准答案可以对，K-Means 没有。",
      page: "聚类可视化"
    },
    {
      k: ["肘部法", "簇数", "k值", "k 值", "选k", "怎么选k", "怎么定k", "k怎么", "定几堆", "elbow"],
      a: "K 是你事先指定要分几堆，属于超参数，聚类本身不会告诉你答案。常用肘部法：把 K=1,2,3… 各自的 inertia 画出来，找下降明显变缓的拐点。本页三团数据在 K=3 处有清晰拐点（639 → 326 → 44 → 38）。也可结合轮廓系数与业务上「分几堆才好用」来判断。",
      page: "聚类可视化"
    },
    {
      k: ["inertia", "簇内距离", "距离平方和", "越来越小"],
      a: "inertia 是「每个点到自己质心的距离平方之和」，衡量簇有多散。K-Means 每轮只会让它下降或不变，不会上升；而 K 越大它必然越小，所以不能单纯追求最小值，要看肘部拐点。",
      page: "聚类可视化"
    },
    {
      k: ["k-means++", "局部最优", "初始化", "起点", "随机种子"],
      a: "K-Means 的初始化会直接影响结局：算法只保证「不再改进就停」，不保证全局最好，起点不好会卡进局部最优。k-means++（2007）让初始中心尽量彼此远离；本页的「最远点」是它的确定性简化版，还可切换「顺序取前 K 个」「固定种子随机」作对照。真实项目常跑多次取 inertia 最小的结果。",
      page: "聚类可视化"
    },
    {
      k: ["圆环", "月牙", "非凸", "dbscan", "密度聚类", "切错"],
      a: "K-Means 隐含假设簇是圆滚滚、大小相近的，用「离哪个中心近」划分地盘，所以遇到环形、月牙这类弯曲（非凸）形状会明显切错。这类数据需要按密度找簇的 DBSCAN（1996）或谱聚类。这和感知机解不了 XOR 是同一类教训：每个算法都带着自己的假设。",
      page: "聚类可视化"
    },
    {
      k: ["直方图", "直方图怎么看", "直方图是什么", "histogram", "分箱", "频数", "bin数", "bin 数", "柱子"],
      a: "直方图就是把数值范围等分成若干个箱子（bin），数每箱落进几个样本，画成柱子。它用在训练前：看清范围、有没有双峰、有没有离群值。箱数太少会把两座峰糊成一坨，太多又全是锯齿；换箱数不改变数据，只改变你看到的样子。打开 histogram_visual.html 可以拖着试。",
      page: "直方图与范围筛选"
    },
    {
      k: ["范围筛选", "筛选范围", "区间筛选", "下限", "上限", "保留区间", "离群值"],
      a: "范围筛选就是只保留满足 low ≤ v ≤ high 的样本（含端点），常用于去掉明确的录入错误或离群值。注意反面：为让指标好看而删数据会造成分布偏移，模型上线遇到被删掉的情况就失灵；筛选依据应是数据质量或业务规则，并要检查被筛掉的那部分。",
      page: "直方图与范围筛选"
    },
    {
      k: ["otsu", "大津", "类间方差", "自动阈值", "最佳阈值", "阈值分割"],
      a: "Otsu（大津，1979）自动找阈值：遍历每个候选分割点，算 w0·w1·(μ0−μ1)²（类间方差），取最大的那一刀。它假设直方图大致双峰，所以本页「图像灰度」效果最好（阈值约 111.56，落在暗背景与亮目标之间）；多峰或峰重叠时会失手。两峰间若有空箱会出现一整段并列最优，本实现取平台中点。",
      page: "直方图与范围筛选"
    },
    {
      k: ["双峰", "箱数", "bin", "数据分布", "谷底"],
      a: "双峰就是直方图上有两坨样本，常见于「暗背景 + 亮目标」这类图像，Otsu 会把阈值放在两峰之间的谷底。箱数（bin 数）决定分箱粗细：经验上可先试约 √n（本页 100~280 个样本约 10~17 箱），再按解释需要微调。",
      page: "直方图与范围筛选"
    },
    {
      k: ["数据清洗", "分布偏移", "标准化", "数据准备", "支线a", "支线b", "两者关系"],
      a: "数据清洗是训练前处理缺失、异常、重复数据的统称，两条支线都属于这一环：直方图（支线 A）先看清一维数据、定筛选规则（筛得不当会造成分布偏移）；聚类（支线 B）让算法在二维空间自动找组，而聚类前恰恰需要先做数据准备——欧氏距离对量纲敏感，通常要先标准化，还要处理会把质心拉偏的离群值。Otsu 本质上也是把样本按数值分成两类，和 K-Means 是同一种「找组」思路，只是发生在一维。",
      page: "知识地图 L2 / 两个专题页"
    },
    {
      k: ["你好", "hi", "hello", "在吗", "帮助", "怎么提问"],
      a: "你好！我是本教程的本地答疑助手（未连接云端大模型）。你可以问我：什么是 AI、AI 发展历程、机器学习怎么分类、损失与梯度下降、感知机怎么学、为什么 XOR 学不会、Q/K/V 是什么、softmax/温度/因果掩码、参数怎么分类，也可以问聚类与 K-Means、质心与肘部法、直方图与箱数、范围筛选、Otsu 阈值等。下面有推荐问题，点一下就能看答案。",
      page: "首页"
    }
  ];

  // ---- 纯函数：本地匹配，无 DOM、无网络 ----
  function localAnswer(rawQuery) {
    var q = (rawQuery || "").toLowerCase().trim();
    // 中文提问常夹空格（如「什么是 AI」「AI 是什么」），额外生成去空格版本参与匹配，
    // 否则「什么是ai」这类关键词会因空格而漏命中。
    var qCompact = q.replace(/\s+/g, "");
    if (!q) return { answer: "请输入你的问题，例如「感知机怎么学」「为什么 XOR 学不会」「学习率是什么」。", page: "", score: -1 };
    if (/^(你好|您好|hi|hello|在吗|help|帮助)/.test(q)) {
      var hi = KB[KB.length - 1];
      return { answer: hi.a, page: hi.page, score: 99 };
    }
    var best = null, bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var e = KB[i], score = 0;
      for (var j = 0; j < e.k.length; j++) {
        var kw = e.k[j].toLowerCase();
        if (q.indexOf(kw) !== -1 || qCompact.indexOf(kw) !== -1) score += e.k[j].length;
      }
      if (score > bestScore) { bestScore = score; best = e; }
    }
    if (best && bestScore > 0) {
      return { answer: best.a, page: best.page, score: bestScore };
    }
    return {
      answer: "本地版暂未覆盖这个问题。你可以试试这些方向：感知机怎么学习、为什么 XOR 学不会、学习率的作用、Q/K/V 分别是什么、softmax 与温度、因果掩码、参数如何分类、聚类与 K-Means、肘部法怎么选 K、直方图与箱数、范围筛选、Otsu 自动阈值。若想获得真正的大模型答疑，可在 WorkBuddy 中开启本应用的云服务（免密钥大模型 API），届时我会接入真实模型。",
      page: "", score: 0
    };
  }

  // 供 Node 测试 & 浏览器共用
  var API = { localAnswer: localAnswer, KB: KB };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  if (typeof window !== "undefined") window.AIHelper = API;

  // ---- 浏览器浮窗 UI（仅在浏览器中初始化） ----
  if (typeof document === "undefined") return;

  var css = [
    "#aiFab{position:fixed;right:18px;bottom:18px;z-index:9999;width:52px;height:52px;border-radius:50%;",
    "border:none;cursor:pointer;background:#185fa5;color:#fff;font-size:20px;box-shadow:0 6px 18px rgba(0,0,0,.3);transition:.15s}",
    "#aiFab:hover{transform:scale(1.06)}",
    "#aiPanel{position:fixed;right:18px;bottom:80px;z-index:9999;width:340px;max-width:calc(100vw - 36px);max-height:60vh;",
    "display:none;flex-direction:column;background:#0f141b;color:#e6edf5;border:1px solid #2b3746;border-radius:14px;",
    "box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif}",
    "#aiHead{background:#171e28;padding:11px 14px;font-size:13px;font-weight:600;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2b3746}",
    "#aiHead .tag{font-size:10px;color:#77899d;font-weight:400;border:1px solid #2b3746;border-radius:10px;padding:1px 7px}",
    "#aiClose{cursor:pointer;color:#77899d;font-size:16px;line-height:1}",
    "#aiBody{padding:12px 14px;overflow-y:auto;font-size:13px;line-height:1.7}",
    "#aiQ{padding:8px 10px;background:#1d2632;border-radius:8px;color:#e6edf5;margin-bottom:10px}",
    "#aiA{padding:8px 10px;background:#10161f;border-left:3px solid #5aa9ff;border-radius:0 8px 8px 0;color:#cdd9e6}",
    "#aiA .src{display:block;margin-top:7px;font-size:11px;color:#77899d}",
    "#aiSug{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 2px}",
    "#aiSug span{font-size:11px;color:#a8b8c9;background:#1d2632;border:1px solid #2b3746;border-radius:14px;padding:3px 9px;cursor:pointer}",
    "#aiSug span:hover{border-color:#5aa9ff;color:#e6edf5}",
    "#aiFoot{padding:9px 12px;border-top:1px solid #2b3746;display:flex;gap:8px}",
    "#aiInput{flex:1;border:1px solid #2b3746;background:#10161f;color:#e6edf5;border-radius:8px;padding:7px 10px;font-size:13px;outline:none}",
    "#aiInput:focus{border-color:#5aa9ff}",
    "#aiSend{border:none;background:#185fa5;color:#fff;border-radius:8px;padding:0 14px;cursor:pointer;font-size:13px}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var sugQuestions = ["什么是 AI？", "AI 发展历程？", "感知机怎么学？", "为什么 XOR 学不会？",
    "Q/K/V 是什么？", "聚类是什么？", "直方图怎么看？", "Otsu 阈值？"];

  var fab = document.createElement("button");
  fab.id = "aiFab"; fab.textContent = "AI"; fab.title = "AI 答疑（本地版）";
  document.body.appendChild(fab);

  var panel = document.createElement("div");
  panel.id = "aiPanel";
  panel.innerHTML =
    '<div id="aiHead">AI 答疑助手<span class="tag">本地版 · 未连接云端大模型</span><span id="aiClose">×</span></div>' +
    '<div id="aiBody"></div>' +
    '<div id="aiFoot"><input id="aiInput" placeholder="问点什么…" /><button id="aiSend">发送</button></div>';
  document.body.appendChild(panel);

  var body = panel.querySelector("#aiBody");
  var input = panel.querySelector("#aiInput");

  function renderSuggestions() {
    var s = '<div id="aiSug">';
    for (var i = 0; i < sugQuestions.length; i++) s += '<span>' + sugQuestions[i] + "</span>";
    s += "</div>";
    return s;
  }

  function showAnswer(query) {
    var r = localAnswer(query);
    var html = '<div id="aiQ">' + escapeHtml(query) + "</div>";
    html += '<div id="aiA">' + escapeHtml(r.answer);
    if (r.page) html += '<span class="src">— 出处：' + escapeHtml(r.page) + "</span>";
    html += "</div>";
    html += renderSuggestions();
    body.innerHTML = html;
    bindSug();
  }

  function bindSug() {
    var sp = body.querySelectorAll("#aiSug span");
    for (var i = 0; i < sp.length; i++) {
      sp[i].addEventListener("click", function () { showAnswer(this.textContent); });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  fab.addEventListener("click", function () {
    var open = panel.style.display === "flex";
    panel.style.display = open ? "none" : "flex";
    if (!open) {
      if (!body.innerHTML) showAnswer("你好");
      input.focus();
    }
  });
  panel.querySelector("#aiClose").addEventListener("click", function () { panel.style.display = "none"; });
  panel.querySelector("#aiSend").addEventListener("click", function () {
    var v = input.value.trim(); if (!v) return; showAnswer(v); input.value = "";
  });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") panel.querySelector("#aiSend").click(); });

  // 暴露给页面脚本（如需要）
  window.AIHelper.initUI = function () {};
  window.AIHelper.showAnswer = showAnswer;
})();
