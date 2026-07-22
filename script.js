'use strict';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

if (window.lucide) {
    window.lucide.createIcons({
        attrs: {
            'aria-hidden': 'true',
            'stroke-width': 1.5
        }
    });
}

const yearElement = document.querySelector('#current-year');
if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
}

const header = document.querySelector('[data-header]');
const sections = Array.from(document.querySelectorAll('main section[id]'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
let viewportTicking = false;

function updateViewportState() {
    const scrollPosition = window.scrollY;
    const scrollableHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const scrollProgress = Math.min(1, Math.max(0, scrollPosition / scrollableHeight));
    document.documentElement.style.setProperty('--scroll-progress', scrollProgress.toFixed(4));

    if (header) {
        header.classList.toggle('scrolled', scrollPosition > 24);
    }

    let currentSection = 'inicio';
    sections.forEach(function (section) {
        if (scrollPosition >= section.offsetTop - window.innerHeight * 0.46) {
            currentSection = section.id;
        }
    });

    navLinks.forEach(function (link) {
        const isCurrent = link.getAttribute('href') === '#' + currentSection;
        link.classList.toggle('active', isCurrent);

        if (isCurrent) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    viewportTicking = false;
}

function requestViewportUpdate() {
    if (!viewportTicking) {
        viewportTicking = true;
        window.requestAnimationFrame(updateViewportState);
    }
}

window.addEventListener('scroll', requestViewportUpdate, { passive: true });
window.addEventListener('resize', requestViewportUpdate, { passive: true });
updateViewportState();

const revealElements = Array.from(document.querySelectorAll('[data-reveal]'));

revealElements.forEach(function (element, index) {
    element.style.transitionDelay = String(Math.min(index % 3, 2) * 80) + 'ms';
});

if ('IntersectionObserver' in window && !motionPreference.matches) {
    const revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px'
    });

    revealElements.forEach(function (element) {
        revealObserver.observe(element);
    });
} else {
    revealElements.forEach(function (element) {
        element.classList.add('revealed');
    });
}

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-navigation');

function setMenu(open) {
    if (!menuButton || !navigation) {
        return;
    }

    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    navigation.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
}

if (menuButton && navigation) {
    menuButton.addEventListener('click', function () {
        setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });

    navigation.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            setMenu(false);
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            setMenu(false);
        }
    });

    window.matchMedia('(min-width: 821px)').addEventListener('change', function (event) {
        if (event.matches) {
            setMenu(false);
        }
    });
}

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

if (finePointer.matches) {
    document.querySelectorAll('.project-card, .info-card').forEach(function (card) {
        card.addEventListener('pointermove', function (event) {
            const bounds = card.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) * 100;
            const y = ((event.clientY - bounds.top) / bounds.height) * 100;
            card.style.setProperty('--spot-x', x.toFixed(1) + '%');
            card.style.setProperty('--spot-y', y.toFixed(1) + '%');
        });

        card.addEventListener('pointerleave', function () {
            card.style.removeProperty('--spot-x');
            card.style.removeProperty('--spot-y');
        });
    });
}

function createStarfield() {
    const canvas = document.querySelector('#starfield');
    if (!canvas) {
        return;
    }

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
        return;
    }

    let width = 0;
    let height = 0;
    let stars = [];
    let animationFrame = 0;
    let resizeFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let running = false;

    function makeStar() {
        const depth = 0.25 + Math.random() * 0.75;
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 0.28 + Math.pow(Math.random(), 2.4) * 1.55,
            alpha: 0.2 + Math.random() * 0.62,
            phase: Math.random() * Math.PI * 2,
            twinkle: 0.0012 + Math.random() * 0.0035,
            speed: 0.04 + Math.random() * 0.12,
            drift: (Math.random() - 0.5) * 0.06,
            depth: depth,
            bright: Math.random() > 0.965
        };
    }

    function resizeCanvas() {
        const nextWidth = window.innerWidth;
        const nextHeight = window.innerHeight;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        width = nextWidth;
        height = nextHeight;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const density = window.innerWidth < 600 ? 10500 : 7600;
        const starCount = Math.max(75, Math.min(250, Math.round((width * height) / density)));
        stars = Array.from({ length: starCount }, makeStar);
        draw(performance.now(), true);
    }

    function draw(time, staticFrame) {
        context.clearRect(0, 0, width, height);

        pointerX += (pointerTargetX - pointerX) * 0.025;
        pointerY += (pointerTargetY - pointerY) * 0.025;

        stars.forEach(function (star) {
            if (!staticFrame) {
                star.y -= star.speed * star.depth;
                star.x += star.drift * star.depth;
                if (star.y < -3) {
                    star.y = height + 3;
                    star.x = Math.random() * width;
                }
                if (star.x < -3) {
                    star.x = width + 3;
                } else if (star.x > width + 3) {
                    star.x = -3;
                }
            }

            const offsetX = pointerX * star.depth * 8;
            const offsetY = pointerY * star.depth * 6;
            const wave = staticFrame ? 0.7 : (Math.sin(time * star.twinkle + star.phase) + 1) / 2;
            const flare = star.bright ? Math.pow(wave, 7) : 0;
            const pulse = 0.16 + wave * 0.84;
            const alpha = Math.max(0.025, star.alpha * pulse + flare * 0.3);
            const radius = star.radius * (0.72 + wave * 0.38 + flare * 0.48);
            const x = star.x + offsetX;
            const y = star.y + offsetY;

            context.beginPath();
            context.fillStyle = 'rgba(255, 255, 255, ' + alpha.toFixed(3) + ')';
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();

            if (star.bright) {
                const ray = 3 + flare * 7;
                context.beginPath();
                context.strokeStyle = 'rgba(255, 255, 255, ' + Math.min(1, alpha * (0.3 + flare)).toFixed(3) + ')';
                context.lineWidth = 0.5;
                context.moveTo(x - ray, y);
                context.lineTo(x + ray, y);
                context.moveTo(x, y - ray);
                context.lineTo(x, y + ray);
                context.stroke();
            }
        });
    }

    function animate(time) {
        if (!running) {
            return;
        }
        draw(time, false);
        animationFrame = window.requestAnimationFrame(animate);
    }

    function start() {
        window.cancelAnimationFrame(animationFrame);
        if (document.hidden) {
            running = false;
            draw(performance.now(), true);
            return;
        }
        running = true;
        animationFrame = window.requestAnimationFrame(animate);
    }

    function handleResize() {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(function () {
            resizeCanvas();
            start();
        });
    }

    window.addEventListener('resize', handleResize, { passive: true });

    if (finePointer.matches) {
        window.addEventListener('pointermove', function (event) {
            pointerTargetX = (event.clientX / Math.max(width, 1) - 0.5) * 2;
            pointerTargetY = (event.clientY / Math.max(height, 1) - 0.5) * 2;
        }, { passive: true });

        document.documentElement.addEventListener('pointerleave', function () {
            pointerTargetX = 0;
            pointerTargetY = 0;
        });
    }

    document.addEventListener('visibilitychange', start);

    if (typeof motionPreference.addEventListener === 'function') {
        motionPreference.addEventListener('change', start);
    }

    resizeCanvas();
    start();
}

function createIntroSparkles() {
    const canvas = document.querySelector('#intro-sparkles');
    if (!canvas) {
        return {
            burst: function () {},
            destroy: function () {}
        };
    }

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
        return {
            burst: function () {},
            destroy: function () {}
        };
    }

    let width = 0;
    let height = 0;
    let particles = [];
    let animationFrame = 0;
    let resizeFrame = 0;
    let active = true;
    let bursting = false;
    let pointerX = 0;
    let pointerY = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;

    function makeParticle(inBeam) {
        const beamHeight = Math.min(280, height * 0.42);
        return {
            x: Math.random() * width,
            y: inBeam
                ? height * 0.54 + (Math.random() - 0.5) * beamHeight
                : Math.random() * height,
            radius: 0.3 + Math.pow(Math.random(), 2.2) * 1.15,
            opacity: 0.18 + Math.random() * 0.78,
            phase: Math.random() * Math.PI * 2,
            speed: 0.0018 + Math.random() * 0.0048,
            driftX: (Math.random() - 0.5) * 0.42,
            driftY: (Math.random() - 0.5) * 0.3,
            velocityX: 0,
            velocityY: 0,
            bright: Math.random() > 0.96
        };
    }

    function resize() {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const density = width < 600 ? 4300 : 5200;
        const count = Math.max(110, Math.min(330, Math.round((width * height) / density)));
        particles = Array.from({ length: count }, function (_, index) {
            return makeParticle(index < count * 0.72);
        });
    }

    function wrapParticle(particle) {
        if (particle.x < -3) {
            particle.x = width + 3;
        } else if (particle.x > width + 3) {
            particle.x = -3;
        }

        if (particle.y < -3) {
            particle.y = height + 3;
        } else if (particle.y > height + 3) {
            particle.y = -3;
        }
    }

    function draw(time) {
        context.clearRect(0, 0, width, height);
        pointerX += (pointerTargetX - pointerX) * 0.035;
        pointerY += (pointerTargetY - pointerY) * 0.035;

        particles.forEach(function (particle) {
            if (bursting) {
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.velocityX *= 0.985;
                particle.velocityY *= 0.985;
                particle.opacity *= 0.975;
            } else {
                particle.x += particle.driftX;
                particle.y += particle.driftY;
                wrapParticle(particle);
            }

            const wave = (Math.sin(time * particle.speed + particle.phase) + 1) / 2;
            const flare = particle.bright ? Math.pow(wave, 7) : 0;
            const twinkle = 0.12 + wave * 0.88;
            const alpha = Math.max(0, particle.opacity * twinkle + flare * 0.32);
            const radius = particle.radius * (0.7 + wave * 0.42 + flare * 0.58);
            const parallaxDepth = 3 + particle.radius * 7;
            const renderX = particle.x + pointerX * parallaxDepth;
            const renderY = particle.y + pointerY * parallaxDepth;

            if (alpha < 0.015) {
                return;
            }

            context.beginPath();
            context.fillStyle = 'rgba(255, 255, 255, ' + alpha.toFixed(3) + ')';
            context.arc(renderX, renderY, radius, 0, Math.PI * 2);
            context.fill();

            if (particle.bright) {
                const ray = 3 + flare * 8;
                context.beginPath();
                context.strokeStyle = 'rgba(255, 255, 255, ' + Math.min(1, alpha * (0.28 + flare)).toFixed(3) + ')';
                context.lineWidth = 0.5;
                context.moveTo(renderX - ray, renderY);
                context.lineTo(renderX + ray, renderY);
                context.moveTo(renderX, renderY - ray);
                context.lineTo(renderX, renderY + ray);
                context.stroke();
            }
        });

        if (active) {
            animationFrame = window.requestAnimationFrame(draw);
        }
    }

    function burst() {
        if (bursting) {
            return;
        }

        bursting = true;
        const centerX = width / 2;
        const centerY = height * 0.51;

        particles.forEach(function (particle) {
            const angle = Math.atan2(particle.y - centerY, particle.x - centerX);
            const force = 1.2 + Math.random() * 4.8;
            particle.velocityX = Math.cos(angle) * force;
            particle.velocityY = Math.sin(angle) * force;
        });

        for (let index = 0; index < 90; index += 1) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * Math.min(width * 0.18, 210);
            const particle = makeParticle(true);
            particle.x = centerX + Math.cos(angle) * distance;
            particle.y = centerY + Math.sin(angle) * distance * 0.35;
            particle.opacity = 0.5 + Math.random() * 0.5;
            particle.radius = 0.5 + Math.random() * 1.25;
            particle.velocityX = Math.cos(angle) * (2 + Math.random() * 6);
            particle.velocityY = Math.sin(angle) * (1 + Math.random() * 4.5);
            particles.push(particle);
        }

    }

    function handleResize() {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(function () {
            resize();
        });
    }

    function handlePointerMove(event) {
        pointerTargetX = (event.clientX / Math.max(width, 1) - 0.5) * 2;
        pointerTargetY = (event.clientY / Math.max(height, 1) - 0.5) * 2;
    }

    function resetPointer() {
        pointerTargetX = 0;
        pointerTargetY = 0;
    }

    function destroy() {
        active = false;
        window.cancelAnimationFrame(animationFrame);
        window.cancelAnimationFrame(resizeFrame);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('pointermove', handlePointerMove);
        document.documentElement.removeEventListener('pointerleave', resetPointer);
    }

    window.addEventListener('resize', handleResize, { passive: true });
    if (finePointer.matches) {
        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', resetPointer);
    }
    resize();
    draw(performance.now());

    return {
        burst: burst,
        destroy: destroy
    };
}

function initializeIntro() {
    const introScreen = document.querySelector('#intro-screen');
    const enterButton = document.querySelector('#enter-portfolio');
    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.querySelector('main');
    const lockedElements = [header, mainContent, skipLink].filter(Boolean);

    if (!introScreen || !enterButton) {
        document.documentElement.classList.remove('intro-pending');
        document.documentElement.classList.add('portfolio-ready');
        return;
    }

    window.scrollTo(0, 0);
    document.body.classList.add('intro-active');

    lockedElements.forEach(function (element) {
        element.inert = true;
        element.setAttribute('aria-hidden', 'true');
    });

    const sparkles = createIntroSparkles();
    let entered = false;

    window.requestAnimationFrame(function () {
        enterButton.focus({ preventScroll: true });
    });

    enterButton.addEventListener('click', function () {
        if (entered) {
            return;
        }

        entered = true;
        introScreen.classList.add('is-leaving');
        sparkles.burst();
        document.documentElement.classList.remove('intro-pending');
        document.documentElement.classList.add('portfolio-ready');

        const exitDuration = motionPreference.matches ? 80 : 1450;
        window.setTimeout(function () {
            introScreen.setAttribute('aria-hidden', 'true');
            introScreen.hidden = true;
            document.body.classList.remove('intro-active');

            lockedElements.forEach(function (element) {
                element.inert = false;
                element.removeAttribute('aria-hidden');
            });

            sparkles.destroy();
            requestViewportUpdate();

            const brandLink = document.querySelector('.brand');
            if (brandLink) {
                brandLink.focus({ preventScroll: true });
            }
        }, exitDuration);
    });
}

initializeIntro();
createStarfield();
