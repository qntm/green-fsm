/* eslint-env mocha */

import assert from 'assert'
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
      '0',
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
      '0',
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
      it('rejects if initial isn\'t a state', () => {
        assert.throws(() => {
          fsm([], [], '1', [], {})
        })
      })

      it('rejects if final isn\'t a state', () => {
        assert.throws(() => {
          fsm([], ['1'], '1', ['2'], {})
        })
      })

      it('rejects if alphabet has dupes', () => {
        assert.throws(() => {
          fsm(['a', 'a'], ['1'], '1', [], {})
        })
      })

      it('rejects invalid transition', () => {
        assert.throws(() => {
          fsm(['a'], ['1'], '1', [], { 1: { a: '2' } })
        })
      })
    })
  })

  describe('toString', () => {
    it('works', () => {
      assert.deepStrictEqual(a.toString(), [
        '  name final? a  b  \n',
        '--------------------\n',
        '* 0    false  1  ob \n',
        '  1    true   ob ob \n',
        '  ob   false  ob ob \n'
      ].join(''))
    })

    it('handles ANYTHING_ELSE and OBLIVION_STATE', () => {
      assert.deepStrictEqual(fsm([ANYTHING_ELSE], ['0'], '0', [], {}).toString(), [
        '  name final? @@ANYTHING_ELSE \n',
        '------------------------------\n',
        '* 0    false                  \n'
      ].join(''))
    })
  })

  describe('accepts', () => {
    it('a', () => {
      assert.deepStrictEqual(a.accepts([]), false)
      assert.deepStrictEqual(a.accepts(['a']), true)
      assert.deepStrictEqual(a.accepts(['b']), false)
    })

    it('b', () => {
      assert.deepStrictEqual(b.accepts([]), false)
      assert.deepStrictEqual(b.accepts(['a']), false)
      assert.deepStrictEqual(b.accepts(['b']), true)
    })

    it('advanced', () => {
      // This is (a|b)*a(a|b)
      const brzozowski = fsm(
        ['a', 'b'],
        ['A', 'B', 'C', 'D', 'E'],
        'A',
        ['C', 'E'],
        {
          A: { a: 'B', b: 'D' },
          B: { a: 'C', b: 'E' },
          C: { a: 'C', b: 'E' },
          D: { a: 'B', b: 'D' },
          E: { a: 'B', b: 'D' }
        }
      )
      assert.deepStrictEqual(brzozowski.accepts(['a', 'a']), true)
      assert.deepStrictEqual(brzozowski.accepts(['a', 'b']), true)
      assert.deepStrictEqual(brzozowski.accepts(['a', 'a', 'b']), true)
      assert.deepStrictEqual(brzozowski.accepts(['b', 'a', 'b']), true)
      assert.deepStrictEqual(brzozowski.accepts(['a', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'a', 'b']), true)
      assert.deepStrictEqual(brzozowski.accepts([]), false)
      assert.deepStrictEqual(brzozowski.accepts(['a']), false)
      assert.deepStrictEqual(brzozowski.accepts(['b']), false)
      assert.deepStrictEqual(brzozowski.accepts(['b', 'a']), false)
      assert.deepStrictEqual(brzozowski.accepts(['b', 'b']), false)
      assert.deepStrictEqual(brzozowski.accepts(['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b']), false)
    })

    it('binary multiples of 3', () => {
      // Disallows the empty string
      // Allows "0" on its own, but not leading zeroes.
      const div3 = fsm(
        ['0', '1'],
        ['initial', 'zero', '0', '1', '2', 'oblivion'],
        'initial',
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
      assert.deepStrictEqual(div3.accepts([]), false)
      assert.deepStrictEqual(div3.accepts(['0']), true)
      assert.deepStrictEqual(div3.accepts(['1']), false)
      assert.deepStrictEqual(div3.accepts(['0', '0']), false)
      assert.deepStrictEqual(div3.accepts(['0', '1']), false)
      assert.deepStrictEqual(div3.accepts(['1', '0']), false)
      assert.deepStrictEqual(div3.accepts(['1', '1']), true)
      assert.deepStrictEqual(div3.accepts(['0', '0', '0']), false)
      assert.deepStrictEqual(div3.accepts(['0', '0', '1']), false)
      assert.deepStrictEqual(div3.accepts(['0', '1', '0']), false)
      assert.deepStrictEqual(div3.accepts(['0', '1', '1']), false)
      assert.deepStrictEqual(div3.accepts(['1', '0', '0']), false)
      assert.deepStrictEqual(div3.accepts(['1', '0', '1']), false)
      assert.deepStrictEqual(div3.accepts(['1', '1', '0']), true)
      assert.deepStrictEqual(div3.accepts(['1', '1', '1']), false)
      assert.deepStrictEqual(div3.accepts(['0', '0', '0', '0']), false)
      assert.deepStrictEqual(div3.accepts(['0', '0', '0', '1']), false)
      assert.deepStrictEqual(div3.accepts(['0', '0', '1', '0']), false)
      assert.deepStrictEqual(div3.accepts(['0', '0', '1', '1']), false)
      assert.deepStrictEqual(div3.accepts(['0', '1', '0', '0']), false)
      assert.deepStrictEqual(div3.accepts(['0', '1', '0', '1']), false)
      assert.deepStrictEqual(div3.accepts(['0', '1', '1', '0']), false)
      assert.deepStrictEqual(div3.accepts(['0', '1', '1', '1']), false)
      assert.deepStrictEqual(div3.accepts(['1', '0', '0', '0']), false)
      assert.deepStrictEqual(div3.accepts(['1', '0', '0', '1']), true)
    })

    it('accepts anything else', () => {
      assert.deepStrictEqual(fsm(
        ['a', 'b', 'c', ANYTHING_ELSE],
        ['1'],
        '1',
        ['1'],
        {
          1: { a: '1', b: '1', c: '1', [ANYTHING_ELSE]: '1' }
        }
      ).accepts(['d']), true)
    })

    it('nothing', () => {
      assert.deepStrictEqual(nothing(['a']).accepts([]), false)
      assert.deepStrictEqual(nothing(['a']).accepts(['a']), false)
    })

    it('epsilon', () => {
      assert.deepStrictEqual(epsilon(['a']).accepts([]), true)
      assert.deepStrictEqual(epsilon(['a']).accepts(['a']), false)
    })
  })

  describe('strings', () => {
    it('blockquote', () => {
      const blockquote = fsm(
        ['/', '*', ANYTHING_ELSE],
        ['0', '1', '2', '3', '4', '5'],
        '0',
        ['4'],
        {
          0: { '/': '1' },
          1: { '*': '2' },
          2: { '/': '2', [ANYTHING_ELSE]: '2', '*': '3' },
          3: { '/': '4', [ANYTHING_ELSE]: '2', '*': '3' }
        }
      )
      assert.deepStrictEqual(blockquote.accepts(['/', '*', 'whatever', '*', '/']), true)
      assert.deepStrictEqual(blockquote.accepts(['*', '*', 'whatever', '*', '/']), false)
      const gen = blockquote.strings()
      assert.deepStrictEqual(gen.next().value, ['/', '*', '*', '/'])
    })

    it('nothing', () => {
      const gen = nothing(['a', 'b']).strings()
      assert.deepStrictEqual(gen.next().done, true)
    })

    it('epsilon', () => {
      const gen = epsilon(['a', 'b']).strings()
      assert.deepStrictEqual(gen.next().value, [])
      assert.deepStrictEqual(gen.next().done, true)
    })

    it('epsilon over an empty alphabet', () => {
      const gen = epsilon([]).strings()
      assert.deepStrictEqual(gen.next().value, [])
      assert.deepStrictEqual(gen.next().done, true)
    })

    it('A', () => {
      const gen = a.strings()
      assert.deepStrictEqual(gen.next().value, ['a'])
      assert.deepStrictEqual(gen.next().done, true)
    })

    it('AAA', () => {
      const gen = concatenate([a, a, a]).strings()
      assert.deepStrictEqual(gen.next().value, ['a', 'a', 'a'])
      assert.deepStrictEqual(gen.next().done, true)
    })

    it('BAB', () => {
      const gen = concatenate([b, a, b]).strings()
      assert.deepStrictEqual(gen.next().value, ['b', 'a', 'b'])
      assert.deepStrictEqual(gen.next().done, true)
    })
  })

  describe('_connectAll', () => {
    it('works', () => {
      const empty = epsilon(['a'])
      assert.deepStrictEqual(_connectAll([empty], 0, empty.initial), [
        { i: 0, substate: empty.initial }
      ])
    })

    it('works A', () => {
      assert.deepStrictEqual(_connectAll([a], 0, a.initial), [
        { i: 0, substate: a.initial }
      ])
    })

    it('works too', () => {
      const empty = epsilon(['a'])
      assert.deepStrictEqual(_connectAll([empty, a], 0, empty.initial), [
        { i: 0, substate: empty.initial },
        { i: 1, substate: a.initial }
      ])
    })

    it('works three', () => {
      const empty = epsilon(['a'])
      assert.deepStrictEqual(_connectAll([empty, empty, a], 0, empty.initial), [
        { i: 0, substate: empty.initial },
        { i: 1, substate: empty.initial },
        { i: 2, substate: a.initial }
      ])
    })
  })

  describe('_getLiveStates', () => {
    it('works', () => {
      assert.deepStrictEqual(a._getLiveStates(), { 0: true, 1: true })
    })
  })

  describe('concatenate', () => {
    it('A and A', () => {
      const concAA = concatenate([a, a])
      assert.deepStrictEqual(concAA.accepts([]), false)
      assert.deepStrictEqual(concAA.accepts(['a']), false)
      assert.deepStrictEqual(concAA.accepts(['a', 'a']), true)
      assert.deepStrictEqual(concAA.accepts(['a', 'a', 'a']), false)
    })

    it('epsilon, A and A', () => {
      const concAA2 = concatenate([epsilon(['a', 'b']), a, a])
      assert.deepStrictEqual(concAA2.accepts([]), false)
      assert.deepStrictEqual(concAA2.accepts(['a']), false)
      assert.deepStrictEqual(concAA2.accepts(['a', 'a']), true)
      assert.deepStrictEqual(concAA2.accepts(['a', 'a', 'a']), false)
    })

    it('A and B', () => {
      const concAB = concatenate([a, b])
      assert.deepStrictEqual(concAB.accepts([]), false)
      assert.deepStrictEqual(concAB.accepts(['a']), false)
      assert.deepStrictEqual(concAB.accepts(['b']), false)
      assert.deepStrictEqual(concAB.accepts(['a', 'a']), false)
      assert.deepStrictEqual(concAB.accepts(['a', 'b']), true)
      assert.deepStrictEqual(concAB.accepts(['b', 'a']), false)
      assert.deepStrictEqual(concAB.accepts(['b', 'b']), false)
    })

    it('unifies alphabets properly', () => {
      // Thanks to sparse maps it should now be possible to compute the union of FSMs
      // with disagreeing alphabets!
      const a = fsm(['a'], ['0', '1'], '0', ['1'], { 0: { a: '1' } })
      const b = fsm(['b'], ['0', '1'], '0', ['1'], { 0: { b: '1' } })
      assert.deepStrictEqual(concatenate([a, b]).accepts(['a', 'b']), true)
    })

    it('defect', () => {
      // This exposes a defect in concatenate.
      assert.deepStrictEqual(concatenate([a, epsilon(['a', 'b']), a]).accepts(['a', 'a']), true)
      assert.deepStrictEqual(concatenate([a, epsilon(['a']), a]).accepts(['a', 'a']), true)
      assert.deepStrictEqual(concatenate([a, epsilon(['a', 'b']), epsilon(['a', 'b']), a]).accepts(['a', 'a']), true)
      assert.deepStrictEqual(concatenate([a, epsilon(['a']), epsilon(['a']), a]).accepts(['a', 'a']), true)
    })

    // Odd bug with concatenate(), exposed by "[bc]*c"
    describe('odd bug', () => {
      let int5A
      let int5B
      beforeEach(() => {
        int5A = fsm(
          ['a', 'b', 'c', ANYTHING_ELSE],
          ['0', '1'],
          '1',
          ['1'],
          {
            0: { [ANYTHING_ELSE]: '0', a: '0', b: '0', c: '0' },
            1: { [ANYTHING_ELSE]: '0', a: '0', b: '1', c: '1' }
          }
        )

        int5B = fsm(
          ['a', 'b', 'c', ANYTHING_ELSE],
          ['0', '1', '2'],
          '1',
          ['0'],
          {
            0: { [ANYTHING_ELSE]: '2', a: '2', b: '2', c: '2' },
            1: { [ANYTHING_ELSE]: '2', a: '2', b: '2', c: '0' },
            2: { [ANYTHING_ELSE]: '2', a: '2', b: '2', c: '2' }
          }
        )
      })

      it('int5A works', () => {
        assert.deepStrictEqual(int5A.accepts([]), true)
      })

      it('int5B works', () => {
        assert.deepStrictEqual(int5B.accepts(['c']), true)
      })

      it('int5C works', () => {
        const int5C = concatenate([int5A, int5B])
        assert.deepStrictEqual(int5C.accepts(['c']), true)
      })
    })

    it('should not create new oblivion states', () => {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        '0',
        ['3'],
        {
          0: { a: '1' },
          1: { b: '2' },
          2: { c: '3' }
        }
      )
      assert.deepStrictEqual(abc.states.length, 4)
      assert.deepStrictEqual(concatenate([abc, abc]).states.length, 7)
    })
  })

  describe('union', () => {
    it('A or B', () => {
      const aorb = union([a, b])
      assert.deepStrictEqual(aorb.accepts([]), false)
      assert.deepStrictEqual(aorb.accepts(['a']), true)
      assert.deepStrictEqual(aorb.accepts(['b']), true)
      assert.deepStrictEqual(aorb.accepts(['a', 'a']), false)
      assert.deepStrictEqual(aorb.accepts(['a', 'b']), false)
      assert.deepStrictEqual(aorb.accepts(['b', 'a']), false)
      assert.deepStrictEqual(aorb.accepts(['b', 'b']), false)
    })

    it('epsilon or A', () => {
      const eora = union([epsilon(['a']), a])
      assert.deepStrictEqual(eora.accepts([]), true)
      assert.deepStrictEqual(eora.accepts(['a']), true)
      assert.deepStrictEqual(eora.accepts(['b']), false)
      assert.deepStrictEqual(eora.accepts(['a', 'a']), false)
      assert.deepStrictEqual(eora.accepts(['a', 'b']), false)
      assert.deepStrictEqual(eora.accepts(['b', 'a']), false)
      assert.deepStrictEqual(eora.accepts(['b', 'b']), false)
    })

    it('A or nothing', () => {
      const aornothing = union([a, nothing(['a', 'b'])])
      assert.deepStrictEqual(aornothing.accepts([]), false)
      assert.deepStrictEqual(aornothing.accepts(['a']), true)
    })

    it('unifies alphabets properly', () => {
      // Thanks to sparse maps it should now be possible to compute the union of FSMs
      // with disagreeing alphabets!
      const a = fsm(['a'], ['0', '1'], '0', ['1'], { 0: { a: '1' } })
      const b = fsm(['b'], ['0', '1'], '0', ['1'], { 0: { b: '1' } })
      assert.deepStrictEqual(union([a, b]).accepts(['a']), true)
      assert.deepStrictEqual(union([a, b]).accepts(['b']), true)
    })

    it('should not create new oblivion states', () => {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        '0',
        ['3'],
        {
          0: { a: '1' },
          1: { b: '2' },
          2: { c: '3' }
        }
      )
      assert.deepStrictEqual(union([abc, abc]).states.length, 4)
    })
  })

  describe('intersection', () => {
    it('works', () => {
      const astar = star(a)
      assert.deepStrictEqual(astar.accepts([]), true)
      assert.deepStrictEqual(astar.accepts(['a']), true)
      assert.deepStrictEqual(astar.accepts(['b']), false)

      const bstar = star(b)
      assert.deepStrictEqual(bstar.accepts([]), true)
      assert.deepStrictEqual(bstar.accepts(['a']), false)
      assert.deepStrictEqual(bstar.accepts(['b']), true)

      const both = intersection([astar, bstar])
      assert.deepStrictEqual(both.accepts([]), true)
      assert.deepStrictEqual(both.accepts(['a']), false)
      assert.deepStrictEqual(both.accepts(['b']), false)
      assert.throws(() => both.accepts([ANYTHING_ELSE]))
    })

    it('strange bug', () => {
      const abcdotdotdot = fsm(
        ['a', 'b', 'c', 'd', 'e', 'f', ANYTHING_ELSE],
        ['0', '1', '2', '3', '4', '5', '6'],
        '0',
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
        '0',
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
      assert.deepStrictEqual(abcdef.accepts(['b', 'b', 'c', 'd', 'e', 'f']), false)
    })

    it('stranger bug minus 1', () => {
      // /[01][01]00-00-00/ and /00.*/
      const yyyymmdd = fsm(
        ['0', '1', '-', ANYTHING_ELSE],
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        '0',
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
        '0',
        ['2', '3'],
        {
          0: { 0: '1' },
          1: { 0: '2' },
          2: { 0: '3', 1: '3', '-': '3' },
          3: { 0: '3', 1: '3', '-': '3' }
        }
      )

      assert.deepStrictEqual(intersection([yyyymmdd, nineteen]).accepts(['0', '0', '0', '0', '-', '0', '0', '-', '0', '0']), true)
    })

    it('stranger bug', () => {
      // /\d\d\d\d-\d\d-\d\d/ and /19.*/
      const yyyymmdd = fsm(
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', ANYTHING_ELSE],
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        '0',
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
        '0',
        ['2', '3'],
        {
          0: { 1: '1' },
          1: { 9: '2' },
          2: { 0: '3', 1: '3', 2: '3', 3: '3', 4: '3', 5: '3', 6: '3', 7: '3', 8: '3', 9: '3', '-': '3' },
          3: { 0: '3', 1: '3', 2: '3', 3: '3', 4: '3', 5: '3', 6: '3', 7: '3', 8: '3', 9: '3', '-': '3' }
        }
      )

      assert.deepStrictEqual(intersection([yyyymmdd, nineteen]).accepts(['1', '9', '9', '-', '9', '9', '-', '9', '9']), false)
      assert.deepStrictEqual(intersection([yyyymmdd, nineteen]).accepts(['1', '9', '9', '9', '-', '9', '9', '-', '9', '9']), true)
    })
  })

  describe('ANYTHING_ELSE', () => {
    it('works', () => {
      const any = fsm(
        [ANYTHING_ELSE],
        ['0', '1'],
        '0',
        ['1'],
        {
          0: { [ANYTHING_ELSE]: '1' }
        }
      )
      assert.deepStrictEqual(any.accepts([]), false)
      assert.deepStrictEqual(any.accepts(['a']), true)
      assert.deepStrictEqual(any.accepts(['b']), true)
      assert.deepStrictEqual(any.accepts([7453]), true)
      assert.deepStrictEqual(any.accepts([ANYTHING_ELSE]), true)
      assert.deepStrictEqual(any.accepts(['a', 'a']), false)
      assert.deepStrictEqual(any.accepts([ANYTHING_ELSE, ANYTHING_ELSE]), false)
    })
  })

  describe('star', () => {
    it('works', () => {
      const starA = star(a)
      assert.deepStrictEqual(starA.accepts([]), true)
      assert.deepStrictEqual(starA.accepts(['a']), true)
      assert.deepStrictEqual(starA.accepts(['b']), false)
      assert.deepStrictEqual(starA.accepts(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a']), true)
    })

    it('bug 28', () => {
      // This is ab*
      const abstar = fsm(
        ['a', 'b'],
        ['0', '1'],
        '0',
        ['1'],
        {
          0: { a: '1' },
          1: { b: '1' }
        }
      )
      assert.deepStrictEqual(abstar.accepts(['a']), true)
      assert.deepStrictEqual(abstar.accepts(['b']), false)
      assert.deepStrictEqual(abstar.accepts(['a', 'b']), true)
      assert.deepStrictEqual(abstar.accepts(['a', 'b', 'b']), true)

      // This is (ab*)* and it caused some defects.
      const abstarstar = star(abstar)
      assert.deepStrictEqual(abstarstar.accepts(['a']), true)
      assert.deepStrictEqual(abstarstar.accepts(['b']), false)
      assert.deepStrictEqual(abstarstar.accepts(['a', 'b']), true)
      assert.deepStrictEqual(abstarstar.accepts(['b', 'b']), false)
    })

    it('advanced', () => {
      // This is (a*ba)*. Naively connecting the final states to the initial state
      // gives the incorrect result here.
      const starred = star(fsm(
        ['a', 'b'],
        ['0', '1', '2', 'oblivion'],
        '0',
        ['2'],
        {
          0: { a: '0', b: '1' },
          1: { a: '2', b: 'oblivion' },
          2: { a: 'oblivion', b: 'oblivion' },
          oblivion: { a: 'oblivion', b: 'oblivion' }
        }
      ))
      assert.deepStrictEqual(starred.alphabet, ['a', 'b'])
      assert.deepStrictEqual(starred.accepts([]), true)
      assert.deepStrictEqual(starred.accepts(['a']), false)
      assert.deepStrictEqual(starred.accepts(['b']), false)
      assert.deepStrictEqual(starred.accepts(['a', 'a']), false)
      assert.deepStrictEqual(starred.accepts(['b', 'a']), true)
      assert.deepStrictEqual(starred.accepts(['a', 'b', 'a']), true)
      assert.deepStrictEqual(starred.accepts(['a', 'a', 'b', 'a']), true)
      assert.deepStrictEqual(starred.accepts(['a', 'a', 'b', 'b']), false)
      assert.deepStrictEqual(starred.accepts(['a', 'b', 'a', 'b', 'a', 'b', 'a']), true)
    })

    it('should not create new oblivion states', () => {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        '0',
        ['3'],
        {
          0: { a: '1' },
          1: { b: '2' },
          2: { c: '3' }
        }
      )
      assert.deepStrictEqual(star(abc).states.length, 4)
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
      assert.deepStrictEqual(zeroA.accepts([]), true)
      assert.deepStrictEqual(zeroA.accepts(['a']), false)
    })

    it('A by 1', () => {
      const oneA = multiply(a, 1)
      assert.deepStrictEqual(oneA.accepts([]), false)
      assert.deepStrictEqual(oneA.accepts(['a']), true)
      assert.deepStrictEqual(oneA.accepts(['a', 'a']), false)
    })

    it('A by 2', () => {
      const twoA = multiply(a, 2)
      assert.deepStrictEqual(twoA.accepts([]), false)
      assert.deepStrictEqual(twoA.accepts(['a']), false)
      assert.deepStrictEqual(twoA.accepts(['a', 'a']), true)
      assert.deepStrictEqual(twoA.accepts(['a', 'a', 'a']), false)
    })

    it('A by 7', () => {
      const sevenA = multiply(a, 7)
      assert.deepStrictEqual(sevenA.accepts(['a', 'a', 'a', 'a', 'a', 'a']), false)
      assert.deepStrictEqual(sevenA.accepts(['a', 'a', 'a', 'a', 'a', 'a', 'a']), true)
      assert.deepStrictEqual(sevenA.accepts(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a']), false)
    })

    it('(AB)?', () => {
      const unit = concatenate([a, b])

      // This is "(ab)?"
      const optional = union([epsilon([]), unit])
      assert.deepStrictEqual(optional.accepts([]), true)
      assert.deepStrictEqual(optional.accepts(['a']), false)
      assert.deepStrictEqual(optional.accepts(['b']), false)
      assert.deepStrictEqual(optional.accepts(['a', 'b']), true)
      assert.deepStrictEqual(optional.accepts(['a', 'a']), false)

      // This is "(ab)?(ab)?"
      const optional2 = multiply(optional, 2)
      assert.deepStrictEqual(optional2.accepts([]), true)
      assert.deepStrictEqual(optional2.accepts(['a']), false)
      assert.deepStrictEqual(optional2.accepts(['b']), false)
      assert.deepStrictEqual(optional2.accepts(['a', 'a']), false)
      assert.deepStrictEqual(optional2.accepts(['a', 'b']), true)
      assert.deepStrictEqual(optional2.accepts(['b', 'a']), false)
      assert.deepStrictEqual(optional2.accepts(['b', 'b']), false)
      assert.deepStrictEqual(optional2.accepts(['a', 'a', 'a']), false)
      assert.deepStrictEqual(optional2.accepts(['a', 'b', 'a', 'b']), true)
    })

    it('should not create new oblivion states', () => {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        '0',
        ['3'],
        {
          0: { a: '1' },
          1: { b: '2' },
          2: { c: '3' }
        }
      )
      assert.deepStrictEqual(multiply(abc, 3).states.length, 10)
    })
  })
})
