/**
  Finite state machine library.
*/

// Special alphabet value
export const ANYTHING_ELSE = Symbol('ANYTHING_ELSE')

// Special oblivion state
export const OBLIVION_STATE = Symbol('OBLIVION_STATE')

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
export class Fsm {
  /*
    `alphabet` is an array of symbols the FSM can be fed
    `states` is a non-empty array of states for the FSM
      the first state in the array is the initial state
    `finals` is an array of accepting states
    `map` may be sparse (i.e. it may omit transitions). In the case of
    omitted transitions, a non-final "oblivion" state is simulated.
  */
  constructor (finals, map, initial) {
    // Validation

    // Gather all the states and symbols in the alphabet
    const _alphabet = []
    const _states = [initial]

    let i = 0
    while (i in _states) {
      const state = _states[i]
      if (state in map) {
        Reflect.ownKeys(map[state]).forEach(symbol => {
          if (!_alphabet.includes(symbol)) {
            _alphabet.push(symbol)
          }
          if (!_states.includes(map[state][symbol])) {
            _states.push(map[state][symbol])
          }
        })
      }
      i++
    }

    this.alphabet = _alphabet
    this.states = _states
    this.finals = finals
    this.map = map
    this.initial = initial

    this._liveStates = undefined
  }

  // `finals` becomes a function
  hasFinalState (state) {
    return this.finals.includes(state)
  }

  // `map` becomes a function
  follow (state, symbol) {
    if (state in this.map) {
      if (symbol in this.map[state]) {
        return this.map[state][symbol]
      }

      if (ANYTHING_ELSE in this.map[state]) {
        return this.map[state][ANYTHING_ELSE]
      }

      return OBLIVION_STATE
    }

    return OBLIVION_STATE
  }

  /**
    Test whether the present FSM accepts the supplied string (array of
    symbols). Equivalently, consider the FSM as a possibly-infinite set of
    strings and test whether the input string is a member of it.
    This is actually mainly used for unit testing purposes.
    If `ANYTHING_ELSE` is in your alphabet, then any symbol not in your
    alphabet will be converted to `ANYTHING_ELSE`.
  */
  accepts (input) {
    let state = this.initial
    for (const symbol of input) {
      state = this.follow(state, symbol)
    }
    return this.hasFinalState(state)
  }

  _getLiveStates () {
    if (this._liveStates === undefined) {
      const reverseMap = {}
      this.states.forEach(state => {
        if (state in this.map) {
          Reflect.ownKeys(this.map[state]).forEach(symbol => {
            const next = this.follow(state, symbol)
            if (!(next in reverseMap)) {
              reverseMap[next] = {}
            }
            reverseMap[next][state] = true
          })
        }
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

      this.finals.forEach(scan)

      this._liveStates = liveStates
    }

    return this._liveStates
  }

  _hasLiveState (state) {
    return state in this._getLiveStates()
  }

  toString () {
    const stringifyState = state =>
      state === OBLIVION_STATE ? '' : state
    const stringifySymbol = symbol =>
      symbol === ANYTHING_ELSE ? '@@ANYTHING_ELSE' : symbol

    let rows = [
      // top row
      [
        '',
        'name',
        'final?'
      ].concat(
        this.alphabet.map(stringifySymbol)
      )
    ].concat(
      // other rows
      this.states.map((state, i) => [
        i === 0 ? '->' : '',
        stringifyState(state),
        this.hasFinalState(state) ? 'true' : 'false'
      ].concat(
        this.alphabet.map(symbol =>
          stringifyState(this.follow(state, symbol))
        )
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
  }

  /**
    Generate strings (lists of symbols) that this FSM accepts. Since there may
    be infinitely many of these we use a generator instead of constructing a
    static list. Strings will be sorted in order of length and then lexically.
    This procedure uses arbitrary amounts of memory but is very fast. There
    may be more efficient ways to do this, that I haven't investigated yet.
  */
  strings () {
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
            return { done: true }
          }
          const string = strings[i]
          const cstring = string.cstring
          const cstate = string.cstate

          if (cstate in this.map) {
            Reflect.ownKeys(this.map[cstate]).forEach(symbol => {
              const nstate = this.follow(cstate, symbol)
              if (!this._hasLiveState(nstate)) {
                return
              }
              const nstring = cstring.concat([symbol])
              strings.push({
                cstring: nstring,
                cstate: nstate
              })
            })
          }

          if (this.hasFinalState(cstate)) {
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

/**
  An FSM accepting nothing (not even the empty string). This is
  demonstrates that this is possible, and is also extremely useful
  in some situations
*/
Fsm.NOTHING = new Fsm([], {}, 'A')

/**
  An FSM matching an empty string, "", only.
  This is very useful in many situations
*/
Fsm.EPSILON = new Fsm(['A'], {}, 'A')

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

  const initial = fsms.map(fsm => ({ fsm, substate: fsm.initial }))

  // dedicated function accepts a "superset" and returns the next "superset"
  // obtained by following this transition in the new FSM
  const follow = (state, symbol) => {
    const next = state
      .map(({ fsm, substate }) => ({ fsm, substate: fsm.follow(substate, symbol) }))
      .filter(({ substate }) => substate !== OBLIVION_STATE)

    return next.length === 0 ? OBLIVION_STATE : next
  }

  return crawl(alphabet, initial, isFinal, follow)
}

/**
  Alternation. Return a finite state machine which accepts any
  sequence of symbols that is accepted by any input FSM. If
  `fsms` is empty, the output FSM is `null`.
*/
export const union = fsms =>
  parallel(fsms, state => state.some(pair => pair.fsm.hasFinalState(pair.substate)))

/**
  Intersection.
*/
export const intersection = fsms =>
  parallel(fsms, state =>
    fsms.every(fsm => state.some(pair => pair.fsm === fsm && pair.fsm.hasFinalState(pair.substate)))
  )

/**
  Given the above conditions and instructions, crawl a new unknown FSM,
  mapping its states, final states and transitions. Return the new FSM.
  This is a pretty powerful procedure which could potentially go on
  forever if you supply an evil version of follow().
*/
export const crawl = (alphabet, initial, isFinal, follow) => {
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
      if (next === OBLIVION_STATE) {
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

  return new Fsm(finals, map, '0')
}

/**
  Take a state in the numbered FSM and return a set containing it, plus
  (if it's final) the first state from the next FSM, plus (if that's
  final) the first state from the next but one FSM, plus...
*/
export const _connectAll = (fsms, i, substate) => {
  const result = [{ i, substate }]
  while (i < fsms.length - 1 && fsms[i].hasFinalState(substate)) {
    i += 1
    substate = fsms[i].initial
    result.push({ i, substate })
  }
  return result
}

/**
  Concatenate arbitrarily many finite state machines together.
*/
export const concatenate = fsms => {
  const alphabet = unifyAlphabets(fsms.map(fsm => fsm.alphabet))

  // Use a superset containing states from all FSMs at once.
  // We start at the start of the first FSM. If this state is final in the
  // first FSM, then we are also at the start of the second FSM. And so on.
  const initial = _connectAll(fsms, 0, fsms[0].initial)

  // If you're in a final state of the final FSM, it's final
  const isFinal = state => state.some(({ i, substate }) =>
    i === fsms.length - 1 &&
    fsms[i].hasFinalState(substate)
  )

  /**
    Follow the collection of states through all FSMs at once, jumping to the
    next FSM if we reach the end of the current one
    TODO: improve all follow() implementations to allow for dead metastates?
  */
  const follow = (current, symbol) => {
    let next = []
    current.forEach(({ i, substate }) => {
      _connectAll(fsms, i, fsms[i].follow(substate, symbol)).forEach(nextsubstate => {
        if (!next.some(x =>
          x.i === i &&
          x.substate === nextsubstate.substate
        )) {
          next.push(nextsubstate)
        }
      })
    })

    next = next.filter(({ substate }) => substate !== OBLIVION_STATE)

    return next.length === 0 ? OBLIVION_STATE : next
  }

  return crawl(alphabet, initial, isFinal, follow)
}

/**
  Given an FSM and a multiplier, return the multiplied FSM.
*/
export const multiply = (x, multiplier) =>
  multiplier === 0
    ? Fsm.EPSILON
    : concatenate(Array(multiplier).fill(x))

// TODO: alphabet should be an object with keys, easier to iterate
// over.

/**
  If the present FSM accepts X, returns an FSM accepting X* (i.e. 0 or
  more Xes). This is NOT as simple as naively connecting the final states
  back to the initial state: see (b*ab)* for example.
*/
export const star = fsm => {
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

    next = next.filter(substate => substate !== OBLIVION_STATE)

    if (next.length === 0) {
      return OBLIVION_STATE
    }

    return next
  }

  const isFinal = state => state.some(fsm.hasFinalState, fsm)

  return union([Fsm.EPSILON, crawl(alphabet, initial, isFinal, follow)])
}
