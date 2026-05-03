document.addEventListener('DOMContentLoaded', () => {

    // ── TYPING NAME EFFECT ───────────────────────────────────────
    const nameElement = document.getElementById('name');
    if (nameElement) {
        const names = [
            "wndud", "wnd", "wndu", "wndi", "James",
            "Juyoung", "PARK", "주영", "박주영", "ㅈㅇ",
            "ㅂㅈㅇ", "James Park", "Juyoung Park",
            "James (Juyoung) Park"
        ];
        let nameIndex = Math.floor(Math.random() * names.length);
        let charIndex = 0;
        let isDeleting = false;
        const typingSpeed = 150;
        const deletingSpeed = 100;
        const delayBetweenWords = 2000;
        function type() {
            const currentName = names[nameIndex];
            if (isDeleting) {
                nameElement.textContent = currentName.substring(0, charIndex - 1) || '\u00A0';
                charIndex--;
                if (charIndex === 0) {
                    isDeleting = false;
                    let newIndex;
                    do {
                        newIndex = Math.floor(Math.random() * names.length);
                    } while (newIndex === nameIndex);
                    nameIndex = newIndex;
                    setTimeout(type, 500);
                } else {
                    setTimeout(type, deletingSpeed);
                }
            } else {
                nameElement.textContent = currentName.substring(0, charIndex + 1);
                charIndex++;
                if (charIndex === currentName.length) {
                    isDeleting = true;
                    setTimeout(type, delayBetweenWords);
                } else {
                    setTimeout(type, typingSpeed);
                }
            }
        }
        nameElement.textContent = '\u00A0';
        type();
    }

    // ── KEYBOARD SHORTCUTS ───────────────────────────────────────
    document.addEventListener("keydown", function (event) {
        if (event.key === "c") {
            window.open("https://classroom.google.com/u/1/?pli=1", "_blank");
        } else if (event.key === "k") {
            window.open("https://otc.school.kiwi/", "_blank");
        } else if (event.key === "d") {
            window.open("https://drive.google.com/drive/u/1/my-drive", "_blank");
        } else if (event.key === "v") {
            window.open("https://discord.com/channels/1305436206728740934/", "_blank");
        } else if (event.key === "m") {
            window.open("https://mail.google.com/mail/u/0/#inbox", "_blank");
            window.open("https://mail.google.com/mail/u/1/#inbox", "_blank");
        } else if (event.key === "g") {
            window.open("https://github.com/sleepywndud", "_blank");
            window.open("https://github.com/wndx2", "_blank");
        }
    });

    // ── LIVE TIME ─────────────────────────────────────────────────
    function updateTime() {
        const now = new Date();
        document.getElementById("live-time").textContent = now.toLocaleTimeString(
            [],
            { hour12: false }
        );
    }

    setInterval(updateTime, 10);
    updateTime();
});