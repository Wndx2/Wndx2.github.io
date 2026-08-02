const input = document.getElementById("latex-input");
const preview = document.getElementById("preview");
const errorMessage = document.getElementById("error-message");
const copyLightBtn = document.getElementById("copy-light-btn");
const copyDarkBtn = document.getElementById("copy-dark-btn");
const toast = document.getElementById("toast");

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
    setCopyButtonsDisabled(true);
    errorMessage.hidden = true;
    errorMessage.textContent = "";
}

function setError(message) {
    errorMessage.textContent = message || "Could not render LaTeX.";
    errorMessage.hidden = false;
}

// Renders on every keystroke using KaTeX (client-side, no backend). This is
// both the visible preview and the source used for the copy buttons, since
// there is no server available on GitHub Pages to run the exact LaTeX/dvisvgm
// pipeline.
function renderPreview(value) {
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
        setCopyButtonsDisabled(false);
    } catch (err) {
        setError(err.message || "Could not render LaTeX.");
        setCopyButtonsDisabled(true);
    }
}

function scheduleRender() {
    renderPreview(input.value);
}

input.addEventListener("input", scheduleRender);
input.addEventListener("snippet-expanded", scheduleRender);

window.__snippetEngine = new SnippetEngine(input, SNIPPETS);

// Renders the current KaTeX node into a detached, padded wrapper (so the
// exported image isn't cropped to the visible preview box) and rasterizes it
// to PNG via html-to-image, which works around the browser's canvas-taint
// restriction on foreignObject-based SVG exports.
async function renderKatexToPngBlob(color, scale) {
    const katexEl = preview.querySelector(".katex");
    if (!katexEl) throw new Error("Nothing to render yet.");

    // Positioned inside the viewport and fully painted (no opacity:0,
    // visibility:hidden, or off-viewport coordinates) because html-to-image's
    // layout/measurement pass silently produces a blank render otherwise.
    // Stacked behind the page via z-index so it's not visible to the user.
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.zIndex = "-1";
    wrapper.style.pointerEvents = "none";
    wrapper.style.display = "inline-flex";
    wrapper.style.padding = "24px";
    wrapper.style.background = "transparent";
    wrapper.style.color = color;
    wrapper.style.fontSize = "32px";

    const clone = katexEl.cloneNode(true);
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
        return await htmlToImage.toBlob(wrapper, {
            pixelRatio: scale,
            backgroundColor: null,
        });
    } finally {
        document.body.removeChild(wrapper);
    }
}

async function copyRenderedImage(color, label) {
    if (copyLightBtn.disabled) return;
    try {
        const pngBlob = await renderKatexToPngBlob(color, 4);
        if (!pngBlob) throw new Error("Could not rasterize preview.");
        await navigator.clipboard.write([
            new ClipboardItem({ "image/png": pngBlob }),
        ]);
        showToast(`Copied ${label} image to clipboard`);
    } catch (err) {
        console.error(err);
        showToast("Copy failed");
    }
}

copyLightBtn.addEventListener("click", () => copyRenderedImage("#000", "light mode"));
copyDarkBtn.addEventListener("click", () => copyRenderedImage("#fff", "dark mode"));

setPlaceholder();
