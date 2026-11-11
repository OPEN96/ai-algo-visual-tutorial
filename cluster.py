"""
K-Means 聚类：纯标准库数值基准。

与 cluster_visual.html 使用同一份确定性数据、同一套公式：
  1) 分配：每个点归到欧氏距离最近的质心（平局取编号较小者）
  2) 更新：质心移到本簇所有点的均值（空簇保持不动）
  3) 重复到质心不再移动；inertia = 各点到所属质心的距离平方和

数据用三角函数加确定性扰动生成（不用随机数），因此浏览器与 Python
可复现同一批点，便于逐元素交叉校验。
"""
import math

KINDS = ("blobs", "ring", "moons")


def make_points(kind):
    """生成 2D 点集，范围大致落在 0..10。"""
    pts = []
    if kind == "blobs":
        centers = [(2.3, 2.6), (7.6, 2.9), (5.0, 7.6)]
        for ci, (cx, cy) in enumerate(centers):
            for i in range(20):
                a = 2 * math.pi * i / 20 + ci * 0.7
                r = 0.55 + 0.55 * (i % 5) / 4
                pts.append((cx + r * math.cos(a) + 0.12 * math.sin(i * 1.7 + ci),
                            cy + r * math.sin(a) + 0.12 * math.cos(i * 2.1 + ci)))
    elif kind == "ring":
        for i in range(34):                       # 外环
            a = 2 * math.pi * i / 34
            r = 3.2 + 0.18 * math.sin(i * 1.3)
            pts.append((5 + r * math.cos(a), 5 + r * math.sin(a)))
        for i in range(20):                       # 内团
            a = 2 * math.pi * i / 20
            r = 0.9 + 0.2 * math.cos(i * 2.2)
            pts.append((5 + r * math.cos(a), 5 + r * math.sin(a)))
    elif kind == "moons":
        for i in range(26):                       # 上弯月牙
            a = math.pi * i / 25
            pts.append((2.0 + 5.0 * a / math.pi + 0.25 * math.sin(i * 1.9),
                        3.2 + 2.2 * math.sin(a) + 0.2 * math.cos(i * 1.3)))
        for i in range(26):                       # 下弯月牙
            a = math.pi * i / 25
            pts.append((8.0 - 5.0 * a / math.pi + 0.25 * math.sin(i * 2.3),
                        6.4 - 2.2 * math.sin(a) + 0.2 * math.cos(i * 1.7)))
    else:
        raise ValueError(kind)
    return pts


def dist2(a, b):
    dx, dy = a[0] - b[0], a[1] - b[1]
    return dx * dx + dy * dy


def init_centers(points, k, mode="farthest"):
    """三种初始化：顺序取前 k 个 / 最远点优先 / 固定种子洗牌。"""
    n = len(points)
    if mode == "first":
        return [list(points[i]) for i in range(k)]
    if mode == "random":
        # 固定种子的 Fisher-Yates，保证可复现（LCG，与页面一致）
        idx = list(range(n))
        seed = 20261111
        for i in range(n - 1, 0, -1):
            seed = (seed * 1103515245 + 12345) & 0x7fffffff
            j = seed % (i + 1)
            idx[i], idx[j] = idx[j], idx[i]
        return [list(points[idx[i]]) for i in range(k)]
    if mode == "farthest":
        # k-means++ 思路的确定性简化：每次挑「离已有中心最远」的点
        centers = [list(points[0])]
        while len(centers) < k:
            best_i, best_d = 0, -1.0
            for i, p in enumerate(points):
                d = min(dist2(p, c) for c in centers)
                if d > best_d:
                    best_d, best_i = d, i
            centers.append(list(points[best_i]))
        return centers
    raise ValueError(mode)


def assign(points, centers):
    labels = []
    for p in points:
        best_j, best_d = 0, float("inf")
        for j, c in enumerate(centers):
            d = dist2(p, c)
            if d < best_d:            # 严格小于 → 平局取编号小者
                best_d, best_j = d, j
        labels.append(best_j)
    return labels


def inertia_of(points, labels, centers):
    return sum(dist2(p, centers[labels[i]]) for i, p in enumerate(points))


def update_centers(points, labels, centers):
    k = len(centers)
    sx, sy, cnt = [0.0] * k, [0.0] * k, [0] * k
    for p, lab in zip(points, labels):
        sx[lab] += p[0]
        sy[lab] += p[1]
        cnt[lab] += 1
    out = []
    for j in range(k):
        if cnt[j]:
            out.append([sx[j] / cnt[j], sy[j] / cnt[j]])
        else:
            out.append(list(centers[j]))   # 空簇保持不动
    return out, cnt


def kmeans(points, k, mode="farthest", max_iter=60, eps=1e-9):
    centers = init_centers(points, k, mode)
    history = []
    labels = assign(points, centers)
    for it in range(1, max_iter + 1):
        cur_inertia = inertia_of(points, labels, centers)
        new_centers, counts = update_centers(points, labels, centers)
        moved = max(math.sqrt(dist2(centers[j], new_centers[j])) for j in range(k))
        centers = new_centers
        history.append({"iter": it, "inertia": cur_inertia, "moved": moved,
                        "counts": counts})
        if moved < eps:
            break
        labels = assign(points, centers)
    return {"centers": centers, "labels": labels, "history": history,
            "inertia": history[-1]["inertia"], "iters": len(history),
            "converged": history[-1]["moved"] < eps}


def elbow(points, ks=range(1, 7), mode="farthest"):
    return [{"k": k, "inertia": kmeans(points, k, mode)["inertia"]} for k in ks]


def verify():
    for kind in KINDS:
        pts = make_points(kind)
        assert all(-1 < x < 11 and -1 < y < 11 for x, y in pts), "点应在画布范围内"
    pts = make_points("blobs")
    assert len(pts) == 60
    r = kmeans(pts, 3, "farthest")
    assert r["converged"] and r["iters"] <= 60, "应收敛"
    seq = [h["inertia"] for h in r["history"]]
    assert all(seq[i + 1] <= seq[i] + 1e-9 for i in range(len(seq) - 1)), "inertia 不应上升"
    assert all(0 <= lab < 3 for lab in r["labels"])
    # 收敛时质心必须等于各簇均值
    new_c, _ = update_centers(pts, r["labels"], r["centers"])
    assert all(dist2(a, b) < 1e-9 for a, b in zip(new_c, r["centers"]))
    assert min(r["history"][-1]["counts"]) > 5, "三团应被分开"
    e = elbow(pts)
    assert all(e[i + 1]["inertia"] <= e[i]["inertia"] + 1e-9 for i in range(len(e) - 1)), \
        "K 增大时 inertia 不应上升"
    print("verify: 数据范围 / 收敛 / inertia 单调 / 质心=簇均值 / 肘部法单调 全部通过")


if __name__ == "__main__":
    verify()
    print()
    for kind in KINDS:
        pts = make_points(kind)
        k = 3 if kind == "blobs" else 2
        r = kmeans(pts, k, "farthest")
        print("=== %s | n=%d k=%d ===" % (kind, len(pts), k))
        print("  轮数=%d 收敛=%s 最终 inertia=%.3f" %
              (r["iters"], r["converged"], r["inertia"]))
        print("  质心=%s" % [[round(v, 2) for v in c] for c in r["centers"]])
        print("  每簇点数=%s" % r["history"][-1]["counts"])
    print()
    print("=== 肘部法（blobs, K=1..6）===")
    for e in elbow(make_points("blobs")):
        print("  K=%d  inertia=%.2f" % (e["k"], e["inertia"]))
