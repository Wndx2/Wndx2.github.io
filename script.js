document.addEventListener('DOMContentLoaded', () => {

    // ── LIVE CLOCK & DATE ─────────────────────────────────────────
    const timeElement = document.getElementById("live-time");
    const dateElement = document.getElementById("date");

    function updateTime() {
        const now = new Date();
        
        // Update Time
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString([], { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        // Update Date
        if (dateElement) {
            const day = String(now.getDate()).padStart(2, "0");
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const year = now.getFullYear();
            dateElement.textContent = `${day}.${month}.${year}`;
        }
    }

    setInterval(updateTime, 1000);
    updateTime();

    // ── KEYBOARD SHORTCUTS ───────────────────────────────────────
    document.addEventListener("keydown", (event) => {
        const shortcuts = {
            'c': "https://classroom.google.com/u/1/?pli=1",
            'k': "https://otc.school.kiwi/",
            'd': "https://drive.google.com/drive/u/1/my-drive",
            'v': "https://discord.com/channels/1305436206728740934/",
            'm': ["https://mail.google.com/mail/u/0/#inbox", "https://mail.google.com/mail/u/1/#inbox"],
            'g': ["https://github.com/sleepywndud", "https://github.com/wndx2"]
        };

        const url = shortcuts[event.key.toLowerCase()];
        if (url) {
            if (Array.isArray(url)) {
                url.forEach(link => window.open(link, "_blank"));
            } else {
                window.open(url, "_blank");
            }
        }
    });
});