/**
  Finite state machine library.
*/

'use strict'

// Special alphabet value
const anythingElse = Symbol()

// Special oblivion state
const oblivionState = Symbol()

/**
  A Finite State Machine or FSM has an alphabet and a set of states. At any
  given moment, the FSM is in one state. When passed a symbol from the
  alphabet, the FSM jumps to another state (or possibly the same state).
  A map (Python dictionary) indicates where to jump.
  One state is nominated as a starting state. Zero or more states are
  nominated as final states. If, after consuming a string of symbols,
  the FSM is in a final state, then it is said to "accept" the string.
  This class also has some pretty powerful methods which allow FSMs to
  be concatenated, alternated between, multiplied, looped (Kleene star
  closure), intersected, and simplified.
  The majority of these methods are available using operator overloads.
*/
const fsm = (alphabet, states, initial, finals, map) => {
  /*
    `alphabet` is an array of symbols the FSM can be fed
    `states` is an array of states for the FSM
    `initial` is the initial state
    `finals` is an array of accepting states
    `map` may be sparse (i.e. it may omit transitions). In the case of
    omitted transitions, a non-final "oblivion" state is simulated.
  */

  // Validation
  const _alphabet = {}
  alphabet.forEach(symbol => {
    if (symbol in _alphabet) {
      throw Error('Duplicate alphabet symbol ' + symbol)
    }
    _alphabet[symbol] = true
  })

  if (!states.includes(initial)) {
    throw Error('Initial state ' + initial + ' must be one of ' + states.join(', '))
  }

  finals.forEach(fynal => {
    if (!states.includes(fynal)) {
      throw Error('Final state ' + fynal + ' must be one of ' + states.join(', '))
    }
  })

  Object.keys(map).forEach(state => {
    Object.keys(map[state]).forEach(symbol => {
      if (!states.includes(map[state][symbol])) {
        throw Error('Transition for state ' + state + ' and symbol ' + symbol + ' leads to ' + map[state][symbol] + ', which is not a state')
      }
    })
  })

  const hasFinalState = function (state) {
    return finals.includes(state)
  }

  // `map` becomes a function
  const follow = function (state, symbol) {
    if (!alphabet.includes(symbol)) {
      if (!alphabet.includes(anythingElse)) {
        throw Error('Unrecognised symbol ' + String(symbol))
      }
      symbol = anythingElse
    }

    return state in map && symbol in map[state]
      ? map[state][symbol]
      : oblivionState
  }

  let _liveStates

  return {
    alphabet: alphabet,
    states: states,
    initial: initial,
    finals: finals,
    map: map,

    follow: follow,
    hasFinalState: hasFinalState,

    /**
      Test whether the present FSM accepts the supplied string (array of
      symbols). Equivalently, consider the FSM as a possibly-infinite set of
      strings and test whether the input string is a member of it.
      This is actually mainly used for unit testing purposes.
      If `anythingElse` is in your alphabet, then any symbol not in your
      alphabet will be converted to `anythingElse`.
    */
    accepts: function (input) {
      return hasFinalState(input.reduce(follow, initial))
    },

    _getLiveStates: function () {
      if (_liveStates === undefined) {
        const reverseMap = {}
        states.forEach(state => {
          alphabet.forEach(symbol => {
            const next = follow(state, symbol)
            if (!(next in reverseMap)) {
              reverseMap[next] = {}
            }
            reverseMap[next][state] = true
          })
        })

        const liveStates = {}

        const scan = function (liveState) {
          liveStates[liveState] = true
          Object.keys(reverseMap[liveState] || {}).forEach(prev => {
            if (!(prev in liveStates)) {
              scan(prev)
            }
          })
        }

        finals.forEach(scan)

        _liveStates = liveStates
      }

      return _liveStates
    },

    _hasLiveState: function (state) {
      return state in this._getLiveStates()
    },

    toString: function () {
      let rows = [
        // top row
        [
          '',
          'name',
          'final?'
        ].concat(
          this.alphabet
        )
      ].concat(
        // other rows
        this.states.map(state => [
          state === this.initial ? '*' : '',
          state,
          hasFinalState(state) ? 'True' : 'False'
        ].concat(
          this.alphabet.map(follow.bind(this, state))
        ))
      )

      // column widths
      const colwidths = rows[0].map((_, x) =>
        Math.max.apply(null, rows.map(row =>
          row[x].length + 1
        ))
      )

      // apply padding
      rows = rows.map(row =>
        row.map((element, x) =>
          element + ' '.repeat(colwidths[x] - element.length)
        )
      )

      // horizontal line
      rows.splice(1, 0, colwidths.map(colwidth => '-'.repeat(colwidth)))

      return rows.map(row => row.join('') + '\n').join('')
    },

    /**
      Generate strings (lists of symbols) that this FSM accepts. Since there may
      be infinitely many of these we use a generator instead of constructing a
      static list. Strings will be sorted in order of length and then lexically.
      This procedure uses arbitrary amounts of memory but is very fast. There
      may be more efficient ways to do this, that I haven't investigated yet.
    */
    strings: function () {
      // We store a list of tuples. Each tuple consists of an input string and the
      // state that this input string leads to. This means we don't have to run the
      // state machine from the very beginning every time we want to check a new
      // string.
      const strings = [{
        cstring: [],
        cstate: this.initial
      }]
      let i = -1

      // This is the generator function
      return {
        next: () => {
          while (true) {
            i++
            if (i >= strings.length) {
              return {done: true}
            }
            const string = strings[i]
            const cstring = string.cstring
            const cstate = string.cstate

            this.alphabet.forEach(symbol => {
              const nstate = follow(cstate, symbol)
              if (!this._hasLiveState(nstate)) {
                return
              }
              const nstring = cstring.concat([symbol])
              strings.push({
                cstring: nstring,
                cstate: nstate
              })
            })

            if (hasFinalState(cstate)) {
              return {
                value: cstring,
                done: false
              }
            }
          }
        }
      }
    }
  }
}

/**
  An FSM accepting nothing (not even the empty string). This is
  demonstrates that this is possible, and is also extremely useful
  in some situations
*/
const nothing = alphabet => {
  const state = 'A'

  const map = {}
  map[state] = {}
  alphabet.forEach(symbol => {
    map[state][symbol] = state
  })

  return fsm(alphabet, [state], state, [], map)
}

/**
  Return an FSM matching an empty string, "", only.
  This is very useful in many situations
*/
const epsilon = alphabet => {
  const state = 'A'
  const map = {}
  return fsm(alphabet, [state], state, [state], map)
}

const unifyAlphabets = alphabets => {
  const unified = []
  alphabets.forEach(alphabet => {
    alphabet.forEach(symbol => {
      if (!unified.includes(symbol)) {
        unified.push(symbol)
      }
    })
  })
  return unified
}

const parallel = (fsms, isFinal) => {
  const alphabet = unifyAlphabets(fsms.map(fsm => fsm.alphabet))

  const initial = fsms.map(fsm => ({fsm: fsm, substate: fsm.initial}))

  // dedicated function accepts a "superset" and returns the next "superset"
  // obtained by following this transition in the new FSM
  const follow = (state, symbol) => {
    const next = state
      .filter(pair => pair.fsm.alphabet.includes(symbol))
      .map(pair => ({fsm: pair.fsm, substate: pair.fsm.follow(pair.substate, symbol)}))
      .filter(pair => pair.substate !== oblivionState)

    return next.length === 0 ? oblivionState : next
  }

  return crawl(alphabet, initial, isFinal, follow)
}

/**
  Alternation. Return a finite state machine which accepts any
  sequence of symbols that is accepted by any input FSM. If
  `fsms` is empty, the output FSM is `null`.
*/
const union = fsms =>
  parallel(fsms, state => state.some(pair => pair.fsm.hasFinalState(pair.substate)))

/**
  Intersection.
*/
const intersection = fsms =>
  parallel(fsms, state => state.every(pair => pair.fsm.hasFinalState(pair.substate)))

/**
  Given the above conditions and instructions, crawl a new unknown FSM,
  mapping its states, final states and transitions. Return the new FSM.
  This is a pretty powerful procedure which could potentially go on
  forever if you supply an evil version of follow().
*/
const crawl = (alphabet, initial, isFinal, follow) => {
  const lookup = [initial]
  const finals = []
  const map = {}

  let state = 0
  while (state < lookup.length) {
    const blah = lookup[state]

    // add to finals
    if (isFinal(blah)) {
      finals.push(String(state))
    }

    // compute map for this state
    map[state] = {}
    alphabet.forEach(symbol => {
      const next = follow(blah, symbol)
      if (next === oblivionState) {
        return
      }

      let state2 = lookup.findIndex(x => JSON.stringify(x) === JSON.stringify(next)) // BAAAD

      if (state2 === -1) {
        state2 = lookup.length
        lookup.push(next)
      }

      map[state][symbol] = String(state2)
    })

    state++
  }

  return fsm(alphabet, Object.keys(lookup), '0', finals, map)
}

/**
  Take a state in the numbered FSM and return a set containing it, plus
  (if it's final) the first state from the next FSM, plus (if that's
  final) the first state from the next but one FSM, plus...
*/
const connectAll = (fsms, i, substate) => {
  const result = [{i, substate}]
  while (i < fsms.length - 1 && fsms[i].hasFinalState(substate)) {
    i += 1
    substate = fsms[i].initial
    result.push({i, substate})
  }
  return result
}

/**
  Concatenate arbitrarily many finite state machines together.
*/
const concatenate = fsms => {
  const alphabet = unifyAlphabets(fsms.map(fsm => fsm.alphabet))

  fsms = [epsilon(alphabet)].concat(fsms)

  // Use a superset containing states from all FSMs at once.
  // We start at the start of the first FSM. If this state is final in the
  // first FSM, then we are also at the start of the second FSM. And so on.
  const initial = connectAll(fsms, 0, fsms[0].initial)

  // If you're in a final state of the final FSM, it's final
  const isFinal = state => state.some(pair =>
    pair.i === fsms.length - 1 &&
    fsms[pair.i].hasFinalState(pair.substate)
  )

  /**
    Follow the collection of states through all FSMs at once, jumping to the
    next FSM if we reach the end of the current one
    TODO: improve all follow() implementations to allow for dead metastates?
  */
  const follow = (current, symbol) => {
    let next = []
    current.forEach(pair => {
      const i = pair.i
      const substate = pair.substate
      if (fsms[i].alphabet.includes(symbol)) {
        connectAll(fsms, i, fsms[i].follow(substate, symbol)).forEach(nextsubstate => {
          if (!next.some(x =>
            x.i === i &&
            x.substate === nextsubstate.substate
          )) {
            next.push(nextsubstate)
          }
        })
      }
    })

    next = next.filter(pair => pair.substate !== oblivionState)

    return next.length === 0 ? oblivionState : next
  }

  return crawl(alphabet, initial, isFinal, follow)
}

/**
  Given an FSM and a multiplier, return the multiplied FSM.
*/
const multiply = (x, multiplier) =>
  multiplier === 0 ? epsilon(x.alphabet)
  : concatenate(Array(multiplier).fill(x))

// TODO: alphabet should be an object with keys, easier to iterate
// over.

/**
  If the present FSM accepts X, returns an FSM accepting X* (i.e. 0 or
  more Xes). This is NOT as simple as naively connecting the final states
  back to the initial state: see (b*ab)* for example.
*/
const star = fsm => {
  const alphabet = fsm.alphabet

  const initial = [fsm.initial]

  const follow = (state, symbol) => {
    let next = []
    state.forEach(substate => {
      const nextsubstate = fsm.follow(substate, symbol)
      if (!next.includes(nextsubstate)) {
        next.push(nextsubstate)
      }

      // If one of our substates is final, then we can also consider
      // transitions from the initial state of the original FSM.
      if (fsm.hasFinalState(substate)) {
        const nextsubstate2 = fsm.follow(initial, symbol)
        if (!next.includes(nextsubstate2)) {
          next.push(nextsubstate2)
        }
      }
    })

    next = next.filter(substate => substate !== oblivionState)

    if (next.length === 0) {
      return oblivionState
    }

    return next
  }

  const isFinal = state => state.some(fsm.hasFinalState)

  return union([epsilon(alphabet), crawl(alphabet, initial, isFinal, follow)])
}

module.exports = {fsm, star, anythingElse, epsilon, nothing, concatenate, intersection, crawl, union, multiply, _connectAll: connectAll}
