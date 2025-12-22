import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:mocha'

import {
  fsm,
  star,
  ANYTHING_ELSE,
  epsilon,
  nothing,
  concatenate,
  intersection,
  union,
  multiply,
  _connectAll
} from '../src/main.js'

describe('fsm', () => {
  let a
  let b
  beforeEach(() => {
    a = fsm(
      ['a', 'b'],
      ['0', '1', 'ob'],
      ['1'],
      {
        0: { a: '1', b: 'ob' },
        1: { a: 'ob', b: 'ob' },
        ob: { a: 'ob', b: 'ob' }
      }
    )

    b = fsm(
      ['a', 'b'],
      ['0', '1', 'ob'],
      ['1'],
      {
        0: { a: 'ob', b: '1' },
        1: { a: 'ob', b: 'ob' },
        ob: { a: 'ob', b: 'ob' }
      }
    )
  })

  describe('constructor', () => {
    describe('rejects invalid inputs', () => {
      it('rejects if final isn\'t a state', () => {
        assert.throws(() => {
          fsm([], ['1'], ['2'], {})
        })
      })

      it('rejects if alphabet has dupes', () => {
        assert.throws(() => {
          fsm(['a', 'a'], ['1'], [], {})
        })
      })

      it('rejects invalid transition', () => {
        assert.throws(() => {
          fsm(['a'], ['1'], [], { 1: { a: '2' } })
        })
      })
    })
  })

  describe('toString', () => {
    it('works', () => {
      assert.deepEqual(a.toString(), [
        '  name final? a  b  \n',
        '--------------------\n',
        '* 0    false  1  ob \n',
        '  1    true   ob ob \n',
        '  ob   false  ob ob \n'
      ].join(''))
    })

    it('handles ANYTHING_ELSE and OBLIVION_STATE', () => {
      assert.deepEqual(fsm([ANYTHING_ELSE], ['0'], [], {}).toString(), [
        '  name final? @@ANYTHING_ELSE \n',
        '------------------------------\n',
        '* 0    false                  \n'
      ].join(''))
    })
  })

  describe('accepts', () => {
    it('a', () => {
      assert.deepEqual(a.accepts([]), false)
      assert.deepEqual(a.accepts(['a']), true)
      assert.deepEqual(a.accepts(['b']), false)
    })

    it('b', () => {
      assert.deepEqual(b.accepts([]), false)
      assert.deepEqual(b.accepts(['a']), false)
      assert.deepEqual(b.accepts(['b']), true)
    })

    it('advanced', () => {
      // This is (a|b)*a(a|b)
      const brzozowski = fsm(
        ['a', 'b'],
        ['A', 'B', 'C', 'D', 'E'],
        ['C', 'E'],
        {
          A: { a: 'B', b: 'D' },
          B: { a: 'C', b: 'E' },
          C: { a: 'C', b: 'E' },
          D: { a: 'B', b: 'D' },
          E: { a: 'B', b: 'D' }
        }
      )
      assert.deepEqual(brzozowski.accepts(['a', 'a']), true)
      assert.deepEqual(brzozowski.accepts(['a', 'b']), true)
      assert.deepEqual(brzozowski.accepts(['a', 'a', 'b']), true)
      assert.deepEqual(brzozowski.accepts(['b', 'a', 'b']), true)
      assert.deepEqual(brzozowski.accepts(['a', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'a', 'b']), true)
      assert.deepEqual(brzozowski.accepts([]), false)
      assert.deepEqual(brzozowski.accepts(['a']), false)
      assert.deepEqual(brzozowski.accepts(['b']), false)
      assert.deepEqual(brzozowski.accepts(['b', 'a']), false)
      assert.deepEqual(brzozowski.accepts(['b', 'b']), false)
      assert.deepEqual(brzozowski.accepts(['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b']), false)
    })

    it('binary multiples of 3', () => {
      // Disallows the empty string
      // Allows "0" on its own, but not leading zeroes.
      const div3 = fsm(
        ['0', '1'],
        ['initial', 'zero', '0', '1', '2', 'oblivion'],
        ['zero', '0'],
        {
          initial: { 0: 'zero', 1: '1' },
          zero: { 0: 'oblivion', 1: 'oblivion' },
          0: { 0: '0', 1: '1' },
          1: { 0: '2', 1: '0' },
          2: { 0: '1', 1: '2' },
          oblivion: { 0: 'oblivion', 1: 'oblivion' }
        }
      )
      assert.deepEqual(div3.accepts([]), false)
      assert.deepEqual(div3.accepts(['0']), true)
      assert.deepEqual(div3.accepts(['1']), false)
      assert.deepEqual(div3.accepts(['0', '0']), false)
      assert.deepEqual(div3.accepts(['0', '1']), false)
      assert.deepEqual(div3.accepts(['1', '0']), false)
      assert.deepEqual(div3.accepts(['1', '1']), true)
      assert.deepEqual(div3.accepts(['0', '0', '0']), false)
      assert.deepEqual(div3.accepts(['0', '0', '1']), false)
      assert.deepEqual(div3.accepts(['0', '1', '0']), false)
      assert.deepEqual(div3.accepts(['0', '1', '1']), false)
      assert.deepEqual(div3.accepts(['1', '0', '0']), false)
      assert.deepEqual(div3.accepts(['1', '0', '1']), false)
      assert.deepEqual(div3.accepts(['1', '1', '0']), true)
      assert.deepEqual(div3.accepts(['1', '1', '1']), false)
      assert.deepEqual(div3.accepts(['0', '0', '0', '0']), false)
      assert.deepEqual(div3.accepts(['0', '0', '0', '1']), false)
      assert.deepEqual(div3.accepts(['0', '0', '1', '0']), false)
      assert.deepEqual(div3.accepts(['0', '0', '1', '1']), false)
      assert.deepEqual(div3.accepts(['0', '1', '0', '0']), false)
      assert.deepEqual(div3.accepts(['0', '1', '0', '1']), false)
      assert.deepEqual(div3.accepts(['0', '1', '1', '0']), false)
      assert.deepEqual(div3.accepts(['0', '1', '1', '1']), false)
      assert.deepEqual(div3.accepts(['1', '0', '0', '0']), false)
      assert.deepEqual(div3.accepts(['1', '0', '0', '1']), true)
    })

    it('accepts anything else', () => {
      assert.deepEqual(fsm(
        ['a', 'b', 'c', ANYTHING_ELSE],
        ['1'],
        ['1'],
        {
          1: { a: '1', b: '1', c: '1', [ANYTHING_ELSE]: '1' }
        }
      ).accepts(['d']), true)
    })

    it('nothing', () => {
      assert.deepEqual(nothing(['a']).accepts([]), false)
      assert.deepEqual(nothing(['a']).accepts(['a']), false)
    })

    it('epsilon', () => {
      assert.deepEqual(epsilon(['a']).accepts([]), true)
      assert.deepEqual(epsilon(['a']).accepts(['a']), false)
    })
  })

  describe('strings', () => {
    it('blockquote', () => {
      const blockquote = fsm(
        ['/', '*', ANYTHING_ELSE],
        ['0', '1', '2', '3', '4', '5'],
        ['4'],
        {
          0: { '/': '1' },
          1: { '*': '2' },
          2: { '/': '2', [ANYTHING_ELSE]: '2', '*': '3' },
          3: { '/': '4', [ANYTHING_ELSE]: '2', '*': '3' }
        }
      )
      assert.deepEqual(blockquote.accepts(['/', '*', 'whatever', '*', '/']), true)
      assert.deepEqual(blockquote.accepts(['*', '*', 'whatever', '*', '/']), false)
      const gen = blockquote.strings()
      assert.deepEqual(gen.next().value, ['/', '*', '*', '/'])
    })

    it('nothing', () => {
      const gen = nothing(['a', 'b']).strings()
      assert.deepEqual(gen.next().done, true)
    })

    it('epsilon', () => {
      const gen = epsilon(['a', 'b']).strings()
      assert.deepEqual(gen.next().value, [])
      assert.deepEqual(gen.next().done, true)
    })

    it('epsilon over an empty alphabet', () => {
      const gen = epsilon([]).strings()
      assert.deepEqual(gen.next().value, [])
      assert.deepEqual(gen.next().done, true)
    })

    it('A', () => {
      const gen = a.strings()
      assert.deepEqual(gen.next().value, ['a'])
      assert.deepEqual(gen.next().done, true)
    })

    it('AAA', () => {
      const gen = concatenate([a, a, a]).strings()
      assert.deepEqual(gen.next().value, ['a', 'a', 'a'])
      assert.deepEqual(gen.next().done, true)
    })

    it('BAB', () => {
      const gen = concatenate([b, a, b]).strings()
      assert.deepEqual(gen.next().value, ['b', 'a', 'b'])
      assert.deepEqual(gen.next().done, true)
    })
  })

  describe('_connectAll', () => {
    it('works', () => {
      const empty = epsilon(['a'])
      assert.deepEqual(_connectAll([empty], 0, empty.states[0]), [
        { i: 0, substate: empty.states[0] }
      ])
    })

    it('works A', () => {
      assert.deepEqual(_connectAll([a], 0, a.states[0]), [
        { i: 0, substate: a.states[0] }
      ])
    })

    it('works too', () => {
      const empty = epsilon(['a'])
      assert.deepEqual(_connectAll([empty, a], 0, empty.states[0]), [
        { i: 0, substate: empty.states[0] },
        { i: 1, substate: a.states[0] }
      ])
    })

    it('works three', () => {
      const empty = epsilon(['a'])
      assert.deepEqual(_connectAll([empty, empty, a], 0, empty.states[0]), [
        { i: 0, substate: empty.states[0] },
        { i: 1, substate: empty.states[0] },
        { i: 2, substate: a.states[0] }
      ])
    })
  })

  describe('_getLiveStates', () => {
    it('works', () => {
      assert.deepEqual(a._getLiveStates(), { 0: true, 1: true })
    })
  })

  describe('concatenate', () => {
    it('A and A', () => {
      const concAA = concatenate([a, a])
      assert.deepEqual(concAA.accepts([]), false)
      assert.deepEqual(concAA.accepts(['a']), false)
      assert.deepEqual(concAA.accepts(['a', 'a']), true)
      assert.deepEqual(concAA.accepts(['a', 'a', 'a']), false)
    })

    it('epsilon, A and A', () => {
      const concAA2 = concatenate([epsilon(['a', 'b']), a, a])
      assert.deepEqual(concAA2.accepts([]), false)
      assert.deepEqual(concAA2.accepts(['a']), false)
      assert.deepEqual(concAA2.accepts(['a', 'a']), true)
      assert.deepEqual(concAA2.accepts(['a', 'a', 'a']), false)
    })

    it('A and B', () => {
      const concAB = concatenate([a, b])
      assert.deepEqual(concAB.accepts([]), false)
      assert.deepEqual(concAB.accepts(['a']), false)
      assert.deepEqual(concAB.accepts(['b']), false)
      assert.deepEqual(concAB.accepts(['a', 'a']), false)
      assert.deepEqual(concAB.accepts(['a', 'b']), true)
      assert.deepEqual(concAB.accepts(['b', 'a']), false)
      assert.deepEqual(concAB.accepts(['b', 'b']), false)
    })

    it('unifies alphabets properly', () => {
      // Thanks to sparse maps it should now be possible to compute the union of FSMs
      // with disagreeing alphabets!
      const a = fsm(['a'], ['0', '1'], ['1'], { 0: { a: '1' } })
      const b = fsm(['b'], ['0', '1'], ['1'], { 0: { b: '1' } })
      assert.deepEqual(concatenate([a, b]).accepts(['a', 'b']), true)
    })

    it('defect', () => {
      // This exposes a defect in concatenate.
      assert.deepEqual(concatenate([a, epsilon(['a', 'b']), a]).accepts(['a', 'a']), true)
      assert.deepEqual(concatenate([a, epsilon(['a']), a]).accepts(['a', 'a']), true)
      assert.deepEqual(concatenate([a, epsilon(['a', 'b']), epsilon(['a', 'b']), a]).accepts(['a', 'a']), true)
      assert.deepEqual(concatenate([a, epsilon(['a']), epsilon(['a']), a]).accepts(['a', 'a']), true)
    })

    // Odd bug with concatenate(), exposed by "[bc]*c"
    describe('odd bug', () => {
      let int5A
      let int5B
      beforeEach(() => {
        int5A = fsm(
          ['a', 'b', 'c', ANYTHING_ELSE],
          ['1', '0'],
          ['1'],
          {
            0: { [ANYTHING_ELSE]: '0', a: '0', b: '0', c: '0' },
            1: { [ANYTHING_ELSE]: '0', a: '0', b: '1', c: '1' }
          }
        )

        int5B = fsm(
          ['a', 'b', 'c', ANYTHING_ELSE],
          ['1', '0', '2'],
          ['0'],
          {
            0: { [ANYTHING_ELSE]: '2', a: '2', b: '2', c: '2' },
            1: { [ANYTHING_ELSE]: '2', a: '2', b: '2', c: '0' },
            2: { [ANYTHING_ELSE]: '2', a: '2', b: '2', c: '2' }
          }
        )
      })

      it('int5A works', () => {
        assert.deepEqual(int5A.accepts([]), true)
      })

      it('int5B works', () => {
        assert.deepEqual(int5B.accepts(['c']), true)
      })

      it('int5C works', () => {
        const int5C = concatenate([int5A, int5B])
        assert.deepEqual(int5C.accepts(['c']), true)
      })
    })

    it('should not create new oblivion states', () => {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        ['3'],
        {
          0: { a: '1' },
          1: { b: '2' },
          2: { c: '3' }
        }
      )
      assert.deepEqual(abc.states.length, 4)
      assert.deepEqual(concatenate([abc, abc]).states.length, 7)
    })
  })

  describe('union', () => {
    it('A or B', () => {
      const aorb = union([a, b])
      assert.deepEqual(aorb.accepts([]), false)
      assert.deepEqual(aorb.accepts(['a']), true)
      assert.deepEqual(aorb.accepts(['b']), true)
      assert.deepEqual(aorb.accepts(['a', 'a']), false)
      assert.deepEqual(aorb.accepts(['a', 'b']), false)
      assert.deepEqual(aorb.accepts(['b', 'a']), false)
      assert.deepEqual(aorb.accepts(['b', 'b']), false)
    })

    it('epsilon or A', () => {
      const eora = union([epsilon(['a']), a])
      assert.deepEqual(eora.accepts([]), true)
      assert.deepEqual(eora.accepts(['a']), true)
      assert.deepEqual(eora.accepts(['b']), false)
      assert.deepEqual(eora.accepts(['a', 'a']), false)
      assert.deepEqual(eora.accepts(['a', 'b']), false)
      assert.deepEqual(eora.accepts(['b', 'a']), false)
      assert.deepEqual(eora.accepts(['b', 'b']), false)
    })

    it('A or nothing', () => {
      const aornothing = union([a, nothing(['a', 'b'])])
      assert.deepEqual(aornothing.accepts([]), false)
      assert.deepEqual(aornothing.accepts(['a']), true)
    })

    it('unifies alphabets properly', () => {
      // Thanks to sparse maps it should now be possible to compute the union of FSMs
      // with disagreeing alphabets!
      const a = fsm(['a'], ['0', '1'], ['1'], { 0: { a: '1' } })
      const b = fsm(['b'], ['0', '1'], ['1'], { 0: { b: '1' } })
      assert.deepEqual(union([a, b]).accepts(['a']), true)
      assert.deepEqual(union([a, b]).accepts(['b']), true)
    })

    it('should not create new oblivion states', () => {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        ['3'],
        {
          0: { a: '1' },
          1: { b: '2' },
          2: { c: '3' }
        }
      )
      assert.deepEqual(union([abc, abc]).states.length, 4)
    })
  })

  describe('intersection', () => {
    it('works', () => {
      const astar = star(a)
      assert.deepEqual(astar.accepts([]), true)
      assert.deepEqual(astar.accepts(['a']), true)
      assert.deepEqual(astar.accepts(['b']), false)

      const bstar = star(b)
      assert.deepEqual(bstar.accepts([]), true)
      assert.deepEqual(bstar.accepts(['a']), false)
      assert.deepEqual(bstar.accepts(['b']), true)

      const both = intersection([astar, bstar])
      assert.deepEqual(both.accepts([]), true)
      assert.deepEqual(both.accepts(['a']), false)
      assert.deepEqual(both.accepts(['b']), false)
      assert.throws(() => both.accepts([ANYTHING_ELSE]))
    })

    it('strange bug', () => {
      const abcdotdotdot = fsm(
        ['a', 'b', 'c', 'd', 'e', 'f', ANYTHING_ELSE],
        ['0', '1', '2', '3', '4', '5', '6'],
        ['6'],
        {
          0: { a: '1' },
          1: { b: '2' },
          2: { c: '3' },
          3: { a: '4', b: '4', c: '4', d: '4', e: '4', f: '4', [ANYTHING_ELSE]: '4' },
          4: { a: '5', b: '5', c: '5', d: '5', e: '5', f: '5', [ANYTHING_ELSE]: '5' },
          5: { a: '6', b: '6', c: '6', d: '6', e: '6', f: '6', [ANYTHING_ELSE]: '6' },
          6: {}
        }
      )

      const dotdotdotdef = fsm(
        ['a', 'b', 'c', 'd', 'e', 'f', ANYTHING_ELSE],
        ['0', '1', '2', '3', '4', '5', '6'],
        ['6'],
        {
          0: { a: '1', b: '1', c: '1', d: '1', e: '1', f: '1', [ANYTHING_ELSE]: '1' },
          1: { a: '2', b: '2', c: '2', d: '2', e: '2', f: '2', [ANYTHING_ELSE]: '2' },
          2: { a: '3', b: '3', c: '3', d: '3', e: '3', f: '3', [ANYTHING_ELSE]: '3' },
          3: { d: '4' },
          4: { e: '5' },
          5: { f: '6' },
          6: {}
        }
      )
      const abcdef = intersection([abcdotdotdot, dotdotdotdef])
      assert.deepEqual(abcdef.accepts(['b', 'b', 'c', 'd', 'e', 'f']), false)
    })

    it('stranger bug minus 1', () => {
      // /[01][01]00-00-00/ and /00.*/
      const yyyymmdd = fsm(
        ['0', '1', '-', ANYTHING_ELSE],
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        ['10'],
        {
          0: { 0: '1', 1: '1' },
          1: { 0: '2', 1: '2' },
          2: { 0: '3' },
          3: { 0: '4' },
          4: { '-': '5' },
          5: { 0: '6' },
          6: { 0: '7' },
          7: { '-': '8' },
          8: { 0: '9' },
          9: { 0: '10' },
          10: {}
        }
      )

      const nineteen = fsm(
        ['0', '1', '-', ANYTHING_ELSE],
        ['0', '1', '2', '3'],
        ['2', '3'],
        {
          0: { 0: '1' },
          1: { 0: '2' },
          2: { 0: '3', 1: '3', '-': '3' },
          3: { 0: '3', 1: '3', '-': '3' }
        }
      )

      assert.deepEqual(intersection([yyyymmdd, nineteen]).accepts(['0', '0', '0', '0', '-', '0', '0', '-', '0', '0']), true)
    })

    it('stranger bug', () => {
      // /\d\d\d\d-\d\d-\d\d/ and /19.*/
      const yyyymmdd = fsm(
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', ANYTHING_ELSE],
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        ['10'],
        {
          0: { 0: '1', 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1' },
          1: { 0: '2', 1: '2', 2: '2', 3: '2', 4: '2', 5: '2', 6: '2', 7: '2', 8: '2', 9: '2' },
          2: { 0: '3', 1: '3', 2: '3', 3: '3', 4: '3', 5: '3', 6: '3', 7: '3', 8: '3', 9: '3' },
          3: { 0: '4', 1: '4', 2: '4', 3: '4', 4: '4', 5: '4', 6: '4', 7: '4', 8: '4', 9: '4' },
          4: { '-': '5' },
          5: { 0: '6', 1: '6', 2: '6', 3: '6', 4: '6', 5: '6', 6: '6', 7: '6', 8: '6', 9: '6' },
          6: { 0: '7', 1: '7', 2: '7', 3: '7', 4: '7', 5: '7', 6: '7', 7: '7', 8: '7', 9: '7' },
          7: { '-': '8' },
          8: { 0: '9', 1: '9', 2: '9', 3: '9', 4: '9', 5: '9', 6: '9', 7: '9', 8: '9', 9: '9' },
          9: { 0: '10', 1: '10', 2: '10', 3: '10', 4: '10', 5: '10', 6: '10', 7: '10', 8: '10', 9: '10' },
          10: {}
        }
      )

      const nineteen = fsm(
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', ANYTHING_ELSE],
        ['0', '1', '2', '3'],
        ['2', '3'],
        {
          0: { 1: '1' },
          1: { 9: '2' },
          2: { 0: '3', 1: '3', 2: '3', 3: '3', 4: '3', 5: '3', 6: '3', 7: '3', 8: '3', 9: '3', '-': '3' },
          3: { 0: '3', 1: '3', 2: '3', 3: '3', 4: '3', 5: '3', 6: '3', 7: '3', 8: '3', 9: '3', '-': '3' }
        }
      )

      assert.deepEqual(intersection([yyyymmdd, nineteen]).accepts(['1', '9', '9', '-', '9', '9', '-', '9', '9']), false)
      assert.deepEqual(intersection([yyyymmdd, nineteen]).accepts(['1', '9', '9', '9', '-', '9', '9', '-', '9', '9']), true)
    })
  })

  describe('ANYTHING_ELSE', () => {
    it('works', () => {
      const any = fsm(
        [ANYTHING_ELSE],
        ['0', '1'],
        ['1'],
        {
          0: { [ANYTHING_ELSE]: '1' }
        }
      )
      assert.deepEqual(any.accepts([]), false)
      assert.deepEqual(any.accepts(['a']), true)
      assert.deepEqual(any.accepts(['b']), true)
      assert.deepEqual(any.accepts([7453]), true)
      assert.deepEqual(any.accepts([ANYTHING_ELSE]), true)
      assert.deepEqual(any.accepts(['a', 'a']), false)
      assert.deepEqual(any.accepts([ANYTHING_ELSE, ANYTHING_ELSE]), false)
    })
  })

  describe('star', () => {
    it('works', () => {
      const starA = star(a)
      assert.deepEqual(starA.accepts([]), true)
      assert.deepEqual(starA.accepts(['a']), true)
      assert.deepEqual(starA.accepts(['b']), false)
      assert.deepEqual(starA.accepts(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a']), true)
    })

    it('bug 28', () => {
      // This is ab*
      const abstar = fsm(
        ['a', 'b'],
        ['0', '1'],
        ['1'],
        {
          0: { a: '1' },
          1: { b: '1' }
        }
      )
      assert.deepEqual(abstar.accepts(['a']), true)
      assert.deepEqual(abstar.accepts(['b']), false)
      assert.deepEqual(abstar.accepts(['a', 'b']), true)
      assert.deepEqual(abstar.accepts(['a', 'b', 'b']), true)

      // This is (ab*)* and it caused some defects.
      const abstarstar = star(abstar)
      assert.deepEqual(abstarstar.accepts(['a']), true)
      assert.deepEqual(abstarstar.accepts(['b']), false)
      assert.deepEqual(abstarstar.accepts(['a', 'b']), true)
      assert.deepEqual(abstarstar.accepts(['b', 'b']), false)
    })

    it('advanced', () => {
      // This is (a*ba)*. Naively connecting the final states to the initial state
      // gives the incorrect result here.
      const starred = star(fsm(
        ['a', 'b'],
        ['0', '1', '2', 'oblivion'],
        ['2'],
        {
          0: { a: '0', b: '1' },
          1: { a: '2', b: 'oblivion' },
          2: { a: 'oblivion', b: 'oblivion' },
          oblivion: { a: 'oblivion', b: 'oblivion' }
        }
      ))
      assert.deepEqual(starred.alphabet, ['a', 'b'])
      assert.deepEqual(starred.accepts([]), true)
      assert.deepEqual(starred.accepts(['a']), false)
      assert.deepEqual(starred.accepts(['b']), false)
      assert.deepEqual(starred.accepts(['a', 'a']), false)
      assert.deepEqual(starred.accepts(['b', 'a']), true)
      assert.deepEqual(starred.accepts(['a', 'b', 'a']), true)
      assert.deepEqual(starred.accepts(['a', 'a', 'b', 'a']), true)
      assert.deepEqual(starred.accepts(['a', 'a', 'b', 'b']), false)
      assert.deepEqual(starred.accepts(['a', 'b', 'a', 'b', 'a', 'b', 'a']), true)
    })

    it('should not create new oblivion states', () => {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        ['3'],
        {
          0: { a: '1' },
          1: { b: '2' },
          2: { c: '3' }
        }
      )
      assert.deepEqual(star(abc).states.length, 4)
    })
  })

  describe('multiply', () => {
    it('rejects bad multipliers', () => {
      assert.throws(() => {
        multiply(a, -1)
      })
    })

    it('A by 0', () => {
      const zeroA = multiply(a, 0)
      assert.deepEqual(zeroA.accepts([]), true)
      assert.deepEqual(zeroA.accepts(['a']), false)
    })

    it('A by 1', () => {
      const oneA = multiply(a, 1)
      assert.deepEqual(oneA.accepts([]), false)
      assert.deepEqual(oneA.accepts(['a']), true)
      assert.deepEqual(oneA.accepts(['a', 'a']), false)
    })

    it('A by 2', () => {
      const twoA = multiply(a, 2)
      assert.deepEqual(twoA.accepts([]), false)
      assert.deepEqual(twoA.accepts(['a']), false)
      assert.deepEqual(twoA.accepts(['a', 'a']), true)
      assert.deepEqual(twoA.accepts(['a', 'a', 'a']), false)
    })

    it('A by 7', () => {
      const sevenA = multiply(a, 7)
      assert.deepEqual(sevenA.accepts(['a', 'a', 'a', 'a', 'a', 'a']), false)
      assert.deepEqual(sevenA.accepts(['a', 'a', 'a', 'a', 'a', 'a', 'a']), true)
      assert.deepEqual(sevenA.accepts(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a']), false)
    })

    it('(AB)?', () => {
      const unit = concatenate([a, b])

      // This is "(ab)?"
      const optional = union([epsilon([]), unit])
      assert.deepEqual(optional.accepts([]), true)
      assert.deepEqual(optional.accepts(['a']), false)
      assert.deepEqual(optional.accepts(['b']), false)
      assert.deepEqual(optional.accepts(['a', 'b']), true)
      assert.deepEqual(optional.accepts(['a', 'a']), false)

      // This is "(ab)?(ab)?"
      const optional2 = multiply(optional, 2)
      assert.deepEqual(optional2.accepts([]), true)
      assert.deepEqual(optional2.accepts(['a']), false)
      assert.deepEqual(optional2.accepts(['b']), false)
      assert.deepEqual(optional2.accepts(['a', 'a']), false)
      assert.deepEqual(optional2.accepts(['a', 'b']), true)
      assert.deepEqual(optional2.accepts(['b', 'a']), false)
      assert.deepEqual(optional2.accepts(['b', 'b']), false)
      assert.deepEqual(optional2.accepts(['a', 'a', 'a']), false)
      assert.deepEqual(optional2.accepts(['a', 'b', 'a', 'b']), true)
    })

    it('should not create new oblivion states', () => {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        ['3'],
        {
          0: { a: '1' },
          1: { b: '2' },
          2: { c: '3' }
        }
      )
      assert.deepEqual(multiply(abc, 3).states.length, 10)
    })
  })
})
