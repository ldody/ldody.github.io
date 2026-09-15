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
