# -*- coding: utf-8 -*-
"""
最简单的 AI 算法：感知机 (Perceptron, Rosenblatt 1957)
零第三方依赖，仅用 Python 标准库。运行：python perceptron.py

判定为「AI」的依据：分类规则不是人工写死的 if-else，
而是由训练样本的预测误差反复修正权重 w、偏置 b 得到。
"""


class Perceptron:
    def __init__(self, n_features, lr=0.1, max_epochs=100):
        self.w = [0.0] * n_features   # 权重，初始值全 0
        self.b = 0.0                  # 偏置
        self.lr = lr                  # 学习率 η
        self.max_epochs = max_epochs
        self.errors_per_epoch = []    # 每轮修正次数，用于观察收敛

    def predict(self, x):
        """前向计算：加权求和 + 阶跃激活"""
        z = sum(wi * xi for wi, xi in zip(self.w, x)) + self.b
        return 1 if z >= 0 else 0

    def fit(self, X, y):
        """训练：预测错就按误差调整参数，直到全部分类正确"""
        for epoch in range(1, self.max_epochs + 1):
            errors = 0
            for x, target in zip(X, y):
                d = target - self.predict(x)      # 误差：+1 该判正却判负，-1 反之
                if d != 0:
                    # 全部「智能」都在这一行：w ← w + η·d·x
                    self.w = [wi + self.lr * d * xi for wi, xi in zip(self.w, x)]
                    self.b += self.lr * d
                    errors += 1
            self.errors_per_epoch.append(errors)
            print(f"第 {epoch} 轮：修正 {errors} 次，"
                  f"w = {[round(v, 2) for v in self.w]}，b = {self.b:.2f}")
            if errors == 0:                       # 全部分类正确，收敛
                break
        return self


if __name__ == "__main__":
    # 训练集：OR 逻辑门（4 个样本，线性可分，最易收敛）
    X = [[0, 0], [0, 1], [1, 0], [1, 1]]
    y = [0, 1, 1, 1]

    print("训练集（OR 门）：")
    for x, t in zip(X, y):
        print(f"  {x} -> {t}")

    print("\n训练过程：")
    model = Perceptron(n_features=2).fit(X, y)

    w = [round(v, 2) for v in model.w]
    b = round(model.b, 2)
    print(f"\n学到的参数：w = {w}，b = {b}")
    print(f"决策边界：{w[0]}·x1 + {w[1]}·x2 + ({b}) = 0")
    print("验证：", [(x, model.predict(x)) for x in X])
    print("新样本推断 [0.5, 0.8] ->", model.predict([0.5, 0.8]),
          "（不在训练集中，靠边界计算而非查表）")
