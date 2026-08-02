// Snippet expansion engine: watches a textarea, auto-expands matching
// triggers at the cursor, and manages Tab-cycling through the resulting
// tabstops ($0, $1, ${N:default text}).

class SnippetEngine {
    constructor(textarea, snippets) {
        this.textarea = textarea;
        this.snippets = snippets;
        this.tabstops = null; // [{start, end, index}] for the innermost active snippet, offsets live-tracked
        this.activeStop = -1;
        // Outer snippets' tabstop frames, pushed when a nested snippet with
        // its own tabstops expands inside an active tabstop (e.g. typing
        // "sq" -> \sqrt{$0}$1 inside \frac{$0}{$1}'s numerator). Popped
        // back once the inner frame's tabstops are exhausted, so Tab
        // continues cycling through the outer snippet (e.g. into the
        // denominator) instead of escaping the textarea entirely.
        this.stack = [];
        this.pendingEdit = null; // {start, end} selection captured just before this keystroke mutates the value

        this.textarea.addEventListener("keydown", (e) => this.onKeyDown(e));
        this.textarea.addEventListener("input", (e) => this.onInput(e));
    }

    onKeyDown(e) {
        if (e.key === "Tab" && this.tabstops && this.tabstops.length > 0) {
            e.preventDefault();
            this.advanceTabstop(e.shiftKey ? -1 : 1);
            return;
        }
        // A bare newline has no effect on rendered math, so Enter inserts
        // the LaTeX line break command "\\" -- followed by an actual
        // newline so the input box itself also visually breaks the line,
        // matching the rendered output.
        if (e.key === "Enter") {
            e.preventDefault();
            this.insertText("\\\\\n");
            return;
        }
        // Record the selection about to be replaced by this keystroke, so
        // the subsequent `input` handler knows exactly what changed instead
        // of having to infer it by diffing strings (unreliable when the
        // replacement text happens to match nearby characters).
        if (this.tabstops) {
            this.pendingEdit = {
                start: this.textarea.selectionStart,
                end: this.textarea.selectionEnd,
            };
        }
    }

    // Splices `text` in at the current selection (replacing it) and routes
    // the change through the normal input pipeline (tabstop reconciliation,
    // then trigger matching) as if it had been typed natively.
    insertText(text) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        this.pendingEdit = this.tabstops ? { start, end } : null;

        const value = this.textarea.value;
        this.textarea.value = value.slice(0, start) + text + value.slice(end);
        const newCursor = start + text.length;
        this.textarea.setSelectionRange(newCursor, newCursor);

        this.textarea.dispatchEvent(new InputEvent("input", { inputType: "insertText", bubbles: true }));
    }

    onInput(e) {
        if (this.tabstops) {
            this.reconcileTabstops();
        }
        // Only characters actually being typed/pasted in should be able to
        // trigger a snippet. Without this, deleting text can expose an
        // unrelated trigger string sitting right before the cursor (e.g.
        // backspacing "x" out of "2_{x}" leaves "2_{", which matches the
        // "{" auto-close snippet and re-inserts a stray "}").
        if (e.inputType && e.inputType.startsWith("delete")) return;
        this.tryExpand();
    }

    // Uses the selection captured on keydown (the range this keystroke
    // just replaced) to shift every tabstop marker after it by the
    // resulting length delta. If the edit fell outside the currently
    // active tabstop's range, tracking is invalidated (user moved on).
    reconcileTabstops() {
        const active = this.tabstops.find((s) => s.index === this.activeStop);
        const edit = this.pendingEdit;
        this.pendingEdit = null;

        if (!active || !edit || edit.start < active.start || edit.end > active.end) {
            this.tabstops = null;
            this.activeStop = -1;
            this.stack = [];
            return;
        }

        const cursor = this.textarea.selectionStart;
        const removedLength = edit.end - edit.start;
        const insertedLength = cursor - edit.start;
        const delta = insertedLength - removedLength;

        active.end += delta;
        this.shiftStopsAfter(active.end - delta, delta, active);
    }

    // Shifts every tracked tabstop marker (current frame and every frame
    // still on the stack) that starts at or after `position` by `delta`,
    // skipping `except`. Used whenever text is inserted/removed at a point
    // that every outer/sibling tabstop's absolute offset must account for.
    shiftStopsAfter(position, delta, except) {
        for (const stop of this.tabstops) {
            if (stop === except) continue;
            if (stop.start >= position) {
                stop.start += delta;
                stop.end += delta;
            }
        }
        for (const frame of this.stack) {
            for (const stop of frame.tabstops) {
                if (stop.start >= position) {
                    stop.start += delta;
                    stop.end += delta;
                }
            }
        }
    }

    tryExpand() {
        const value = this.textarea.value;
        const cursor = this.textarea.selectionStart;
        if (cursor !== this.textarea.selectionEnd) return; // no expansion mid-selection

        const before = value.slice(0, cursor);
        let best = null; // {snippet, matchStart, matchText, captures}

        for (const snippet of this.snippets) {
            const match = this.matchTrigger(snippet, before);
            if (!match) continue;
            // Longer matches win first (a whole-word trigger like "dint"
            // beats a generic character-class rule that also happens to
            // match a shorter tail of the same text, e.g. backslash-
            // inserting before "int"). Literal triggers break ties against
            // same-length regex matches. Explicit `priority` is the final
            // tiebreaker.
            const tier = snippet.regex ? 0 : 1;
            const priority = [match.matchText.length, tier, snippet.priority || 0];
            if (!best || comparePriority(priority, best.priority) > 0) {
                best = { snippet, priority, ...match };
            }
        }

        if (!best) return;
        this.applyExpansion(best, value, cursor);
    }

    matchTrigger(snippet, before) {
        if (snippet.regex) {
            const re = new RegExp(snippet.trigger.source + "$", snippet.trigger.flags.replace("g", ""));
            const m = before.match(re);
            if (!m) return null;
            return { matchStart: cursorAdjust(before, m), matchText: m[0], captures: m };
        }
        const trigger = snippet.trigger;
        if (before.endsWith(trigger)) {
            return { matchStart: before.length - trigger.length, matchText: trigger, captures: null };
        }
        return null;
    }

    applyExpansion(best, value, cursor) {
        const { snippet, matchStart, matchText, captures } = best;

        let replacement;
        if (typeof snippet.replacement === "function") {
            replacement = snippet.replacement(captures);
        } else if (captures) {
            replacement = snippet.replacement.replace(/\[\[(\d+)\]\]/g, (_, i) => captures[parseInt(i, 10) + 1] ?? "");
        } else {
            replacement = snippet.replacement;
        }

        const { text: expandedText, stops } = parseTabstops(replacement);

        // If the cursor sits inside an already-active tabstop when this
        // snippet expands (e.g. typing "sr" or "sq" inside \frac{$0}{$1}'s
        // numerator), that outer tabstop must survive the edit so Tab still
        // cycles back out to it (e.g. into the denominator) afterwards.
        const outerActive = this.tabstops ? this.tabstops.find((s) => s.index === this.activeStop) : null;
        const outerActiveInRange =
            outerActive && matchStart >= outerActive.start && cursor <= outerActive.end ? outerActive : null;

        const newValue = value.slice(0, matchStart) + expandedText + value.slice(cursor);
        this.textarea.value = newValue;

        if (outerActiveInRange) {
            const delta = expandedText.length - (cursor - matchStart);
            outerActiveInRange.end += delta;
            this.shiftStopsAfter(outerActiveInRange.end - delta, delta, outerActiveInRange);
        }

        if (stops.length > 0) {
            // A nested snippet with its own tabstops takes over as the
            // active frame; the outer frame (if any) is preserved on the
            // stack and restored once this inner frame is exhausted.
            if (this.tabstops) {
                this.stack.push({ tabstops: this.tabstops, activeStop: this.activeStop });
            }
            this.tabstops = stops.map((s) => ({
                start: matchStart + s.start,
                end: matchStart + s.end,
                index: s.index,
            }));
            this.activeStop = -1;
            this.advanceTabstop(1);
        } else if (!outerActiveInRange) {
            const newCursor = matchStart + expandedText.length;
            this.textarea.setSelectionRange(newCursor, newCursor);
            this.tabstops = null;
            this.stack = [];
        } else {
            const newCursor = matchStart + expandedText.length;
            this.textarea.setSelectionRange(newCursor, newCursor);
        }

        this.textarea.dispatchEvent(new Event("snippet-expanded", { bubbles: true }));
    }

    advanceTabstop(direction) {
        if (!this.tabstops || this.tabstops.length === 0) return;

        const order = [...new Set(this.tabstops.map((s) => s.index))].sort((a, b) => a - b);
        let pos = order.indexOf(this.currentIndex());
        pos = pos === -1 ? (direction > 0 ? 0 : order.length - 1) : pos + direction;

        if (pos < 0 || pos >= order.length) {
            // Exhausted this frame's tabstops. If it was nested inside an
            // outer snippet, pop back to that frame and keep cycling from
            // where it left off, instead of leaving the textarea entirely.
            if (this.stack.length > 0) {
                const outer = this.stack.pop();
                this.tabstops = outer.tabstops;
                this.activeStop = outer.activeStop;
                this.advanceTabstop(direction);
                return;
            }
            // No outer frame: exiting the last tabstop places the cursor
            // at the end of the final stop and stops intercepting Tab.
            const last = this.tabstops[this.tabstops.length - 1];
            this.textarea.setSelectionRange(last.end, last.end);
            this.tabstops = null;
            this.activeStop = -1;
            return;
        }

        const targetIndex = order[pos];
        const stop = this.tabstops.find((s) => s.index === targetIndex);
        this.activeStop = targetIndex;
        this.textarea.setSelectionRange(stop.start, stop.end);
    }

    currentIndex() {
        return this.activeStop;
    }
}

function cursorAdjust(before, m) {
    return before.length - m[0].length;
}

// Lexicographic comparison of [tier, matchLength, explicitPriority] tuples.
function comparePriority(a, b) {
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
}

// Parses $0, $1, ${0:default} tabstop syntax out of a replacement string.
// Returns the literal text with tabstops removed, plus stop offsets
// (into that literal text) keyed by tabstop index.
function parseTabstops(replacement) {
    const stops = [];
    let text = "";
    let i = 0;

    while (i < replacement.length) {
        const ch = replacement[i];

        if (ch === "$" && replacement[i + 1] === "{") {
            const close = replacement.indexOf("}", i + 2);
            if (close !== -1) {
                const inner = replacement.slice(i + 2, close);
                const colonIdx = inner.indexOf(":");
                const index = parseInt(colonIdx === -1 ? inner : inner.slice(0, colonIdx), 10);
                const placeholder = colonIdx === -1 ? "" : inner.slice(colonIdx + 1);
                const start = text.length;
                text += placeholder;
                stops.push({ index, start, end: text.length });
                i = close + 1;
                continue;
            }
        }

        if (ch === "$" && /\d/.test(replacement[i + 1] || "")) {
            let j = i + 1;
            while (j < replacement.length && /\d/.test(replacement[j])) j++;
            const index = parseInt(replacement.slice(i + 1, j), 10);
            stops.push({ index, start: text.length, end: text.length });
            i = j;
            continue;
        }

        text += ch;
        i++;
    }

    stops.sort((a, b) => a.index - b.index);
    return { text, stops };
}
