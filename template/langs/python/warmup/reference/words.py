# 热身：词频统计
# Warm-up: word frequencies
import re
from collections import Counter


# 第 1 关：返回每个词（小写）出现的次数。词 = 连续的字母或数字。
# Level 1: return how many times each word (lower-cased) appears. A word is a run of letters or digits.
def word_count(text: str) -> dict[str, int]:
    return dict(Counter(re.findall(r"[a-z0-9]+", text.lower())))


# 第 2 关：出现最多的前 k 个词，按次数从大到小；次数相同按字母顺序。
# Level 2: the k most frequent words, most frequent first; equal counts in alphabetical order.
def top_k(counts: dict[str, int], k: int) -> list[tuple[str, int]]:
    return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:k]
