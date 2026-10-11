package warmup

// SumParallel 对 chunks 里的每一段并发调用 f，返回所有结果之和。
// SumParallel calls f on every chunk concurrently and returns the sum of the results.
func SumParallel(chunks [][]int, f func([]int) int) int {
	total := 0
	// TODO: 第 1 关
	// TODO: level 1
	return total
}

// RunPool 同一时刻最多运行 n 个 f，返回 results，其中 results[i] == f(jobs[i])。
// RunPool runs at most n calls of f at once and returns results, where results[i] == f(jobs[i]).
func RunPool(jobs []int, n int, f func(int) int) []int {
	results := make([]int, len(jobs))
	// TODO: 第 2 关
	// TODO: level 2
	return results
}
