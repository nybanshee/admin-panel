import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function FloatingParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000, isDown: false, isPulling: false });
    const pullTimeoutRef = useRef<NodeJS.Timeout>();
    const particlesRef = useRef<Array<{
        x: number;
        y: number;
        baseVx: number;
        baseVy: number;
        vx: number;
        vy: number;
        radius: number;
        baseAlpha: number;
    }>>([]);
    const location = useLocation();

    // Effect to scramble particles on route change
    useEffect(() => {
        particlesRef.current.forEach(p => {
            const angle = Math.random() * Math.PI * 2;
            const force = 4 + Math.random() * 4; // Reduced force (approx 2x click strength)
            p.vx = Math.cos(angle) * force;
            p.vy = Math.sin(angle) * force;
        });
    }, [location]);

    // 3D Network Check
    const searchParams = new URLSearchParams(location.search);
    const isNetworkView = searchParams.get('tab') === 'network';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // Initialize particles if empty
        if (particlesRef.current.length === 0) {
            const particleCount = 15;
            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    baseVx: (Math.random() - 0.5) * 0.5,
                    baseVy: (Math.random() - 0.5) * 0.5,
                    vx: 0,
                    vy: 0,
                    radius: 20 + Math.random() * 40,
                    baseAlpha: 0.05 + Math.random() * 0.1
                });
            }
        }

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        const handleMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };

        const handleDown = () => {
            mouseRef.current.isDown = true;
            mouseRef.current.isPulling = false;
            if (pullTimeoutRef.current) clearTimeout(pullTimeoutRef.current);
        };

        const handleUp = () => {
            mouseRef.current.isDown = false;
            // Trigger momentary pull
            mouseRef.current.isPulling = true;
            pullTimeoutRef.current = setTimeout(() => {
                mouseRef.current.isPulling = false;
            }, 500); // 500ms pull effect
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mouseup', handleUp);

        let animationFrame: number;

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            particlesRef.current.forEach(p => {
                // Apply velocities
                p.x += p.baseVx + p.vx;
                p.y += p.baseVy + p.vy;

                // Mouse interaction
                const dx = p.x - mouseRef.current.x;
                const dy = p.y - mouseRef.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Interaction config
                let interactionRadius = 200;
                let forceMultiplier = 0.05; // Default push

                if (mouseRef.current.isDown) {
                    interactionRadius = 400; // Bigger push radius
                    forceMultiplier = 0.15; // Stronger push
                } else if (mouseRef.current.isPulling) {
                    interactionRadius = 300;
                    forceMultiplier = -0.08; // Pull (Attract)
                }

                if (dist < interactionRadius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (interactionRadius - dist) / interactionRadius;
                    const pushX = Math.cos(angle) * force * forceMultiplier * 20;
                    const pushY = Math.sin(angle) * force * forceMultiplier * 20;
                    
                    p.vx += pushX;
                    p.vy += pushY;
                }

                // Friction (only affects interaction velocity)
                p.vx *= 0.96;
                p.vy *= 0.96;

                // Bounce off walls
                if (p.x < -50) { p.x = width + 50; p.vx *= -0.5; }
                if (p.x > width + 50) { p.x = -50; p.vx *= -0.5; }
                if (p.y < -50) { p.y = height + 50; p.vy *= -0.5; }
                if (p.y > height + 50) { p.y = -50; p.vy *= -0.5; }

                // Draw
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                gradient.addColorStop(0, `rgba(34, 211, 238, ${p.baseAlpha})`);
                gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
                ctx.fillStyle = gradient;
                ctx.globalCompositeOperation = 'screen';
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrame = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mouseup', handleUp);
            cancelAnimationFrame(animationFrame);
            if (pullTimeoutRef.current) clearTimeout(pullTimeoutRef.current);
        };
    }, [isNetworkView]);

    if (isNetworkView) return null;

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 pointer-events-none z-[9997]" 
        />
    );
}

export function CustomCursor() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    // Snappier but smooth: higher stiffness, critical damping
    const springConfig = { damping: 35, stiffness: 400, mass: 0.5 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX - 16);
            cursorY.set(e.clientY - 16);
        };

        const handleHoverStart = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleHoverStart);

        // Hide default cursor
        document.body.style.cursor = 'none';

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleHoverStart);
            document.body.style.cursor = 'auto';
        };
    }, [cursorX, cursorY]);

    return (
        <motion.div
            className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-cyan-400 pointer-events-none z-[9999] mix-blend-difference"
            style={{
                x: cursorXSpring,
                y: cursorYSpring,
            }}
            animate={{
                scale: isHovering ? 1.2 : 1,
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
            }}
        >
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </motion.div>
    );
}

export function ReactiveBackground() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 35, stiffness: 400, mass: 0.5 };
    const mouseXSpring = useSpring(mouseX, springConfig);
    const mouseYSpring = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, [mouseX, mouseY]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden mix-blend-screen">
            <motion.div
                className="absolute w-[100px] h-[100px] rounded-full opacity-20 blur-[25px]"
                style={{
                    background: 'radial-gradient(circle, rgba(34,211,238,0.25) 0%, rgba(34,211,238,0) 70%)',
                    x: mouseXSpring,
                    y: mouseYSpring,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            />
        </div>
    );
}