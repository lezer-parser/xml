/* Hand-written tokenizer for XML tag matching. */

import {ExternalTokenizer} from "lezer"
import {matchingTagName, nonMatchingTagName, element} from "./parser.terms.js"

function nameChar(ch) {
  return ch == 45 || ch == 46 || ch == 58 || ch >= 65 && ch <= 90 || ch == 95 || ch >= 97 && ch <= 122 || ch >= 161
}

export const closeTagName = new ExternalTokenizer((input, token, stack) => {
  let pos = token.start
  for (;;) {
    let next = input.get(pos)
    if (!nameChar(next)) break
    pos++
  }
  if (pos > token.start) {
    let name = input.read(token.start, pos)
    let elementStart = stack.startOf([element])
    let match = elementStart < 0 ? null : /^<\s*([\.\-\:\w\xa1-\uffff]+)/.exec(input.read(elementStart, elementStart + name.length + 10))
    token.accept(match && match[1] == name ? matchingTagName : nonMatchingTagName, pos)
  }
}, {contextual: true})
