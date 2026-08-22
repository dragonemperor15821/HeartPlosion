/* ============================================================
   HEARTPLOSION — Birthday Memory Experience
   ============================================================

   RIGHT HAND
   ✊ Fist      → bring the two heart halves together
   🖐️ Open     → explode the completed heart

   LEFT HAND
   👈 Swipe    → navigate through the Polaroid memories

   EXPERIENCE
   ────────────────────────────────────────────────────────────
   Two heart halves
        ↓
   Right fist
        ↓
   Whole glowing heart
        ↓
   Right hand opens
        ↓
   Heart explosion
        ↓
   Butterflies + flower petals
        ↓
   Vintage Polaroid memories
        ↓
   Left-hand swiping
        ↓
   Giant glowing heart
        ↓
   Happy Birthday My Wifey...
   ============================================================ */

class HeartPlosion {

    constructor() {

        // =====================================================
        // DOM
        // =====================================================

        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.video = document.getElementById("webcam");

        this.loading = document.getElementById("loading");
        this.instructions = document.getElementById("instructions");
        this.status = document.getElementById("status");


        // =====================================================
        // CANVAS
        // =====================================================

        this.resize();

        window.addEventListener(
            "resize",
            () => this.resize()
        );


        // =====================================================
        // TIME
        // =====================================================

        this.time = 0;
        this.lastTimestamp = 0;


        // =====================================================
        // EXPERIENCE STATE
        // =====================================================

        this.state = "heart";

        /*
            heart
            joining
            complete
            exploding
            reveal
            gallery
            ending
        */


        // =====================================================
        // HEART
        // =====================================================

        this.heartProgress = 0;
        this.targetHeartProgress = 0;

        this.heartJoined = false;

        this.explosionTriggered = false;

        this.explosionTimer = 0;


        // =====================================================
        // HAND STATE
        // =====================================================

        this.handLandmarks = [];
        this.handHandedness = [];

        this.rightHand = null;
        this.leftHand = null;

        this.rightFistAmount = 0;
        this.rightOpenAmount = 0;

        this.previousRightOpen = 0;

        // Left-hand swipe tracking
        this.previousLeftX = null;
        this.leftSwipeStartX = null;
        this.leftSwipeCooldown = 0;

        // Prevent multiple swipe triggers
        this.swipeThreshold = 0.13;


        // =====================================================
        // GALLERY
        // =====================================================

        /*
            We will replace these placeholder paths with your
            actual GitHub image filenames after the core system
            is working.
        */

        this.photos = [
    "photos/photo01.png",
    "photos/photo02.png",
    "photos/photo03.png",
    "photos/photo04.png",
    "photos/photo05.png",
    "photos/photo06.png",
    "photos/photo07.png",
    "photos/photo08.png",
    "photos/photo09.png",
    "photos/photo10.png",
    "photos/photo11.png",
    "photos/photo12.png",
    "photos/photo13.png",
    "photos/photo14.png",
    "photos/photo15.png"
];

        this.photoImages = [];

        this.currentPhoto = 0;

        this.photoTransition = 0;

        this.photoTransitionDirection = 0;

        this.galleryReady = false;


        // =====================================================
        // PARTICLES
        // =====================================================

        this.particles = [];

        this.butterflies = [];

        this.petals = [];

        this.initBackgroundParticles();


        // =====================================================
        // LOAD PHOTOS
        // =====================================================

        this.loadPhotos();


        // =====================================================
        // HAND TRACKING
        // =====================================================

        this.initHandTracking();


        // =====================================================
        // ANIMATION
        // =====================================================

        requestAnimationFrame(
            (timestamp) =>
                this.animate(timestamp)
        );
    }


    // =========================================================
    // RESIZE
    // =========================================================

    resize() {

        this.canvas.width =
            window.innerWidth;

        this.canvas.height =
            window.innerHeight;
    }


    // =========================================================
    // BACKGROUND PARTICLES
    // =========================================================

    initBackgroundParticles() {

        for (let i = 0; i < 120; i++) {

            this.particles.push({

                x: Math.random(),

                y: Math.random(),

                size:
                    Math.random() * 2.2 + 0.4,

                alpha:
                    Math.random() * 0.5 + 0.1,

                speed:
                    Math.random() * 0.00035 +
                    0.00008,

                phase:
                    Math.random() *
                    Math.PI *
                    2
            });
        }
    }


    // =========================================================
    // PHOTO LOADING
    // =========================================================

    loadPhotos() {

        let loaded = 0;

        this.photoImages =
            new Array(this.photos.length);


        this.photos.forEach(
            (src, index) => {

                const img =
                    new Image();

                img.onload = () => {

                    this.photoImages[index] =
                        img;

                    loaded++;

                    if (
                        loaded ===
                        this.photos.length
                    ) {

                        this.galleryReady = true;
                    }
                };


                img.onerror = () => {

                    console.warn(
                        "Could not load:",
                        src
                    );
                };


                img.src = src;
            }
        );
    }


    // =========================================================
    // MEDIAPIPE
    // =========================================================

    initHandTracking() {

        const hands =
            new Hands({

                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
            });


        hands.setOptions({

            maxNumHands: 2,

            modelComplexity: 1,

            minDetectionConfidence: 0.65,

            minTrackingConfidence: 0.5
        });


        hands.onResults(
            (results) =>
                this.onHandResults(results)
        );


        const camera =
            new Camera(
                this.video,
                {

                    onFrame: async () => {

                        await hands.send({
                            image:
                                this.video
                        });
                    },

                    width: 1280,

                    height: 720
                }
            );


        camera
            .start()
            .then(() => {

                setTimeout(
                    () => {

                        if (this.loading) {

                            this.loading.classList.add(
                                "hidden"
                            );
                        }

                    },
                    900
                );

            })
            .catch((error) => {

                console.error(
                    "Camera error:",
                    error
                );


                if (this.status) {

                    this.status.textContent =
                        "Camera access is required ❤️";
                }
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

            const hand =
                this.handLandmarks[i];

            const handedness =
                this.handHandedness[i];


            if (
                handedness &&
                handedness.label === "Left"
            ) {

                // MediaPipe's label is reversed because
                // our camera input is not mirrored for detection.
                // "Left" here corresponds to the user's physical RIGHT hand.
                this.rightHand = hand;

            } else {

                // "Right" corresponds to the user's physical LEFT hand.
                this.leftHand = hand;
            }
        }


        // =====================================================
        // RIGHT HAND
        // =====================================================

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
            // HEART STAGE
            // -------------------------------------------------

            if (
                this.state === "heart" ||
                this.state === "joining"
            ) {

                this.targetHeartProgress = Math.max(
    0,
    Math.min(
        1,
        (this.rightFistAmount - 0.42) / 0.50
    )
);

if (this.rightFistAmount > 0.88) {

    this.state = "joining";

    this.heartJoined = true;

    this.targetHeartProgress = 1;

    if (this.status) {
        this.status.textContent =
            "Open your right hand ✋ to explode the heart";
    }

} else if (this.rightFistAmount > 0.42) {

    this.state = "joining";

    if (this.status) {
        this.status.textContent =
            "Bring us together...";
    }

} else {

    this.state = "heart";

    if (this.status) {
        this.status.textContent =
            "Close your right hand ✊";
    }
}

            // -------------------------------------------------
            // EXPLOSION
            // -------------------------------------------------

            if (
                this.heartJoined &&
                !this.explosionTriggered &&
                this.rightOpenAmount >
                0.55
            ) {

                this.explodeHeart();
            }


            this.previousRightOpen =
                this.rightOpenAmount;

        } else {

            this.rightFistAmount *= 0.9;

            this.rightOpenAmount *= 0.9;

            this.previousRightOpen *= 0.9;
        }


        // =====================================================
        // LEFT HAND / SWIPES
        // =====================================================

        if (this.leftHand) {

            const center =
                this.palmCenter(
                    this.leftHand
                );

            const x =
                center.x;


            if (
                this.previousLeftX ===
                null
            ) {

                this.previousLeftX =
                    x;

                this.leftSwipeStartX =
                    x;
            }


            const movement =
                x -
                this.previousLeftX;


            this.previousLeftX =
                x;


            // -----------------------------------------------
            // Gallery swipe detection
            // -----------------------------------------------

            if (
                this.state ===
                "gallery"
            ) {

                if (
                    this.leftSwipeCooldown >
                    0
                ) {

                    return;
                }


                const totalSwipe =
                    x -
                    this.leftSwipeStartX;


                if (
                    Math.abs(
                        totalSwipe
                    ) >
                    this.swipeThreshold
                ) {

                    if (totalSwipe > 0) {
    this.nextPhoto();
} else {
    this.previousPhoto();
}


                    this.leftSwipeStartX =
                        x;

                    this.leftSwipeCooldown =
                        25;
                }
            }

        } else {

            this.previousLeftX =
                null;

            this.leftSwipeStartX =
                null;
        }
    }


    // =========================================================
    // FIST DETECTION
    // =========================================================

    calculateFistAmount(lm) {

        const wrist =
            lm[0];


        const palmSize =
            Math.hypot(
                lm[9].x -
                    wrist.x,

                lm[9].y -
                    wrist.y
            );


        if (
            palmSize <
            0.01
        ) {

            return 0;
        }


        const fingertips = [

            lm[8],

            lm[12],

            lm[16],

            lm[20]

        ];


        let total = 0;


        for (
            const tip
            of fingertips
        ) {

            const distance =
                Math.hypot(
                    tip.x -
                        wrist.x,

                    tip.y -
                        wrist.y
                );


            const normalized =
                distance /
                palmSize;


            let amount =
                1 -
                (
                    normalized -
                    1.25
                ) /
                1.0;


            amount =
                Math.max(
                    0,

                    Math.min(
                        1,
                        amount
                    )
                );


            total +=
                amount;
        }


        return total / 4;
    }


    // =========================================================
    // OPEN HAND
    // =========================================================

    calculateOpenAmount(lm) {

        const wrist =
            lm[0];


        const palmSize =
            Math.hypot(
                lm[9].x -
                    wrist.x,

                lm[9].y -
                    wrist.y
            );


        if (
            palmSize <
            0.01
        ) {

            return 0;
        }


        const fingertips = [

            lm[8],

            lm[12],

            lm[16],

            lm[20]

        ];


        let total = 0;


        for (
            const tip
            of fingertips
        ) {

            const distance =
                Math.hypot(
                    tip.x -
                        wrist.x,

                    tip.y -
                        wrist.y
                );


            const normalized =
                distance /
                palmSize;


            let amount =
                (
                    normalized -
                    1.25
                ) /
                1.0;


            amount =
                Math.max(
                    0,

                    Math.min(
                        1,
                        amount
                    )
                );


            total +=
                amount;
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


        for (
            const id
            of ids
        ) {

            x +=
                lm[id].x;

            y +=
                lm[id].y;
        }


        return {

            x:
                x /
                ids.length,

            y:
                y /
                ids.length
        };
    }


    // =========================================================
    // HEART EXPLOSION
    // =========================================================

    explodeHeart() {

        this.explosionTriggered =
            true;


        this.state =
            "exploding";


        this.explosionTimer =
            0;


        if (this.status) {

            this.status.textContent =
                "";
        }


        // -----------------------------------------------------
        // Light burst
        // -----------------------------------------------------

        for (
            let i = 0;
            i < 280;
            i++
        ) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            const speed =
                Math.random() *
                6 +
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

                explosion:
                    true
            });
        }


        // -----------------------------------------------------
        // Butterflies
        // -----------------------------------------------------

        for (
            let i = 0;
            i < 18;
            i++
        ) {

            this.butterflies.push({

                x:
                    this.canvas.width *
                    0.5,

                y:
                    this.canvas.height *
                    0.48,

                vx:
                    (
                        Math.random() -
                        0.5
                    ) *
                    4,

                vy:
                    (
                        Math.random() -
                        0.5
                    ) *
                    4 -
                    1,

                size:
                    Math.random() *
                    12 +
                    10,

                rotation:
                    Math.random() *
                    Math.PI *
                    2,

                rotationSpeed:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.03,

                phase:
                    Math.random() *
                    Math.PI *
                    2,

                alpha: 1
            });
        }


        // -----------------------------------------------------
        // Flower petals
        // -----------------------------------------------------

        for (
            let i = 0;
            i < 80;
            i++
        ) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            const speed =
                Math.random() *
                4 +
                1;


            this.petals.push({

                x:
                    this.canvas.width *
                    0.5,

                y:
                    this.canvas.height *
                    0.48,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                size:
                    Math.random() *
                    8 +
                    4,

                rotation:
                    Math.random() *
                    Math.PI *
                    2,

                rotationSpeed:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.08,

                alpha: 1
            });
        }
    }


    // =========================================================
    // HEART DRAWING
    // =========================================================

    drawHeart(
        cx,
        cy,
        size,
        progress
    ) {

        const ctx =
            this.ctx;


        const separation =
            size *
            0.72 *
            (
                1 -
                progress
            );


        ctx.save();

        ctx.translate(
            cx,
            cy
        );


        // -----------------------------------------------------
        // Ambient glow
        // -----------------------------------------------------

        const glow =
            ctx.createRadialGradient(
                0,
                0,
                size *
                0.1,

                0,
                0,
                size *
                1.6
            );


        glow.addColorStop(
            0,

            `rgba(255, 90, 160, ${
                0.18 +
                progress *
                0.25
            })`
        );


        glow.addColorStop(
            0.5,

            `rgba(170, 70, 255, ${
                0.10 +
                progress *
                0.12
            })`
        );


        glow.addColorStop(
            1,

            "rgba(100, 0, 150, 0)"
        );


        ctx.fillStyle =
            glow;


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            size *
            1.6,
            0,
            Math.PI *
            2
        );

        ctx.fill();


        // -----------------------------------------------------
        // Heart halves
        // -----------------------------------------------------

        this.drawHeartHalf(
            ctx,
            -separation,
            0,
            size,
            false
        );


        this.drawHeartHalf(
            ctx,
            separation,
            0,
            size,
            true
        );


        // -----------------------------------------------------
        // Labels inside the heart halves
        // -----------------------------------------------------

        ctx.save();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font =
            `italic ${Math.max(22, size * 0.20)}px cursive`;

        ctx.fillStyle =
            "rgba(255, 245, 252, 0.96)";

        ctx.shadowBlur = 18;

        ctx.shadowColor =
            "rgba(255, 120, 200, 0.9)";


        // When the halves are together, show a single "Us"
        // instead of allowing "You" and "Me" to overlap.
        if (progress > 0.96) {

            ctx.fillText(
                "Us",
                0,
                -size * 0.02
            );

        } else {

            // Visual LEFT half = "You"
            // Because the canvas is mirrored, visual-left
            // corresponds to positive canvas X.
            ctx.fillText(
                "You",
                separation,
                -size * 0.02
            );

            // Visual RIGHT half = "Me"
            ctx.fillText(
                "Me",
                -separation,
                -size * 0.02
            );
        }


        ctx.restore();


        // -----------------------------------------------------
        // Complete heart pulse
        // -----------------------------------------------------

        if (
            progress >
            0.96
        ) {

            const pulse =
                1 +
                Math.sin(
                    this.time *
                    5
                ) *
                0.025;


            ctx.scale(
                pulse,
                pulse
            );
        }


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
        mirrored
    ) {

        ctx.save();


        ctx.translate(
            offsetX,
            offsetY
        );


        if (mirrored) {

            ctx.scale(
                -1,
                1
            );
        }


        const gradient =
            ctx.createLinearGradient(
                0,
                -size,
                0,
                size
            );


        gradient.addColorStop(
            0,
            "#ffb1d0"
        );

        gradient.addColorStop(
            0.3,
            "#ff5c9a"
        );

        gradient.addColorStop(
            0.7,
            "#e9286e"
        );

        gradient.addColorStop(
            1,
            "#8d174e"
        );


        ctx.fillStyle =
            gradient;


        ctx.shadowBlur =
            35;


        ctx.shadowColor =
            "rgba(255, 45, 130, 0.75)";


        ctx.beginPath();


        ctx.moveTo(
            0,
            size *
            0.72
        );


        ctx.bezierCurveTo(
            -size *
            0.15,
            size *
            0.48,

            -size *
            0.65,
            size *
            0.10,

            -size *
            0.65,
            -size *
            0.20
        );


        ctx.bezierCurveTo(
            -size *
            0.65,
            -size *
            0.58,

            -size *
            0.18,
            -size *
            0.70,

            0,
            -size *
            0.40
        );


        ctx.lineTo(
            0,
            size *
            0.72
        );


        ctx.closePath();

        ctx.fill();


        ctx.restore();
    }


    // =========================================================
    // BACKGROUND
    // =========================================================

    drawBackground() {

        const ctx =
            this.ctx;

        const cw =
            this.canvas.width;

        const ch =
            this.canvas.height;


        const gradient =
            ctx.createRadialGradient(
                cw *
                0.5,
                ch *
                0.45,
                0,

                cw *
                0.5,
                ch *
                0.45,

                Math.max(
                    cw,
                    ch
                ) *
                0.75
            );


        gradient.addColorStop(
            0,
            "#281020"
        );


        gradient.addColorStop(
            0.38,
            "#150814"
        );


        gradient.addColorStop(
            0.72,
            "#09030b"
        );


        gradient.addColorStop(
            1,
            "#020103"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            0,
            0,
            cw,
            ch
        );


        // Purple ambient glow
        const purple =
            ctx.createRadialGradient(
                cw *
                0.18,
                ch *
                0.25,
                0,

                cw *
                0.18,
                ch *
                0.25,

                cw *
                0.6
            );


        purple.addColorStop(
            0,
            "rgba(150, 50, 255, 0.10)"
        );


        purple.addColorStop(
            1,
            "rgba(150, 50, 255, 0)"
        );


        ctx.fillStyle =
            purple;


        ctx.fillRect(
            0,
            0,
            cw,
            ch
        );
    }


    // =========================================================
    // BACKGROUND PARTICLES
    // =========================================================

    updateBackgroundParticles(dt) {

        const ctx =
            this.ctx;


        for (
            const p
            of this.particles
        ) {

            if (
                p.explosion
            ) {

                continue;
            }


            p.y -=
                p.speed *
                dt;


            if (
                p.y <
                -0.02
            ) {

                p.y =
                    1.02;

                p.x =
                    Math.random();
            }


            const flicker =
                0.5 +
                0.5 *
                Math.sin(
                    this.time *
                    1.5 +
                    p.phase
                );


            ctx.save();


            ctx.globalAlpha =
                p.alpha *
                flicker;


            ctx.fillStyle =
                "#ff91bd";


            ctx.shadowBlur =
                10;


            ctx.shadowColor =
                "#ff3d8c";


            ctx.beginPath();


            ctx.arc(
                p.x *
                this.canvas.width,

                p.y *
                this.canvas.height,

                p.size,

                0,
                Math.PI *
                2
            );


            ctx.fill();

            ctx.restore();
        }
    }


    // =========================================================
    // EXPLOSION PARTICLES
    // =========================================================

    updateExplosionParticles(dt) {

        const ctx =
            this.ctx;


        for (
            const p
            of this.particles
        ) {

            if (
                !p.explosion
            ) {

                continue;
            }


            p.x +=
                (
                    p.vx /
                    this.canvas.width
                ) *
                dt *
                2.2;


            p.y +=
                (
                    p.vy /
                    this.canvas.height
                ) *
                dt *
                2.2;


            p.vx *=
                0.975;

            p.vy *=
                0.975;


            p.alpha *=
                0.972;


            ctx.save();


            ctx.globalAlpha =
                p.alpha;


            ctx.fillStyle =
                Math.random() >
                0.5
                    ? "#ff6ba5"
                    : "#c77dff";


            ctx.shadowBlur =
                18;


            ctx.shadowColor =
                "#ff4f9a";


            ctx.beginPath();


            ctx.arc(
                p.x *
                this.canvas.width,

                p.y *
                this.canvas.height,

                p.size,

                0,
                Math.PI *
                2
            );


            ctx.fill();


            ctx.restore();
        }
    }


    // =========================================================
    // BUTTERFLIES
    // =========================================================

    updateButterflies(dt) {

        const ctx =
            this.ctx;


        for (
            const b
            of this.butterflies
        ) {

            b.x +=
                b.vx *
                dt;

            b.y +=
                b.vy *
                dt;


            b.vy +=
                Math.sin(
                    this.time *
                    2 +
                    b.phase
                ) *
                0.015;


            b.rotation +=
                b.rotationSpeed;


            b.alpha *=
                0.996;


            this.drawButterfly(
                b
            );
        }
    }


    // =========================================================
    // BUTTERFLY DRAWING
    // =========================================================

    drawButterfly(b) {

        const ctx =
            this.ctx;


        ctx.save();


        ctx.translate(
            b.x,
            b.y
        );


        ctx.rotate(
            b.rotation
        );


        ctx.globalAlpha =
            b.alpha;


        const flap =
            Math.sin(
                this.time *
                9 +
                b.phase
            );


        const wing =
            b.size *
            (
                0.65 +
                Math.abs(
                    flap
                ) *
                0.35
            );


        // Soft glow
        ctx.shadowBlur =
            18;

        ctx.shadowColor =
            "rgba(255, 150, 220, 0.7)";


        // Left wing
        const left =
            ctx.createRadialGradient(
                -wing *
                0.55,
                0,
                1,

                -wing *
                0.55,
                0,
                wing
            );


        left.addColorStop(
            0,
            "#ffd0e7"
        );

        left.addColorStop(
            0.45,
            "#ff73ad"
        );

        left.addColorStop(
            1,
            "rgba(177, 66, 255, 0.15)"
        );


        ctx.fillStyle =
            left;


        ctx.beginPath();


        ctx.ellipse(
            -wing *
            0.55,
            -wing *
            0.1,
            wing *
            0.75,
            wing,
            -0.4,
            0,
            Math.PI *
            2
        );


        ctx.fill();


        // Right wing
        const right =
            ctx.createRadialGradient(
                wing *
                0.55,
                0,
                1,

                wing *
                0.55,
                0,
                wing
            );


        right.addColorStop(
            0,
            "#ffd0e7"
        );

        right.addColorStop(
            0.45,
            "#c77dff"
        );

        right.addColorStop(
            1,
            "rgba(255, 70, 160, 0.15)"
        );


        ctx.fillStyle =
            right;


        ctx.beginPath();


        ctx.ellipse(
            wing *
            0.55,
            -wing *
            0.1,
            wing *
            0.75,
            wing,
            0.4,
            0,
            Math.PI *
            2
        );


        ctx.fill();


        // Body
        ctx.shadowBlur = 0;

        ctx.fillStyle =
            "#3b1730";


        ctx.beginPath();


        ctx.ellipse(
            0,
            0,
            b.size *
            0.08,
            b.size *
            0.55,
            0,
            0,
            Math.PI *
            2
        );


        ctx.fill();


        ctx.restore();
    }


    // =========================================================
    // FLOWER PETALS
    // =========================================================

    updatePetals(dt) {

        const ctx =
            this.ctx;


        for (
            const p
            of this.petals
        ) {

            p.x +=
                p.vx *
                dt;

            p.y +=
                p.vy *
                dt;


            p.vy +=
                0.025 *
                dt;


            p.rotation +=
                p.rotationSpeed;


            p.alpha *=
                0.985;


            ctx.save();


            ctx.translate(
                p.x,
                p.y
            );


            ctx.rotate(
                p.rotation
            );


            ctx.globalAlpha =
                p.alpha;


            ctx.fillStyle =
                "#ff9fc4";


            ctx.shadowBlur =
                12;


            ctx.shadowColor =
                "#ff4c91";


            ctx.beginPath();


            ctx.ellipse(
                0,
                0,
                p.size *
                0.55,
                p.size,
                0,
                0,
                Math.PI *
                2
            );


            ctx.fill();


            ctx.restore();
        }
    }


    // =========================================================
    // GALLERY
    // =========================================================

   enterGallery() {
    this.state = "gallery";

    // ALWAYS begin with Photo 1
    this.currentPhoto = 0;

    this.photoTransition = 1;
    this.photoTransitionDirection = 0;

    // Reset swipe tracking so the hand movement
    // that triggered the gallery does NOT count
    // as an immediate swipe.
    this.previousLeftX = null;
    this.leftSwipeStartX = null;

    // Give the gallery a short settling period
    this.leftSwipeCooldown = 45;

    if (this.status) {
        this.status.textContent =
            "Photo 1 / " + this.photoImages.length +
            "  •  Swipe with your left hand ← →";
    }
}

    nextPhoto() {
    if (
        this.currentPhoto <
        this.photoImages.length - 1
    ) {
        this.currentPhoto++;

        this.photoTransition = 0;
        this.photoTransitionDirection = -1;

        if (this.status) {
            this.status.textContent =
                "Photo " +
                (this.currentPhoto + 1) +
                " / " +
                this.photoImages.length +
                "  •  Swipe with your left hand ← →";
        }
    } else {
        this.finishGallery();
    }
}

    previousPhoto() {
    if (this.currentPhoto > 0) {
        this.currentPhoto--;

        this.photoTransition = 0;
        this.photoTransitionDirection = 1;

        if (this.status) {
            this.status.textContent =
                "Photo " +
                (this.currentPhoto + 1) +
                " / " +
                this.photoImages.length +
                "  •  Swipe with your left hand ← →";
        }
    }
}


    // =========================================================
    // POLAROID
    // =========================================================

    drawPolaroid() {

        const img =
            this.photoImages[
                this.currentPhoto
            ];


        if (!img) {

            return;
        }


        const ctx =
            this.ctx;

        const cw =
            this.canvas.width;

        const ch =
            this.canvas.height;


        const mobile =
            cw <
            650;


        const cardWidth =
            mobile
                ? cw *
                    0.76
                : Math.min(
                    470,
                    cw *
                    0.46
                );


        const cardHeight =
            cardWidth *
            1.16;


        const x =
            cw *
            0.5 -
            cardWidth *
            0.5;


        const y =
            ch *
            0.47 -
            cardHeight *
            0.5;


        // Gentle floating motion
        const float =
            Math.sin(
                this.time *
                1.2
            ) *
            5;


        ctx.save();


        ctx.translate(
            cw *
            0.5,
            y +
            cardHeight *
            0.5 +
            float
        );


        const rotation =
            Math.sin(
                this.currentPhoto *
                1.7
            ) *
            0.025;


        ctx.rotate(
            rotation
        );


        // -----------------------------------------------------
        // Shadow / glow
        // -----------------------------------------------------

        ctx.shadowBlur =
            35;


        ctx.shadowColor =
            "rgba(255, 80, 170, 0.25)";


        // -----------------------------------------------------
        // Polaroid frame
        // -----------------------------------------------------

        ctx.fillStyle =
            "#f3eadc";


        ctx.fillRect(
            -cardWidth *
            0.5,
            -cardHeight *
            0.5,
            cardWidth,
            cardHeight
        );


        // -----------------------------------------------------
        // Photo area
        // -----------------------------------------------------

        const margin =
            cardWidth *
            0.055;


        const photoX =
            -cardWidth *
            0.5 +
            margin;


        const photoY =
            -cardHeight *
            0.5 +
            margin;


        const photoW =
            cardWidth -
            margin *
            2;


        const photoH =
            cardHeight *
            0.76;


        ctx.save();


        ctx.beginPath();

        ctx.rect(
            photoX,
            photoY,
            photoW,
            photoH
        );

        ctx.clip();


        // Cover image area while preserving aspect ratio
        const imageRatio =
            img.width /
            img.height;

        const boxRatio =
            photoW /
            photoH;


        let drawW;
        let drawH;


        if (
            imageRatio >
            boxRatio
        ) {

            drawH =
                photoH;

            drawW =
                drawH *
                imageRatio;

        } else {

            drawW =
                photoW;

            drawH =
                drawW /
                imageRatio;
        }


        ctx.drawImage(
            img,

            -drawW *
            0.5,

            -drawH *
            0.5,

            drawW,
            drawH
        );


        ctx.restore();


        // -----------------------------------------------------
        // Vintage overlay
        // -----------------------------------------------------

        ctx.fillStyle =
            "rgba(255, 215, 180, 0.08)";


        ctx.fillRect(
            photoX,
            photoY,
            photoW,
            photoH
        );


        // -----------------------------------------------------
        // Photo number
        // -----------------------------------------------------

        ctx.shadowBlur =
            0;


        ctx.fillStyle =
            "rgba(60, 40, 40, 0.5)";


        ctx.font =
            `${Math.max(
                11,
                cardWidth *
                0.026
            )}px serif`;


        ctx.textAlign =
            "center";


        ctx.fillText(
            `${this.currentPhoto + 1} / ${this.photoImages.length}`,
            0,
            cardHeight *
            0.455
        );


        ctx.restore();
    }


    // =========================================================
    // FINAL HEART
    // =========================================================

    finishGallery() {

        this.state =
            "ending";


        this.explosionTimer =
            0;


        if (this.status) {

            this.status.textContent =
                "";
        }
    }


    drawFinalHeart() {

        const ctx =
            this.ctx;

        const cw =
            this.canvas.width;

        const ch =
            this.canvas.height;


        const pulse =
            1 +
            Math.sin(
                this.time *
                2
            ) *
            0.04;


        const size =
            Math.min(
                cw,
                ch
            ) *
            0.25 *
            pulse;


        const cx =
            cw *
            0.5;


        const cy =
            ch *
            0.38;


        ctx.save();


        ctx.translate(
            cx,
            cy
        );


        // Massive glow
        const glow =
            ctx.createRadialGradient(
                0,
                0,
                0,
                0,
                0,
                size *
                2.4
            );


        glow.addColorStop(
            0,
            "rgba(255, 100, 180, 0.24)"
        );

        glow.addColorStop(
            0.45,
            "rgba(180, 80, 255, 0.12)"
        );

        glow.addColorStop(
            1,
            "rgba(100, 0, 180, 0)"
        );


        ctx.fillStyle =
            glow;


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            size *
            2.4,
            0,
            Math.PI *
            2
        );

        ctx.fill();


        // Heart path
        const gradient =
            ctx.createLinearGradient(
                0,
                -size,
                0,
                size
            );


        gradient.addColorStop(
            0,
            "#ffb5d4"
        );

        gradient.addColorStop(
            0.4,
            "#ff5a9b"
        );

        gradient.addColorStop(
            0.75,
            "#d93683"
        );

        gradient.addColorStop(
            1,
            "#8d2464"
        );


        ctx.fillStyle =
            gradient;


        ctx.shadowBlur =
            45;

        ctx.shadowColor =
            "rgba(255, 70, 160, 0.8)";


        ctx.beginPath();


        ctx.moveTo(
            0,
            size *
            0.75
        );


        ctx.bezierCurveTo(
            -size *
            0.75,
            size *
            0.20,

            -size *
            0.82,
            -size *
            0.45,

            -size *
            0.40,
            -size *
            0.62
        );


        ctx.bezierCurveTo(
            -size *
            0.18,
            -size *
            0.72,

            0,
            -size *
            0.50,

            0,
            -size *
            0.30
        );


        ctx.bezierCurveTo(
            0,
            -size *
            0.50,

            size *
            0.18,
            -size *
            0.72,

            size *
            0.40,
            -size *
            0.62
        );


        ctx.bezierCurveTo(
            size *
            0.82,
            -size *
            0.45,

            size *
            0.75,
            size *
            0.20,

            0,
            size *
            0.75
        );


        ctx.closePath();

        ctx.fill();


        ctx.restore();


        // -----------------------------------------------------
        // Final message
        // -----------------------------------------------------

        const fade =
            Math.min(
                1,
                this.explosionTimer /
                120
            );


        ctx.save();


        ctx.globalAlpha =
            fade;


        ctx.textAlign =
            "center";


        ctx.fillStyle =
            "#fff7fb";


        ctx.shadowBlur =
            18;


        ctx.shadowColor =
            "rgba(255, 100, 180, 0.6)";


        ctx.font =
            `600 ${Math.max(
                23,
                Math.min(
                    42,
                    cw *
                    0.055
                )
            )}px serif`;


        ctx.fillText(
            "Happy Birthday",
            cw *
            0.5,
            ch *
            0.70
        );


        ctx.font =
            `italic ${Math.max(
                17,
                Math.min(
                    29,
                    cw *
                    0.035
                )
            )}px serif`;


        const lines = [
            "My Wifey, My Baby, My Bebe,",
            "My Babes, My Honey Bun, My Love ❤️"
        ];


        lines.forEach(
            (line, index) => {

                ctx.fillText(
                    line,
                    cw *
                    0.5,
                    ch *
                    0.76 +
                    index *
                    32
                );
            }
        );


        ctx.restore();
    }


    // =========================================================
    // ANIMATION
    // =========================================================

    animate(timestamp) {

        const dt =
            this.lastTimestamp
                ? (
                    timestamp -
                    this.lastTimestamp
                ) /
                16.67
                : 1;


        this.lastTimestamp =
            timestamp;


        this.time +=
            0.016 *
            dt;


        if (
            this.leftSwipeCooldown >
            0
        ) {

            this.leftSwipeCooldown -=
                dt;
        }


        // -----------------------------------------------------
        // Smooth heart
        // -----------------------------------------------------

        this.heartProgress +=
    (
        this.targetHeartProgress -
        this.heartProgress
    ) *
    0.08 *
    dt;


        // -----------------------------------------------------
        // Clear / background
        // -----------------------------------------------------

        this.drawBackground();

        this.updateBackgroundParticles(dt);


        // =====================================================
        // HEART
        // =====================================================

        if (
            this.state ===
                "heart" ||
            this.state ===
                "joining"
        ) {

            const size =
                Math.min(
                    this.canvas.width,
                    this.canvas.height
                ) *
                0.22;


            this.drawHeart(
                this.canvas.width *
                0.5,

                this.canvas.height *
                0.46,

                size,

                this.heartProgress
            );
        }


        // =====================================================
        // EXPLOSION
        // =====================================================

        if (
            this.state ===
            "exploding"
        ) {

            this.explosionTimer +=
                dt;


            this.updateExplosionParticles(
                dt
            );


            this.updateButterflies(
                dt
            );


            this.updatePetals(
                dt
            );


            /*
                After the initial burst, let the
                butterflies/petals linger before
                revealing the first Polaroid.
            */

            if (
                this.explosionTimer >
                110
            ) {

                this.enterGallery();
            }
        }


        // =====================================================
        // GALLERY
        // =====================================================

        if (
            this.state ===
            "gallery"
        ) {

            this.updateButterflies(
                dt
            );


            this.updatePetals(
                dt
            );


            this.drawPolaroid();
        }


        // =====================================================
        // ENDING
        // =====================================================

        if (
            this.state ===
            "ending"
        ) {

            this.explosionTimer +=
                dt;


            this.updateButterflies(
                dt
            );


            this.updatePetals(
                dt
            );


            this.drawFinalHeart();
        }


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
