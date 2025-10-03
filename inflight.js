var wrappy = require('wrappy')
var reqs = new Map()
var once = require('once')

module.exports = wrappy(inflight)

function inflight (key, cb) {
  var existing = reqs.get(key)
  if (existing) {
    existing.push(cb)
    return null
  } else {
    // Fast path: pre-allocate array with initial callback
    reqs.set(key, [cb])
    return makeres(key)
  }
}

function makeres (key) {
  return once(function RES () {
    var cbs = reqs.get(key)
    var len = cbs.length
    // Use Array.from for better performance than custom slice
    var args = Array.from(arguments)

    // XXX It's somewhat ambiguous whether a new callback added in this
    // pass should be queued for later execution if something in the
    // list of callbacks throws, or if it should just be discarded.
    // However, it's such an edge case that it hardly matters, and either
    // choice is likely as surprising as the other.
    // As it happens, we do go ahead and schedule it for later execution.
    try {
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args)
      }
    } finally {
      if (cbs.length > len) {
        // added more in the interim.
        // de-zalgo, just in case, but don't call again.
        cbs.splice(0, len)
        process.nextTick(function () {
          RES.apply(null, args)
        })
      } else {
        // Use Map.delete for faster cleanup
        reqs.delete(key)
      }
    }
  })
}
