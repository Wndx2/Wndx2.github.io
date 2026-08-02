// LaTeX Suite-style snippet definitions, adapted for a math-only textarea.
//
// trigger: string (literal) or RegExp (must end with the text immediately
//   before the cursor; capture groups referenced in `replacement` as [[0]],
//   [[1]], ... or, for function replacements, passed as the regex match).
// replacement: string with tabstop syntax ($0, $1, ${0:default text}) or a
//   function(match) => string for computed snippets.
// priority: higher wins when multiple regex snippets match at the same
//   position (default 0).
//
// Single-letter auto-expand triggers (S/U/O/B/C/K wrapping a selection)
// were intentionally dropped: this textarea has no non-math mode to scope
// them to, so they would collide with normal letter typing.
const GREEK = "alpha|beta|gamma|Gamma|delta|Delta|epsilon|varepsilon|zeta|eta|theta|Theta|vartheta|iota|kappa|lambda|Lambda|mu|nu|xi|Xi|pi|Pi|rho|sigma|Sigma|tau|upsilon|Upsilon|phi|Phi|varphi|chi|psi|Psi|omega|Omega";
// "in" and "to" are deliberately excluded: as bare 2-letter substrings
// they collide with common English/snippet fragments (e.g. "dint",
// "into") and would auto-expand mid-word before a longer trigger like
// "dint" or "->" gets a chance to complete. Use "inn" -> \in / "->" -> \to.
const SYMBOL = "sum|prod|int|infty|partial|nabla|pm|mp|times|cdot|div|leq|geq|neq|approx|equiv|propto|subset|supset|subseteq|supseteq|notin|cup|cap|emptyset|forall|exists|rightarrow|leftarrow|leftrightarrow|Rightarrow|Leftarrow|Leftrightarrow|mapsto";

const SNIPPETS = [
    // TRIGGER MATH MODE (no-ops here since the whole textarea is math mode;
    // kept out entirely rather than inserting literal $ delimiters).

    { trigger: "beg", replacement: "\\begin{$0}\n$1\n\\end{$0}" },

    // GREEK LETTERS
    { trigger: "@a", replacement: "\\alpha" },
    { trigger: "@b", replacement: "\\beta" },
    { trigger: "@g", replacement: "\\gamma" },
    { trigger: "@G", replacement: "\\Gamma" },
    { trigger: "@d", replacement: "\\delta" },
    { trigger: "@D", replacement: "\\Delta" },
    { trigger: "@e", replacement: "\\epsilon" },
    { trigger: ":e", replacement: "\\varepsilon" },
    { trigger: "@z", replacement: "\\zeta" },
    { trigger: "@t", replacement: "\\theta" },
    { trigger: "@T", replacement: "\\Theta" },
    { trigger: ":t", replacement: "\\vartheta" },
    { trigger: "@i", replacement: "\\iota" },
    { trigger: "@k", replacement: "\\kappa" },
    { trigger: "@l", replacement: "\\lambda" },
    { trigger: "@L", replacement: "\\Lambda" },
    { trigger: "@s", replacement: "\\sigma" },
    { trigger: "@S", replacement: "\\Sigma" },
    { trigger: "@u", replacement: "\\upsilon" },
    { trigger: "@U", replacement: "\\Upsilon" },
    { trigger: "@o", replacement: "\\omega" },
    { trigger: "@O", replacement: "\\Omega" },
    { trigger: "ome", replacement: "\\omega" },
    { trigger: "Ome", replacement: "\\Omega" },

    // TEXT ENVIRONMENTS
    { trigger: "text", replacement: "\\text{$0}$1" },
    { trigger: "\"", replacement: "\\text{$0}$1" },

    // BASIC OPERATIONS
    { trigger: "sr", replacement: "^{2}" },
    { trigger: "cb", replacement: "^{3}" },
    { trigger: "rd", replacement: "^{$0}$1" },
    { trigger: "_", replacement: "_{$0}$1" },
    { trigger: "sts", replacement: "_\\text{$0}" },
    { trigger: "sq", replacement: "\\sqrt{ $0 }$1" },
    { trigger: "//", replacement: "\\frac{$0}{$1}$2" },
    { trigger: /([A-Za-z0-9]+)\//, replacement: "\\frac{[[0]]}{$0}$1", regex: true },
    { trigger: "ee", replacement: "e^{ $0 }$1" },
    { trigger: "invs", replacement: "^{-1}" },
    { trigger: /([A-Za-z])(\d)/, replacement: "[[0]]_{[[1]]}", regex: true, priority: -1 },

    { trigger: /([^\\])(exp|log|ln)/, replacement: "[[0]]\\[[1]]", regex: true },
    { trigger: "conj", replacement: "^{*}" },
    { trigger: "Re", replacement: "\\mathrm{Re}" },
    { trigger: "Im", replacement: "\\mathrm{Im}" },
    { trigger: "bf", replacement: "\\mathbf{$0}" },
    { trigger: "rm", replacement: "\\mathrm{$0}$1" },

    // LINEAR ALGEBRA
    { trigger: /([^\\])(det)/, replacement: "[[0]]\\[[1]]", regex: true },
    { trigger: "trace", replacement: "\\mathrm{Tr}" },

    // MORE OPERATIONS
    { trigger: /([a-zA-Z])hat/, replacement: "\\hat{[[0]]}", regex: true },
    { trigger: /([a-zA-Z])bar/, replacement: "\\bar{[[0]]}", regex: true },
    { trigger: /([a-zA-Z])dot/, replacement: "\\dot{[[0]]}", regex: true, priority: -1 },
    { trigger: /([a-zA-Z])ddot/, replacement: "\\ddot{[[0]]}", regex: true, priority: 1 },
    { trigger: /([a-zA-Z])tilde/, replacement: "\\tilde{[[0]]}", regex: true },
    { trigger: /([a-zA-Z])und/, replacement: "\\underline{[[0]]}", regex: true },
    { trigger: /([a-zA-Z])vec/, replacement: "\\vec{[[0]]}", regex: true },
    { trigger: /([a-zA-Z]),\./, replacement: "\\mathbf{[[0]]}", regex: true },
    { trigger: /([a-zA-Z])\.,/, replacement: "\\mathbf{[[0]]}", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "),\\."), replacement: "\\boldsymbol{\\[[0]]}", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + ")\\.,"), replacement: "\\boldsymbol{\\[[0]]}", regex: true },

    { trigger: "hat", replacement: "\\hat{$0}$1" },
    { trigger: "bar", replacement: "\\bar{$0}$1" },
    { trigger: "dot", replacement: "\\dot{$0}$1", priority: -1 },
    { trigger: "ddot", replacement: "\\ddot{$0}$1" },
    { trigger: "cdot", replacement: "\\cdot" },
    { trigger: "tilde", replacement: "\\tilde{$0}$1" },
    { trigger: "und", replacement: "\\underline{$0}$1" },
    { trigger: "vec", replacement: "\\vec{$0}$1" },

    // AUTOMATED SUBSCRIPTS
    { trigger: /([A-Za-z])_(\d\d)/, replacement: "[[0]]_{[[1]]}", regex: true },
    { trigger: /\\hat\{([A-Za-z])\}(\d)/, replacement: "\\hat{[[0]]}_{[[1]]}", regex: true },
    { trigger: /\\vec\{([A-Za-z])\}(\d)/, replacement: "\\vec{[[0]]}_{[[1]]}", regex: true },
    { trigger: /\\mathbf\{([A-Za-z])\}(\d)/, replacement: "\\mathbf{[[0]]}_{[[1]]}", regex: true },

    { trigger: "xnn", replacement: "x_{n}" },
    { trigger: "xii", replacement: "x_{i}", priority: 1 },
    { trigger: "xjj", replacement: "x_{j}" },
    { trigger: "xp1", replacement: "x_{n+1}" },
    { trigger: "ynn", replacement: "y_{n}" },
    { trigger: "yii", replacement: "y_{i}" },
    { trigger: "yjj", replacement: "y_{j}" },

    // SYMBOLS
    { trigger: "ooo", replacement: "\\infty" },
    { trigger: "sum", replacement: "\\sum" },
    { trigger: "prod", replacement: "\\prod" },

    { trigger: "lim", replacement: "\\lim_{ ${0:?} \\to ${1:?} } $2" },

    { trigger: "\\sum", replacement: "\\sum_{${0:i}=${1:1}}^{${2:N}} $3" },
    { trigger: "\\prod", replacement: "\\prod_{${0:i}=${1:1}}^{${2:N}} $3" },

    { trigger: "+-", replacement: "\\pm" },
    { trigger: "-+", replacement: "\\mp" },
    { trigger: "...", replacement: "\\dots" },
    { trigger: "nabl", replacement: "\\nabla" },
    { trigger: "del", replacement: "\\nabla" },
    { trigger: "xx", replacement: "\\times" },
    { trigger: "**", replacement: "\\cdot" },
    { trigger: "para", replacement: "\\parallel" },

    { trigger: "===", replacement: "\\equiv" },
    { trigger: "!=", replacement: "\\neq" },
    { trigger: ">=", replacement: "\\geq" },
    { trigger: "<=", replacement: "\\leq" },
    { trigger: ">>", replacement: "\\gg" },
    { trigger: "<<", replacement: "\\ll" },
    { trigger: "simm", replacement: "\\sim" },
    { trigger: "sim=", replacement: "\\simeq" },
    { trigger: "prop", replacement: "\\propto" },

    { trigger: "<->", replacement: "\\leftrightarrow " },
    { trigger: "->", replacement: "\\to" },
    { trigger: "!>", replacement: "\\mapsto" },
    { trigger: "=>", replacement: "\\implies" },
    { trigger: "=<", replacement: "\\impliedby" },

    { trigger: "and", replacement: "\\cap" },
    { trigger: "orr", replacement: "\\cup" },
    { trigger: "inn", replacement: "\\in" },
    { trigger: "notin", replacement: "\\not\\in" },
    { trigger: "\\\\\\", replacement: "\\setminus" },
    { trigger: "sub=", replacement: "\\subseteq" },
    { trigger: "sup=", replacement: "\\supseteq" },
    { trigger: "eset", replacement: "\\emptyset" },
    { trigger: "set", replacement: "\\{ $0 \\}$1" },
    { trigger: "exists", replacement: "\\exists", priority: 1 },

    { trigger: "LL", replacement: "\\mathcal{L}" },
    { trigger: "HH", replacement: "\\mathcal{H}" },
    { trigger: "CC", replacement: "\\mathbb{C}" },
    { trigger: "RR", replacement: "\\mathbb{R}" },
    { trigger: "ZZ", replacement: "\\mathbb{Z}" },
    { trigger: "NN", replacement: "\\mathbb{N}" },

    // SPACES & BACKSLASH HANDLERS
    { trigger: new RegExp("([^\\\\])(" + GREEK + ")"), replacement: "[[0]]\\[[1]]", regex: true },
    { trigger: new RegExp("([^\\\\])(" + SYMBOL + ")"), replacement: "[[0]]\\[[1]]", regex: true },

    // GREEK LETTERS AND SYMBOLS FOLLOWED BY A LETTER (need a space)
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ")([A-Za-z])"), replacement: "\\[[0]] [[1]]", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ") sr"), replacement: "\\[[0]]^{2}", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ") cb"), replacement: "\\[[0]]^{3}", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ") rd"), replacement: "\\[[0]]^{$0}$1", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ") hat"), replacement: "\\hat{\\[[0]]}", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ") dot"), replacement: "\\dot{\\[[0]]}", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ") bar"), replacement: "\\bar{\\[[0]]}", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ") vec"), replacement: "\\vec{\\[[0]]}", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ") tilde"), replacement: "\\tilde{\\[[0]]}", regex: true },
    { trigger: new RegExp("\\\\(" + GREEK + "|" + SYMBOL + ") und"), replacement: "\\underline{\\[[0]]}", regex: true },

    // DERIVATIVES AND INTEGRALS
    { trigger: "par", replacement: "\\frac{ \\partial ${0:y} }{ \\partial ${1:x} } $2" },
    { trigger: /pa([A-Za-z])([A-Za-z])/, replacement: "\\frac{ \\partial [[0]] }{ \\partial [[1]] } ", regex: true },
    { trigger: "ddt", replacement: "\\frac{d}{dt} " },

    { trigger: /([^\\])int/, replacement: "[[0]]\\int", regex: true, priority: -1 },
    // Bare "int" expands to the full integral template, but only when it
    // starts a fresh word: nothing before it, or the previous character is
    // not a backslash or letter. This keeps "\int" (typed directly, e.g.
    // inside \frac{\int}{}) untouched, and keeps "xint" going through the
    // plain backslash-insert rule above ("x\int") instead of the template.
    { trigger: /(^|[^\\A-Za-z])int/, replacement: "[[0]]\\int $0 \\, d${1:x} $2", regex: true },
    { trigger: "dint", replacement: "\\int_{${0:0}}^{${1:1}} $2 \\, d${3:x} $4" },
    { trigger: "oint", replacement: "\\oint" },
    { trigger: "iint", replacement: "\\iint" },
    { trigger: "iiint", replacement: "\\iiint" },
    { trigger: "oinf", replacement: "\\int_{0}^{\\infty} $0 \\, d${1:x} $2" },
    { trigger: "infi", replacement: "\\int_{-\\infty}^{\\infty} $0 \\, d${1:x} $2" },

    // TRIGONOMETRY
    { trigger: /([^\\])(arcsin|sin|arccos|cos|arctan|tan|csc|sec|cot)/, replacement: "[[0]]\\[[1]]", regex: true },
    { trigger: /\\(arcsin|sin|arccos|cos|arctan|tan|csc|sec|cot)([A-Za-gi-z])/, replacement: "\\[[0]] [[1]]", regex: true },
    { trigger: /\\(sinh|cosh|tanh|coth)([A-Za-z])/, replacement: "\\[[0]] [[1]]", regex: true },

    // PHYSICS
    { trigger: "kbt", replacement: "k_{B}T" },
    { trigger: "msun", replacement: "M_{\\odot}" },

    // QUANTUM MECHANICS
    { trigger: "dag", replacement: "^{\\dagger}" },
    { trigger: "o+", replacement: "\\oplus " },
    { trigger: "bra", replacement: "\\bra{$0} $1" },
    { trigger: "ket", replacement: "\\ket{$0} $1" },
    { trigger: "brk", replacement: "\\braket{ $0 | $1 } $2" },
    { trigger: "outer", replacement: "\\ket{${0:\\psi}} \\bra{${0:\\psi}} $1" },

    // CHEMISTRY
    { trigger: "pu", replacement: "\\pu{ $0 }" },
    { trigger: "cee", replacement: "\\ce{ $0 }" },
    { trigger: "he4", replacement: "{}^{4}_{2}He " },
    { trigger: "he3", replacement: "{}^{3}_{2}He " },
    { trigger: "iso", replacement: "{}^{${0:4}}_{${1:2}}${2:He}" },

    // ENVIRONMENTS
    { trigger: "pmat", replacement: "\\begin{pmatrix}$0\\end{pmatrix}" },
    { trigger: "bmat", replacement: "\\begin{bmatrix}$0\\end{bmatrix}" },
    { trigger: "Bmat", replacement: "\\begin{Bmatrix}$0\\end{Bmatrix}" },
    { trigger: "vmat", replacement: "\\begin{vmatrix}$0\\end{vmatrix}" },
    { trigger: "Vmat", replacement: "\\begin{Vmatrix}$0\\end{Vmatrix}" },
    { trigger: "matrix", replacement: "\\begin{matrix}$0\\end{matrix}" },

    { trigger: "cases", replacement: "\\begin{cases}\n$0\n\\end{cases}" },
    { trigger: "align", replacement: "\\begin{align}\n$0\n\\end{align}" },
    { trigger: "array", replacement: "\\begin{array}\n$0\n\\end{array}" },

    // BRACKETS
    { trigger: "avg", replacement: "\\langle $0 \\rangle $1" },
    { trigger: "norm", replacement: "\\lvert $0 \\rvert $1", priority: 1 },
    { trigger: "Norm", replacement: "\\lVert $0 \\rVert $1", priority: 1 },
    { trigger: "ceil", replacement: "\\lceil $0 \\rceil $1" },
    { trigger: "floor", replacement: "\\lfloor $0 \\rfloor $1" },
    { trigger: "mod", replacement: "|$0|$1" },
    { trigger: "(", replacement: "($0)$1" },
    { trigger: "{", replacement: "{$0}$1" },
    { trigger: "[", replacement: "[$0]$1" },
    { trigger: "lr(", replacement: "\\left( $0 \\right) $1" },
    { trigger: "lr{", replacement: "\\left\\{ $0 \\right\\} $1" },
    { trigger: "lr[", replacement: "\\left[ $0 \\right] $1" },
    { trigger: "lr|", replacement: "\\left| $0 \\right| $1" },
    { trigger: "lra", replacement: "\\left< $0 \\right> $1" },

    // CUSTOM TRIGGERS
    { trigger: "fox", replacement: "f(x)" },
    { trigger: "fpox", replacement: "f'(x)" },
    { trigger: "fppox", replacement: "f''(x)" },
    { trigger: "dis", replacement: "s(t)" },
    { trigger: "vel", replacement: "v(t)" },
    { trigger: "acc", replacement: "a(t)" },
    { trigger: "deriv", replacement: "\\frac{dy}{dx}" },
    { trigger: "2deriv", replacement: "\\frac{d^2y}{dx^2}" },
    { trigger: "SP", replacement: "\\space $0" },
    { trigger: "const", replacement: "+C " },
    { trigger: "box", replacement: "\\boxed{$0}" },
    { trigger: "2sim", replacement: "\\left\\{\\begin{aligned}$0 \\\\$1\\end{aligned}\\right." },
    { trigger: "3sim", replacement: "\\left\\{\\begin{aligned}$0 \\\\$1 \\\\$2 \\end{aligned}\\right." },
    { trigger: "cnj", replacement: "\\overline{$0}" },
    { trigger: "cis", replacement: "\\text{cis}$0" },
    { trigger: "arg", replacement: "\\text{arg}$0" },
    { trigger: "tq", replacement: "\\tau$0" },
    { trigger: "ox", replacement: "(x)" },
    { trigger: "pox", replacement: "'(x)" },

    {
        trigger: /iden(\d)/,
        regex: true,
        replacement: (match) => {
            const n = parseInt(match[1], 10);
            const rows = [];
            for (let j = 0; j < n; j++) {
                const row = [];
                for (let i = 0; i < n; i++) row.push(i === j ? "1" : "0");
                rows.push(row.join(" & "));
            }
            return `\\begin{pmatrix}\n${rows.join(" \\\\\n")}\n\\end{pmatrix}`;
        },
    },
];
