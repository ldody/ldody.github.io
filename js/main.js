const canvas = document.getElementById("network");
const context = canvas ? canvas.getContext("2d") : null;

let points = [];
let animationFrame = null;
let lastFrameTime = 0;

const targetFrameDuration = 1000 / 30;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function resizeCanvas(resetPoints = false) {
    if (!canvas || !context) {
        return;
    }

    const oldWidth = Number(canvas.dataset.cssWidth) || innerWidth;
    const oldHeight = Number(canvas.dataset.cssHeight) || innerHeight;
    const newWidth = innerWidth;
    const newHeight = innerHeight;
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);

    canvas.width = newWidth * pixelRatio;
    canvas.height = newHeight * pixelRatio;
    canvas.style.width = newWidth + "px";
    canvas.style.height = newHeight + "px";
    canvas.dataset.cssWidth = newWidth;
    canvas.dataset.cssHeight = newHeight;

    context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
    );

    if (resetPoints || points.length === 0) {
        points = Array.from(
            { length: Math.min(42, Math.floor(newWidth / 30)) },
            () => ({
                x: Math.random() * newWidth,
                y: Math.random() * newHeight,
                vx: (Math.random() - 0.5) * 0.08,
                vy: (Math.random() - 0.5) * 0.08,
            })
        );

        return;
    }

    const scaleX = oldWidth > 0 ? newWidth / oldWidth : 1;
    const scaleY = oldHeight > 0 ? newHeight / oldHeight : 1;

    for (const point of points) {
        point.x *= scaleX;
        point.y *= scaleY;
    }
}

function renderNetwork(movePoints = true) {
    if (!canvas || !context) {
        return;
    }

    context.clearRect(0, 0, innerWidth, innerHeight);

    for (const point of points) {
        if (movePoints) {
            point.x += point.vx;
            point.y += point.vy;

            if (point.x < 0 || point.x > innerWidth) {
                point.vx *= -1;
            }

            if (point.y < 0 || point.y > innerHeight) {
                point.vy *= -1;
            }
        }

        context.beginPath();
        context.arc(point.x, point.y, 1.25, 0, Math.PI * 2);
        context.fillStyle = "rgba(103, 215, 255, 0.22)";
        context.fill();
    }

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const pointA = points[i];
            const pointB = points[j];

            const dx = pointA.x - pointB.x;
            const dy = pointA.y - pointB.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < 18225) {
                const distance = Math.sqrt(distanceSquared);

                context.beginPath();
                context.moveTo(pointA.x, pointA.y);
                context.lineTo(pointB.x, pointB.y);
                context.strokeStyle = `rgba(103, 215, 255, ${
                    0.07 * (1 - distance / 135)
                })`;
                context.stroke();
            }
        }
    }
}

function animateNetwork(timestamp) {
    if (document.hidden || reducedMotion.matches) {
        animationFrame = null;
        return;
    }

    if (timestamp - lastFrameTime >= targetFrameDuration) {
        lastFrameTime = timestamp;
        renderNetwork(true);
    }

    animationFrame = requestAnimationFrame(animateNetwork);
}

function startNetwork() {
    if (!canvas || !context) {
        return;
    }

    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    if (reducedMotion.matches) {
        renderNetwork(false);
        return;
    }

    animationFrame = requestAnimationFrame(animateNetwork);
}

function handleVisibilityChange() {
    if (!document.hidden) {
        startNetwork();
    }
}

function handleReducedMotionChange() {
    startNetwork();
}

addEventListener("resize", () => {
    resizeCanvas();

    if (reducedMotion.matches) {
        renderNetwork(false);
    }
});

document.addEventListener("visibilitychange", handleVisibilityChange);
reducedMotion.addEventListener("change", handleReducedMotionChange);

resizeCanvas(true);
startNetwork();

// -----------------------------------------------------------------------------
// Fast internal navigation
// Keeps the current document (and therefore the animated canvas) alive while
// replacing only the page shell contained in .wrap.
// -----------------------------------------------------------------------------
const pageCache = new Map();
const prefetchedPages = [
    "index.html",
    "about.html",
    "skills.html",
    "experience.html",
    "projects.html",
    "publications.html",
];

function normalizePageUrl(url) {
    const parsed = new URL(url, location.href);

    if (parsed.origin !== location.origin) {
        return null;
    }

    if (!parsed.pathname.endsWith(".html") && !parsed.pathname.endsWith("/")) {
        return null;
    }

    parsed.hash = "";
    return parsed;
}

async function loadPage(url) {
    const normalized = normalizePageUrl(url);
    if (!normalized) {
        return null;
    }

    const key = normalized.href;
    if (pageCache.has(key)) {
        return pageCache.get(key);
    }

    const request = fetch(key, { credentials: "same-origin" })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Unable to load ${normalized.pathname}`);
            }
            return response.text();
        })
        .then((html) => {
            const documentCopy = new DOMParser().parseFromString(html, "text/html");
            const wrap = documentCopy.querySelector(".wrap");

            if (!wrap) {
                throw new Error(`Missing .wrap in ${normalized.pathname}`);
            }

            return {
                title: documentCopy.title,
                wrapHTML: wrap.innerHTML,
                pageStyles: Array.from(documentCopy.head.querySelectorAll("style"))
                    .map((style) => style.textContent)
                    .join("\n"),
            };
        });

    pageCache.set(key, request);

    try {
        return await request;
    } catch (error) {
        pageCache.delete(key);
        throw error;
    }
}

function applyPageStyles(cssText) {
    let style = document.getElementById("dynamic-page-style");

    if (!cssText) {
        style?.remove();
        return;
    }

    if (!style) {
        style = document.createElement("style");
        style.id = "dynamic-page-style";
        document.head.appendChild(style);
    }

    style.textContent = cssText;
}

async function navigateTo(url, { push = true } = {}) {
    const normalized = normalizePageUrl(url);
    if (!normalized) {
        location.href = url;
        return;
    }

    try {
        const page = await loadPage(normalized.href);
        const wrap = document.querySelector(".wrap");

        if (!page || !wrap) {
            location.href = normalized.href;
            return;
        }

        // Mark SPA updates so CSS can avoid replaying the initial page-load fade.
        document.documentElement.classList.add("spa-navigation");
        wrap.innerHTML = page.wrapHTML;
        applyPageStyles(page.pageStyles);
        document.title = page.title;

        if (push) {
            history.pushState({ spa: true }, "", normalized.href);
        }

        scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (error) {
        console.error(error);
        location.href = normalized.href;
    }
}

function getInternalNavigationLink(target) {
    const link = target.closest("a[href]");
    if (!link) {
        return null;
    }

    if (
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.href.startsWith("mailto:") ||
        link.href.startsWith("tel:") ||
        link.href.startsWith("javascript:")
    ) {
        return null;
    }

    return normalizePageUrl(link.href) ? link : null;
}

document.addEventListener("click", (event) => {
    if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
    ) {
        return;
    }

    const link = getInternalNavigationLink(event.target);
    if (!link) {
        return;
    }

    event.preventDefault();
    navigateTo(link.href);
});

// Preload as soon as a user shows intent to open a page.
document.addEventListener("pointerover", (event) => {
    const link = getInternalNavigationLink(event.target);
    if (link) {
        loadPage(link.href).catch(() => {});
    }
});

document.addEventListener("touchstart", (event) => {
    const link = getInternalNavigationLink(event.target);
    if (link) {
        loadPage(link.href).catch(() => {});
    }
}, { passive: true });

window.addEventListener("popstate", () => {
    navigateTo(location.href, { push: false });
});

// Warm the small portfolio in idle time. Navigation still works normally if
// the browser decides not to run this before the first click.
const preloadPortfolio = () => {
    for (const page of prefetchedPages) {
        loadPage(new URL(page, location.href).href).catch(() => {});
    }
};

if ("requestIdleCallback" in window) {
    requestIdleCallback(preloadPortfolio, { timeout: 1500 });
} else {
    setTimeout(preloadPortfolio, 250);
}
