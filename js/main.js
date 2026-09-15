const canvas = document.getElementById("network");
const context = canvas.getContext("2d");

let points = [];

function resizeCanvas() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";

    context.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0
    );

    points = Array.from(
        { length: Math.min(55, Math.floor(innerWidth / 24)) },
        () => ({
            x: Math.random() * innerWidth,
            y: Math.random() * innerHeight,
            vx: (Math.random() - 0.5) * 0.08,
            vy: (Math.random() - 0.5) * 0.08,
        })
    );
}

function drawNetwork() {
    context.clearRect(0, 0, innerWidth, innerHeight);

    for (const point of points) {
        point.x += point.vx;
        point.y += point.vy;

        if (point.x < 0 || point.x > innerWidth) {
            point.vx *= -1;
        }

        if (point.y < 0 || point.y > innerHeight) {
            point.vy *= -1;
        }

        context.beginPath();
        context.arc(point.x, point.y, 1.25, 0, 7);
        context.fillStyle = "rgba(103, 215, 255, 0.22)";
        context.fill();
    }

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const pointA = points[i];
            const pointB = points[j];
            const distance = Math.hypot(
                pointA.x - pointB.x,
                pointA.y - pointB.y
            );

            if (distance < 135) {
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

    requestAnimationFrame(drawNetwork);
}

addEventListener("resize", resizeCanvas);
resizeCanvas();

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    drawNetwork();
} else {
    drawNetwork();
}
