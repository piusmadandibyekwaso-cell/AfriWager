(function () {
    // 1. Create Cinematic Vignette (Blue/Dark)
    const vignette = document.createElement('div');
    vignette.style.position = 'fixed';
    vignette.style.top = '0';
    vignette.style.left = '0';
    vignette.style.width = '100vw';
    vignette.style.height = '100vh';
    vignette.style.pointerEvents = 'none'; // Click-through
    vignette.style.background = 'radial-gradient(circle, transparent 60%, rgba(2, 6, 23, 0.8) 100%)'; // Dark Blue/Slate Vignette
    vignette.style.zIndex = '9998';
    vignette.id = 'cinematic-vignette';
    document.body.appendChild(vignette);

    // 2. Create Caption Container
    const captionBox = document.createElement('div');
    captionBox.style.position = 'fixed';
    captionBox.style.bottom = '80px';
    captionBox.style.left = '50%';
    captionBox.style.transform = 'translateX(-50%)';
    captionBox.style.zIndex = '9999';
    captionBox.style.textAlign = 'center';
    captionBox.style.opacity = '0';
    captionBox.style.transition = 'opacity 0.5s ease-in-out';

    // Caption Styling (Institutional/Terminal Look)
    const captionText = document.createElement('div');
    captionText.style.fontFamily = "'JetBrains Mono', 'Courier New', monospace";
    captionText.style.fontSize = '14px';
    captionText.style.fontWeight = 'bold';
    captionText.style.color = '#10b981'; // Emerald 500
    captionText.style.background = 'rgba(6, 7, 9, 0.9)'; // Dark bg
    captionText.style.border = '1px solid rgba(16, 185, 129, 0.2)'; // Emerald border
    captionText.style.padding = '12px 24px';
    captionText.style.borderRadius = '9999px';
    captionText.style.boxShadow = '0 10px 40px -10px rgba(16, 185, 129, 0.2)';
    captionText.style.textTransform = 'uppercase';
    captionText.style.letterSpacing = '0.05em';
    captionText.id = 'cinematic-caption-text';

    captionBox.appendChild(captionText);
    document.body.appendChild(captionBox);

    // 3. Helper Functions
    window.showCaption = function (text, duration = 4000) {
        captionText.innerText = `> ${text}`;
        captionBox.style.opacity = '1';

        if (duration > 0) {
            setTimeout(() => {
                captionBox.style.opacity = '0';
            }, duration);
        }
    };

    window.hideCaption = function () {
        captionBox.style.opacity = '0';
    };

    console.log("🎬 Cinematic Mode Activated. Use `showCaption('Text')` to display overlays.");

    // Initial Welcome
    window.showCaption("AfriWager Institutional Protocol // Connected", 3000);
})();
