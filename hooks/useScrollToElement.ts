import { useEffect } from 'react';

/**
 * A hook that attempts to scroll a given element ID into view.
 * It uses requestAnimationFrame and polling to wait until the element
 * is rendered and laid out before scrolling.
 * @param elementId The DOM ID of the element to scroll to.
 * @param enabled A boolean to enable or disable the hook's effect.
 * @param trigger A value that changes to force the effect to re-run (e.g., a question index).
 */
export const useScrollToElement = (elementId: string | null, enabled: boolean, trigger: any) => {
    useEffect(() => {
        if (!elementId || !enabled) return;

        let attempts = 0;
        const maxAttempts = 50; // Poll for ~0.8s (50 frames at 60fps)
        let animationFrameId: number;

        const tryScroll = () => {
            const element = document.getElementById(elementId);
            
            // Check that the element exists and has been laid out with dimensions.
            // This prevents trying to scroll to an element that's in the DOM but not yet visible.
            if (element && element.offsetWidth > 0 && element.offsetHeight > 0) {
                 element.scrollIntoView({
                    behavior: 'auto',
                    inline: 'center',
                    block: 'nearest',
                 });
            } else if (attempts < maxAttempts) {
                 attempts++;
                 animationFrameId = requestAnimationFrame(tryScroll);
            }
        };

        // Start the process
        animationFrameId = requestAnimationFrame(tryScroll);
        
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [elementId, enabled, trigger]);
};
