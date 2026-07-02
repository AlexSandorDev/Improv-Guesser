import assert from "node:assert/strict";
import test from "node:test";

import {
  isAnswerCorrect,
  levenshteinDistance,
  normalizeAnswerText,
  similarityRatio,
} from "./answerMatch.js";

test("normalizeAnswerText lowercases, trims, strips punctuation, collapses whitespace", () => {
  assert.equal(normalizeAnswerText("  Who's PLAYER 1?!  "), "whos player 1");
});

test("levenshteinDistance counts edits between two strings", () => {
  assert.equal(levenshteinDistance("kitten", "sitting"), 3);
  assert.equal(levenshteinDistance("player 1", "player 1"), 0);
});

test("levenshteinDistance counts an adjacent-letter transposition as a single edit", () => {
  assert.equal(levenshteinDistance("stromy", "stormy"), 1);
  assert.equal(levenshteinDistance("plyaer", "player"), 1);
});

test("similarityRatio returns 1 for identical strings and 0 for fully different strings", () => {
  assert.equal(similarityRatio("player 1", "player 1"), 1);
  assert.equal(similarityRatio("abc", "xyz"), 0);
});

test("isAnswerCorrect accepts an exact match, case and punctuation insensitive", () => {
  assert.equal(isAnswerCorrect("Player 1!", ["player 1"]), true);
});

test("isAnswerCorrect accepts a single dropped-letter typo in one word", () => {
  assert.equal(isAnswerCorrect("playr 1", ["player 1"]), true);
});

test("isAnswerCorrect accepts a typo inside a longer phrase", () => {
  assert.equal(isAnswerCorrect("where are thay", ["where are they"]), true);
});

test("isAnswerCorrect accepts an adjacent-letter-swap typo inside a longer phrase", () => {
  assert.equal(
    isAnswerCorrect(
      "sam is tryng to get home throug a stromy nigt at sea",
      ["Sam is trying to get home through a stormy night at sea."]
    ),
    true
  );
});

test("isAnswerCorrect accepts a rephrased guess with extra filler words", () => {
  assert.equal(isAnswerCorrect("I think it's player 1 for sure", ["player 1"]), true);
});

test("isAnswerCorrect checks every accepted answer, not just the first", () => {
  assert.equal(isAnswerCorrect("animal shelter", ["adopts a dog", "animal shelter"]), true);
});

test("isAnswerCorrect rejects an unrelated guess", () => {
  assert.equal(isAnswerCorrect("the wrong answer entirely", ["player 1"]), false);
});

test("isAnswerCorrect rejects an empty guess", () => {
  assert.equal(isAnswerCorrect("   ", ["player 1"]), false);
});
