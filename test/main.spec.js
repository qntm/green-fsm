/* eslint-env jasmine */

'use strict'

const {fsm, star, anythingElse, epsilon, nothing, concatenate, intersection, crawl, union, multiply, _connectAll} = require('../src/main.js')

describe('fsm', function () {
  let a
  let b
  beforeEach(function () {
    a = fsm(
      ['a', 'b'],
      ['0', '1', 'ob'],
      '0',
      ['1'],
      {
        0: {a: '1', b: 'ob'},
        1: {a: 'ob', b: 'ob'},
        ob: {a: 'ob', b: 'ob'}
      }
    )

    b = fsm(
      ['a', 'b'],
      ['0', '1', 'ob'],
      '0',
      ['1'],
      {
        0: {a: 'ob', b: '1'},
        1: {a: 'ob', b: 'ob'},
        ob: {a: 'ob', b: 'ob'}
      }
    )
  })

  describe('constructor', function () {
    describe('rejects invalid inputs', function () {
      it("rejects if initial isn't a state", function () {
        expect(function () {
          fsm([], [], '1', [], {})
        }).toThrow()
      })

      it("rejects if final isn't a state", function () {
        expect(function () {
          fsm([], ['1'], '1', ['2'], {})
        }).toThrow()
      })

      it('rejects invalid transition', function () {
        expect(function () {
          fsm(['a'], ['1'], '1', [], {1: {a: '2'}})
        }).toThrow()
      })
    })
  })

  describe('accepts', function () {
    it('a', function () {
      expect(a.accepts([])).toBe(false)
      expect(a.accepts(['a'])).toBe(true)
      expect(a.accepts(['b'])).toBe(false)
    })

    it('b', function () {
      expect(b.accepts([])).toBe(false)
      expect(b.accepts(['a'])).toBe(false)
      expect(b.accepts(['b'])).toBe(true)
    })

    it('advanced', function () {
      // This is (a|b)*a(a|b)
      const brzozowski = fsm(
        ['a', 'b'],
        ['A', 'B', 'C', 'D', 'E'],
        'A',
        ['C', 'E'],
        {
          A: {a: 'B', b: 'D'},
          B: {a: 'C', b: 'E'},
          C: {a: 'C', b: 'E'},
          D: {a: 'B', b: 'D'},
          E: {a: 'B', b: 'D'}
        }
      )
      expect(brzozowski.accepts(['a', 'a'])).toBe(true)
      expect(brzozowski.accepts(['a', 'b'])).toBe(true)
      expect(brzozowski.accepts(['a', 'a', 'b'])).toBe(true)
      expect(brzozowski.accepts(['b', 'a', 'b'])).toBe(true)
      expect(brzozowski.accepts(['a', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'a', 'b'])).toBe(true)
      expect(brzozowski.accepts([])).toBe(false)
      expect(brzozowski.accepts(['a'])).toBe(false)
      expect(brzozowski.accepts(['b'])).toBe(false)
      expect(brzozowski.accepts(['b', 'a'])).toBe(false)
      expect(brzozowski.accepts(['b', 'b'])).toBe(false)
      expect(brzozowski.accepts(['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b'])).toBe(false)
    })

    it('binary multiples of 3', function () {
      // Disallows the empty string
      // Allows "0" on its own, but not leading zeroes.
      const div3 = fsm(
        ['0', '1'],
        ['initial', 'zero', '0', '1', '2', 'oblivion'],
        'initial',
        ['zero', '0'],
        {
          initial: {0: 'zero', 1: '1'},
          zero: {0: 'oblivion', 1: 'oblivion'},
          0: {0: '0', 1: '1'},
          1: {0: '2', 1: '0'},
          2: {0: '1', 1: '2'},
          oblivion: {0: 'oblivion', 1: 'oblivion'}
        }
      )
      expect(div3.accepts([])).toBe(false)
      expect(div3.accepts(['0'])).toBe(true)
      expect(div3.accepts(['1'])).toBe(false)
      expect(div3.accepts(['0', '0'])).toBe(false)
      expect(div3.accepts(['0', '1'])).toBe(false)
      expect(div3.accepts(['1', '0'])).toBe(false)
      expect(div3.accepts(['1', '1'])).toBe(true)
      expect(div3.accepts(['0', '0', '0'])).toBe(false)
      expect(div3.accepts(['0', '0', '1'])).toBe(false)
      expect(div3.accepts(['0', '1', '0'])).toBe(false)
      expect(div3.accepts(['0', '1', '1'])).toBe(false)
      expect(div3.accepts(['1', '0', '0'])).toBe(false)
      expect(div3.accepts(['1', '0', '1'])).toBe(false)
      expect(div3.accepts(['1', '1', '0'])).toBe(true)
      expect(div3.accepts(['1', '1', '1'])).toBe(false)
      expect(div3.accepts(['0', '0', '0', '0'])).toBe(false)
      expect(div3.accepts(['0', '0', '0', '1'])).toBe(false)
      expect(div3.accepts(['0', '0', '1', '0'])).toBe(false)
      expect(div3.accepts(['0', '0', '1', '1'])).toBe(false)
      expect(div3.accepts(['0', '1', '0', '0'])).toBe(false)
      expect(div3.accepts(['0', '1', '0', '1'])).toBe(false)
      expect(div3.accepts(['0', '1', '1', '0'])).toBe(false)
      expect(div3.accepts(['0', '1', '1', '1'])).toBe(false)
      expect(div3.accepts(['1', '0', '0', '0'])).toBe(false)
      expect(div3.accepts(['1', '0', '0', '1'])).toBe(true)
    })

    it('accepts anything else', function () {
      expect(fsm(
        ['a', 'b', 'c', anythingElse],
        ['1'],
        '1',
        ['1'],
        {
          1: {a: '1', b: '1', c: '1', [anythingElse]: '1'}
        }
      ).accepts(['d'])).toBe(true)
    })

    it('nothing', function () {
      expect(nothing(['a']).accepts([])).toBe(false)
      expect(nothing(['a']).accepts(['a'])).toBe(false)
    })

    it('epsilon', function () {
      expect(epsilon(['a']).accepts([])).toBe(true)
      expect(epsilon(['a']).accepts(['a'])).toBe(false)
    })
  })

  describe('strings', function () {
    it('blockquote', function () {
      const blockquote = fsm(
        ['/', '*', anythingElse],
        ['0', '1', '2', '3', '4', '5'],
        '0',
        ['4'],
        {
          0: {'/': '1'},
          1: {'*': '2'},
          2: {'/': '2', [anythingElse]: '2', '*': '3'},
          3: {'/': '4', [anythingElse]: '2', '*': '3'}
        }
      )
      expect(blockquote.accepts(['/', '*', 'whatever', '*', '/'])).toBe(true)
      expect(blockquote.accepts(['*', '*', 'whatever', '*', '/'])).toBe(false)
      const gen = blockquote.strings()
      expect(gen.next().value).toEqual(['/', '*', '*', '/'])
    })

    it('nothing', function () {
      const gen = nothing(['a', 'b']).strings()
      expect(gen.next().done).toBe(true)
    })

    it('epsilon', function () {
      const gen = epsilon(['a', 'b']).strings()
      expect(gen.next().value).toEqual([])
      expect(gen.next().done).toBe(true)
    })

    it('epsilon over an empty alphabet', function () {
      const gen = epsilon([]).strings()
      expect(gen.next().value).toEqual([])
      expect(gen.next().done).toBe(true)
    })

    it('A', function () {
      const gen = a.strings()
      expect(gen.next().value).toEqual(['a'])
      expect(gen.next().done).toBe(true)
    })

    it('AAA', function () {
      const gen = concatenate([a, a, a]).strings()
      expect(gen.next().value).toEqual(['a', 'a', 'a'])
      expect(gen.next().done).toBe(true)
    })

    it('BAB', function () {
      const gen = concatenate([b, a, b]).strings()
      expect(gen.next().value).toEqual(['b', 'a', 'b'])
      expect(gen.next().done).toBe(true)
    })
  })

  describe('_connectAll', function () {
    it('works', function () {
      const empty = epsilon(['a'])
      expect(_connectAll([empty], 0, empty.initial)).toEqual([
        {i: 0, substate: empty.initial}
      ])
    })

    it('works A', function () {
      expect(_connectAll([a], 0, a.initial)).toEqual([
        {i: 0, substate: a.initial}
      ])
    })

    it('works too', () => {
      const empty = epsilon(['a'])
      expect(_connectAll([empty, a], 0, empty.initial)).toEqual([
        {i: 0, substate: empty.initial},
        {i: 1, substate: a.initial}
      ])
    })

    it('works three', () => {
      const empty = epsilon(['a'])
      expect(_connectAll([empty, empty, a], 0, empty.initial)).toEqual([
        {i: 0, substate: empty.initial},
        {i: 1, substate: empty.initial},
        {i: 2, substate: a.initial}
      ])
    })
  })

  describe('_getLiveStates', function () {
    it('works', function () {
      expect(a._getLiveStates()).toEqual({0: true, 1: true})
    })
  })

  describe('concatenate', function () {
    it('A and A', function () {
      const concAA = concatenate([a, a])
      expect(concAA.accepts([])).toBe(false)
      expect(concAA.accepts(['a'])).toBe(false)
      expect(concAA.accepts(['a', 'a'])).toBe(true)
      expect(concAA.accepts(['a', 'a', 'a'])).toBe(false)
    })

    it('epsilon, A and A', function () {
      const concAA2 = concatenate([epsilon(['a', 'b']), a, a])
      expect(concAA2.accepts([])).toBe(false)
      expect(concAA2.accepts(['a'])).toBe(false)
      expect(concAA2.accepts(['a', 'a'])).toBe(true)
      expect(concAA2.accepts(['a', 'a', 'a'])).toBe(false)
    })

    it('A and B', function () {
      const concAB = concatenate([a, b])
      expect(concAB.accepts([])).toBe(false)
      expect(concAB.accepts(['a'])).toBe(false)
      expect(concAB.accepts(['b'])).toBe(false)
      expect(concAB.accepts(['a', 'a'])).toBe(false)
      expect(concAB.accepts(['a', 'b'])).toBe(true)
      expect(concAB.accepts(['b', 'a'])).toBe(false)
      expect(concAB.accepts(['b', 'b'])).toBe(false)
    })

    it('unifies alphabets properly', function () {
      // Thanks to sparse maps it should now be possible to compute the union of FSMs
      // with disagreeing alphabets!
      const a = fsm(['a'], ['0', '1'], '0', ['1'], {0: {a: '1'}})
      const b = fsm(['b'], ['0', '1'], '0', ['1'], {0: {b: '1'}})
      expect(concatenate([a, b]).accepts(['a', 'b'])).toBe(true)
    })

    it('defect', function () {
      // This exposes a defect in concatenate.
      expect(concatenate([a, epsilon(['a', 'b']), a]).accepts(['a', 'a'])).toBe(true)
      expect(concatenate([a, epsilon(['a']), a]).accepts(['a', 'a'])).toBe(true)
      expect(concatenate([a, epsilon(['a', 'b']), epsilon(['a', 'b']), a]).accepts(['a', 'a'])).toBe(true)
      expect(concatenate([a, epsilon(['a']), epsilon(['a']), a]).accepts(['a', 'a'])).toBe(true)
    })

    // Odd bug with concatenate(), exposed by "[bc]*c"
    describe('odd bug', function () {
      let int5A
      let int5B
      beforeEach(function () {
        int5A = fsm(
          ['a', 'b', 'c', anythingElse],
          ['0', '1'],
          '1',
          ['1'],
          {
            0: {[anythingElse]: '0', 'a': '0', 'b': '0', 'c': '0'},
            1: {[anythingElse]: '0', 'a': '0', 'b': '1', 'c': '1'}
          }
        )

        int5B = fsm(
          ['a', 'b', 'c', anythingElse],
          ['0', '1', '2'],
          '1',
          ['0'],
          {
            0: {[anythingElse]: '2', a: '2', b: '2', c: '2'},
            1: {[anythingElse]: '2', a: '2', b: '2', c: '0'},
            2: {[anythingElse]: '2', a: '2', b: '2', c: '2'}
          }
        )
      })

      it('int5A works', function () {
        expect(int5A.accepts([])).toBe(true)
      })

      it('int5B works', function () {
        expect(int5B.accepts(['c'])).toBe(true)
      })

      it('int5C works', function () {
        const int5C = concatenate([int5A, int5B])
        expect(int5C.accepts(['c'])).toBe(true)
      })
    })

    it('should not create new oblivion states', function () {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        '0',
        ['3'],
        {
          0: {a: '1'},
          1: {b: '2'},
          2: {c: '3'}
        }
      )
      expect(abc.states.length).toBe(4)
      expect(concatenate([abc, abc]).states.length).toBe(7)
    })
  })

  describe('union', function () {
    it('A or B', function () {
      const aorb = union([a, b])
      expect(aorb.accepts([])).toBe(false)
      expect(aorb.accepts(['a'])).toBe(true)
      expect(aorb.accepts(['b'])).toBe(true)
      expect(aorb.accepts(['a', 'a'])).toBe(false)
      expect(aorb.accepts(['a', 'b'])).toBe(false)
      expect(aorb.accepts(['b', 'a'])).toBe(false)
      expect(aorb.accepts(['b', 'b'])).toBe(false)
    })

    it('epsilon or A', function () {
      const eora = union([epsilon(['a']), a])
      expect(eora.accepts([])).toBe(true)
      expect(eora.accepts(['a'])).toBe(true)
      expect(eora.accepts(['b'])).toBe(false)
      expect(eora.accepts(['a', 'a'])).toBe(false)
      expect(eora.accepts(['a', 'b'])).toBe(false)
      expect(eora.accepts(['b', 'a'])).toBe(false)
      expect(eora.accepts(['b', 'b'])).toBe(false)
    })

    it('A or nothing', function () {
      const aornothing = union([a, nothing(['a', 'b'])])
      expect(aornothing.accepts([])).toBe(false)
      expect(aornothing.accepts(['a'])).toBe(true)
    })

    it('unifies alphabets properly', function () {
      // Thanks to sparse maps it should now be possible to compute the union of FSMs
      // with disagreeing alphabets!
      const a = fsm(['a'], ['0', '1'], '0', ['1'], {0: {a: '1'}})
      const b = fsm(['b'], ['0', '1'], '0', ['1'], {0: {b: '1'}})
      expect(union([a, b]).accepts(['a'])).toBe(true)
      expect(union([a, b]).accepts(['b'])).toBe(true)
    })

    it('should not create new oblivion states', function () {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        '0',
        ['3'],
        {
          0: {a: '1'},
          1: {b: '2'},
          2: {c: '3'}
        }
      )
      expect(union([abc, abc]).states.length).toBe(4)
    })
  })

  describe('intersection', () => {
    it('works', () => {
      const astar = star(a)
      expect(astar.accepts([])).toBe(true)
      expect(astar.accepts(['a'])).toBe(true)
      expect(astar.accepts(['b'])).toBe(false)

      const bstar = star(b)
      expect(bstar.accepts([])).toBe(true)
      expect(bstar.accepts(['a'])).toBe(false)
      expect(bstar.accepts(['b'])).toBe(true)

      const both = intersection([astar, bstar])
      expect(both.accepts([])).toBe(true)
      expect(both.accepts(['a'])).toBe(false)
      expect(both.accepts(['b'])).toBe(false)
      expect(() => both.accepts([anythingElse])).toThrow
    })

    it('strange bug', () => {
      const abcdotdotdot = fsm(
        ['a', 'b', 'c', 'd', 'e', 'f', anythingElse],
        ['0', '1', '2', '3', '4', '5', '6'],
        '0',
        ['6'],
        {
          '0': { a: '1' },
          '1': { b: '2' },
          '2': { c: '3' },
          '3': { a: '4', b: '4', c: '4', d: '4', e: '4', f: '4', [anythingElse]: '4' },
          '4': { a: '5', b: '5', c: '5', d: '5', e: '5', f: '5', [anythingElse]: '5' },
          '5': { a: '6', b: '6', c: '6', d: '6', e: '6', f: '6', [anythingElse]: '6' },
          '6': {}
        }
      )

      const dotdotdotdef = fsm(
        ['a', 'b', 'c', 'd', 'e', 'f', anythingElse],
        ['0', '1', '2', '3', '4', '5', '6'],
        '0',
        ['6'],
        {
          '0': { a: '1', b: '1', c: '1', d: '1', e: '1', f: '1', [anythingElse]: '1' },
          '1': { a: '2', b: '2', c: '2', d: '2', e: '2', f: '2', [anythingElse]: '2' },
          '2': { a: '3', b: '3', c: '3', d: '3', e: '3', f: '3', [anythingElse]: '3' },
          '3': { d: '4' },
          '4': { e: '5' },
          '5': { f: '6' },
          '6': {}
        }
      )
      const abcdef = intersection([abcdotdotdot, dotdotdotdef])
      expect(abcdef.accepts(['b', 'b', 'c', 'd', 'e', 'f'])).toBe(false)
    })
  })

  describe('anythingElse', () => {
    it('works', () => {
      const any = fsm(
        [anythingElse],
        ['0', '1'],
        '0',
        ['1'],
        {
          0: {[anythingElse]: '1'}
        }
      )
      expect(any.accepts([])).toBe(false)
      expect(any.accepts(['a'])).toBe(true)
      expect(any.accepts(['b'])).toBe(true)
      expect(any.accepts([7453])).toBe(true)
      expect(any.accepts([anythingElse])).toBe(true)
      expect(any.accepts(['a', 'a'])).toBe(false)
      expect(any.accepts([anythingElse, anythingElse])).toBe(false)
    })
  })

  describe('star', function () {
    it('works', function () {
      const starA = star(a)
      expect(starA.accepts([])).toBe(true)
      expect(starA.accepts(['a'])).toBe(true)
      expect(starA.accepts(['b'])).toBe(false)
      expect(starA.accepts(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'])).toBe(true)
    })

    it('bug 28', function () {
      // This is ab*
      const abstar = fsm(
        ['a', 'b'],
        ['0', '1'],
        '0',
        ['1'],
        {
          0: {a: '1'},
          1: {b: '1'}
        }
      )
      expect(abstar.accepts(['a'])).toBe(true)
      expect(abstar.accepts(['b'])).toBe(false)
      expect(abstar.accepts(['a', 'b'])).toBe(true)
      expect(abstar.accepts(['a', 'b', 'b'])).toBe(true)

      // This is (ab*)* and it caused some defects.
      const abstarstar = star(abstar)
      expect(abstarstar.accepts(['a'])).toBe(true)
      expect(abstarstar.accepts(['b'])).toBe(false)
      expect(abstarstar.accepts(['a', 'b'])).toBe(true)
      expect(abstarstar.accepts(['b', 'b'])).toBe(false)
    })

    it('advanced', function () {
      // This is (a*ba)*. Naively connecting the final states to the initial state
      // gives the incorrect result here.
      const starred = star(fsm(
        ['a', 'b'],
        ['0', '1', '2', 'oblivion'],
        '0',
        ['2'],
        {
          0: {a: '0', b: '1'},
          1: {a: '2', b: 'oblivion'},
          2: {a: 'oblivion', b: 'oblivion'},
          oblivion: {a: 'oblivion', b: 'oblivion'}
        }
      ))
      expect(starred.alphabet).toEqual(['a', 'b'])
      expect(starred.accepts([])).toBe(true)
      expect(starred.accepts(['a'])).toBe(false)
      expect(starred.accepts(['b'])).toBe(false)
      expect(starred.accepts(['a', 'a'])).toBe(false)
      expect(starred.accepts(['b', 'a'])).toBe(true)
      expect(starred.accepts(['a', 'b', 'a'])).toBe(true)
      expect(starred.accepts(['a', 'a', 'b', 'a'])).toBe(true)
      expect(starred.accepts(['a', 'a', 'b', 'b'])).toBe(false)
      expect(starred.accepts(['a', 'b', 'a', 'b', 'a', 'b', 'a'])).toBe(true)
    })

    it('should not create new oblivion states', function () {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        '0',
        ['3'],
        {
          0: {a: '1'},
          1: {b: '2'},
          2: {c: '3'}
        }
      )
      expect(star(abc).states.length).toBe(4)
    })
  })

  describe('multiply', function () {
    it('rejects bad multipliers', function () {
      expect(function () {
        multiply(a, -1)
      }).toThrow()
    })

    it('A by 0', function () {
      const zeroA = multiply(a, 0)
      expect(zeroA.accepts([])).toBe(true)
      expect(zeroA.accepts(['a'])).toBe(false)
    })

    it('A by 1', function () {
      const oneA = multiply(a, 1)
      expect(oneA.accepts([])).toBe(false)
      expect(oneA.accepts(['a'])).toBe(true)
      expect(oneA.accepts(['a', 'a'])).toBe(false)
    })

    it('A by 2', function () {
      const twoA = multiply(a, 2)
      expect(twoA.accepts([])).toBe(false)
      expect(twoA.accepts(['a'])).toBe(false)
      expect(twoA.accepts(['a', 'a'])).toBe(true)
      expect(twoA.accepts(['a', 'a', 'a'])).toBe(false)
    })

    it('A by 7', function () {
      const sevenA = multiply(a, 7)
      expect(sevenA.accepts(['a', 'a', 'a', 'a', 'a', 'a'])).toBe(false)
      expect(sevenA.accepts(['a', 'a', 'a', 'a', 'a', 'a', 'a'])).toBe(true)
      expect(sevenA.accepts(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'])).toBe(false)
    })

    it('(AB)?', function () {
      const unit = concatenate([a, b])

      // This is "(ab)?
      const optional = union([epsilon([]), unit])
      expect(optional.accepts([])).toBe(true)
      expect(optional.accepts(['a'])).toBe(false)
      expect(optional.accepts(['b'])).toBe(false)
      expect(optional.accepts(['a', 'b'])).toBe(true)
      expect(optional.accepts(['a', 'a'])).toBe(false)

      // This is "(ab)?(ab)?"
      const optional2 = multiply(optional, 2)
      expect(optional2.accepts([])).toBe(true)
      expect(optional2.accepts(['a'])).toBe(false)
      expect(optional2.accepts(['b'])).toBe(false)
      expect(optional2.accepts(['a', 'a'])).toBe(false)
      expect(optional2.accepts(['a', 'b'])).toBe(true)
      expect(optional2.accepts(['b', 'a'])).toBe(false)
      expect(optional2.accepts(['b', 'b'])).toBe(false)
      expect(optional2.accepts(['a', 'a', 'a'])).toBe(false)
      expect(optional2.accepts(['a', 'b', 'a', 'b'])).toBe(true)
    })

    it('should not create new oblivion states', function () {
      const abc = fsm(
        ['a', 'b', 'c'],
        ['0', '1', '2', '3'],
        '0',
        ['3'],
        {
          0: {a: '1'},
          1: {b: '2'},
          2: {c: '3'}
        }
      )
      expect(multiply(abc, 3).states.length).toBe(10)
    })
  })
})
