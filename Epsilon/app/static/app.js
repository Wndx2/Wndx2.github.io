const input = document.getElementById("latex-input");
const preview = document.getElementById("preview");
const errorMessage = document.getElementById("error-message");
const copyLightBtn = document.getElementById("copy-light-btn");
const copyDarkBtn = document.getElementById("copy-dark-btn");
const toast = document.getElementById("toast");

let debounceTimer = null;
let currentRequestId = 0;
let lastSvgText = null;

function showToast(text) {
    toast.textContent = text;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.hidden = true;
        }, 200);
    }, 1800);
}

function setCopyButtonsDisabled(disabled) {
    copyLightBtn.disabled = disabled;
    copyDarkBtn.disabled = disabled;
}

function setPlaceholder() {
    preview.innerHTML = '<span class="preview-placeholder">Nothing to render yet</span>';
    lastSvgText = null;
    setCopyButtonsDisabled(true);
    errorMessage.hidden = true;
    errorMessage.textContent = "";
}

function setError(message) {
    errorMessage.textContent = message || "Could not render LaTeX.";
    errorMessage.hidden = false;
}

// Renders instantly on every keystroke using KaTeX (client-side, no
// network round trip). This is what the user sees while typing.
function renderInstantPreview(value) {
    if (!value.trim()) {
        setPlaceholder();
        return;
    }

    try {
        katex.render(value, preview, {
            throwOnError: true,
            displayMode: true,
            output: "html",
        });
        errorMessage.hidden = true;
        errorMessage.textContent = "";
    } catch (err) {
        setError(err.message || "Could not render LaTeX.");
    }
}

// Runs the exact server-side LaTeX/dvisvgm pipeline in the background
// (debounced) so an exact, pixel-perfect SVG is ready for the copy
// buttons shortly after typing stops. Does not touch the visible preview.
async function renderExactForCopy(value) {
    const requestId = ++currentRequestId;

    if (!value.trim()) {
        lastSvgText = null;
        setCopyButtonsDisabled(true);
        return;
    }

    try {
        const response = await fetch("/api/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latex: value }),
        });
        const data = await response.json();

        if (requestId !== currentRequestId) return;

        if (data.ok) {
            lastSvgText = data.svg;
            setCopyButtonsDisabled(false);
        } else {
            lastSvgText = null;
            setCopyButtonsDisabled(true);
        }
    } catch (err) {
        if (requestId !== currentRequestId) return;
        lastSvgText = null;
        setCopyButtonsDisabled(true);
    }
}

function scheduleRender() {
    renderInstantPreview(input.value);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderExactForCopy(input.value), 400);
}

input.addEventListener("input", scheduleRender);
input.addEventListener("snippet-expanded", scheduleRender);

window.__snippetEngine = new SnippetEngine(input, SNIPPETS);

function recolorSvg(svgText, color) {
    return svgText.replace(/fill=(['"])#fff\1/gi, `fill=$1${color}$1`);
}

function svgToPngBlob(svgText, scale) {
    return new Promise((resolve, reject) => {
        const svgEl = new DOMParser().parseFromString(svgText, "image/svg+xml").documentElement;
        const widthPt = parseFloat(svgEl.getAttribute("width")) || 100;
        const heightPt = parseFloat(svgEl.getAttribute("height")) || 100;
        // dvisvgm outputs dimensions in pt (1pt = 4/3 px).
        const widthPx = (widthPt * 4) / 3;
        const heightPx = (heightPt * 4) / 3;
        const widthPxScaled = Math.ceil(widthPx * scale);
        const heightPxScaled = Math.ceil(heightPx * scale);

        // Bake the target resolution into the SVG's own width/height so the
        // browser rasterizes it natively at that size, instead of decoding
        // at the small intrinsic size and upscaling the bitmap (which is
        // what produces a blurry/pixelated result).
        svgEl.setAttribute("width", `${widthPxScaled}px`);
        svgEl.setAttribute("height", `${heightPxScaled}px`);
        const scaledSvgText = new XMLSerializer().serializeToString(svgEl);

        const svgBlob = new Blob([scaledSvgText], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = widthPxScaled;
            canvas.height = heightPxScaled;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, widthPxScaled, heightPxScaled);
            URL.revokeObjectURL(url);
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Canvas produced no blob."));
            }, "image/png");
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to rasterize SVG."));
        };
        img.src = url;
    });
}

async function copyRenderedImage(color, label) {
    if (!lastSvgText) return;
    try {
        const recolored = recolorSvg(lastSvgText, color);
        const pngBlob = await svgToPngBlob(recolored, 8);
        await navigator.clipboard.write([
            new ClipboardItem({ "image/png": pngBlob }),
        ]);
        showToast(`Copied ${label} image to clipboard`);
    } catch (err) {
        showToast("Copy failed");
    }
}

copyLightBtn.addEventListener("click", () => copyRenderedImage("#000", "light mode"));
copyDarkBtn.addEventListener("click", () => copyRenderedImage("#fff", "dark mode"));

setPlaceholder();
