import React, { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { textRevealVariants, reducedMotionVariants } from './animationVariants';
import { ANIMATION_CONFIG } from './animationConfig';

/**
 * AnimatedText Component
 * Smooth text entrance that glides gracefully into place with subtle scale and opacity.
 */
export const AnimatedText = forwardRef(({
    children,
    className = '',
    style = {},
    direction = 'up',
    delay = 0,
    duration,
    as = 'div',
    whileInView = true,
    once = true,
    amount = 0.1,
    margin = '0px 0px -30px 0px',
    disabled = false,
    overflowClip = false,
    ...rest
}, ref) => {
    const shouldReduceMotion = useReducedMotion();

    if (disabled) {
        const Component = as;
        return (
            <Component ref={ref} className={className} style={style} {...rest}>
                {children}
            </Component>
        );
    }

    const variants = shouldReduceMotion ? reducedMotionVariants : textRevealVariants;
    const custom = {
        direction,
        delay,
        duration: duration || ANIMATION_CONFIG.timings.textReveal,
        spring: ANIMATION_CONFIG.spring.bisk,
    };

    const MotionComponent = motion[as] || motion.div;

    const triggerProps = whileInView ? {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once, amount, margin },
    } : {
        initial: 'hidden',
        animate: 'visible',
    };

    const wrapperStyle = overflowClip ? { overflow: 'hidden', display: 'inline-block' } : {};

    const content = (
        <MotionComponent
            ref={ref}
            className={`animated-text ${className}`.trim()}
            style={{ ...style }}
            variants={variants}
            custom={custom}
            {...triggerProps}
            {...rest}
        >
            {children}
        </MotionComponent>
    );

    if (overflowClip) {
        return <div style={wrapperStyle}>{content}</div>;
    }

    return content;
});

AnimatedText.displayName = 'AnimatedText';
export default AnimatedText;

