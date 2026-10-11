// 练功房 warmup 的课程内容：每关的讲解、任务、分层提示，以及按失败原因（测试里 fail() 的 code）给出的定向提示。
// 文件名 = 练功房 id = course/dojos/<id>/ 目录名 = Go 包名。英文版写在 <id>.en.js 里，按关卡号覆盖。
window.COURSE = {
  id: 'warmup',
  title: 'Go 练功房',
  subtitle: '并发热身 · 2 关',
  fileOrder: ['warmup.go'],
  finalNote: '全部完成！现在可以去做真正的作业了。',
  timelineIntro: '第 2 关的测试会把每个任务的开始和结束画在这里，一眼就能看出同一时刻有几个在跑。',
  levels: [
    {
      n: 1, short: 'goroutine', title: 'goroutine、WaitGroup 与锁', file: 'warmup.go',
      concept: `<p>在函数调用前加一个 <code>go</code>，这个函数就在后台运行。要等所有 goroutine 做完，用 <code>sync.WaitGroup</code>；多个 goroutine 改同一个变量，用 <code>sync.Mutex</code> 包起来。</p>
        <p>测试开着 <b>-race</b> 数据竞争检测器运行。忘了加锁，它会当场指出是哪两行代码在打架。</p>`,
      task: ['实现 <code>SumParallel</code>：为每一段启动一个 goroutine 调用 f，把结果加进 total。6 段要在 350 毫秒内全部完成。'],
      tests: {TestLv1_Correct: '总和正确', TestLv1_Parallel: '同时处理所有段', TestLv1_Repeat: '连续运行 30 次都正确'},
      tiers: [
        '先写一个 for 循环，循环体里用 go func(c []int) { ... }(c) 启动 goroutine。',
        '用 WaitGroup 等所有 goroutine 结束：循环里 wg.Add(1)，goroutine 里 defer wg.Done()，循环后 wg.Wait()。',
        '再声明一个 var mu sync.Mutex。goroutine 拿到 f 的结果后，mu.Lock()，加进 total，再 mu.Unlock()。'],
      byCode: {
        not_parallel: '这说明 f 是一次一次依次调用的。每次调用都要放进一个新的 goroutine 里。',
        wrong_total: '结果不对，最常见的原因是函数在 goroutine 做完之前就返回了。用 WaitGroup 等它们全部结束。',
        flaky: '有时对有时错，是并发程序的典型症状：有 goroutine 还没做完，函数就返回了；或者没加锁。',
        race: '有两个 goroutine 在没有加锁的情况下同时访问了 total。看下面的报告，它指出了冲突的两行。',
      },
    },
    {
      n: 2, short: 'channel', title: 'channel 与工作池', file: 'warmup.go',
      concept: `<p>有时不能无限制地开 goroutine。带缓冲的 channel <code>make(chan struct{}, n)</code> 最多装 n 个东西，装满了再放就会等待。把它当成 n 张通行证：开始干活前放一个进去，干完拿一个出来。</p>`,
      task: ['实现 <code>RunPool</code>：同一时刻最多 n 个 f 在运行，并且要用满 n 个；<code>results[i]</code> 必须是 <code>f(jobs[i])</code>。'],
      tests: {TestLv2_PoolOf3: '3 个并发，9 个任务', TestLv2_PoolOf1: '1 个并发', TestLv2_Wide: '并发数等于任务数'},
      tiers: [
        '每个任务还是放在自己的 goroutine 里运行，再想办法限制同时运行的数量。',
        '建一个容量为 n 的 channel 当通行证：启动 goroutine 前往里放一个（满了会自动等待），goroutine 做完再取出一个。',
        '结果写进 results[i]，每个 goroutine 写的是不同的下标，所以不需要加锁。别忘了用 WaitGroup 等所有任务结束。'],
      byCode: {
        pool_order: '结果顺序不对。直接写 results[i]，i 是任务在 jobs 里的下标。',
        pool_too_many: '同时运行的超过了 n 个，说明没有限制住。试试容量为 n 的 channel。',
        pool_serial: '同时运行的不到 n 个。是不是在主循环里等了每个任务结束？等待应该放在所有任务启动之后。',
      },
    },
  ],
  // 所有关卡共用的失败原因说明（运行器自己识别的 code）
  common: {
    build: '代码没能编译，先修好编译错误。',
    race: '-race 检测到数据竞争。',
    concurrent_map: '多个 goroutine 同时写了同一个 map。',
    timeout: '测试超时，可能有死锁或死循环。',
    panic: '代码 panic 了，看下面的堆栈找到出错的那一行。',
  },
};
