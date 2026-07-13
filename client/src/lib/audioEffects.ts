"use client";

// Web Audio API Synthesized sound effects
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
    if (!audioCtx && typeof window !== "undefined") {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    return audioCtx!;
};

export const playSound = (type: "move" | "capture" | "check" | "win" | "loss" | "draw") => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Resume context if suspended
        if (ctx.state === "suspended") {
            ctx.resume();
        }

        const now = ctx.currentTime;

        if (type === "move") {
            // Crisp wood click sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = "sine";
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.start(now);
            osc.stop(now + 0.08);

        } else if (type === "capture") {
            // Crunch/snap capture sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = "triangle";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(140, now + 0.03);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.start(now);
            osc.stop(now + 0.12);

        } else if (type === "check") {
            // High pitch alarm chime
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.type = "sine";
            osc1.frequency.setValueAtTime(680, now);
            osc1.frequency.linearRampToValueAtTime(880, now + 0.15);

            osc2.type = "sine";
            osc2.frequency.setValueAtTime(920, now);
            osc2.frequency.linearRampToValueAtTime(1200, now + 0.15);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.25);
            osc2.stop(now + 0.25);

        } else if (type === "win") {
            // Major pentatonic victory sound
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C E G C E
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sine";
                osc.frequency.value = freq;
                
                const noteStart = now + idx * 0.1;
                gain.gain.setValueAtTime(0, now);
                gain.gain.setValueAtTime(0.12, noteStart);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);

                osc.start(noteStart);
                osc.stop(noteStart + 0.6);
            });

        } else if (type === "loss") {
            // Melancholic minor sweep
            const notes = [392.00, 311.13, 261.63, 196.00]; // G Eb C G
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                osc.frequency.exponentialRampToValueAtTime(freq - 40, now + idx * 0.12 + 0.4);

                const noteStart = now + idx * 0.12;
                gain.gain.setValueAtTime(0, now);
                gain.gain.setValueAtTime(0.08, noteStart);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.5);

                osc.start(noteStart);
                osc.stop(noteStart + 0.5);
            });

        } else if (type === "draw") {
            // Neutral fifth drone
            const notes = [261.63, 392.00]; // C G
            notes.forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sine";
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

                osc.start(now);
                osc.stop(now + 1.2);
            });
        }
    } catch (e) {
        console.error("Error playing synthesized sound:", e);
    }
};

// Vibration API haptic helper
export const triggerHaptic = (type: "move" | "capture" | "check" | "gameover") => {
    if (typeof window === "undefined" || !navigator.vibrate) return;

    if (type === "move") {
        navigator.vibrate(12); // Short pulse
    } else if (type === "capture") {
        navigator.vibrate(25); // Heavy pulse
    } else if (type === "check") {
        navigator.vibrate([20, 40, 20]); // Double alert pulse
    } else if (type === "gameover") {
        navigator.vibrate([40, 60, 80]); // Final pulse sequence
    }
};
