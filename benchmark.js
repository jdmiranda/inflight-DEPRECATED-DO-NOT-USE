const Benchmark = require('benchmark')
const inflight = require('./inflight.js')

const suite = new Benchmark.Suite()

// Benchmark 1: Simple unique requests (fast path)
suite.add('Unique requests (fast path)', function () {
  const key = 'unique-' + Math.random()
  const cb = inflight(key, function () {})
  if (cb) cb()
})

// Benchmark 2: Duplicate requests (callback queuing)
suite.add('Duplicate requests (2 callbacks)', function () {
  const key = 'dup-test'
  let resolved = false

  const cb1 = inflight(key, function () {
    resolved = true
  })

  const cb2 = inflight(key, function () {})

  if (cb1 && !resolved) {
    cb1()
  }
})

// Benchmark 3: Heavy duplication (10 callbacks)
suite.add('Heavy duplication (10 callbacks)', function () {
  const key = 'heavy-dup-' + Math.random()

  const cb1 = inflight(key, function () {})
  for (let i = 0; i < 9; i++) {
    inflight(key, function () {})
  }

  if (cb1) cb1()
})

// Benchmark 4: High-throughput scenario
suite.add('High-throughput mixed requests', function () {
  const keys = ['key1', 'key2', 'key3', 'key4', 'key5']
  const results = []

  for (let i = 0; i < 10; i++) {
    const key = keys[i % keys.length]
    const cb = inflight(key, function () {})
    if (cb) results.push(cb)
  }

  results.forEach(cb => cb())
})

// Benchmark 5: Argument passing
suite.add('Argument passing (5 args)', function () {
  const key = 'args-' + Math.random()

  const cb1 = inflight(key, function (a, b, c, d, e) {})
  const cb2 = inflight(key, function (a, b, c, d, e) {})

  if (cb1) cb1(1, 2, 3, 4, 5)
})

suite
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  .on('complete', function () {
    console.log('\n=== Benchmark Results ===')
    this.forEach(function (bench) {
      const ops = bench.hz.toLocaleString('en-US', { maximumFractionDigits: 0 })
      const rme = bench.stats.rme.toFixed(2)
      console.log(`${bench.name}: ${ops} ops/sec ±${rme}%`)
    })
  })
  .run({ async: false })
