"""
直方图与范围筛选：纯标准库数值基准。

与 histogram_visual.html 使用同一份确定性数据、同一套公式：
  - 直方图：把值域等分成 bins 个箱子，数每个箱子落进几个值
  - 范围筛选：保留 low <= v <= high 的样本（含端点）
  - Otsu：遍历所有分割位置，取「类间方差」最大的那个作为自动阈值

Otsu 的类间方差用未归一化形式 w0*w1*(mu0-mu1)^2（等价于概率形式乘
总数平方，最大点相同），便于整数运算、与页面逐位对齐。
"""
import math

RANGES = {"exam": (0.0, 100.0), "pixel": (0.0, 255.0), "petal": (0.0, 8.0)}
KINDS = tuple(RANGES)


def make_values(kind):
    """确定性生成一维数据（不用随机数），浏览器与 Python 可复现同一批值。"""
    vals = []
    if kind == "exam":                       # 考试成绩：主体 40~90，掺几个低分离群值
        for i in range(100):
            v = 62 + 18 * math.sin(i * 0.37) + 9 * math.cos(i * 1.13)
            if i % 17 == 0:
                v -= 35
            vals.append(v)
    elif kind == "pixel":                    # 图像灰度：暗背景 + 亮目标，典型双峰
        for i in range(180):
            vals.append(38 + 14 * math.sin(i * 0.41) + 6 * math.cos(i * 1.7))
        for i in range(100):
            vals.append(182 + 20 * math.sin(i * 0.53) + 7 * math.cos(i * 2.1))
    elif kind == "petal":                    # 花瓣长度：两个品种 + 少量中间值
        for i in range(150):
            if i < 60:
                v = 1.5 + 0.4 * math.sin(i * 0.7) + 0.2 * math.cos(i * 1.9)
            elif i < 110:
                v = 4.8 + 0.5 * math.sin(i * 0.6) + 0.2 * math.cos(i * 2.3)
            else:
                v = 3.0 + 1.2 * math.sin(i * 0.31)
            vals.append(v)
    else:
        raise ValueError(kind)
    lo, hi = RANGES[kind]
    return [min(hi, max(lo, v)) for v in vals]


def histogram(values, bins, lo, hi):
    counts = [0] * bins
    for v in values:
        idx = int((v - lo) / (hi - lo) * bins)
        if idx < 0:
            idx = 0
        elif idx >= bins:                    # 值恰等于上界时归最后一箱
            idx = bins - 1
        counts[idx] += 1
    return counts


def filter_range(values, low, high):
    return [v for v in values if low <= v <= high]


def stats(values):
    n = len(values)
    if n == 0:
        return {"n": 0, "mean": 0.0, "std": 0.0}
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / n   # 总体标准差
    return {"n": n, "mean": mean, "std": math.sqrt(var)}


def otsu(values, bins, lo, hi):
    counts = histogram(values, bins, lo, hi)
    total = sum(counts)
    sum_all = sum(i * counts[i] for i in range(bins))
    w0, sum0 = 0, 0.0
    best_b, ties = -1.0, []
    curve = []
    for t in range(bins - 1):
        w0 += counts[t]
        sum0 += t * counts[t]
        w1 = total - w0
        if w0 == 0:
            curve.append(0.0)
            continue
        if w1 == 0:
            curve.append(0.0)
            break
        mu0, mu1 = sum0 / w0, (sum_all - sum0) / w1
        b = w0 * w1 * (mu0 - mu1) ** 2
        curve.append(b)
        # 两峰之间若有空箱，会出现一整段「并列最优」。此时取平台中点，
        # 阈值才落在谷底中央，而不是贴着某一峰的边缘。
        if b > best_b + 1e-9:
            best_b, ties = b, [t]
        elif abs(b - best_b) <= 1e-9:
            ties.append(t)
    best_t = ties[len(ties) // 2] if ties else 0
    return {"t": best_t, "between": best_b, "curve": curve, "ties": ties,
            "threshold": lo + (best_t + 1) * (hi - lo) / bins}


def verify():
    for kind in KINDS:
        vals = make_values(kind)
        lo, hi = RANGES[kind]
        assert vals and all(lo <= v <= hi for v in vals), "值应在值域内"
        for bins in (6, 12, 20, 30):
            assert sum(histogram(vals, bins, lo, hi)) == len(vals), "频数之和应等于样本数"
    assert len(make_values("exam")) == 100
    assert len(make_values("pixel")) == 280
    assert len(make_values("petal")) == 150

    exam = make_values("exam")
    kept = filter_range(exam, 60, 100)
    assert len(kept) == sum(1 for v in exam if 60 <= v <= 100)
    assert all(60 <= v <= 100 for v in kept)
    s = stats(kept)
    assert abs(s["mean"] - sum(kept) / len(kept)) < 1e-12
    assert stats([])["n"] == 0
    # 放宽上界，保留数不应减少
    assert len(filter_range(exam, 0, 70)) <= len(filter_range(exam, 0, 90))

    px = make_values("pixel")
    o = otsu(px, 32, *RANGES["pixel"])
    assert 80 < o["threshold"] < 160, "双峰数据的最佳阈值应落在两峰之间"
    assert o["between"] == max(o["curve"]), "应取类间方差最大点"
    assert abs(o["threshold"] - (o["t"] + 1) * 255 / 32) < 1e-12
    print("verify: 频数守恒 / 筛选端点 / 统计量 / 单调性 / Otsu 最大性 全部通过")


if __name__ == "__main__":
    verify()
    print()
    for kind in KINDS:
        vals = make_values(kind)
        lo, hi = RANGES[kind]
        print("=== %s | n=%d 值域 %.0f~%.0f ===" % (kind, len(vals), lo, hi))
        print("  12 箱频数=%s" % histogram(vals, 12, lo, hi))
        s = stats(vals)
        print("  全量均值=%.2f 标准差=%.2f" % (s["mean"], s["std"]))
        o = otsu(vals, 32, lo, hi)
        print("  Otsu 阈值=%.2f（第 %d 个分割点）" % (o["threshold"], o["t"]))
    print()
    exam = make_values("exam")
    for low, high in ((0, 100), (40, 90), (60, 100)):
        kept = filter_range(exam, low, high)
        s = stats(kept)
        print("  筛选 %.0f~%.0f → 保留 %3d/%d，均值 %.2f" %
              (low, high, len(kept), len(exam), s["mean"]))
