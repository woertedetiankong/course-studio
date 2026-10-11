package warmup

import "sync"

// SumParallel 对 chunks 里的每一段并发调用 f，返回所有结果之和。
// SumParallel calls f on every chunk concurrently and returns the sum of the results.
func SumParallel(chunks [][]int, f func([]int) int) int {
	total := 0
	var wg sync.WaitGroup
	var mu sync.Mutex
	for _, c := range chunks {
		wg.Add(1)
		go func(c []int) {
			defer wg.Done()
			v := f(c)
			mu.Lock()
			total += v
			mu.Unlock()
		}(c)
	}
	wg.Wait()
	return total
}

// RunPool 同一时刻最多运行 n 个 f，返回 results，其中 results[i] == f(jobs[i])。
// RunPool runs at most n calls of f at once and returns results, where results[i] == f(jobs[i]).
func RunPool(jobs []int, n int, f func(int) int) []int {
	results := make([]int, len(jobs))
	slots := make(chan struct{}, n)
	var wg sync.WaitGroup
	for i, j := range jobs {
		wg.Add(1)
		slots <- struct{}{}
		go func(i, j int) {
			defer wg.Done()
			results[i] = f(j)
			<-slots
		}(i, j)
	}
	wg.Wait()
	return results
}
