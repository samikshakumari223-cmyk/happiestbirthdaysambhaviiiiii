// ===== BIRTHDAY WEBSITE - MAIN JS =====

(function () {
    'use strict';

    // ===== CONFIG =====
    const BIRTHDAY = new Date('2026-03-27T00:00:00');

    // ===== DOM REFS =====
    const scrollContainer = document.querySelector('.scroll-container');
    const enterBtn = document.getElementById('enter-btn');
    const musicBtn = document.getElementById('music-btn');
    const musicLabel = musicBtn ? musicBtn.querySelector('.music-label') : null;
    const bgMusic = document.getElementById('bg-music');
    const partySound = document.getElementById('party-sound');
    const countdownTick = document.getElementById('countdown-tick');
    const uncAudio = document.getElementById('unc-audio');
    const blowBtn = document.getElementById('blow-btn');
    const blowFallback = document.getElementById('blow-fallback');
    const wishSuccess = document.getElementById('wish-success');
    const finaleBtn = document.getElementById('finale-btn');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const particleCanvas = document.getElementById('particle-canvas');
    const transitionOverlay = document.getElementById('transition-overlay');
    const transitionNumber = document.getElementById('transition-number');
    const transitionHbd = document.getElementById('transition-hbd');

    // ===== COUNTDOWN TIMER =====
    function updateCountdown() {
        const now = new Date();
        const diff = BIRTHDAY - now;

        if (diff <= 0) {
            // It's her birthday!
            document.getElementById('countdown').style.display = 'none';
            document.getElementById('birthday-today').style.display = 'block';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ===== SOUND EFFECTS (Web Audio API fallback) =====
    let audioCtxForSounds = null;

    function getAudioCtx() {
        if (!audioCtxForSounds) {
            audioCtxForSounds = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtxForSounds;
    }

    function playTickSound() {
        // Try the audio file first, fall back to generated sound
        countdownTick.currentTime = 0;
        countdownTick.play().catch(function () {
            // Generate a tick sound
            var ctx = getAudioCtx();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        });
    }

    // ===== CELEBRATION SOUND (realistic 2-3 second confetti burst) =====
    var celebrationNodes = [];

    function startCelebrationSound() {
        // Try the real audio file first
        partySound.currentTime = 0;
        partySound.play().then(function () {
            // Real file played — stop after 3 seconds
            setTimeout(function () { partySound.pause(); }, 3000);
        }).catch(function () {
            // No audio file — generate a realistic celebration burst
            playSynthCelebration();
        });
    }

    function playSynthCelebration() {
        var ctx = getAudioCtx();
        var now = ctx.currentTime;
        var duration = 2.8;

        // Master gain for the whole celebration
        var master = ctx.createGain();
        master.gain.setValueAtTime(0.35, now);
        master.gain.linearRampToValueAtTime(0.25, now + 1.5);
        master.gain.exponentialRampToValueAtTime(0.001, now + duration);
        master.connect(ctx.destination);
        celebrationNodes.push(master);

        // === 1. CONFETTI RUSTLE — filtered noise that sounds like paper falling ===
        var rustleDuration = duration;
        var rustleBuffer = ctx.createBuffer(1, ctx.sampleRate * rustleDuration, ctx.sampleRate);
        var rustleData = rustleBuffer.getChannelData(0);
        // Modulated noise — sounds like rustling / showering confetti
        for (var i = 0; i < rustleData.length; i++) {
            var t = i / ctx.sampleRate;
            var envelope = Math.exp(-t * 1.5) * 0.6;
            // Vary the amplitude rapidly to create a "shower" texture
            var mod = Math.sin(t * 80) * 0.3 + Math.sin(t * 130) * 0.2 + Math.sin(t * 200) * 0.15;
            rustleData[i] = (Math.random() * 2 - 1) * envelope * (0.4 + mod);
        }
        var rustleSource = ctx.createBufferSource();
        rustleSource.buffer = rustleBuffer;
        // Bandpass filter — makes it sound like paper, not static
        var rustleFilter = ctx.createBiquadFilter();
        rustleFilter.type = 'bandpass';
        rustleFilter.frequency.value = 3500;
        rustleFilter.Q.value = 0.5;
        rustleSource.connect(rustleFilter);
        rustleFilter.connect(master);
        rustleSource.start(now);
        rustleSource.stop(now + rustleDuration);

        // === 2. PARTY POPPER BURST — initial "pop" with body ===
        // Big pop
        var popBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        var popData = popBuffer.getChannelData(0);
        for (var i = 0; i < popData.length; i++) {
            var t = i / ctx.sampleRate;
            popData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.8;
        }
        var popSource = ctx.createBufferSource();
        popSource.buffer = popBuffer;
        var popFilter = ctx.createBiquadFilter();
        popFilter.type = 'lowpass';
        popFilter.frequency.value = 2000;
        popSource.connect(popFilter);
        popFilter.connect(master);
        popSource.start(now);

        // Second pop slightly delayed
        var pop2Source = ctx.createBufferSource();
        pop2Source.buffer = popBuffer;
        var pop2Filter = ctx.createBiquadFilter();
        pop2Filter.type = 'lowpass';
        pop2Filter.frequency.value = 2500;
        pop2Source.connect(pop2Filter);
        pop2Filter.connect(master);
        pop2Source.start(now + 0.08);

        // === 3. CHIME / SPARKLE — rising tone that says "celebration" ===
        var chimeNotes = [523, 659, 784, 1047, 1319]; // C5, E5, G5, C6, E6
        chimeNotes.forEach(function (freq, idx) {
            var delay = 0.05 + idx * 0.12;
            var osc = ctx.createOscillator();
            var oscGain = ctx.createGain();
            osc.connect(oscGain);
            oscGain.connect(master);
            osc.type = 'sine';
            osc.frequency.value = freq;
            oscGain.gain.setValueAtTime(0, now + delay);
            oscGain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);
            osc.start(now + delay);
            osc.stop(now + delay + 0.5);
        });

        // === 4. SCATTERED POPS — like confetti poppers going off ===
        for (var p = 0; p < 12; p++) {
            (function (index) {
                var delay = 0.1 + Math.random() * 1.8;
                var miniPop = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
                var miniPopData = miniPop.getChannelData(0);
                for (var i = 0; i < miniPopData.length; i++) {
                    var t = i / ctx.sampleRate;
                    miniPopData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 60) * 0.5;
                }
                var src = ctx.createBufferSource();
                src.buffer = miniPop;
                var filt = ctx.createBiquadFilter();
                filt.type = 'bandpass';
                filt.frequency.value = 1500 + Math.random() * 3000;
                filt.Q.value = 1;
                src.connect(filt);
                filt.connect(master);
                src.start(now + delay);
            })(p);
        }

        // === 5. WHOOSH — the swoosh of confetti in the air ===
        var whooshDuration = 1.5;
        var whooshBuffer = ctx.createBuffer(1, ctx.sampleRate * whooshDuration, ctx.sampleRate);
        var whooshData = whooshBuffer.getChannelData(0);
        for (var i = 0; i < whooshData.length; i++) {
            var t = i / ctx.sampleRate;
            var env = Math.sin(t / whooshDuration * Math.PI) * 0.3;
            whooshData[i] = (Math.random() * 2 - 1) * env;
        }
        var whooshSource = ctx.createBufferSource();
        whooshSource.buffer = whooshBuffer;
        var whooshFilter = ctx.createBiquadFilter();
        whooshFilter.type = 'bandpass';
        whooshFilter.frequency.setValueAtTime(500, now);
        whooshFilter.frequency.linearRampToValueAtTime(2000, now + 0.5);
        whooshFilter.frequency.linearRampToValueAtTime(800, now + whooshDuration);
        whooshFilter.Q.value = 0.8;
        whooshSource.connect(whooshFilter);
        whooshFilter.connect(master);
        whooshSource.start(now + 0.05);
        whooshSource.stop(now + 0.05 + whooshDuration);
    }

    function stopCelebrationSound() {
        celebrationNodes.forEach(function (node) {
            try { node.gain.cancelScheduledValues(0); node.gain.value = 0; } catch (e) {}
        });
        celebrationNodes = [];
        partySound.pause();
        partySound.currentTime = 0;
    }

    // ===== BALLOON GENERATOR =====
    var balloonColors = ['#ff6b9d', '#ffd93d', '#c084fc', '#6bffb8', '#6bb5ff', '#ff6bdb', '#ff9a56'];

    // Regular balloons (full screen, for transition celebration)
    function launchBalloons(count) {
        for (var i = 0; i < count; i++) {
            (function (index) {
                setTimeout(function () {
                    var balloon = document.createElement('div');
                    balloon.className = 'balloon celebration-balloon';
                    balloon.style.left = (Math.random() * 98 + 1) + '%';
                    var color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
                    balloon.style.background = color;
                    balloon.style.borderBottomColor = color;
                    var size = 55 + Math.random() * 50;
                    balloon.style.width = size + 'px';
                    balloon.style.height = (size * 1.25) + 'px';
                    balloon.style.animationDuration = (3.5 + Math.random() * 3) + 's';
                    balloon.style.animationDelay = '0s';
                    document.body.appendChild(balloon);

                    setTimeout(function () {
                        balloon.remove();
                    }, 8000);
                }, index * 30);
            })(i);
        }
    }

    // Continuous balloon flood — spawns nonstop for a duration
    var balloonFloodInterval = null;

    function startBalloonFlood(durationMs) {
        var batchSize = 8;
        balloonFloodInterval = setInterval(function () {
            for (var i = 0; i < batchSize; i++) {
                var balloon = document.createElement('div');
                balloon.className = 'balloon celebration-balloon';
                balloon.style.left = (Math.random() * 98 + 1) + '%';
                var color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
                balloon.style.background = color;
                balloon.style.borderBottomColor = color;
                var size = 50 + Math.random() * 55;
                balloon.style.width = size + 'px';
                balloon.style.height = (size * 1.25) + 'px';
                balloon.style.animationDuration = (3 + Math.random() * 3.5) + 's';
                balloon.style.animationDelay = '0s';
                document.body.appendChild(balloon);

                setTimeout(function (b) {
                    b.remove();
                }, 8000, balloon);
            }
        }, 150);

        // Auto-stop after duration
        setTimeout(function () {
            clearInterval(balloonFloodInterval);
            balloonFloodInterval = null;
        }, durationMs);
    }

    // ===== LANDING PAGE SIDE BALLOONS (looping) =====
    var landingBalloonInterval = null;

    function startLandingBalloons() {
        var landingSection = document.getElementById('landing');

        function spawnSideBalloon() {
            // Only spawn if landing section is visible
            if (scrollContainer.scrollTop > window.innerHeight) return;

            var balloon = document.createElement('div');
            balloon.className = 'balloon landing-balloon';

            // Left side (0-15%) or right side (85-100%) — NOT center
            var side = Math.random() < 0.5 ? (Math.random() * 15) : (85 + Math.random() * 15);
            balloon.style.left = side + '%';
            balloon.style.background = balloonColors[Math.floor(Math.random() * balloonColors.length)];
            balloon.style.width = (35 + Math.random() * 20) + 'px';
            balloon.style.height = (44 + Math.random() * 22) + 'px';
            balloon.style.animationDuration = (4 + Math.random() * 4) + 's';
            balloon.style.animationDelay = '0s';
            balloon.style.opacity = '0.7';
            balloon.style.zIndex = '0';
            landingSection.appendChild(balloon);

            setTimeout(function () {
                balloon.remove();
            }, 9000);
        }

        // Spawn balloons rapidly — 3 at a time every 250ms
        landingBalloonInterval = setInterval(function () {
            spawnSideBalloon();
            spawnSideBalloon();
            spawnSideBalloon();
        }, 250);

        // Stop when user scrolls away from landing
        scrollContainer.addEventListener('scroll', function checkScroll() {
            if (scrollContainer.scrollTop > window.innerHeight * 0.5) {
                clearInterval(landingBalloonInterval);
                landingBalloonInterval = null;
                // Clean up remaining landing balloons
                var leftover = document.querySelectorAll('.landing-balloon');
                leftover.forEach(function (b) {
                    b.style.opacity = '0';
                    setTimeout(function () { b.remove(); }, 1000);
                });
                scrollContainer.removeEventListener('scroll', checkScroll);
            }
        });
    }

    // Start landing balloons immediately
    startLandingBalloons();

    // ===== ENTER BUTTON — scrolls to wish/candle section =====
    enterBtn.addEventListener('click', function () {
        var wish = document.getElementById('wish');
        wish.scrollIntoView({ behavior: 'smooth' });
    });

    // ===== 3-2-1 TRANSITION (triggered after candle blow-out) =====
    // Confetti flood that keeps going on the greeting slide
    var confettiFloodInterval = null;

    function startConfettiFlood() {
        confettiFloodInterval = setInterval(function () {
            launchConfetti();
        }, 600);
    }

    function stopConfettiFlood() {
        if (confettiFloodInterval) {
            clearInterval(confettiFloodInterval);
            confettiFloodInterval = null;
        }
    }

    function startBirthdayTransition() {
        // Show overlay
        transitionOverlay.classList.add('active');

        // 3-2-1 countdown — clean, no balloons yet
        var nums = [3, 2, 1];
        var step = 0;

        function showNumber() {
            if (step < nums.length) {
                transitionNumber.textContent = nums[step];
                transitionNumber.classList.remove('shrink');
                transitionNumber.classList.add('show');
                transitionNumber.style.display = '';
                playTickSound();

                setTimeout(function () {
                    transitionNumber.classList.remove('show');
                    transitionNumber.classList.add('shrink');
                }, 700);

                step++;
                setTimeout(showNumber, 1000);
            } else {
                // "1" just disappeared — NOW the explosion!
                transitionNumber.style.display = 'none';

                // Celebration sound
                startCelebrationSound();

                // INSTANT wall of balloons — fill the whole screen immediately
                launchBalloons(120);

                // Keep flooding for the full 4.5 seconds
                startBalloonFlood(4500);

                // Massive confetti bursts
                launchConfetti();
                setTimeout(function () { launchConfetti(); }, 100);
                setTimeout(function () { launchConfetti(); }, 250);
                setTimeout(function () { launchConfetti(); }, 500);
                setTimeout(function () { launchConfetti(); }, 800);
                setTimeout(function () { launchConfetti(); }, 1200);
                setTimeout(function () { launchConfetti(); }, 1800);
                setTimeout(function () { launchConfetti(); }, 2500);
                setTimeout(function () { launchConfetti(); }, 3200);
                setTimeout(function () { launchConfetti(); }, 4000);

                // Show "Happiest 18th Birthday Shambhavi!" text
                transitionHbd.style.display = 'block';
                setTimeout(function () {
                    transitionHbd.classList.add('show');
                }, 100);

                // After 4.5 seconds — move to greeting, balloons fade there
                setTimeout(function () {
                    stopCelebrationSound();
                    transitionOverlay.classList.remove('active');
                    transitionHbd.classList.remove('show');
                    transitionHbd.style.display = 'none';

                    // Scroll to greeting section
                    var greeting = document.getElementById('greeting');
                    greeting.scrollIntoView({ behavior: 'smooth' });
                }, 4500);
            }
        }

        setTimeout(showNumber, 500);
    }

    // ===== SMOOTH BALLOON FADE ON GREETING SECTION =====
    function watchGreetingEnd() {
        var greetingSection = document.getElementById('greeting');
        var fadeStarted = false;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !fadeStarted) {
                    fadeStarted = true;

                    // Stop spawning new balloons and confetti
                    if (balloonFloodInterval) {
                        clearInterval(balloonFloodInterval);
                        balloonFloodInterval = null;
                    }
                    stopConfettiFlood();

                    // Slowly, smoothly fade out all celebration balloons over 4 seconds
                    // Stagger them so they don't all vanish at once
                    var balloons = document.querySelectorAll('.celebration-balloon');
                    balloons.forEach(function (b, i) {
                        var delay = Math.random() * 3000;
                        var fadeDuration = 2 + Math.random() * 2;

                        setTimeout(function () {
                            b.style.transition = 'opacity ' + fadeDuration + 's ease';
                            b.style.opacity = '0';
                            setTimeout(function () { b.remove(); }, fadeDuration * 1000 + 500);
                        }, delay);
                    });

                    observer.disconnect();
                }
            });
        }, {
            threshold: 0.3,
            root: scrollContainer
        });

        observer.observe(greetingSection);
    }

    // Start watching as soon as page loads
    watchGreetingEnd();

    // ===== MUSIC TOGGLE =====
    let musicPlaying = false;

    if (musicBtn) {
        musicBtn.addEventListener('click', function () {
            if (musicPlaying) {
                bgMusic.pause();
                if (musicLabel) musicLabel.textContent = 'Play';
                musicBtn.classList.remove('playing');
            } else {
                bgMusic.play().catch(function () {});
                if (musicLabel) musicLabel.textContent = 'Pause';
                musicBtn.classList.add('playing');
            }
            musicPlaying = !musicPlaying;
        });
    }

    // ===== SCROLL REVEAL (IntersectionObserver) =====
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.15,
        root: scrollContainer
    });

    revealElements.forEach(function (el) {
        revealObserver.observe(el);
    });

    // ===== FLOATING HEARTS (Greeting Section) =====
    const heartsContainer = document.getElementById('greeting-hearts');
    const heartSymbols = ['\u2764', '\u1F49C', '\u1F49B', '\u2764\uFE0F', '\u1F497'];

    function createHeart() {
        const heart = document.createElement('span');
        heart.className = 'floating-heart';
        heart.textContent = ['❤', '💜', '💛', '💖', '💕'][Math.floor(Math.random() * 5)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.fontSize = (Math.random() * 1.5 + 0.8) + 'rem';
        heart.style.animationDuration = (Math.random() * 4 + 4) + 's';
        heart.style.animationDelay = (Math.random() * 3) + 's';
        heartsContainer.appendChild(heart);

        setTimeout(function () {
            heart.remove();
        }, 10000);
    }

    // Create hearts periodically
    setInterval(createHeart, 800);

    // ===== QUIZ =====
    var quizPopup = document.getElementById('quiz-popup');
    var quizPopupImg = document.getElementById('quiz-popup-img');
    var quizPopupClose = document.getElementById('quiz-popup-close');
    var quizCorrectPopup = document.getElementById('quiz-correct-popup');
    var quizCorrectClose = document.getElementById('quiz-correct-close');
    var quizOptions = document.querySelectorAll('.quiz-option');
    var wrongTexts = [
        'Nope! Try again',
        'Haha, not even close!',
        'Wrong! Think harder',
        'Are you even trying?'
    ];
    var wrongAttempt = 0;

    function playWrongBuzzer() {
        var ctx = getAudioCtx();
        var now = ctx.currentTime;

        // Buzzer — low harsh tone
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);

        // Second lower tone for thickness
        var osc2 = ctx.createOscillator();
        var gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'square';
        osc2.frequency.value = 80;
        gain2.gain.setValueAtTime(0.12, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.start(now);
        osc2.stop(now + 0.4);
    }

    // Yay sound — drop a real sound file at assets/music/yay.mp3 for best results
    var yaySoundFile = new Audio('assets/music/yay.mp3.mp3');
    yaySoundFile.volume = 0.7;

    function playCorrectSound() {
        yaySoundFile.currentTime = 0;
        yaySoundFile.play().catch(function () {
            // Fallback: synthetic cheerful sound if file not found
            var ctx = getAudioCtx();
            var now = ctx.currentTime;
            var notes = [523, 659, 784, 1047]; // C E G C (octave up)
            notes.forEach(function (freq, i) {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + i * 0.1);
                gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.35);
            });
        });
    }

    quizOptions.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var isCorrect = btn.getAttribute('data-correct') === 'true';

            if (isCorrect) {
                // Correct!
                btn.classList.add('correct');
                quizOptions.forEach(function (b) { b.classList.add('disabled'); });
                playCorrectSound();

                setTimeout(function () {
                    quizCorrectPopup.classList.add('active');
                }, 500);
            } else {
                // Wrong!
                btn.classList.add('wrong');
                playWrongBuzzer();

                // Show popup with image
                var imgSrc = btn.getAttribute('data-img');
                quizPopupImg.classList.remove('has-img');
                if (imgSrc) {
                    quizPopupImg.onload = function () {
                        quizPopupImg.classList.add('has-img');
                    };
                    // Force reload by clearing src first
                    quizPopupImg.src = '';
                    quizPopupImg.src = imgSrc;
                    // Also show immediately if cached
                    if (quizPopupImg.complete && quizPopupImg.naturalWidth > 0) {
                        quizPopupImg.classList.add('has-img');
                    }
                }

                quizPopup.classList.add('active');

                // Keep it marked as tried (stays reddish)
                setTimeout(function () {
                    btn.classList.remove('wrong');
                    btn.classList.add('tried');
                }, 500);
            }
        });
    });

    quizPopupClose.addEventListener('click', function () {
        quizPopup.classList.remove('active');
    });

    quizCorrectClose.addEventListener('click', function () {
        quizCorrectPopup.classList.remove('active');
        // Scroll to next section (personal message)
        var message = document.getElementById('message');
        message.scrollIntoView({ behavior: 'smooth' });
    });

    // ===== CANDLE BLOW-OUT =====
    let candlesBlown = false;
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let blowDetectionInterval = null;

    function blowOutCandles() {
        if (candlesBlown) return;
        candlesBlown = true;

        const flames = document.querySelectorAll('.flame');
        flames.forEach(function (flame, i) {
            setTimeout(function () {
                flame.classList.add('out');
            }, i * 100);
        });

        // Stop mic if active
        stopMicDetection();

        // Hide buttons immediately
        blowBtn.style.display = 'none';
        blowFallback.style.display = 'none';

        // After 1 second — fade out the entire wish section content, then show transition
        setTimeout(function () {
            var wishContent = document.querySelector('#wish .section-content');
            wishContent.style.transition = 'opacity 0.6s ease';
            wishContent.style.opacity = '0';

            // After fade out completes, start the smooth 3-2-1 transition
            setTimeout(function () {
                startBirthdayTransition();
            }, 700);
        }, 1000);
    }

    // Mic blow detection
    blowBtn.addEventListener('click', function () {
        if (candlesBlown) return;

        if (audioContext) {
            // Already listening — toggle off
            stopMicDetection();
            blowBtn.classList.remove('listening');
            return;
        }

        // Request mic access
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                micStream = stream;
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;

                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                blowBtn.classList.add('listening');

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                blowDetectionInterval = setInterval(function () {
                    analyser.getByteFrequencyData(dataArray);
                    // Check low-frequency volume (blow sound)
                    let sum = 0;
                    for (let i = 0; i < 10; i++) {
                        sum += dataArray[i];
                    }
                    const avg = sum / 10;

                    if (avg > 130) {
                        blowOutCandles();
                    }
                }, 100);
            })
            .catch(function () {
                // Mic denied — use fallback
                blowBtn.style.display = 'none';
            });
    });

    // Fallback button
    blowFallback.addEventListener('click', function () {
        blowOutCandles();
    });

    function stopMicDetection() {
        if (blowDetectionInterval) {
            clearInterval(blowDetectionInterval);
            blowDetectionInterval = null;
        }
        if (micStream) {
            micStream.getTracks().forEach(function (t) { t.stop(); });
            micStream = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
    }

    // ===== CONFETTI ENGINE =====
    const confettiCtx = confettiCanvas.getContext('2d');
    let confettiParticles = [];
    let confettiAnimating = false;

    function resizeConfettiCanvas() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    resizeConfettiCanvas();
    window.addEventListener('resize', resizeConfettiCanvas);

    const confettiColors = ['#ff6b9d', '#ffd93d', '#c084fc', '#ff9a56', '#6bffb8', '#6bb5ff', '#ff6bdb'];

    function createConfettiParticle() {
        // Some confetti from top, some from sides, some from center burst
        var spawnType = Math.random();
        var x, y, speedX, speedY;

        if (spawnType < 0.5) {
            // From top — spread across full width
            x = Math.random() * confettiCanvas.width;
            y = -10 - Math.random() * confettiCanvas.height * 0.3;
            speedX = (Math.random() - 0.5) * 6;
            speedY = Math.random() * 4 + 2;
        } else if (spawnType < 0.75) {
            // From sides
            x = Math.random() < 0.5 ? -10 : confettiCanvas.width + 10;
            y = Math.random() * confettiCanvas.height * 0.6;
            speedX = x < 0 ? (Math.random() * 5 + 2) : -(Math.random() * 5 + 2);
            speedY = Math.random() * 3 + 1;
        } else {
            // Center burst
            x = confettiCanvas.width / 2 + (Math.random() - 0.5) * 200;
            y = confettiCanvas.height / 2 + (Math.random() - 0.5) * 200;
            speedX = (Math.random() - 0.5) * 10;
            speedY = (Math.random() - 0.5) * 10;
        }

        return {
            x: x,
            y: y,
            w: Math.random() * 12 + 4,
            h: Math.random() * 8 + 3,
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 12,
            speedX: speedX,
            speedY: speedY,
            opacity: 1,
            decay: Math.random() * 0.004 + 0.001
        };
    }

    function launchConfetti() {
        for (let i = 0; i < 350; i++) {
            confettiParticles.push(createConfettiParticle());
        }
        if (!confettiAnimating) {
            confettiAnimating = true;
            animateConfetti();
        }
    }

    function animateConfetti() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        confettiParticles.forEach(function (p) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;
            p.opacity -= p.decay;
            p.speedY += 0.05; // gravity

            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate((p.rotation * Math.PI) / 180);
            confettiCtx.globalAlpha = Math.max(0, p.opacity);
            confettiCtx.fillStyle = p.color;
            confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            confettiCtx.restore();
        });

        confettiParticles = confettiParticles.filter(function (p) {
            return p.opacity > 0 && p.y < confettiCanvas.height + 20;
        });

        if (confettiParticles.length > 0) {
            requestAnimationFrame(animateConfetti);
        } else {
            confettiAnimating = false;
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    // ===== VOICE NOTE PLAYER =====
    var vnButtons = document.querySelectorAll('.vn-play-btn');
    var currentVnAudio = null;
    var currentVnBtn = null;
    var vnProgressRAF = null;

    function stopCurrentVn() {
        if (currentVnAudio) {
            currentVnAudio.pause();
            currentVnAudio.currentTime = 0;
            currentVnAudio = null;
        }
        if (currentVnBtn) {
            currentVnBtn.classList.remove('playing');
            currentVnBtn.querySelector('.vn-icon').innerHTML = '&#9654;';
            currentVnBtn.querySelector('.vn-label').textContent = 'Play voice note';
            currentVnBtn.querySelector('.vn-progress-bar').style.width = '0%';
            currentVnBtn = null;
        }
        if (vnProgressRAF) {
            cancelAnimationFrame(vnProgressRAF);
            vnProgressRAF = null;
        }
    }

    function updateVnProgress() {
        if (currentVnAudio && currentVnBtn && currentVnAudio.duration) {
            var pct = (currentVnAudio.currentTime / currentVnAudio.duration) * 100;
            currentVnBtn.querySelector('.vn-progress-bar').style.width = pct + '%';
        }
        if (currentVnAudio && !currentVnAudio.paused) {
            vnProgressRAF = requestAnimationFrame(updateVnProgress);
        }
    }

    vnButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (btn.disabled) return;

            var audioSrc = btn.getAttribute('data-audio');

            // If same button clicked while playing — pause it
            if (currentVnBtn === btn && currentVnAudio && !currentVnAudio.paused) {
                stopCurrentVn();
                return;
            }

            // Stop any currently playing VN
            stopCurrentVn();

            // Pause main bg music while VN plays
            if (bgMusic && !bgMusic.paused) {
                bgMusic.pause();
                if (musicBtn) musicBtn.classList.remove('playing');
                if (musicLabel) musicLabel.textContent = 'Play';
                musicPlaying = false;
            }

            currentVnAudio = new Audio(audioSrc);
            currentVnBtn = btn;
            btn.classList.add('playing');
            btn.querySelector('.vn-icon').innerHTML = '&#10074;&#10074;';
            btn.querySelector('.vn-label').textContent = 'Playing...';

            currentVnAudio.play().catch(function () {});
            vnProgressRAF = requestAnimationFrame(updateVnProgress);

            currentVnAudio.addEventListener('ended', function () {
                stopCurrentVn();
            });
        });
    });

    // ===== PHOTO SLIDESHOW =====
    var slideshowImages = document.querySelectorAll('.slideshow-img');
    var slideshowDotsContainer = document.getElementById('slideshow-dots');
    var galleryMusic = document.getElementById('gallery-music');
    var slideshowInterval = null;
    var currentSlide = 0;
    var galleryStarted = false;

    // Create dots
    if (slideshowImages.length > 0 && slideshowDotsContainer) {
        slideshowImages.forEach(function (_, i) {
            var dot = document.createElement('div');
            dot.className = 'slideshow-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', function () {
                goToSlide(i);
            });
            slideshowDotsContainer.appendChild(dot);
        });
    }

    var slideshowCaption = document.getElementById('slideshow-caption');
    var prevBtn = document.getElementById('slideshow-prev');
    var nextBtn = document.getElementById('slideshow-next');

    function goToSlide(index) {
        // Pause any playing videos
        slideshowImages.forEach(function (img) {
            img.classList.remove('active');
            if (img.tagName === 'VIDEO') {
                img.pause();
                img.currentTime = 0;
            }
        });
        var dots = document.querySelectorAll('.slideshow-dot');
        dots.forEach(function (d) { d.classList.remove('active'); });

        currentSlide = index;
        slideshowImages[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');

        // Update caption
        var caption = slideshowImages[currentSlide].getAttribute('data-caption') || '';
        if (slideshowCaption) slideshowCaption.textContent = caption;

        // If it's a video, play it
        if (slideshowImages[currentSlide].tagName === 'VIDEO') {
            slideshowImages[currentSlide].play().catch(function () {});
        }
    }

    function nextSlide() {
        var next = (currentSlide + 1) % slideshowImages.length;
        goToSlide(next);
        scheduleNextSlide();
    }

    function scheduleNextSlide() {
        if (slideshowInterval) clearTimeout(slideshowInterval);

        var current = slideshowImages[currentSlide];
        if (current.tagName === 'VIDEO') {
            // Wait for video to end before moving on
            current.onended = function () {
                current.onended = null;
                nextSlide();
            };
        } else {
            // Images stay for 5 seconds
            slideshowInterval = setTimeout(function () {
                nextSlide();
            }, 5000);
        }
    }

    function startSlideshow() {
        if (slideshowInterval) return;
        scheduleNextSlide();
    }

    function stopSlideshow() {
        if (slideshowInterval) {
            clearTimeout(slideshowInterval);
            slideshowInterval = null;
        }
        // Remove any video ended listeners
        slideshowImages.forEach(function (img) {
            if (img.tagName === 'VIDEO') img.onended = null;
        });
    }

    // Arrow buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            stopSlideshow();
            var prev = (currentSlide - 1 + slideshowImages.length) % slideshowImages.length;
            goToSlide(prev);
            scheduleNextSlide();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            stopSlideshow();
            var next = (currentSlide + 1) % slideshowImages.length;
            goToSlide(next);
            scheduleNextSlide();
        });
    }

    // Start slideshow + gallery music when section comes into view
    var gallerySection = document.getElementById('gallery');
    if (gallerySection) {
        var galleryObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    startSlideshow();
                    if (galleryMusic && !galleryStarted) {
                        galleryMusic.volume = 0.5;
                        galleryMusic.currentTime = 10;
                        galleryMusic.play().catch(function () {});
                        galleryStarted = true;
                    }
                } else {
                    stopSlideshow();
                    if (galleryMusic && galleryStarted) {
                        galleryMusic.pause();
                        galleryStarted = false;
                    }
                }
            });
        }, {
            threshold: 0.3,
            root: scrollContainer
        });

        galleryObserver.observe(gallerySection);
    }

    // ===== FINALE BUTTON =====
    finaleBtn.addEventListener('click', function () {
        // Big confetti burst
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(function () {
                launchConfetti();
            }, wave * 500);
        }
        finaleBtn.textContent = 'Happy Birthday! 🎉';
        finaleBtn.style.pointerEvents = 'none';
    });

    // ===== PARTICLE BACKGROUND =====
    const particleCtx = particleCanvas.getContext('2d');
    let particles = [];

    function resizeParticleCanvas() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }
    resizeParticleCanvas();
    window.addEventListener('resize', resizeParticleCanvas);

    function createParticle() {
        return {
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.1,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.01
        };
    }

    // Create initial particles
    for (let i = 0; i < 80; i++) {
        particles.push(createParticle());
    }

    function animateParticles() {
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

        particles.forEach(function (p) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulse += p.pulseSpeed;

            // Wrap around
            if (p.x < 0) p.x = particleCanvas.width;
            if (p.x > particleCanvas.width) p.x = 0;
            if (p.y < 0) p.y = particleCanvas.height;
            if (p.y > particleCanvas.height) p.y = 0;

            const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));

            particleCtx.beginPath();
            particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            particleCtx.fillStyle = 'rgba(255, 255, 255, ' + currentOpacity + ')';
            particleCtx.fill();
        });

        requestAnimationFrame(animateParticles);
    }

    animateParticles();

})();
