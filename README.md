# green-fsm

This is a small finite state machine library which I built mainly for my own use.

## Installation

```bash
npm install green-fsm
```

## Example

```js
import { fsm } from 'green-fsm'

const a = fsm(
  ['a', 'b'],   // alphabet
  ['0', '1'],   // states
  '0',          // initial state
  ['1'],        // final states
  {0: {a: '1'}} // transition map
)

console.log(a.accepts([]))         // false
console.log(a.accepts(['a']))      // true
console.log(a.accepts(['b']))      // false
console.log(a.accepts(['a', 'a'])) // false
console.log(a.accepts(['c']))      // throws exception
```

## API

`green-fsm` exposes the following properties and functions. These are a little up in the air right now.

### fsm(alphabet, states, initial, finals, map)

Build a finite state machine according to the supplied parameters. Symbols in the alphabet and states are used as keys in `Object`s, so they should be either `String`s or `Symbol`s.

`map` may be sparse. If a transition is missing from `map`, then it is assumed that this transition leads to an undocumented "oblivion state" which is not final. This oblivion state does not appear when the FSM is printed out.

The resulting object has some properties and methods on it.

#### alphabet
#### states
#### initial
#### finals
#### map

These are just the properties which were originally passed in.

#### follow(state, symbol)

Use this for preference over just looking up transitions in the `map` - it handles sparse transitions and suchlike correctly.

#### hasFinalState(state)

Use this to determine whether a given state is final in this FSM.

#### accepts(input)

`input` should be an array of symbols chosen from this FSM's alphabet. Returns a Boolean indicating whether the input is accepted.

#### toString()

Pretty-prints this FSM's structure.

#### strings()

Returns an object conforming to the iterator protocol. This means it has a single property, `next`, which is a function which can be called repeatedly. At first, calling `next` will return results of the form `{value, done: false}` where `value` is an accepted input of the FSM i.e. an array of symbols. If the FSM is finite, eventally results will take the form `{done: true}`.

### ANYTHING_ELSE

Ordinarily, you may only feed known alphabet symbols into the FSM. Any other symbol will result in an exception being thrown. However, if you add the special `Symbol` `ANYTHING_ELSE` to your alphabet, then any unrecognised symbol will be automatically converted into `ANYTHING_ELSE` before following whatever transition you have specified for this symbol.

### crawl(alphabet, initial, final, follow)

Crawl what is assumed to be an FSM and return a new finite state machine object representing it. Starts at state `initial`. At any given state, `crawl` calls `final(state)` to determine whether it is final. Then, for each symbol in `alphabet`, it calls `follow(state, symbol)` to try to discover new states. Obviously this procedure could go on for ever if your implementation of `follow` is faulty.

### OBLIVION_STATE

Your implementation of `follow` (above) may also return the special `Symbol` `OBLIVION_STATE` to indicate that you have reached an inescapable, non-final "oblivion state". This state and transitions to it will be omitted from the resulting FSM.

### nothing(alphabet)

Returns an FSM over the supplied alphabet which accepts no inputs at all.

### epsilon(alphabet)

Returns an FSM over the supplied alphabet which accepts only the empty input, `[]`.

### union(fsms)

Returns an FSM accepting all inputs accepted by any of the supplied input FSMs.

### intersection(fsms)

Returns an FSM accepting all inputs accepted by all of the supplied input FSMs.

### concatenate(fsms)

Returns an FSM accepting any input *a·b·...* where *a* is an input accepted by the first FSM, *b* is an input accepted by the second FSM, and so on.

### multiply(fsm, multiplier)

Returns an FSM equivalent to the concatenation of `multiplier` instances of the original FSM.

### star(fsm)

Kleene star closure. Turns an FSM accepting only `['a']` into one accepting any of `[]`, `['a']`, `['a', 'a']`, ...
