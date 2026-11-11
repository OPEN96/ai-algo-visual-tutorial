# -*- coding: utf-8 -*-
"""
最小自注意力（Self-Attention）前向实现，零第三方依赖。
与 attention_visual.html 使用完全相同的词嵌入、打分矩阵与公式。

    Q = X @ W_Q      K = X @ W_K      V = X @ W_V
    S = Q @ K.T / sqrt(d_k)
    A = softmax(S / temperature)        （可选因果掩码）
    O = A @ V

本演示取 W_K = W_V = I、W_Q = M，因此 Q @ K.T = X @ M @ X.T。
M 是一个非对称的双线性打分矩阵，等价于真实模型中分别学习得到的
W_Q @ W_K.T；此处手工设定其数值，使「训练后」的注意力模式可解释。
"""

import math

DIM = 8
# 标准 Transformer 等价于 temperature = 1.0。演示用 8 维稀疏嵌入，
# QK 点积量级偏小，取 0.6 放大注意力差异以便观察；页面滑块可随时调回 1.0。
DEFAULT_TEMP = 0.6
FEATURES = ["ENT", "ACT", "PRON", "OBJ", "ANIM", "MOD", "TIME", "FUNC"]
IDX = {name: i for i, name in enumerate(FEATURES)}


def vec(**kwargs):
    v = [0.0] * DIM
    for name, val in kwargs.items():
        v[IDX[name.upper()]] = val
    return v


SENTENCES = {
    "指代": {
        "tokens": ["猫", "追", "老鼠", "，", "它", "跑", "得", "快"],
        "X": [vec(ENT=1, ANIM=1), vec(ACT=1), vec(ENT=1, ANIM=1), vec(FUNC=1),
              vec(PRON=1), vec(ACT=1), vec(FUNC=1), vec(MOD=1)],
        "note": "「它」同时指向「猫」和「老鼠」——注意力本身不消解指代歧义",
    },
    "修饰": {
        "tokens": ["红色", "的", "小球", "滚", "向", "角落"],
        "X": [vec(MOD=1), vec(FUNC=1), vec(ENT=1, OBJ=1), vec(ACT=1),
              vec(FUNC=1), vec(TIME=1, ENT=0.5)],
        "note": "「红色」主要关注被修饰的「小球」",
    },
    "论元": {
        "tokens": ["学生", "读", "完", "了", "这", "本", "书"],
        "X": [vec(ENT=1, ANIM=1), vec(ACT=1), vec(FUNC=1), vec(FUNC=1),
              vec(MOD=1), vec(FUNC=1), vec(ENT=1, OBJ=1)],
        "note": "「读」同时关注施事「学生」与受事「书」",
    },
}

RULES_SEMANTIC = {
    ("PRON", "OBJ"): 3.0, ("PRON", "ANIM"): 2.8, ("PRON", "ENT"): 1.0,
    ("ACT", "ENT"): 2.2, ("ACT", "ANIM"): 1.2, ("ACT", "OBJ"): 1.0,
    ("MOD", "ENT"): 2.6, ("MOD", "OBJ"): 1.6, ("MOD", "ANIM"): 1.0,
}
RULES_LOCAL = {
    ("ENT", "ENT"): 1.4, ("ACT", "ACT"): 1.2, ("MOD", "MOD"): 1.0,
    ("FUNC", "FUNC"): 1.0, ("ANIM", "ANIM"): 1.2,
}

HEADS = {
    "Head 1 · 语义关系": {"rules": RULES_SEMANTIC, "diag": 0.5, "pos": 0.15},
    "Head 2 · 局部位置": {"rules": RULES_LOCAL, "diag": 1.5, "pos": 1.20},
}


def score_matrix(rules, diag):
    M = [[0.0] * DIM for _ in range(DIM)]
    for i in range(DIM):
        M[i][i] = diag
    for (a, b), w in rules.items():
        M[IDX[a]][IDX[b]] = w
    return M


def matmul(A, B):
    n, k, m = len(A), len(B), len(B[0])
    return [[sum(A[i][p] * B[p][j] for p in range(k)) for j in range(m)]
            for i in range(n)]


def transpose(A):
    return [list(row) for row in zip(*A)]


def softmax(row):
    top = max(row)
    exps = [math.exp(v - top) if v != float("-inf") else 0.0 for v in row]
    total = sum(exps)
    return [e / total for e in exps]


def lcg_random(n, seed=20261106):
    """可复现的伪随机数，用于模拟未训练的随机权重"""
    state, out = seed, []
    for _ in range(n):
        state = (1103515245 * state + 12345) % (2 ** 31)
        out.append(state / (2 ** 31) * 2 - 1)
    return out


def attention(tokens, X, M, temp=DEFAULT_TEMP, causal=False, pos_bias=0.0,
              use_pos=True, random_weights=False):
    n = len(tokens)
    if random_weights:
        M = [lcg_random(DIM, seed=20261106 + i * 977) for i in range(DIM)]
    Q = matmul(X, M)
    K, V = X, X
    raw = matmul(Q, transpose(K))
    scale = math.sqrt(DIM)
    logits = []
    for i in range(n):
        row = []
        for j in range(n):
            val = raw[i][j] / (scale * temp)
            if use_pos:
                val += pos_bias * math.exp(-abs(i - j) / 1.5)
            row.append(val)
        logits.append(row)
    if causal:
        for i in range(n):
            for j in range(i + 1, n):
                logits[i][j] = float("-inf")
    A = [softmax(r) for r in logits]
    O = matmul(A, V)
    return {"raw": raw, "logits": logits, "A": A, "O": O,
            "Q": Q, "K": K, "V": V, "M": M}


def verify():
    for name, data in SENTENCES.items():
        for head_name, head in HEADS.items():
            M = score_matrix(head["rules"], head["diag"])
            r = attention(data["tokens"], data["X"], M,
                          pos_bias=head["pos"])
            for row in r["A"]:
                assert abs(sum(row) - 1.0) < 1e-9, "softmax 行和必须为 1"
            c = attention(data["tokens"], data["X"], M,
                          pos_bias=head["pos"], causal=True)
            for i, row in enumerate(c["A"]):
                assert abs(sum(row) - 1.0) < 1e-9
                assert all(v == 0.0 for v in row[i + 1:]), "因果掩码上三角必须为 0"

    data = SENTENCES["论元"]
    M = score_matrix(RULES_SEMANTIC, 0.5)
    A = attention(data["tokens"], data["X"], M, pos_bias=0.15)["A"]
    read_row = A[1]
    assert read_row[0] + read_row[6] > 0.55, "「读」应主要关注「学生」与「书」"

    data = SENTENCES["指代"]
    A = attention(data["tokens"], data["X"], M, pos_bias=0.15)["A"]
    it_row = A[4]
    assert it_row[0] + it_row[2] > 0.60, "「它」应主要关注「猫」与「老鼠」"

    sharp = attention(data["tokens"], data["X"], M, temp=0.4, pos_bias=0.15)["A"][4]
    flat = attention(data["tokens"], data["X"], M, temp=3.0, pos_bias=0.15)["A"][4]
    assert max(sharp) > max(flat), "温度降低应使分布更尖锐"

    trained = attention(data["tokens"], data["X"], M, pos_bias=0.15)["A"][4]
    untrained = attention(data["tokens"], data["X"], M, pos_bias=0.15,
                          random_weights=True)["A"][4]
    assert max(trained) > max(untrained) * 1.5, "随机权重应显著更均匀"
    print("verify: 6 组行和 / 掩码断言 + 4 组语义与权重断言全部通过")


def demo():
    print(f"temperature = {DEFAULT_TEMP}（标准缩放对应 1.0）\n")
    for name, data in SENTENCES.items():
        head = HEADS["Head 1 · 语义关系"]
        M = score_matrix(head["rules"], head["diag"])
        r = attention(data["tokens"], data["X"], M, pos_bias=head["pos"])
        print(f"\n=== {name}｜{' '.join(data['tokens'])} ===")
        print("说明：", data["note"])
        for i, t in enumerate(data["tokens"]):
            pairs = sorted(enumerate(r["A"][i]), key=lambda p: -p[1])[:2]
            desc = "，".join(f"{data['tokens'][j]} {v*100:.1f}%" for j, v in pairs)
            print(f"  {t:<3} -> {desc}")
    print()


if __name__ == "__main__":
    verify()
    demo()
