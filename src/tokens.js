/* Hand-written tokenizer for XML tag matching. */

import {ExternalTokenizer} from "lezer"
import {StartTag, StartCloseTag, mismatchedStartCloseTag, incompleteStartCloseTag, Element,
        commentContent as _commentContent, piContent as _piContent, cdataContent as _cdataContent} from "./parser.terms.js"

function nameChar(ch) {
  return ch == 45 || ch == 46 || ch == 58 || ch >= 65 && ch <= 90 || ch == 95 || ch >= 97 && ch <= 122 || ch >= 161
}

function isSpace(ch) {
  return ch == 9 || ch == 10 || ch == 13 || ch == 32
}

let elementQuery = [Element], openAt = 0

function parentElement(input, stack, pos, len) {
  openAt = stack.startOf(elementQuery, pos)
  if (openAt == null) return null
  let match = /^<\s*([\.\-\:\w\xa1-\uffff]+)/.exec(input.read(openAt, openAt + len + 10))
  return match ? match[1].toLowerCase() : ""
}

export const startTag = new ExternalTokenizer((input, token, stack) => {
  let pos = token.start
  if (input.get(pos++) != 60 /* '<' */) return
  let next = input.get(pos++)
  if (next == 47 /* '/' */) {
    let tokEnd = pos
    while (isSpace(input.get(pos))) pos++
    let nameStart = pos
    while (nameChar(input.get(pos))) pos++
    if (pos == nameStart) return token.accept(incompleteStartCloseTag, tokEnd)

    let name = input.read(nameStart, pos)
    let parent = parentElement(input, stack, stack.pos + 1, name.length)
    if (name == parent) return token.accept(StartCloseTag, tokEnd)
    while (parent != null) {
      parent = parentElement(input, stack, openAt, name.length)
      if (parent == name) return
    }
    token.accept(mismatchedStartCloseTag, tokEnd)
  } else if (next != 33 /* '!' */ && next != 63 /* '?' */) {
    return token.accept(StartTag, token.start + 1)
  }
}, {contextual: true})

function scanTo(type, end) {
  return new ExternalTokenizer((input, token, stack) => {
    let pos = token.start, endPos = 0
    for (;;) {
      let next = input.get(pos)
      if (next < 0) break
      pos++
      if (next == end.charCodeAt(endPos)) {
        endPos++
        if (endPos == end.length) { pos -= end.length; break }
      } else {
        endPos = 0
      }
    }
    if (pos > token.start) token.accept(type, pos)
  })
}


export const commentContent = scanTo(_commentContent, "-->")
export const piContent = scanTo(_piContent, "?>")
export const cdataContent = scanTo(_cdataContent, "?>")
