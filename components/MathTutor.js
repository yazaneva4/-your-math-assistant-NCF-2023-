"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Rocket,
  Calculator,
  Landmark,
  AlertTriangle,
  Mic,
  Square,
  Volume2,
  VolumeX,
  ImagePlus,
  X,
  Globe2,
  Brain,
  Users,
} from "lucide-react";

/* =========================================================================
   LANGUAGES
   English + the major NCF/Indian languages. "speechLang" is the BCP-47 tag
   used for both speech recognition (mic input) and speech synthesis (read
   aloud), since the two browser APIs use the same tag format.
   ========================================================================= */
const LANGUAGES = [
  { code: "en", native: "English", english: "English", speechLang: "en-IN" },
  { code: "hi", native: "हिन्दी", english: "Hindi", speechLang: "hi-IN" },
  { code: "bn", native: "বাংলা", english: "Bengali", speechLang: "bn-IN" },
  { code: "ta", native: "தமிழ்", english: "Tamil", speechLang: "ta-IN" },
  { code: "te", native: "తెలుగు", english: "Telugu", speechLang: "te-IN" },
  { code: "mr", native: "मराठी", english: "Marathi", speechLang: "mr-IN" },
  { code: "gu", native: "ગુજરાતી", english: "Gujarati", speechLang: "gu-IN" },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada", speechLang: "kn-IN" },
  { code: "ml", native: "മലയാളം", english: "Malayalam", speechLang: "ml-IN" },
  { code: "pa", native: "ਪੰਜਾਬੀ", english: "Punjabi", speechLang: "pa-IN" },
  { code: "ur", native: "اردو", english: "Urdu", speechLang: "ur-IN", rtl: true },
];

/* =========================================================================
   ROTATING TUTOR STYLES ("multi-tutor" mode)
   When the student turns on rotation, each successive reply comes from a
   different tutor "voice". Every one of these is a real claude-sonnet-5
   call — what changes is the teaching personality layered on via the
   system prompt, so the student genuinely gets a differently-worded,
   differently-angled explanation each turn (a fresh way in when one style
   isn't clicking), while the underlying maths and the Socratic,
   one-step-at-a-time rule stay the same. The badge shown in the UI names
   whichever style is answering, and the rotation advances one step per
   tutor reply.
   ========================================================================= */
const TUTOR_STYLES = [
  {
    id: "nova",
    name: "Nova",
    blurb: "clear & encouraging",
    color: "#FF7A33",
    prompt:
      "Your teaching voice this turn: warm, upbeat and crystal-clear. Lead with encouragement, use short plain sentences, and give one simple concrete example. Keep it friendly and confidence-building.",
  },
  {
    id: "sage",
    name: "Sage",
    blurb: "step-by-step & patient",
    color: "#2EBFA5",
    prompt:
      "Your teaching voice this turn: calm, careful and methodical. Break things into clearly numbered little steps and move slowly, checking understanding before the next step. Precise and patient.",
  },
  {
    id: "pixel",
    name: "Pixel",
    blurb: "playful & story-driven",
    color: "#E84A8A",
    prompt:
      "Your teaching voice this turn: playful and imaginative. Wrap the idea in a tiny story, game, or fun picture-in-words (rockets, robots, treasure) that a 9-year-old would grin at — but still teach the real maths underneath and stay on one step at a time.",
  },
  {
    id: "atlas",
    name: "Atlas",
    blurb: "real-world examples",
    color: "#7B5EA7",
    prompt:
      "Your teaching voice this turn: grounded and practical. Explain using everyday real-world things a child knows — money, cricket scores, sweets, distances, days — so the maths feels useful and real. One relatable example, then one small step.",
  },
  {
    id: "echo",
    name: "Echo",
    blurb: "asks guiding questions",
    color: "#4A90D9",
    prompt:
      "Your teaching voice this turn: gently Socratic. Mostly guide by asking one good question at a time that nudges the student to spot the next step themselves, then affirm what they get right. Lots of 'what do you think happens if…'.",
  },
  {
    id: "bolt",
    name: "Bolt",
    blurb: "quick tips & tricks",
    color: "#F5A623",
    prompt:
      "Your teaching voice this turn: snappy and clever. Share the quick mental-maths trick or shortcut for this kind of problem, in a punchy memorable way, then check they can use it. Brisk and energetic, but never skip the 'why' entirely.",
  },
  {
    id: "claude",
    name: "Claude",
    blurb: "thoughtful & honest",
    color: "#D97757",
    prompt:
      "Your teaching voice this turn: thoughtful, honest and genuinely curious, in the style of Claude (the AI assistant made by Anthropic). Be warm but straightforward — think out loud a little, show real interest in how the student is reasoning, and gently name what's tricky about the problem rather than glossing over it. If they make a mistake, treat it as an interesting clue about their thinking, not a failure. Careful, kind, and never condescending — talk to the 9-year-old as a capable thinker. Still one small step at a time, still scoped to the chapter.",
  },
];

/* =========================================================================
   CHAPTER LIBRARY
   Add new chapters here as plain data objects — nothing else in the file
   needs to change for a new chapter to show up in the picker and be taught
   correctly. Each chapter carries its own "systemPrompt" context so the
   tutor stays grounded in that chapter's actual vocabulary/method.
   ========================================================================= */
const CHAPTERS = [
  {
    id: "place-value",
    number: 1,
    title: "Place Value",
    tagline: "Mission to the Moon",
    color: "#FF7A33",
    available: true,
    tools: ["abacus", "calc", "roman"],
    topics: [
      "5- and 6-digit numbers",
      "Place value chart & periods (ones, thousands, lakhs)",
      "Place value vs. face value",
      "Comparing numbers",
      "Ascending & descending order",
      "Building greatest / smallest numbers",
      "Rounding to nearest 10 and 100",
      "Roman numerals (I, V, X, L, C, D, M)",
    ],
    systemPrompt: `You are a warm, patient, encouraging math tutor for a Grade 4 student (age 9-10), teaching strictly from Chapter 1: "Place Value" of their NCF 2023 aligned Indian primary maths textbook (theme: "Mission to the Moon" / Chandrayaan-3).

SCOPE — stick to exactly what this chapter covers, in this order/vocabulary:
1. 5-digit numbers: ten thousands place; 9,999 + 1 = 10,000. Reading numbers like 36,500 as "thirty-six thousand five hundred".
2. 6-digit numbers: the "lakhs period" (Indian numbering system, NOT the international thousand/million system). 99,999 + 1 = 1,00,000 (one lakh). Commas/spaces separate periods: lakhs | thousands (ten thousands, thousands) | ones (hundreds, tens, ones). Example: 1,27,603 = "one lakh, twenty-seven thousand, six hundred three".
3. Place Value Chart with periods: Ones period (H, T, O), Thousands period (TTh, Th), Lakhs period (L).
4. Place value vs face value: face value = the digit itself; place value = digit × its place (e.g. in 16,786 the place value of 7 is 700, but its face value is 7).
5. Expanded notation, e.g. 20,000 + 6,000 + 700 + 80 + 6.
6. Comparing numbers: more digits = greater number; same digit count → compare left to right until digits differ.
7. Ascending order (smallest→greatest) and Descending order (greatest→smallest).
8. Building the greatest/smallest number from a set of digits — greatest place gets greatest digit (descending arrangement) for greatest number; greatest place gets smallest digit (ascending arrangement, watch out for leading zero!) for smallest number. Also covers cases where digits may repeat.
9. Rounding to the nearest 10 and nearest 100 using a number line and the "look at the digit to the right" shortcut (5 or more rounds up).
10. Roman numerals: I=1, V=5, X=10, L=50, C=100, D=500, M=1000. Rules: a letter after a bigger one is added (VI=6), a letter before a bigger one is subtracted (IV=4), letters repeat at most 3 times, V/L/D are never subtracted or repeated, only I/X/C can be used as subtractive prefixes (and only from the next two higher symbols: I from V or X; X from L or C).

INDIAN NUMBER SYSTEM RULE: Always use the Indian comma system (e.g. 1,27,603) and lakhs terminology, not "hundred thousand" or "million" — this textbook does not use the international system at this stage.

TEACHING STYLE:
* Be encouraging, patient, and use simple, concrete language a 9-10 year old understands. Use short sentences.
* Use the textbook's own examples and flavor where natural (Chandrayaan-3, ISRO, mountain peaks, rivers, the spike abacus, ten thousands/lakhs place) so it feels like the same book talking to them, not a generic source.
* When a student asks for help on a problem, do NOT just give the final answer immediately. Guide them with one small step or question at a time (Socratic), unless they explicitly ask for the full worked answer or say they're stuck and want the answer.
* After they answer a step, tell them clearly if they're right; if wrong, gently point at why and re-ask rather than just giving the correct number.
* Keep replies short (a few sentences / a short list) — this is a chat with a child, not an essay.
* If asked something completely outside this chapter's scope (e.g. fractions, algebra, multiplication tables) gently say that's a different chapter and offer to stick to Place Value for now, unless it's a trivial cross-check (like basic addition needed to verify a place-value sum).
* You may use the place-value chart / abacus on screen as a reference ("look at the abacus on the left — it shows...") since the student can see it next to the chat.
* There is also a live "Calculator" tab next to the abacus (same panel, a toggle at the top). It lets the student type two numbers and pick + or −, and it shows the answer broken into columns labelled L, TTh, Th, H, T, O (Lakhs, Ten Thousands, Thousands, Hundreds, Tens, Ones) stacked on top of each other exactly like doing it on paper, including any carries or borrows, finishing with the full equation (e.g. "333 + 50 = 383"). When a student seems confused about why an addition/subtraction works, or asks "why is the answer X", tell them to switch to the Calculator tab and try the same numbers there so they can see each column worked out step by step — don't just restate the rule, point them at the tool that shows it visually.
* There is also a "Roman" tab with a two-way Roman numeral converter: type a number to see its Roman numeral (with a place-value breakdown, e.g. 34 → XXX + IV), or type Roman letters to see the value (grouped into subtractive pairs like IV, plus a "Common Mistake!" callout if it's written wrong, e.g. IIII instead of IV). Whenever a student asks how to write a number in Roman numerals, or asks what a Roman numeral equals, tell them to try it in the Roman tab so they can check their own answer and see the breakdown — don't just give them the answer in text.
* Never use markdown headers; this is a casual chat. Light use of bold for key numbers/terms and bullet lists for steps is fine.`,
    starterPrompts: [
      "What's the difference between place value and face value?",
      "Help me read the number 4,36,452",
      "Quiz me on rounding to the nearest 100",
      "How do I write 34 in Roman numerals?",
    ],
    welcomeMessage:
      "Hi there! 🚀 I'm your Place Value tutor — same chapter as your book, **Mission to the Moon**. Ask me anything about reading big numbers, the lakhs period, comparing numbers, rounding, or Roman numerals. Or tap a question below to start!\n\n🎤 Tap the mic to talk, 📷 the paperclip to share a photo of your work, 🌐 the globe to switch languages, 🧠 Deep Think up top to see my full working, or 👥 Multi-tutor to have a different tutor answer each turn.",
    resetMessage:
      "Fresh start! 🚀 What would you like to work on in **Place Value** — reading numbers, the lakhs period, comparing, rounding, or Roman numerals?",
    defaultAbacusNumber: "16786",
  },
  {
    id: "addition-subtraction",
    number: 2,
    title: "Addition and Subtraction",
    tagline: "Robots",
    color: "#4A90D9",
    available: true,
    tools: ["abacus", "calc"],
    topics: [
      "Addition with regrouping (carrying)",
      "Subtraction with regrouping (borrowing)",
      "Subtracting across zeros",
      "Mental addition & subtraction strategies",
      "Number patterns & consecutive numbers",
      "Adding & subtracting money (₹)",
      "5-step problem solving (R-F-D-S-C)",
      "Bar models for word problems",
      "Two-step word problems",
      "Extra/unneeded information in word problems",
      "Simpler-numbers strategy",
    ],
    systemPrompt: `You are a warm, patient, encouraging math tutor for a Grade 4 student (age 9-10), teaching strictly from Chapter 2: "Addition and Subtraction" of their NCF 2023 aligned Indian primary maths textbook (theme: Robots — DOST the robot, drones, robotic cleaners, factory/space robots).

SCOPE — stick to exactly what this chapter covers, in this order/vocabulary:
1. Addition with regrouping (carrying): line up digits by place value in a column chart (Th, H, T, O or TTh, Th, H, T, O), add from the ones place leftward, carry to the next place whenever a column sums to 10 or more. Always check the answer by "adding up" (re-adding the same columns, or adding in reverse order) — the textbook explicitly asks students to check this way.
2. Subtraction with regrouping (borrowing): same column-chart approach, but borrowing 1 group of 10 from the place to the left whenever the top digit is smaller than the bottom digit in a column. Check subtraction by adding the answer back to the number subtracted to see if it gives the original number.
3. Subtracting across zeros (e.g. 3000 − 1327, 4010 − 1867): when there aren't enough ones/tens/hundreds to borrow from directly, regroup the thousands first, then keep regrouping down through the zeros one place at a time. Also teach the "shortcut": subtract 1 from both numbers first to avoid the zeros (3000−1327 becomes 2999−1326), and the "combine place values" method (think of 3000 as 300 tens, then regroup 300 tens as 299 tens and 10 ones).
4. Addition strategies (mental math, e.g. 37+22): (A) break up only one number using place value (37+20=57, 57+2=59), (B) break up both numbers (30+7 and 20+2, add tens together and ones together, then combine), (C) count forward in tens and ones.
5. Subtraction strategies (mental math, e.g. 38−21): (A) break up the second number using place value, (B) count forward from the smaller number to the bigger number in steps, (C) count forward from the smaller to the bigger number using tens then ones.
6. Number patterns: spotting a pattern in a sequence (e.g. constant difference, or alternating differences), summing consecutive numbers, and the "pairing" shortcut for summing a consecutive run (pair first+last, second+second-last, etc., each pair sums to the same total, then multiply by the number of pairs) — including the adjustment needed when there's an odd one out in the middle.
7. Mental math shortcuts: to subtract 19, first subtract 20 then add 1; to subtract 29, first subtract 30 then add 1 (and similar "subtract a round number, then adjust" tricks).
8. Addition and subtraction of money (₹): align the decimal point (always two digits after the point, since Indian currency uses paise), add/subtract exactly like whole numbers once aligned, and find change/balance due by subtracting the bill amount from the money given.
9. Problem solving — the 5 steps (R-F-D-S-C): Read the problem and understand the question; Find the important information; Decide what to do (recognizing one-step vs. two-step problems); Solve the problem and answer the question (with correct units); Check the answer (re-verify the calculation, confirm the units/answer make sense). Encourage the student to invent their own mnemonic sentence for R-F-D-S-C like the book's example "Rita Finds Dogs So Cute."
10. Bar models: drawing a single bar split into parts for addition (parts known, total unknown → add the parts) or for "comparison"/"more than" situations (e.g. "7 more girls than boys" → add); drawing a bar with the whole known and one part known for subtraction (whole − known part = missing part); two bars side-by-side for direct comparison problems (difference in bar lengths = the answer); and combining two bar models in sequence for two-step problems (use the first model's answer as input to the second model).
11. Extra/unneeded information: word problems may contain numbers/facts that are not needed to answer the actual question — the student should identify exactly what's needed and ignore the rest.
12. The "simpler numbers" strategy: when a word problem has large or confusing numbers, mentally substitute much smaller numbers to see what operation is needed (e.g. "what number added to 4 gives 9? Subtract: 9−4=5"), then apply the same operation to the actual large numbers.

TEACHING STYLE:
* Be encouraging, patient, and use simple, concrete language a 9-10 year old understands. Use short sentences.
* Use the textbook's own examples and flavor where natural (DOST the robot, drones, robotic cleaners, Mars rovers, ATMs, factory robots) so it feels like the same book talking to them, not a generic source.
* When a student asks for help on a problem, do NOT just give the final answer immediately. Guide them with one small step or question at a time (Socratic), unless they explicitly ask for the full worked answer or say they're stuck and want the answer.
* For column addition/subtraction, walk through place by place starting from the ones column, the same way the book's place-value charts do — ask the student what happens in each column before moving to the next, and explicitly mention carrying/borrowing by name when it happens.
* After they answer a step, tell them clearly if they're right; if wrong, gently point at why and re-ask rather than just giving the correct number.
* For word problems, default to the 5-step (R-F-D-S-C) process and/or a bar model description when it helps — ask the student what information is given and what's being asked before jumping to the calculation.
* Keep replies short (a few sentences / a short list) — this is a chat with a child, not an essay.
* If asked something completely outside this chapter's scope (e.g. multiplication tables, fractions, place value of 6+ digit numbers in depth) gently say that's a different chapter and offer to stick to Addition and Subtraction for now, unless it's a trivial cross-check.
* You may use the abacus/calculator panel on screen as a reference for column math ("look at the calculator tab — it shows the columns lining up") since the student can see it next to the chat.
* Never use markdown headers; this is a casual chat. Light use of bold for key numbers/terms and bullet lists for steps is fine.`,
    starterPrompts: [
      "Help me add 7125 + 3799 with regrouping",
      "Why do we borrow when subtracting?",
      "How do I subtract 4010 − 1867 with all those zeros?",
      "Walk me through a two-step word problem",
    ],
    welcomeMessage:
      "Beep boop! 🤖 I'm your Addition & Subtraction tutor, same chapter as your book — Robots. Ask me about regrouping, borrowing across zeros, mental math tricks, bar models, or word problems. Or tap a question below to start!\n\n🎤 Tap the mic to talk, 📷 the paperclip to share a photo of your work, 🌐 the globe to switch languages, 🧠 Deep Think up top to see my full working, or 👥 Multi-tutor to have a different tutor answer each turn.",
    resetMessage:
      "Fresh start! 🤖 What would you like to work on in Addition and Subtraction — regrouping, borrowing, mental math, bar models, or word problems?",
    defaultAbacusNumber: "7125",
  },
  // Future chapters slot in here, e.g.:
  // { id: "multiplication", number: 3, title: "Multiplication", available: false, ... }
];

/* ---------- Spike Abacus (signature visual element) ---------- */
function SpikeAbacus({ digits, periods }) {
  // digits: array like ['1','2','7','6','0','3'] most-significant first, length up to 6
  const labels = ["L", "TTh", "Th", "H", "T", "O"];
  const colors = ["#E84A8A", "#7B5EA7", "#2EBFA5", "#2EBFA5", "#FF7A33", "#FF7A33"];
  const start = labels.length - digits.length;

  return (
    <div className="abacus-wrap">
      <div className="abacus-board">
        {labels.map((lab, i) => {
          const active = i >= start;
          const digit = active ? parseInt(digits[i - start], 10) : 0;
          const beadColor = colors[i];
          return (
            <div className={`spike-col ${active ? "" : "spike-col--dim"}`} key={lab}>
              <div className="spike-label">{lab}</div>
              <div className="spike-rod">
                <div className="spike-pin" />
                {active &&
                  (() => {
                    // Rod usable height is ROD_H minus a little headroom at the
                    // top and the pin gap at the bottom. Bead height + gap must
                    // shrink as the digit grows so 1 bead and 9 beads both fit
                    // cleanly on the same fixed-height rod (just like the real
                    // spike abacus in the book never spills off its peg).
                    const ROD_H = 100;
                    const BOTTOM_PAD = 8;
                    const TOP_PAD = 6;
                    const usable = ROD_H - BOTTOM_PAD - TOP_PAD;
                    const n = Math.max(digit, 1);
                    // slot = how much vertical room each bead gets, capped so
                    // small digits don't get oversized, comfortably tight so
                    // big digits don't overflow
                    const slot = Math.min(13, usable / n);
                    const beadHeight = Math.max(7, Math.min(11, slot * 0.82));
                    return Array.from({ length: digit }).map((_, b) => (
                      <div
                        key={b}
                        className="bead"
                        style={{
                          background: beadColor,
                          width: `${Math.max(13, beadHeight * 1.6)}px`,
                          height: `${beadHeight}px`,
                          bottom: `${BOTTOM_PAD + b * slot}px`,
                          animationDelay: `${b * 40}ms`,
                        }}
                      />
                    ));
                  })()}
              </div>
              <div className="spike-digit" style={{ color: active ? beadColor : "#C9C2B4" }}>
                {active ? digit : "·"}
              </div>
            </div>
          );
        })}
      </div>
      {periods && (
        <div className="period-strip">
          <span className="period-tag period-tag--lakh">Lakhs</span>
          <span className="period-tag period-tag--thou">Thousands</span>
          <span className="period-tag period-tag--ones">Ones</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Place value breakdown strip under the abacus ---------- */
function PlaceValueBreakdown({ digits }) {
  const placeNames = ["Lakhs", "Ten Th.", "Thousands", "Hundreds", "Tens", "Ones"];
  const placeValues = [100000, 10000, 1000, 100, 10, 1];
  const start = placeNames.length - digits.length;
  const parts = digits
    .map((d, i) => ({
      d: parseInt(d, 10),
      name: placeNames[start + i],
      pv: parseInt(d, 10) * placeValues[start + i],
    }))
    .filter((p) => p.d > 0);

  if (parts.length === 0) return null;

  return (
    <div className="breakdown">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="plus">+</span>}
          <span className="term">
            <span className="term-val">{p.pv.toLocaleString("en-IN")}</span>
            <span className="term-name">{p.name}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------- Column-by-column place value arithmetic engine ---------- */
const PLACE_LABELS = ["L", "TTh", "Th", "H", "T", "O"];

function padToSix(numStr) {
  return numStr.padStart(6, "0").split("");
}

// Computes addition or subtraction column-by-column (right to left),
// exactly the way the textbook's place value chart teaches it, including
// carries (for +) and borrows (for -), so a confused student can see
// why each digit in the answer is what it is.
function computeColumnMath(aStr, bStr, op) {
  const a = padToSix(aStr);
  const b = padToSix(bStr);
  const cols = [];
  let carry = 0;

  if (op === "+") {
    for (let i = 5; i >= 0; i--) {
      const sum = parseInt(a[i], 10) + parseInt(b[i], 10) + carry;
      const digit = sum % 10;
      carry = Math.floor(sum / 10);
      cols[i] = { a: a[i], b: b[i], result: digit, carryIn: i === 5 ? 0 : carry, note: sum >= 10 ? `carry ${carry}` : "" };
    }
    const finalCarry = carry;
    return { cols, finalCarry, resultStr: (finalCarry ? String(finalCarry) : "") + cols.map((c) => c.result).join("") };
  }

  // subtraction with borrowing — assumes aStr >= bStr (UI enforces this)
  const aNums = a.map((d) => parseInt(d, 10));
  const bNums = b.map((d) => parseInt(d, 10));
  let borrow = 0;
  const results = new Array(6).fill(0);
  const notes = new Array(6).fill("");
  for (let i = 5; i >= 0; i--) {
    let top = aNums[i] - borrow;
    if (top < bNums[i]) {
      top += 10;
      results[i] = top - bNums[i];
      notes[i] = "borrowed";
      borrow = 1;
    } else {
      results[i] = top - bNums[i];
      borrow = 0;
    }
  }
  for (let i = 0; i < 6; i++) {
    cols[i] = { a: a[i], b: b[i], result: results[i], note: notes[i] };
  }
  return { cols, finalCarry: 0, resultStr: cols.map((c) => c.result).join("") };
}

function stripLeadingZeros(numStr) {
  const stripped = numStr.replace(/^0+(?=\d)/, "");
  return stripped === "" ? "0" : stripped;
}

/* ---------- Roman Numerals: number ↔ Roman conversion, place-value
   breakdown, and "Common Mistake!" detection matching the textbook's own
   callout boxes (IIII vs IV, VIIII vs IX, V/L/D never repeated, etc.) ---------- */
const ROMAN_VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const ROMAN_ONES = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const ROMAN_TENS = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];
const ROMAN_HUNDREDS = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"];
const ROMAN_THOUSANDS = ["", "M", "MM", "MMM"];
// Canonical valid-Roman-numeral pattern, 1-3999: at most 3 of the same
// repeatable symbol in a row, V/L/D never repeated, and only the standard
// subtractive pairs (IV, IX, XL, XC, CD, CM) are allowed.
const VALID_ROMAN_REGEX = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

function numberToRomanBreakdown(num) {
  if (!Number.isInteger(num) || num < 1 || num > 3999) return null;
  const th = Math.floor(num / 1000) % 10;
  const h = Math.floor(num / 100) % 10;
  const t = Math.floor(num / 10) % 10;
  const o = num % 10;
  const pieces = [
    { place: 1000, digit: th, chunk: ROMAN_THOUSANDS[th] },
    { place: 100, digit: h, chunk: ROMAN_HUNDREDS[h] },
    { place: 10, digit: t, chunk: ROMAN_TENS[t] },
    { place: 1, digit: o, chunk: ROMAN_ONES[o] },
  ].filter((p) => p.digit > 0);
  return { roman: pieces.map((p) => p.chunk).join(""), pieces };
}

// Lenient left-to-right scan: computes a value for ANY sequence of the 7
// valid letters, even non-canonical ones, so we can still show a number
// while separately flagging it as a "Common Mistake" — exactly like the
// textbook's "Common Mistake!" boxes show both the wrong and right form.
function romanToNumberLenient(str) {
  let total = 0;
  let invalidChar = null;
  for (let i = 0; i < str.length; i++) {
    const v = ROMAN_VALUES[str[i]];
    if (!v) {
      invalidChar = str[i];
      continue;
    }
    const next = ROMAN_VALUES[str[i + 1]];
    total += next && v < next ? -v : v;
  }
  return { total, invalidChar };
}

// Groups a Roman string into display chunks, merging subtractive pairs
// (e.g. "IV") into one unit — this is the exact habit the book is teaching
// when it warns against misreading XXXIV as 10+10+10+1+5=36 instead of
// grouping the IV together as a single 4.
function romanToGroups(str) {
  const groups = [];
  let i = 0;
  while (i < str.length) {
    const cur = ROMAN_VALUES[str[i]];
    const next = ROMAN_VALUES[str[i + 1]];
    if (cur != null && next != null && cur < next) {
      groups.push({ symbols: str.slice(i, i + 2), value: next - cur });
      i += 2;
    } else if (cur != null) {
      groups.push({ symbols: str[i], value: cur });
      i += 1;
    } else {
      i += 1; // invalid character, already flagged elsewhere
    }
  }
  return groups;
}

// Returns a friendly "Common Mistake!" message (matching the textbook's own
// callout style) if the Roman numeral isn't written the standard way, else null.
function detectRomanMistake(str) {
  if (!str) return null;
  if (/(.)\1\1\1/.test(str)) {
    return "A letter can repeat at most 3 times in a row. Try a subtraction instead — like IV for 4, or IX for 9.";
  }
  if (/V.*V|L.*L|D.*D/.test(str)) {
    return "V, L, and D are never repeated — there's only ever one of each in a Roman numeral.";
  }
  if (!VALID_ROMAN_REGEX.test(str)) {
    return "Double-check the order — a smaller letter before a bigger one only works for I before V or X, or X before L or C (like IV or XC).";
  }
  return null;
}

/* ---------- "Show your working" column strip: L TTh Th H T O stacked ---------- */
function WorkingStrip({ aStr, bStr, op, result }) {
  const { cols } = computeColumnMath(aStr, bStr, op);
  const aPad = padToSix(aStr);
  const bPad = padToSix(bStr);
  // find leftmost meaningful column across a, b, and result for display trimming
  const resultPad = padToSix(stripLeadingZeros(result));
  let firstMeaningful = 0;
  for (let i = 0; i < 6; i++) {
    if (aPad[i] !== "0" || bPad[i] !== "0" || resultPad[i] !== "0") {
      firstMeaningful = i;
      break;
    }
  }

  return (
    <div className="working-strip">
      <div className="working-row working-row--labels">
        {PLACE_LABELS.map((lab, i) =>
          i >= firstMeaningful ? (
            <div className="wcell wcell--label" key={lab}>
              {lab}
            </div>
          ) : null
        )}
      </div>
      <div className="working-row">
        {aPad.map((d, i) => (i >= firstMeaningful ? <div className="wcell" key={`a${i}`}>{d}</div> : null))}
      </div>
      <div className="working-row working-row--op">
        <div className="wop">{op}</div>
        {bPad.map((d, i) => (i >= firstMeaningful ? <div className="wcell" key={`b${i}`}>{d}</div> : null))}
      </div>
      <div className="working-divider" />
      <div className="working-row working-row--result">
        {resultPad.map((d, i) =>
          i >= firstMeaningful ? (
            <div className="wcell wcell--result" key={`r${i}`}>
              {d}
            </div>
          ) : null
        )}
      </div>
      <div className="working-notes">
        {cols
          .map((c, i) => (c.note ? { i, note: c.note, label: PLACE_LABELS[i] } : null))
          .filter(Boolean)
          .map((n) => (
            <span className="note-chip" key={n.i}>
              {n.label}: {n.note}
            </span>
          ))}
      </div>
      <div className="working-equation">
        {parseInt(aStr, 10).toLocaleString("en-IN")} {op} {parseInt(bStr, 10).toLocaleString("en-IN")} ={" "}
        <strong>{parseInt(result, 10).toLocaleString("en-IN")}</strong>
      </div>
    </div>
  );
}

/* ---------- Real-time calculator: two numbers, an operation, live working ---------- */
function LiveCalculator({ onResult }) {
  const [a, setA] = useState("333");
  const [b, setB] = useState("50");
  const [op, setOp] = useState("+");
  const [error, setError] = useState("");

  const cleanA = a.replace(/[^\d]/g, "");
  const cleanB = b.replace(/[^\d]/g, "");

  const aNum = cleanA === "" ? 0 : parseInt(cleanA, 10);
  const bNum = cleanB === "" ? 0 : parseInt(cleanB, 10);

  let resultStr = "0";
  let invalid = false;

  if (cleanA === "" || cleanB === "") {
    invalid = true;
  } else if (aNum > 999999 || bNum > 999999) {
    invalid = true;
  } else if (op === "-" && bNum > aNum) {
    invalid = true;
  } else {
    const calc = computeColumnMath(String(aNum), String(bNum), op);
    resultStr = stripLeadingZeros(calc.resultStr || "0");
  }

  useEffect(() => {
    setError(
      op === "-" && bNum > aNum ? "Can't subtract a bigger number from a smaller one yet — try swapping them!" : ""
    );
  }, [aNum, bNum, op]);

  useEffect(() => {
    if (onResult) onResult(resultStr, invalid);
  }, [resultStr, invalid]);

  return (
    <div className="calc-wrap">
      <div className="calc-row">
        <input
          className="calc-input"
          value={a}
          onChange={(e) => setA(e.target.value)}
          inputMode="numeric"
          placeholder="333"
          maxLength={6}
        />
        <div className="calc-op-toggle">
          <button className={op === "+" ? "op-btn op-btn--active" : "op-btn"} onClick={() => setOp("+")}>
            +
          </button>
          <button className={op === "-" ? "op-btn op-btn--active" : "op-btn"} onClick={() => setOp("-")}>
            −
          </button>
        </div>
        <input
          className="calc-input"
          value={b}
          onChange={(e) => setB(e.target.value)}
          inputMode="numeric"
          placeholder="50"
          maxLength={6}
        />
        <div className="calc-equals">=</div>
        <div className="calc-result">{invalid && !error ? "?" : resultStr}</div>
      </div>
      {error && <div className="calc-error">⚠️ {error}</div>}
      {!invalid && <WorkingStrip aStr={String(aNum)} bStr={String(bNum)} op={op} result={resultStr} />}
    </div>
  );
}

/* ---------- Roman Numerals interactive tool (Chapter 1 third tab) ----------
   Two-way: type a number to see its Roman numeral (with a place-value
   breakdown), or type a Roman numeral to see its value (with subtractive
   pairs grouped, and a "Common Mistake!" callout if it's not written the
   standard way) — mirroring the textbook's own worked examples. */
function RomanNumeralTool() {
  const [numText, setNumText] = useState("34");
  const [romanText, setRomanText] = useState("XXXIV");

  const cleanNum = numText.replace(/[^\d]/g, "");
  const numValue = cleanNum === "" ? null : parseInt(cleanNum, 10);
  const isZero = numValue === 0;
  const numBreakdown = numValue && numValue >= 1 && numValue <= 3999 ? numberToRomanBreakdown(numValue) : null;
  const numOutOfRange = numValue !== null && !isZero && (numValue < 1 || numValue > 3999);

  const cleanRoman = romanText.toUpperCase().replace(/[^A-Z]/g, "");
  const { total: romanValue, invalidChar } = romanToNumberLenient(cleanRoman);
  const mistake = !invalidChar ? detectRomanMistake(cleanRoman) : null;
  const romanGroups = cleanRoman && !invalidChar && !mistake ? romanToGroups(cleanRoman) : [];

  return (
    <div className="roman-wrap">
      <div className="roman-legend">
        {Object.entries(ROMAN_VALUES).map(([sym, val]) => (
          <div className="roman-chip" key={sym}>
            <span className="roman-chip-sym">{sym}</span>
            <span className="roman-chip-val">{val}</span>
          </div>
        ))}
      </div>

      <div className="roman-row">
        <div className="roman-row-label">Number → Roman</div>
        <div className="roman-io">
          <input
            className="roman-input"
            value={numText}
            onChange={(e) => setNumText(e.target.value)}
            inputMode="numeric"
            placeholder="34"
            maxLength={4}
          />
          <div className="roman-arrow">→</div>
          <div className="roman-output">{numBreakdown ? numBreakdown.roman : numValue !== null ? "?" : "—"}</div>
        </div>
        {isZero && (
          <div className="roman-hint">
            Romans didn't have a symbol for 0! There's a fun fact about that in your book — an old abacus dot became
            our "0".
          </div>
        )}
        {numOutOfRange && <div className="roman-hint">Try a number from 1 to 3999 — that's as high as these 7 symbols can go.</div>}
        {numBreakdown && numBreakdown.pieces.length > 1 && (
          <div className="breakdown roman-breakdown">
            {numBreakdown.pieces.map((p, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="plus">+</span>}
                <span className="term">
                  <span className="term-val">{p.chunk}</span>
                  <span className="term-name">{p.digit * p.place}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="roman-row">
        <div className="roman-row-label">Roman → Number</div>
        <div className="roman-io">
          <input
            className="roman-input roman-input--text"
            value={romanText}
            onChange={(e) => setRomanText(e.target.value.toUpperCase())}
            placeholder="XXXIV"
            maxLength={15}
          />
          <div className="roman-arrow">→</div>
          <div className="roman-output">{cleanRoman ? (invalidChar ? "?" : romanValue) : "—"}</div>
        </div>
        {invalidChar && (
          <div className="roman-hint">⚠️ "{invalidChar}" isn't a Roman numeral letter — only I, V, X, L, C, D, M are used.</div>
        )}
        {!invalidChar && mistake && (
          <div className="roman-mistake">
            <AlertTriangle size={13} />
            <span>Common Mistake! {mistake}</span>
          </div>
        )}
        {!invalidChar && !mistake && romanGroups.length > 0 && (
          <div className="breakdown roman-breakdown">
            {romanGroups.map((g, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="plus">+</span>}
                <span className="term">
                  <span className="term-val">{g.symbols}</span>
                  <span className="term-name">{g.value}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Which icon/label each chapter's tool tabs show ---------- */
const TOOL_TABS = {
  abacus: { icon: Sparkles, label: "Abacus" },
  calc: { icon: Calculator, label: "Calculator" },
  roman: { icon: Landmark, label: "Roman" },
};

/* ---------- Extract a number to show on the abacus from text ---------- */
function extractNumberFromText(text) {
  if (!text) return null;
  const matches = text.match(/\d[\d,]{2,}|\d{4,}/g);
  if (!matches) return null;
  // pick the longest digit run (most likely the "interesting" number)
  let best = null;
  for (const m of matches) {
    const clean = m.replace(/,/g, "");
    if (clean.length >= 4 && clean.length <= 6) {
      if (!best || clean.length > best.length) best = clean;
    }
  }
  return best;
}

// Message content is either a plain string, or (when an image is attached)
// an array of Anthropic-style content blocks. These two helpers let the
// rest of the UI treat both shapes uniformly.
function getTextFromContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textBlock = content.find((b) => b.type === "text");
    return textBlock ? textBlock.text : "";
  }
  return "";
}
function getImageFromContent(content) {
  if (!Array.isArray(content)) return null;
  const imgBlock = content.find((b) => b.type === "image");
  if (!imgBlock) return null;
  return `data:${imgBlock.source.media_type};base64,${imgBlock.source.data}`;
}

// Strips markdown styling so text-to-speech doesn't read out asterisks,
// bullet dashes, etc.
function stripMarkdownForSpeech(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\n- /g, ". ")
    .replace(/\n/g, " ");
}

// When Deep Think mode is on, the model wraps its reasoning in a
// <thinking>...</thinking> block before its normal reply. This pulls that
// block out so the UI can show it as a separate panel rather than as part
// of the regular chat text. If the model is still streaming/finished mid-
// block (no closing tag yet), or the reply is otherwise just the thinking
// with nothing after it, fall back sensibly rather than showing nothing.
function splitThinking(text) {
  if (!text) return { thinking: "", answer: text || "" };
  const match = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
  if (match) {
    const thinking = match[1].trim();
    const answer = (text.slice(0, match.index) + text.slice(match.index + match[0].length)).trim();
    return { thinking, answer: answer || text };
  }
  const openOnly = text.match(/<thinking>([\s\S]*)/);
  if (openOnly) {
    return { thinking: openOnly[1].trim(), answer: "" };
  }
  return { thinking: "", answer: text };
}

/* ---------- Tiny markdown-lite renderer for chat bubbles:
   **bold**, "- " / "* " bullet lists, and blank-line paragraph breaks. ---------- */
function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 3) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
}

function renderRichText(text) {
  const lines = (text || "").split("\n");
  const blocks = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      blocks.push(
        <ul className="bubble-list" key={`list-${blocks.length}`}>
          {listBuffer.map((item, i) => (
            <li key={i}>{renderInline(item, `li-${blocks.length}-${i}`)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ""));
      return;
    }
    flushList();
    if (trimmed === "") {
      blocks.push(<div className="bubble-gap" key={`gap-${i}`} />);
    } else {
      blocks.push(
        <p className="bubble-line" key={`line-${i}`}>
          {renderInline(line, `p-${i}`)}
        </p>
      );
    }
  });
  flushList();
  return blocks;
}

/* ---------- One chat bubble: text/image, tutor badge, "see my thinking"
   panel, and the read-aloud button. Memoized so it doesn't re-render on
   every keystroke in the input box below it. ---------- */
const Bubble = React.memo(function Bubble({ index, role, content, styleId, isSpeaking, onToggleSpeak, speechSupported }) {
  const [thinkOpen, setThinkOpen] = useState(false);
  const isUser = role === "user";
  const rawText = getTextFromContent(content);
  const image = getImageFromContent(content);
  const { thinking, answer } = !isUser ? splitThinking(rawText) : { thinking: "", answer: rawText };
  const style = styleId ? TUTOR_STYLES.find((s) => s.id === styleId) : null;

  return (
    <div className={`bubble-row ${isUser ? "bubble-row--user" : ""}`}>
      {!isUser && (
        <div className="avatar">
          <Rocket size={16} strokeWidth={2.5} />
        </div>
      )}
      <div className={`bubble ${isUser ? "bubble--user" : "bubble--tutor"}`}>
        {style && (
          <div className="tutor-badge" style={{ color: style.color }}>
            <span className="tutor-dot" style={{ background: style.color }} />
            {style.name} · {style.blurb}
          </div>
        )}
        {image && <img className="bubble-image" src={image} alt="Shared homework" />}
        {thinking && (
          <div className="think-panel">
            <button className="think-head" onClick={() => setThinkOpen((o) => !o)}>
              <Brain size={13} />
              <span>{thinkOpen ? "Hide my thinking" : "See my thinking"}</span>
              <ChevronRight
                size={14}
                className="think-chevron"
                style={{ transform: thinkOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </button>
            {thinkOpen && <div className="think-body">{renderRichText(thinking)}</div>}
          </div>
        )}
        {renderRichText(answer)}
        {!isUser && speechSupported && answer && (
          <button
            className="speak-btn"
            onClick={() => onToggleSpeak(index, answer)}
            title={isSpeaking ? "Stop reading aloud" : "Read aloud"}
          >
            {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        )}
      </div>
    </div>
  );
});

/* ---------- System prompt addenda shared by every chapter ---------- */
const GLOBAL_TUTOR_ADDENDUM = `

GENERAL CAPABILITIES OF THIS APP (so you can refer to them naturally when useful):
* The student can talk to you with their voice (a microphone button) and hear your replies read aloud (a speaker icon on each of your messages) — if a reply is confusing to read, you can suggest they listen to it instead.
* The student can attach a photo of their notebook or textbook page. When a message includes an image, look at it carefully and refer to specifically what you see (the actual numbers/working on the page) rather than speaking generically.
* The student can switch the whole conversation to a different Indian language at any time from the globe button — don't comment on this unless asked.
* Currency in examples should always be Indian Rupees (₹), written in the Indian digit-grouping style (e.g. ₹12,340), and other units should match Indian conventions (kilometres, kilograms, etc).
* Never answer questions about, or solve problems from, any subject or chapter other than the one you were set up for above — politely redirect back to this chapter.
* You are talking with a 9-10 year old. Be warm, brief, and never condescending.`;

// When Deep Think mode is on, the model is asked to first think out loud
// inside a <thinking>...</thinking> block, which the UI then renders as a
// separate collapsible "see my thinking" panel (see splitThinking above).
const DEEP_THINK_ADDENDUM = `

DEEP THINK MODE: The student has switched on "Deep Think". Before your normal reply, first work through the problem privately inside a <thinking>...</thinking> block. In it:
* Restate the question in your own words, in one short line.
* Work through it one small step at a time (the same way you'd want the student to), showing any arithmetic plainly (e.g. "20,000 + 6,000 = 26,000").
* If there's more than one way to approach it, briefly say why you're picking this one.
* Double-check your final number/answer before closing the block.
* Keep it written so a 9-10 year old could follow it if they wanted to — plain words, short lines, no jargon.
Close the block with </thinking>, then continue with your normal Socratic reply exactly as you would otherwise (still one step at a time, still not just handing over the answer unless asked). The <thinking> block is shown to the student as a separate "see my thinking" panel, so it should feel like genuine working-out, not a restatement of the reply that follows it.`;

// Builds the final system prompt sent to the API: the chapter's own prompt,
// plus the capabilities above, plus a language instruction if the student
// has picked something other than English, plus deep-think instructions
// if that mode is switched on, plus a rotating tutor-style voice if the
// student has multi-tutor rotation switched on.
function buildSystemPrompt(chapter, languageCode, deepThink, style) {
  let prompt = chapter.systemPrompt + "\n" + GLOBAL_TUTOR_ADDENDUM;
  const lang = LANGUAGES.find((l) => l.code === languageCode);
  if (lang && lang.code !== "en") {
    prompt += `\n\nLANGUAGE: Respond ONLY in ${lang.english} (${lang.native}), written in its native script, regardless of which language the student writes in. Keep these in their standard form rather than translating them: digits/numerals, proper nouns (e.g. ISRO, Chandrayaan-3, place names), and Roman numeral letters (I, V, X, L, C, D, M) — that's how the textbook itself presents them. Everything else — your explanations, questions, and encouragement — should be in ${lang.english}.`;
  }
  if (deepThink) {
    prompt += DEEP_THINK_ADDENDUM;
  }
  if (style) {
    prompt += `\n\n${style.prompt}`;
  }
  return prompt;
}

/* ============================== MAIN APP ============================== */
export default function MathTutor() {
  const [chapter, setChapter] = useState(CHAPTERS[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: CHAPTERS[0].welcomeMessage,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [abacusNumber, setAbacusNumber] = useState(CHAPTERS[0].defaultAbacusNumber);
  const [panelMode, setPanelMode] = useState("abacus");
  const [calcResultStr, setCalcResultStr] = useState("383");
  const [calcInvalid, setCalcInvalid] = useState(false);
  const [language, setLanguage] = useState("en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [listening, setListening] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // { dataUrl, mediaType, name }
  const [imageError, setImageError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [deepThink, setDeepThink] = useState(false);
  const [rotateTutors, setRotateTutors] = useState(false);
  const [styleIndex, setStyleIndex] = useState(0);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const speechLangRef = useRef("en-IN");
  const speakingIndexRef = useRef(null);

  // Feature detection — browser support for these Web Speech APIs varies
  // (and a sandboxed iframe may not be granted mic permission at all), so
  // every voice control below checks this and gracefully hides if absent.
  const SpeechRecognitionAPI =
    typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const speechInputSupported = !!SpeechRecognitionAPI;
  const speechOutputSupported = typeof window !== "undefined" && !!window.speechSynthesis;
  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  speechLangRef.current = currentLanguage.speechLang;
  speakingIndexRef.current = speakingIndex;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // If the chapter changes and the current tab isn't one of its tools
  // (e.g. leaving the Roman tab when switching away from Place Value),
  // fall back to the first tool that chapter actually offers.
  useEffect(() => {
    const tools = chapter.tools || ["abacus", "calc"];
    if (!tools.includes(panelMode)) {
      setPanelMode(tools[0] || "abacus");
    }
  }, [chapter]);

  // ----- Text-to-speech: read a given message aloud, or stop if it's
  // already the one playing. Only one message can speak at a time. -----
  // Stable identity (useCallback with no changing deps) so that memoized
  // Bubbles keep the same onToggleSpeak reference across renders and don't
  // re-render when unrelated parent state (typing, listening) changes.
  const toggleSpeak = useCallback((index, text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speakingIndexRef.current === index) {
      setSpeakingIndex(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
    utterance.lang = speechLangRef.current;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingIndex(index);
  }, []);

  // ----- Speech-to-text: mic button fills the input live, then sends
  // automatically once the student finishes speaking. -----
  const startListening = () => {
    if (!speechInputSupported || listening) return;
    if (speechOutputSupported) window.speechSynthesis.cancel();
    setVoiceError("");
    const rec = new SpeechRecognitionAPI();
    rec.lang = currentLanguage.speechLang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setInput(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        sendMessage(transcript);
      }
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setVoiceError("Microphone access was blocked — check your browser's permission settings to use voice.");
      } else if (e.error === "no-speech") {
        setVoiceError("Didn't catch that — try again and speak right after tapping the mic.");
      } else {
        setVoiceError("Voice input had a hiccup — you can always type instead.");
      }
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };
  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.abort();
    setListening(false);
  };

  // ----- Photo/file attach: read as base64, stage a preview, clear on send -----
  const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    setImageError("");
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file (like a photo of your page).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("That photo is a bit too big — try one under 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage({ dataUrl: reader.result, mediaType: file.type, name: file.name });
    };
    reader.onerror = () => setImageError("Couldn't read that file — please try again.");
    reader.readAsDataURL(file);
  };
  const removePendingImage = () => {
    setPendingImage(null);
    setImageError("");
  };

  const sendMessage = useCallback(
    async (textOverride) => {
      const text = (textOverride ?? input).trim();
      const image = pendingImage;
      if ((!text && !image) || loading) return;

      if (speechOutputSupported) window.speechSynthesis.cancel();
      setSpeakingIndex(null);

      // Build the content the user actually sent: a plain string when
      // there's just text (unchanged from before), or an Anthropic-style
      // content-block array when a photo is attached — the API accepts
      // this shape directly, and the chat bubble renders it via the same
      // getTextFromContent/getImageFromContent helpers either way.
      const userContent = image
        ? [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.dataUrl.split(",")[1],
              },
            },
            { type: "text", text: text || "Here's a photo of my homework — can you help me with it?" },
          ]
        : text;

      const newMessages = [...messages, { role: "user", content: userContent }];
      setMessages(newMessages);
      setInput("");
      setPendingImage(null);
      setImageError("");
      setLoading(true);

      const found = extractNumberFromText(text);
      if (found) setAbacusNumber(found);

      // Which tutor voice answers this turn (only when rotation is on).
      const activeStyle = rotateTutors ? TUTOR_STYLES[styleIndex % TUTOR_STYLES.length] : null;

      try {
        // Only the most recent turn needs its full image data. Re-sending the
        // base64 of every past photo on each request would balloon the payload
        // (and token cost) as the conversation grows, so older image blocks are
        // collapsed to a short text placeholder — the model keeps the context
        // that a photo was shared without paying to re-encode it every turn.
        const lastIndex = newMessages.length - 1;
        const apiMessages = newMessages.map((m, idx) => {
          if (idx === lastIndex || !Array.isArray(m.content)) {
            return { role: m.role, content: m.content };
          }
          const collapsed = m.content.map((block) =>
            block.type === "image" ? { type: "text", text: "[shared a photo earlier in the conversation]" } : block
          );
          return { role: m.role, content: collapsed };
        });

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            max_tokens: deepThink ? 2000 : 1000,
            system: buildSystemPrompt(chapter, language, deepThink, activeStyle),
            messages: apiMessages,
          }),
        });

        if (!response.ok) {
          let serverMsg = "";
          try {
            const errData = await response.json();
            serverMsg = errData && errData.error ? errData.error : "";
          } catch (_) {}
          const friendly =
            response.status === 503 || /not configured|api key/i.test(serverMsg)
              ? "I'm almost ready! 🛠️ The tutor's AI connection hasn't been set up yet — whoever set up this site needs to add an ANTHROPIC_API_KEY or OPENAI_API_KEY. (See the README.)"
              : "Oops, my rocket signal got lost on the way back from the moon! 🛰️ Could you try sending that again?";
          setMessages((prev) => [...prev, { role: "assistant", content: friendly }]);
          return;
        }

        const data = await response.json();
        const textBlocks = (data.content || [])
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n");

        const replyText = textBlocks || "Hmm, I didn't quite catch that — could you try asking again?";

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: replyText, styleId: activeStyle ? activeStyle.id : null },
        ]);

        // Advance to the next voice in the rotation for the following turn.
        if (activeStyle) setStyleIndex((i) => (i + 1) % TUTOR_STYLES.length);

        const replyNum = extractNumberFromText(replyText);
        if (replyNum) setAbacusNumber(replyNum);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Oops, my rocket signal got lost on the way back from the moon! 🛰️ Could you try sending that again?",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, chapter, language, pendingImage, speechOutputSupported, deepThink, rotateTutors, styleIndex]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    if (speechOutputSupported) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    if (listening) stopListening();
    setPendingImage(null);
    setImageError("");
    setVoiceError("");
    setMessages([
      {
        role: "assistant",
        content: chapter.resetMessage,
      },
    ]);
    setAbacusNumber(chapter.defaultAbacusNumber);
  };

  // Stable identity (useCallback) so LiveCalculator's effect that calls this
  // doesn't get a "new" function every parent render and re-fire needlessly.
  const handleCalcResult = useCallback((resultStr, invalid) => {
    setCalcInvalid(invalid);
    if (!invalid) setCalcResultStr(resultStr);
  }, []);

  const digits = abacusNumber.split("");
  // While the calculator shows "?" (a blank field, or subtracting a bigger
  // number) the abacus should go blank too — never hold onto a stale number
  // left over from the last valid combination.
  const calcAbacusDigits = calcInvalid ? [] : stripLeadingZeros(calcResultStr || "0").split("");

  return (
    <div className="mt-app">
      <style>{CSS}</style>

      {/* ---------- Top bar ---------- */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand-badge">
            <Rocket size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-title">Your Math Assistant</div>
            <div className="brand-sub">NCF 2023 · textbook tutor, chapter by chapter</div>
          </div>
        </div>
        <div className="topbar-right">
          <button
            className="lang-pill"
            onClick={() => {
              setShowLangPicker((s) => !s);
              setShowPicker(false);
            }}
            title="Change language"
          >
            <Globe2 size={14} />
            <span>{currentLanguage.native}</span>
          </button>
          <button
            className={`think-pill ${deepThink ? "think-pill--active" : ""}`}
            onClick={() => setDeepThink((d) => !d)}
            title={deepThink ? "Deep Think is on — tutor shows its working" : "Turn on Deep Think to see step-by-step working"}
          >
            <Brain size={14} />
            <span>Deep Think</span>
          </button>
          <button
            className={`think-pill ${rotateTutors ? "think-pill--active" : ""}`}
            onClick={() => setRotateTutors((r) => !r)}
            title={
              rotateTutors
                ? `Multi-tutor is on — ${TUTOR_STYLES[styleIndex % TUTOR_STYLES.length].name} answers next`
                : "Turn on Multi-tutor: a different tutor style answers each turn"
            }
          >
            <Users size={14} />
            <span>{rotateTutors ? `Tutor: ${TUTOR_STYLES[styleIndex % TUTOR_STYLES.length].name}` : "Multi-tutor"}</span>
          </button>
          <button
            className="chapter-pill"
            onClick={() => {
              setShowPicker((s) => !s);
              setShowLangPicker(false);
            }}
          >
            <span className="chapter-pill-num">Ch. {chapter.number}</span>
            <span>{chapter.title}</span>
            <ChevronRight
              size={16}
              style={{
                transform: showPicker ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform .2s",
              }}
            />
          </button>
        </div>
      </header>

      {showLangPicker && (
        <div className="picker-panel lang-picker-panel">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-item ${lang.code === language ? "lang-item--active" : ""}`}
              onClick={() => {
                setLanguage(lang.code);
                setShowLangPicker(false);
              }}
              dir={lang.rtl ? "rtl" : "ltr"}
            >
              <span className="lang-native">{lang.native}</span>
              <span className="lang-english">{lang.english}</span>
            </button>
          ))}
        </div>
      )}

      {showPicker && (
        <div className="picker-panel">
          {CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              className={`picker-item ${ch.id === chapter.id ? "picker-item--active" : ""} ${
                !ch.available ? "picker-item--locked" : ""
              }`}
              disabled={!ch.available}
              onClick={() => {
                if (!ch.available) return;
                if (speechOutputSupported) window.speechSynthesis.cancel();
                setSpeakingIndex(null);
                setPendingImage(null);
                setImageError("");
                setVoiceError("");
                setChapter(ch);
                setShowPicker(false);
                setAbacusNumber(ch.defaultAbacusNumber);
                setMessages([
                  {
                    role: "assistant",
                    content: `Switched to **Chapter ${ch.number}: ${ch.title}**! ${
                      ch.tagline ? `(${ch.tagline}) ` : ""
                    }Ask away. 🚀`,
                  },
                ]);
              }}
            >
              <span className="picker-num" style={{ background: ch.color || "#999" }}>
                {ch.number}
              </span>
              <span className="picker-text">
                <span className="picker-title">{ch.title}</span>
                <span className="picker-meta">{ch.available ? ch.tagline : "Coming soon"}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ---------- Main two-pane layout ---------- */}
      <div className="main-grid">
        {/* LEFT: visual reference panel */}
        <aside className="ref-panel">
          <div className="ref-card">
            <div className="ref-card-head ref-card-head--tabs">
              {(chapter.tools || ["abacus", "calc"]).map((toolId) => {
                const tab = TOOL_TABS[toolId];
                if (!tab) return null;
                const Icon = tab.icon;
                return (
                  <button
                    key={toolId}
                    className={`mode-tab ${panelMode === toolId ? "mode-tab--active" : ""}`}
                    onClick={() => setPanelMode(toolId)}
                  >
                    <Icon size={13} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {panelMode === "abacus" ? (
              <>
                <SpikeAbacus digits={digits} periods />
                <PlaceValueBreakdown digits={digits} />
              </>
            ) : panelMode === "roman" ? (
              <RomanNumeralTool />
            ) : (
              <>
                <SpikeAbacus digits={calcAbacusDigits} periods />
                <LiveCalculator onResult={handleCalcResult} />
              </>
            )}
          </div>

          <div className="ref-card ref-card--topics">
            <div className="ref-card-head">
              <span>{chapter.title} covers</span>
            </div>
            <ul className="topic-list">
              {chapter.topics.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </aside>

        {/* RIGHT: chat */}
        <section className="chat-panel">
          <div className="chat-scroll" ref={scrollRef}>
            {messages.map((m, i) => (
              <Bubble
                key={i}
                index={i}
                role={m.role}
                content={m.content}
                styleId={m.styleId}
                isSpeaking={speakingIndex === i}
                onToggleSpeak={toggleSpeak}
                speechSupported={speechOutputSupported}
              />
            ))}
            {loading && (
              <div className="bubble-row">
                <div className="avatar">
                  <Rocket size={16} strokeWidth={2.5} />
                </div>
                <div className="bubble bubble--tutor bubble--typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="starter-row">
              {(chapter.starterPrompts || []).map((p, i) => (
                <button key={i} className="starter-chip" onClick={() => sendMessage(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {(pendingImage || imageError || voiceError) && (
            <div className="attach-preview-row">
              {pendingImage && (
                <div className="attach-preview">
                  <img src={pendingImage.dataUrl} alt="" />
                  <button className="attach-remove" onClick={removePendingImage} title="Remove photo">
                    <X size={12} />
                  </button>
                </div>
              )}
              {imageError && <div className="attach-error">{imageError}</div>}
              {voiceError && <div className="attach-error">{voiceError}</div>}
            </div>
          )}

          <div className="input-row">
            <button className="reset-btn" onClick={resetChat} title="Start over">
              <RotateCcw size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} />
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Attach a photo of your homework"
              disabled={loading}
            >
              <ImagePlus size={16} />
            </button>
            <input
              className="text-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? "Listening…" : "Ask about place value, lakhs, rounding, Roman numerals…"}
              disabled={loading}
            />
            {speechInputSupported && (
              <button
                className={`mic-btn ${listening ? "mic-btn--active" : ""}`}
                onClick={listening ? stopListening : startListening}
                title={listening ? "Stop listening" : "Ask with your voice"}
                disabled={loading}
              >
                {listening ? <Square size={14} /> : <Mic size={16} />}
              </button>
            )}
            <button className="send-btn" onClick={() => sendMessage()} disabled={loading || (!input.trim() && !pendingImage)}>
              <Send size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================== STYLES ============================== */
const CSS = `
:root {
  --navy: #1B2A4A;
  --navy-soft: #2E3F66;
  --cream: #FBF3E3;
  --paper: #FFFDF8;
  --orange: #FF7A33;
  --teal: #2EBFA5;
  --magenta: #E84A8A;
  --purple: #7B5EA7;
  --ink-soft: #5B6478;
}

* { box-sizing: border-box; }
.mt-app { font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; background: var(--cream); color: var(--navy); min-height: 100vh; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

/* ---- Top bar ---- */
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: var(--navy); color: white; }
.topbar-left { display: flex; align-items: center; gap: 12px; }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.brand-badge { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--orange), #FFB066); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
.brand-title { font-weight: 800; font-size: 15px; letter-spacing: 0.2px; }
.brand-sub { font-size: 11.5px; color: #AEB9D6; }

.lang-pill { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); color: white; padding: 7px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
.lang-pill:hover { background: rgba(255,255,255,0.18); }

.think-pill { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); color: white; padding: 7px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s; }
.think-pill:hover { background: rgba(255,255,255,0.18); }
.think-pill--active { background: var(--orange); border-color: var(--orange); color: white; }
.think-pill--active:hover { background: #FF8B4D; }

.chapter-pill { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); color: white; padding: 7px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
.chapter-pill:hover { background: rgba(255,255,255,0.18); }
.chapter-pill-num { background: var(--orange); padding: 2px 8px; border-radius: 999px; font-size: 11px; }

.picker-panel { background: var(--navy-soft); padding: 10px 16px 14px; display: flex; flex-direction: column; gap: 6px; }
.lang-picker-panel { display: grid; grid-template-columns: repeat(2, 1fr); }
.lang-item { display: flex; flex-direction: column; align-items: flex-start; background: rgba(255,255,255,0.06); border: 1px solid transparent; border-radius: 12px; padding: 8px 12px; cursor: pointer; color: white; transition: background 0.15s, border-color 0.15s; }
.lang-item:hover { background: rgba(255,255,255,0.14); }
.lang-item--active { border-color: var(--orange); background: rgba(255,122,51,0.15); }
.lang-native { font-size: 13.5px; font-weight: 700; }
.lang-english { font-size: 11px; color: #AEB9D6; }
.picker-item { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.06); border: 1px solid transparent; border-radius: 12px; padding: 8px 10px; cursor: pointer; text-align: left; color: white; transition: background 0.15s, border-color 0.15s; }
.picker-item:hover:not(.picker-item--locked) { background: rgba(255,255,255,0.14); }
.picker-item--active { border-color: var(--orange); background: rgba(255,122,51,0.15); }
.picker-item--locked { opacity: 0.45; cursor: not-allowed; }
.picker-num { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; flex-shrink: 0; }
.picker-text { display: flex; flex-direction: column; }
.picker-title { font-size: 13.5px; font-weight: 700; }
.picker-meta { font-size: 11px; color: #AEB9D6; }

/* ---- Main grid ---- */
.main-grid { display: grid; grid-template-columns: 290px 1fr; flex: 1; min-height: 0; overflow: hidden; }
@media (max-width: 720px) {
  .main-grid { grid-template-columns: 1fr; }
  .topbar { flex-wrap: wrap; row-gap: 8px; }
  .topbar-right { flex-wrap: wrap; }
}

/* ---- Reference panel ---- */
.ref-panel { background: var(--paper); border-right: 1px solid #ECE3D2; padding: 16px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; min-height: 0; }
.ref-card { background: white; border: 1px solid #ECE3D2; border-radius: 14px; padding: 14px; }
.ref-card-head { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: var(--ink-soft); margin-bottom: 10px; }
.ref-card-head--tabs { gap: 8px; margin-bottom: 12px; }
.mode-tab { display: flex; align-items: center; gap: 5px; background: #F2EBDC; border: 1px solid transparent; color: var(--ink-soft); font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; padding: 6px 11px; border-radius: 999px; cursor: pointer; transition: background 0.15s, color 0.15s; }
.mode-tab--active { background: var(--navy); color: white; }
.mode-tab:hover:not(.mode-tab--active) { background: #E8DFC9; }

/* ---- Live calculator ---- */
.calc-wrap { margin-top: 12px; }
.calc-row { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.calc-input { width: 0; flex: 1.3; min-width: 0; border: 1.5px solid #ECE3D2; border-radius: 10px; padding: 8px 6px; font-size: 14px; font-weight: 800; text-align: center; color: var(--navy); background: white; font-family: inherit; outline: none; }
.calc-input:focus { border-color: var(--orange); }
.calc-op-toggle { display: flex; flex-direction: column; border-radius: 8px; overflow: hidden; border: 1.5px solid #ECE3D2; flex-shrink: 0; }
.op-btn { width: 26px; height: 18px; border: none; background: white; color: var(--ink-soft); font-weight: 800; font-size: 12px; cursor: pointer; line-height: 1; }
.op-btn--active { background: var(--orange); color: white; }
.calc-equals { font-weight: 800; color: var(--ink-soft); flex-shrink: 0; }
.calc-result { flex: 1.3; min-width: 0; text-align: center; font-weight: 800; font-size: 15px; color: var(--teal); background: #EAF8F4; border-radius: 10px; padding: 8px 4px; white-space: nowrap; overflow: hidden; }
.calc-error { font-size: 11.5px; color: var(--magenta); background: #FDEAF1; border-radius: 8px; padding: 7px 10px; margin-bottom: 8px; font-weight: 700; line-height: 1.4; }

/* ---- Working strip: L TTh Th H T O column math ---- */
.working-strip { background: #FBF7EE; border: 1px dashed #D9CBA9; border-radius: 10px; padding: 10px 8px; margin-top: 4px; }
.working-row { display: flex; justify-content: center; gap: 4px; margin-bottom: 3px; }
.working-row--op { align-items: center; }
.wop { width: 16px; font-weight: 800; font-size: 14px; color: var(--orange); text-align: center; flex-shrink: 0; }
.wcell { width: 24px; text-align: center; font-size: 14px; font-weight: 700; color: var(--navy); font-family: 'Courier New', monospace; }
.wcell--label { font-size: 9.5px; font-weight: 800; color: var(--ink-soft); text-transform: uppercase; font-family: inherit; }
.wcell--result { color: var(--teal); font-weight: 800; }
.working-divider { border-top: 2px solid var(--navy); margin: 2px 4px 5px; }
.working-notes { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; margin-top: 4px; }
.note-chip { font-size: 9.5px; font-weight: 700; color: white; background: var(--purple); padding: 2px 7px; border-radius: 999px; }
.working-equation { text-align: center; font-size: 12.5px; color: var(--ink-soft); margin-top: 8px; font-weight: 600; }
.working-equation strong { color: var(--navy); font-weight: 800; }

/* ---- Roman numeral tool ---- */
.roman-wrap { display: flex; flex-direction: column; gap: 14px; }
.roman-legend { display: flex; justify-content: space-between; gap: 4px; background: #F7F1E4; border-radius: 10px; padding: 8px 6px; }
.roman-chip { display: flex; flex-direction: column; align-items: center; flex: 1; }
.roman-chip-sym { font-weight: 800; font-size: 14px; color: var(--navy); font-family: 'Courier New', monospace; }
.roman-chip-val { font-size: 9.5px; color: var(--ink-soft); font-weight: 700; }
.roman-row { background: #FBF7EE; border: 1px dashed #D9CBA9; border-radius: 10px; padding: 10px; }
.roman-row-label { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: var(--ink-soft); margin-bottom: 7px; }
.roman-io { display: flex; align-items: center; gap: 8px; }
.roman-input { flex: 1.2; min-width: 0; border: 1.5px solid #ECE3D2; border-radius: 10px; padding: 8px 6px; font-size: 14px; font-weight: 800; text-align: center; color: var(--navy); background: white; font-family: inherit; outline: none; }
.roman-input--text { font-family: 'Courier New', monospace; letter-spacing: 0.5px; }
.roman-input:focus { border-color: var(--orange); }
.roman-arrow { font-weight: 800; color: var(--ink-soft); flex-shrink: 0; }
.roman-output { flex: 1.2; min-width: 0; text-align: center; font-weight: 800; font-size: 16px; color: var(--purple); background: #F1ECF8; border-radius: 10px; padding: 8px 4px; font-family: 'Courier New', monospace; white-space: nowrap; overflow: hidden; }
.roman-hint { font-size: 11.5px; color: var(--ink-soft); margin-top: 8px; line-height: 1.4; font-weight: 600; }
.roman-mistake { display: flex; align-items: flex-start; gap: 6px; font-size: 11.5px; color: #9A4221; background: #FCEFE3; border: 1px solid #F0D2B2; border-radius: 8px; padding: 7px 9px; margin-top: 8px; font-weight: 700; line-height: 1.4; }
.roman-mistake svg { flex-shrink: 0; margin-top: 1px; }
.roman-breakdown { margin-top: 8px; }

.abacus-board { display: flex; justify-content: center; gap: 6px; background: linear-gradient(180deg, #2B1E14, #4A3526); border-radius: 10px; padding: 10px 8px 6px; width: 100%; }
.spike-col { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0; }
.spike-col--dim { opacity: 0.35; }
.spike-label { font-size: 9px; font-weight: 800; color: #E8D9C4; margin-bottom: 4px; }
.spike-rod { position: relative; width: 4px; height: 100px; background: #C9A876; border-radius: 2px; }
.spike-pin { position: absolute; bottom: -4px; left: 50%; width: 10px; height: 10px; background: #C9A876; border-radius: 50%; transform: translateX(-50%); }
.bead { position: absolute; left: 50%; border-radius: 6px; transform: translateX(-50%); box-shadow: 0 1px 2px rgba(0,0,0,0.35) inset, 0 1px 2px rgba(0,0,0,0.3); animation: beadPop 0.25s ease-out backwards; }
@keyframes beadPop { from { transform: translateX(-50%) scale(0.3); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
.spike-digit { margin-top: 6px; font-size: 15px; font-weight: 800; }
.period-strip { display: flex; width: 100%; margin-top: 8px; gap: 4px; }
.period-tag { flex: 1; text-align: center; font-size: 9px; font-weight: 800; color: white; border-radius: 6px; padding: 3px 2px; letter-spacing: 0.3px; }
.period-tag--lakh { background: var(--magenta); flex: 1; }
.period-tag--thou { background: var(--purple); flex: 2; }
.period-tag--ones { background: var(--orange); flex: 3; }

.breakdown { margin-top: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 11px; }
.plus { color: #C9C2B4; font-weight: 800; }
.term { display: flex; flex-direction: column; align-items: center; background: #F7F1E4; border-radius: 8px; padding: 4px 7px; }
.term-val { font-weight: 800; color: var(--navy); font-size: 12px; }
.term-name { font-size: 8.5px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.3px; }

.topic-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.topic-list li { font-size: 12.5px; color: var(--navy); padding-left: 16px; position: relative; line-height: 1.35; }
.topic-list li::before { content: ""; position: absolute; left: 0; top: 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--orange); }

/* ---- Chat panel ---- */
.chat-panel { display: flex; flex-direction: column; background: var(--cream); min-height: 0; }
.chat-scroll { flex: 1; overflow-y: auto; padding: 18px 20px 6px; display: flex; flex-direction: column; gap: 12px; }
.bubble-row { display: flex; align-items: flex-start; gap: 8px; max-width: 88%; }
.bubble-row--user { align-self: flex-end; flex-direction: row-reverse; max-width: 80%; }
.avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: var(--orange); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.bubble { padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; display: flex; flex-direction: column; gap: 6px; position: relative; }
.bubble--tutor { background: white; border: 1px solid #ECE3D2; border-top-left-radius: 4px; color: var(--navy); }
.bubble--user { background: var(--navy); color: white; border-top-right-radius: 4px; }
.bubble-image { max-width: 220px; max-height: 220px; border-radius: 10px; object-fit: cover; align-self: flex-start; }
.bubble-row--user .bubble-image { align-self: flex-end; }
.bubble-line { white-space: pre-wrap; }
.bubble-gap { height: 4px; }
.bubble-list { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; }
.speak-btn { align-self: flex-start; width: 22px; height: 22px; border-radius: 50%; border: none; background: #F2EBDC; color: var(--ink-soft); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; margin-top: 2px; transition: background 0.15s, color 0.15s; }
.speak-btn:hover { background: var(--orange); color: white; }

.tutor-badge { display: flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; align-self: flex-start; }
.tutor-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.think-panel { background: #FBF3EA; border: 1px dashed #E3C8A8; border-radius: 10px; align-self: stretch; overflow: hidden; }
.think-head { display: flex; align-items: center; gap: 6px; width: 100%; background: none; border: none; padding: 7px 10px; cursor: pointer; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: var(--orange); font-family: inherit; }
.think-head span { flex: 1; text-align: left; }
.think-chevron { transition: transform 0.15s; flex-shrink: 0; }
.think-body { padding: 0 12px 10px; font-size: 13px; line-height: 1.5; color: var(--ink-soft); }

.bubble--typing { display: flex; flex-direction: row; gap: 4px; align-items: center; padding: 13px 16px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ink-soft); animation: bounce 1.2s infinite; }
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }

.starter-row { display: flex; flex-wrap: wrap; gap: 8px; padding: 6px 20px 14px; }
.starter-chip { background: white; border: 1px solid #ECE3D2; color: var(--navy-soft); font-size: 12.5px; font-weight: 700; padding: 8px 13px; border-radius: 999px; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
.starter-chip:hover { border-color: var(--orange); color: var(--orange); }

.input-row { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: white; border-top: 1px solid #ECE3D2; }
.reset-btn, .send-btn, .attach-btn, .mic-btn { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; flex-shrink: 0; transition: opacity 0.15s, transform 0.1s, background 0.15s, color 0.15s; }
.reset-btn { background: #F2EBDC; color: var(--ink-soft); }
.reset-btn:hover { background: #E8DFC9; }
.attach-btn { background: #F2EBDC; color: var(--ink-soft); }
.attach-btn:hover:not(:disabled) { background: #E8DFC9; }
.attach-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mic-btn { background: #F2EBDC; color: var(--ink-soft); }
.mic-btn:hover:not(:disabled) { background: #E8DFC9; }
.mic-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mic-btn--active { background: var(--magenta); color: white; animation: micPulse 1.2s infinite; }
@keyframes micPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(232,74,138,0.4); } 50% { box-shadow: 0 0 0 6px rgba(232,74,138,0); } }
.send-btn { background: var(--orange); color: white; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.send-btn:not(:disabled):hover { transform: scale(1.06); }
.text-input { flex: 1; border: 1px solid #ECE3D2; background: var(--cream); border-radius: 999px; padding: 10px 16px; font-size: 14px; outline: none; color: var(--navy); font-family: inherit; }
.text-input:focus { border-color: var(--orange); }
.text-input::placeholder { color: #B3A892; }

.attach-preview-row { padding: 8px 20px 0; display: flex; align-items: center; gap: 10px; }
.attach-preview { position: relative; width: 52px; height: 52px; flex-shrink: 0; }
.attach-preview img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; border: 1.5px solid #ECE3D2; }
.attach-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: var(--navy); color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.attach-error { font-size: 12px; color: var(--magenta); font-weight: 700; }

@media (prefers-reduced-motion: reduce) {
  .bead, .dot { animation: none !important; }
  .mic-btn--active { animation: none !important; }
}
`;
