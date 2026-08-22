/* ============================================================
   HEARTPLOSION — Interactive Birthday Heart
   ============================================================
   Right hand:
     ✊ Fist  → bring the heart together
     🖐️ Open → explode the completed heart

   Left hand:
     👈 Swipe → reserved for photo navigation
   ============================================================ */

class HeartPlosion {

    constructor() {
        // -----------------------------------------------------
        // DOM
        // -----------------------------------------------------
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.video = document.getElementById("webcam");

        this.loading = document.getElementById("loading");
        this.instructions = document.getElementById("instructions");
        this.status = document.getElementById("status");

        // -----------------------------------------------------
        // Canvas
        // -----------------------------------------------------
        this.resize();
        window.addEventListener("resize", () => this.resize());

        // -----------------------------------------------------
        // Animation
        // -----------------------------------------------------
        this.time = 0;
        this.lastTimestamp = 0;

        // -----------------------------------------------------
        // Heart state
        // -----------------------------------------------------

        // 0 = completely separated
        // 1 = completely joined
        this.heartProgress = 0;

        this.targetHeartProgress = 0;

        // Once the heart is joined, opening the right hand
        // can trigger the explosion.
        this.heartJoined = false;

        this.exploded = false;

        // Prevent the explosion from repeatedly triggering
        this.explosionCooldown = 0;

        // -----------------------------------------------------
        // Hand state
        // -----------------------------------------------------
        this.handLandmarks = [];
        this.handHandedness = [];

        this.rightHand = null;
        this.leftHand = null;

        this.rightFistAmount = 0;
        this.rightOpenAmount = 0;

        // Used later for left-hand swiping
        this.previousLeftX = null;
        this.leftSwipeVelocity = 0;

        // -----------------------------------------------------
        // Particles
        // -----------------------------------------------------
        this.particles = [];

        this.initParticles();

        // -----------------------------------------------------
        // Start hand tracking
        // -----------------------------------------------------
        this.initHandTracking();

        // -----------------------------------------------------
        // Animation
        // -----------------------------------------------------
        requestAnimationFrame((timestamp) => this.animate(timestamp));
    }


    // =========================================================
    // RESIZE
    // =========================================================

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }


    // =========================================================
    // PARTICLES
    // =========================================================

    initParticles() {

        for (let i = 0; i < 100; i++) {

            this.particles.push({
                x: Math.random(),
                y: Math.random(),

                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,

                size: Math.random() * 2 + 0.5,

                alpha: Math.random() * 0.6 + 0.2,

                phase: Math.random() * Math.PI * 2
            });
        }
    }


    // =========================================================
    // HAND TRACKING
    // =========================================================

    initHandTracking() {

        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
            }
        });

        hands.setOptions({

            maxNumHands: 2,

            modelComplexity: 1,

            minDetectionConfidence: 0.65,

            minTrackingConfidence: 0.5
        });

        hands.onResults((results) => {
            this.onHandResults(results);
        });


        const camera = new Camera(this.video, {

            onFrame: async () => {

                await hands.send({
                    image: this.video
                });
            },

            width: 1280,

            height: 720
        });


        camera.start()
            .then(() => {

                setTimeout(() => {

                    this.loading.classList.add("hidden");

                }, 800);

            })
            .catch((error) => {

                console.error("Camera error:", error);

                this.status.textContent =
                    "Camera access is required ❤️";
            });
    }


    // =========================================================
    // HAND RESULTS
    // =========================================================

    onHandResults(results) {

        this.handLandmarks =
            results.multiHandLandmarks || [];

        this.handHandedness =
            results.multiHandedness || [];


        this.rightHand = null;
        this.leftHand = null;


        for (
            let i = 0;
            i < this.handLandmarks.length;
            i++
        ) {

            const landmarks =
                this.handLandmarks[i];

            const handedness =
                this.handHandedness[i];


            if (
                handedness &&
                handedness.label === "Right"
            ) {

                this.rightHand = landmarks;

            } else {

                this.leftHand = landmarks;
            }
        }


        // -----------------------------------------------------
        // RIGHT HAND
        // -----------------------------------------------------

        if (this.rightHand) {

            this.rightFistAmount =
                this.calculateFistAmount(
                    this.rightHand
                );

            this.rightOpenAmount =
                this.calculateOpenAmount(
                    this.rightHand
                );


            // -------------------------------------------------
            // FIST → bring heart together
            // -------------------------------------------------

            if (!this.exploded) {

                this.targetHeartProgress =
                    this.rightFistAmount;

                if (this.rightFistAmount > 0.82) {

                    this.heartJoined = true;

                    this.status.textContent =
                        "❤️ Hold your fist...";

                } else if (
                    this.rightFistAmount > 0.35
                ) {

                    this.status.textContent =
                        "Bring the heart together...";

                } else {

                    this.status.textContent =
                        "✊ Close your right hand";
                }
            }


            // -------------------------------------------------
            // OPEN HAND → EXPLOSION
            // -------------------------------------------------

            if (
                this.heartJoined &&
                !this.exploded &&
                this.rightOpenAmount > 0.78 &&
                this.explosionCooldown <= 0
            ) {

                this.explodeHeart();
            }

        } else {

            // No right hand detected
            this.rightFistAmount *= 0.9;
            this.rightOpenAmount *= 0.9;

            if (!this.exploded) {

                this.targetHeartProgress *= 0.96;

                this.status.textContent =
                    "Show your right hand ❤️";
            }
        }


        // -----------------------------------------------------
        // LEFT HAND
        // -----------------------------------------------------

        if (this.leftHand) {

            const center =
                this.palmCenter(this.leftHand);

            const x = center.x;


            if (this.previousLeftX !== null) {

                this.leftSwipeVelocity =
                    x - this.previousLeftX;
            }

            this.previousLeftX = x;

        } else {

            this.previousLeftX = null;

            this.leftSwipeVelocity = 0;
        }
    }


    // =========================================================
    // FIST DETECTION
    // =========================================================

    calculateFistAmount(lm) {

        /*
            MediaPipe landmarks:

            0  = wrist

            Index:
            8  = fingertip

            Middle:
            12 = fingertip

            Ring:
            16 = fingertip

            Pinky:
            20 = fingertip
        */


        const wrist = lm[0];

        const palmSize =
            Math.hypot(
                lm[9].x - wrist.x,
                lm[9].y - wrist.y
            );


        if (palmSize < 0.01) {
            return 0;
        }


        const fingertips = [
            lm[8],
            lm[12],
            lm[16],
            lm[20]
        ];


        let total = 0;


        for (const tip of fingertips) {

            const distance =
                Math.hypot(
                    tip.x - wrist.x,
                    tip.y - wrist.y
                );


            const normalized =
                distance / palmSize;


            /*
                Open fingers are usually
                further from the wrist.

                Closed fingers are closer.

                Convert that into:

                0 = open
                1 = fist
            */

            let fist =
                1 -
                (normalized - 1.25) / 1.0;


            fist =
                Math.max(
                    0,
                    Math.min(1, fist)
                );


            total += fist;
        }


        return total / 4;
    }


    // =========================================================
    // OPEN HAND DETECTION
    // =========================================================

    calculateOpenAmount(lm) {

        const wrist = lm[0];

        const palmSize =
            Math.hypot(
                lm[9].x - wrist.x,
                lm[9].y - wrist.y
            );


        if (palmSize < 0.01) {
            return 0;
        }


        const fingertips = [
            lm[8],
            lm[12],
            lm[16],
            lm[20]
        ];


        let total = 0;


        for (const tip of fingertips) {

            const distance =
                Math.hypot(
                    tip.x - wrist.x,
                    tip.y - wrist.y
                );


            const normalized =
                distance / palmSize;


            let open =
                (normalized - 1.25) / 1.0;


            open =
                Math.max(
                    0,
                    Math.min(1, open)
                );


            total += open;
        }


        return total / 4;
    }


    // =========================================================
    // PALM CENTER
    // =========================================================

    palmCenter(lm) {

        const ids = [
            0,
            5,
            9,
            13,
            17
        ];


        let x = 0;
        let y = 0;


        for (const id of ids) {

            x += lm[id].x;
            y += lm[id].y;
        }


        return {
            x: x / ids.length,
            y: y / ids.length
        };
    }


    // =========================================================
    // HEART EXPLOSION
    // =========================================================

    explodeHeart() {

        this.exploded = true;

        this.explosionCooldown = 120;

        this.status.textContent =
            "💥 ❤️";


        // Create a burst of particles
        for (let i = 0; i < 180; i++) {

            const angle =
                Math.random() *
                Math.PI *
                2;

            const speed =
                Math.random() *
                8 +
                2;


            this.particles.push({

                x: 0.5,

                y: 0.48,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                size:
                    Math.random() *
                    4 +
                    1,

                alpha: 1,

                phase:
                    Math.random() *
                    Math.PI *
                    2,

                explosion: true
            });
        }
    }


    // =========================================================
    // DRAW HEART
    // =========================================================

    drawHeart(cx, cy, size, progress) {

        const ctx = this.ctx;

        /*
            The two halves start separated
            and move toward each other.

            progress:
                0 = separated
                1 = whole
        */


        const separation =
            size *
            0.65 *
            (1 - progress);


        ctx.save();

        ctx.translate(cx, cy);


        // -----------------------------------------------------
        // Glow
        // -----------------------------------------------------

        const glow =
            ctx.createRadialGradient(
                0,
                0,
                size * 0.15,
                0,
                0,
                size * 1.5
            );


        glow.addColorStop(
            0,
            `rgba(255, 50, 110, ${0.25 * progress + 0.12})`
        );

        glow.addColorStop(
            0.5,
            `rgba(255, 20, 80, ${0.12 * progress + 0.05})`
        );

        glow.addColorStop(
            1,
            "rgba(255, 0, 70, 0)"
        );


        ctx.fillStyle = glow;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            size * 1.5,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // -----------------------------------------------------
        // Draw each half
        // -----------------------------------------------------

        this.drawHeartHalf(
            ctx,
            -separation,
            0,
            size,
            "left"
        );


        this.drawHeartHalf(
            ctx,
            separation,
            0,
            size,
            "right"
        );


        ctx.restore();
    }


    // =========================================================
    // HEART HALF
    // =========================================================

    drawHeartHalf(
        ctx,
        offsetX,
        offsetY,
        size,
        side
    ) {

        ctx.save();

        ctx.translate(
            offsetX,
            offsetY
        );


        if (side === "right") {

            ctx.scale(-1, 1);
        }


        const gradient =
            ctx.createRadialGradient(
                -size * 0.1,
                -size * 0.2,
                size * 0.1,
                0,
                0,
                size
            );


        gradient.addColorStop(
            0,
            "#ff8aaa"
        );

        gradient.addColorStop(
            0.35,
            "#ff3f76"
        );

        gradient.addColorStop(
            0.75,
            "#e91652"
        );

        gradient.addColorStop(
            1,
            "#9d0838"
        );


        ctx.fillStyle = gradient;

        ctx.shadowBlur = 30;

        ctx.shadowColor =
            "rgba(255, 30, 100, 0.7)";


        ctx.beginPath();


        /*
            Left half of a heart.

            The shape is designed so the
            two halves meet in the center.
        */

        ctx.moveTo(0, size * 0.72);

        ctx.bezierCurveTo(
            -size * 0.15,
            size * 0.48,

            -size * 0.58,
            size * 0.15,

            -size * 0.58,
            -size * 0.18
        );


        ctx.bezierCurveTo(
            -size * 0.58,
            -size * 0.52,

            -size * 0.2,
            -size * 0.68,

            0,
            -size * 0.4
        );


        ctx.lineTo(
            0,
            size * 0.72
        );


        ctx.closePath();

        ctx.fill();


        ctx.restore();
    }


    // =========================================================
    // BACKGROUND PARTICLES
    // =========================================================

    drawBackgroundParticles(dt) {

        const ctx = this.ctx;

        for (const p of this.particles) {

            if (p.explosion) {
                continue;
            }


            p.x += p.vx * dt * 0.01;
            p.y += p.vy * dt * 0.01;


            if (p.x < 0) p.x = 1;
            if (p.x > 1) p.x = 0;

            if (p.y < 0) p.y = 1;
            if (p.y > 1) p.y = 0;


            const flicker =
                0.5 +
                0.5 *
                Math.sin(
                    this.time * 2 +
                    p.phase
                );


            ctx.save();

            ctx.globalAlpha =
                p.alpha *
                flicker;

            ctx.fillStyle =
                "#ff719d";

            ctx.shadowBlur = 10;

            ctx.shadowColor =
                "#ff326f";


            ctx.beginPath();

            ctx.arc(
                p.x * this.canvas.width,
                p.y * this.canvas.height,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        }
    }


    // =========================================================
    // EXPLOSION PARTICLES
    // =========================================================

    updateExplosionParticles(dt) {

        const ctx = this.ctx;

        for (const p of this.particles) {

            if (!p.explosion) {
                continue;
            }


            p.x +=
                (p.vx / this.canvas.width) *
                dt *
                2.5;


            p.y +=
                (p.vy / this.canvas.height) *
                dt *
                2.5;


            p.vx *= 0.97;
            p.vy *= 0.97;

            p.alpha *= 0.975;


            ctx.save();

            ctx.globalAlpha =
                p.alpha;

            ctx.fillStyle =
                "#ff4f86";

            ctx.shadowBlur = 15;

            ctx.shadowColor =
                "#ff236c";


            ctx.beginPath();

            ctx.arc(
                p.x * this.canvas.width,
                p.y * this.canvas.height,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        }
    }


    // =========================================================
    // MAIN ANIMATION LOOP
    // =========================================================

    animate(timestamp) {

        const dt =
            this.lastTimestamp
                ? (timestamp - this.lastTimestamp) / 16.67
                : 1;


        this.lastTimestamp =
            timestamp;


        this.time +=
            0.016 * dt;


        const ctx =
            this.ctx;


        const cw =
            this.canvas.width;


        const ch =
            this.canvas.height;


        // -----------------------------------------------------
        // Smooth heart movement
        // -----------------------------------------------------

        this.heartProgress +=
            (
                this.targetHeartProgress -
                this.heartProgress
            ) *
            0.08 *
            dt;


        if (this.explosionCooldown > 0) {

            this.explosionCooldown -= dt;
        }


        // -----------------------------------------------------
        // Clear
        // -----------------------------------------------------

        ctx.clearRect(
            0,
            0,
            cw,
            ch
        );


        // -----------------------------------------------------
        // Background
        // -----------------------------------------------------

        const background =
            ctx.createRadialGradient(
                cw * 0.5,
                ch * 0.45,
                0,
                cw * 0.5,
                ch * 0.45,
                Math.max(cw, ch) * 0.7
            );


        background.addColorStop(
            0,
            "#210917"
        );

        background.addColorStop(
            0.5,
            "#10040c"
        );

        background.addColorStop(
            1,
            "#050105"
        );


        ctx.fillStyle =
            background;


        ctx.fillRect(
            0,
            0,
            cw,
            ch
        );


        // -----------------------------------------------------
        // Background particles
        // -----------------------------------------------------

        this.drawBackgroundParticles(dt);


        // -----------------------------------------------------
        // Heart
        // -----------------------------------------------------

        if (!this.exploded) {

            const pulse =
                1 +
                Math.sin(
                    this.time * 2.5
                ) *
                0.025;


            const heartSize =
                Math.min(cw, ch) *
                0.22 *
                pulse;


            this.drawHeart(
                cw * 0.5,
                ch * 0.48,
                heartSize,
                this.heartProgress
            );
        }


        // -----------------------------------------------------
        // Explosion
        // -----------------------------------------------------

        this.updateExplosionParticles(dt);


        // -----------------------------------------------------
        // Continue
        // -----------------------------------------------------

        requestAnimationFrame(
            (ts) =>
                this.animate(ts)
        );
    }
}


// ============================================================
// START
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        new HeartPlosion();

    }
);
