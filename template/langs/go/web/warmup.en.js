// English text for the warmup dojo (warmup.js). Levels are matched by n; fields not written here keep the Chinese.
enOverlay(window.COURSE, {
  title: 'Go Dojo',
  subtitle: 'Concurrency warm-up · 2 levels',
  finalNote: 'All done! You are ready for the real assignment.',
  timelineIntro: 'Level 2\'s tests draw when each job starts and ends here, so you can see at a glance how many run at once.',
  levels: {
    1: {
      title: 'Goroutines, WaitGroup and locks',
      concept: `<p>Put <code>go</code> in front of a function call and the function runs in the background. To wait for every goroutine, use <code>sync.WaitGroup</code>; when several goroutines change the same variable, wrap the change in a <code>sync.Mutex</code>.</p>
        <p>The tests run with the <b>-race</b> data race detector. Forget a lock and it points at the two lines that collided.</p>`,
      task: ['Implement <code>SumParallel</code>: start one goroutine per chunk to call f, and add the results into total. All 6 chunks must finish within 350 ms.'],
      tests: {TestLv1_Correct: 'The sum is correct', TestLv1_Parallel: 'All chunks processed at once', TestLv1_Repeat: 'Correct 30 runs in a row'},
      tiers: [
        'Write a for loop and start a goroutine in its body with go func(c []int) { ... }(c).',
        'Wait for every goroutine with a WaitGroup: wg.Add(1) in the loop, defer wg.Done() in the goroutine, wg.Wait() after the loop.',
        'Declare var mu sync.Mutex too. Once a goroutine has f\'s result, mu.Lock(), add it into total, then mu.Unlock().'],
      byCode: {
        not_parallel: 'f is being called one call after another. Each call needs its own new goroutine.',
        wrong_total: 'The result is wrong. The most common cause: the function returns before the goroutines are done. Wait for all of them with a WaitGroup.',
        flaky: 'Right sometimes and wrong other times is the classic symptom of a concurrent program: it returned before a goroutine finished, or a lock is missing.',
        race: 'Two goroutines touched total at the same time without a lock. The report below names the two lines that collided.',
      },
    },
    2: {
      title: 'Channels and worker pools',
      concept: `<p>Sometimes you can't start goroutines without limit. A buffered channel <code>make(chan struct{}, n)</code> holds at most n items, and putting one more in waits. Think of it as n passes: put one in before starting work, take one out when done.</p>`,
      task: ['Implement <code>RunPool</code>: at most n calls of f run at once, and n must actually be used; <code>results[i]</code> must be <code>f(jobs[i])</code>.'],
      tests: {TestLv2_PoolOf3: '3 at a time, 9 jobs', TestLv2_PoolOf1: '1 at a time', TestLv2_Wide: 'As many at a time as there are jobs'},
      tiers: [
        'Still run each job in its own goroutine, then find a way to limit how many run at once.',
        'Make a channel with capacity n to act as passes: put one in before starting a goroutine (it waits when full), and take one out when the goroutine is done.',
        'Write the result into results[i]. Each goroutine writes a different index, so no lock is needed. Don\'t forget a WaitGroup to wait for every job.'],
      byCode: {
        pool_order: 'The results are in the wrong order. Write results[i] directly, where i is the job\'s index in jobs.',
        pool_too_many: 'More than n ran at once, so nothing is limiting them. Try a channel with capacity n.',
        pool_serial: 'Fewer than n ran at once. Are you waiting for each job inside the main loop? Wait only after every job has started.',
      },
    },
  },
  common: {
    build: 'The code did not compile; fix the build errors first.',
    race: '-race found a data race.',
    concurrent_map: 'Several goroutines wrote the same map at once.',
    timeout: 'The test timed out; there may be a deadlock or an endless loop.',
    panic: 'Your code panicked; follow the stack trace below to the failing line.',
  },
});
