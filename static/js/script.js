(() => {
    "use strict";

    const THEME_KEY = "themeState";

    const particlesDark = {
        particles: {
            number: { value: 72, density: { enable: true, value_area: 900 } },
            color: { value: ["#6e56cf", "#9b8afb", "#63b3ff"] },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 2.6, random: true },
            line_linked: { enable: true, distance: 140, color: "#8b7cf5", opacity: 0.2, width: 1 },
            move: { enable: true, speed: 0.9, direction: "none", random: true, straight: false, out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "grab" },
                onclick: { enable: true, mode: "push" },
                resize: true
            },
            modes: {
                grab: { distance: 140, line_linked: { opacity: 0.4 } },
                push: { particles_nb: 3 }
            }
        },
        retina_detect: true
    };

    const particlesLight = {
        ...particlesDark,
        particles: {
            ...particlesDark.particles,
            color: { value: ["#2563eb", "#38bdf8", "#93c5fd"] },
            line_linked: { ...particlesDark.particles.line_linked, color: "#4f8ef7", opacity: 0.18 }
        }
    };

    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
    }

    function getCookie(name) {
        const key = `${name}=`;
        return document.cookie
            .split(";")
            .map((part) => part.trim())
            .find((part) => part.startsWith(key))
            ?.slice(key.length) || null;
    }

    function toggleWechatPopup(imageURL = "") {
        const overlay = document.querySelector(".tc");
        const panel = document.querySelector(".tc-main");
        const image = document.querySelector(".tc-img");
        if (!overlay || !panel) return;
        if (imageURL && image) image.src = imageURL;
        overlay.classList.toggle("active");
        panel.classList.toggle("active");
    }

    function applyTheme(theme) {
        const html = document.documentElement;
        const checkbox = document.getElementById("myonoffswitch");
        const snake = document.getElementById("tanChiShe");
        const nextTheme = theme === "Light" ? "Light" : "Dark";

        html.dataset.theme = nextTheme;
        setCookie(THEME_KEY, nextTheme, 365);
        if (snake) snake.src = `./static/svg/snake-${nextTheme}.svg`;
        if (checkbox) checkbox.checked = nextTheme !== "Dark";

        if (typeof particlesJS !== "undefined") {
            particlesJS("particles-js", nextTheme === "Dark" ? particlesDark : particlesLight);
        }
    }

    function initThemeSwitch() {
        const checkbox = document.getElementById("myonoffswitch");
        if (!checkbox) return;
        checkbox.addEventListener("change", () => {
            const current = document.documentElement.dataset.theme || "Dark";
            applyTheme(current === "Dark" ? "Light" : "Dark");
        });
    }

    function initPressFeedback() {
        document.querySelectorAll(".projectItem, .project-card, .iconItem").forEach((element) => {
            const add = () => element.classList.add("pressed");
            const remove = () => element.classList.remove("pressed");
            element.addEventListener("mousedown", add);
            element.addEventListener("mouseup", remove);
            element.addEventListener("mouseleave", remove);
            element.addEventListener("touchstart", add, { passive: true });
            element.addEventListener("touchend", remove, { passive: true });
            element.addEventListener("touchcancel", remove, { passive: true });
        });
    }

    function initReveal() {
        const targets = document.querySelectorAll(
            ".scroll-fade-in, .fade-in-section, .paper-item, .project-card, .honor-item, .research-item, .course-item, .about-me"
        );
        if (!("IntersectionObserver" in window)) {
            targets.forEach((el) => el.classList.add("is-visible"));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
        );

        targets.forEach((el) => observer.observe(el));
    }

    function initPageLoading() {
        const loading = document.getElementById("zyyo-loading");
        window.addEventListener("load", () => {
            document.body.classList.add("loaded");
            if (!loading) return;
            setTimeout(() => {
                loading.style.opacity = "0";
                loading.style.pointerEvents = "none";
            }, 120);
            setTimeout(() => {
                loading.style.display = "none";
            }, 520);
        });
    }

    function initPopupBindings() {
        const overlay = document.querySelector(".tc");
        const panel = document.querySelector(".tc-main");
        if (overlay) {
            overlay.addEventListener("click", () => toggleWechatPopup());
        }
        if (panel) {
            panel.addEventListener("click", (event) => event.stopPropagation());
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        window.setCookie = setCookie;
        window.getCookie = getCookie;
        window.pop = toggleWechatPopup;

        initThemeSwitch();
        initPressFeedback();
        initReveal();
        initPopupBindings();

        const themeFromCookie = getCookie(THEME_KEY) || document.documentElement.dataset.theme || "Dark";
        applyTheme(themeFromCookie);
    });

    initPageLoading();
})();
