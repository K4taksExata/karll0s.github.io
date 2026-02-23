// Ativar os ícones "Feather"
feather.replace();

// Menu Mobile Toggle
const btn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');

btn.addEventListener('click', () => {
    menu.classList.toggle('active');
});

// Fechar menu mobile ao clicar em um link
const mobileLinks = document.querySelectorAll('.mobile-link');
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        menu.classList.remove('active');
    });
});

// Esconder Navbar ao dar Scroll para baixo (Efeito app moderno)
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Animação da Navbar
    if (scrollTop > lastScrollTop && scrollTop > 80) {
        // Scroll p/ baixo
        navbar.style.transform = 'translateY(-100%)';
    } else {
        // Scroll p/ cima
        navbar.style.transform = 'translateY(0)';
    }

    // Adicionar sombra na navbar se não estiver no topo
    if (scrollTop > 10) {
        navbar.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.5)';
    } else {
        navbar.style.boxShadow = 'none';
    }

    lastScrollTop = scrollTop;
});

// --- Efeito Partículas 3D no Hero ---
const canvas = document.getElementById('hero-particles');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;

    let particles = [];
    const numParticles = 800; // Pontos na esfera
    const sphereRadius = 350; // Tamanho

    let rotationX = 0;
    let rotationY = 0;

    function initCanvas() {
        width = canvas.parentElement.clientWidth;
        height = canvas.parentElement.clientHeight;
        canvas.width = width;
        canvas.height = height;
    }

    window.addEventListener('resize', initCanvas);
    initCanvas();

    // Cria as partículas distribuídas numa esfera usando espiral de Fibonacci
    for (let i = 0; i < numParticles; i++) {
        const phi = Math.acos(-1 + (2 * i) / numParticles);
        const theta = Math.sqrt(numParticles * Math.PI) * phi;

        const x = sphereRadius * Math.cos(theta) * Math.sin(phi);
        const y = sphereRadius * Math.sin(theta) * Math.sin(phi);
        const z = sphereRadius * Math.cos(phi);

        particles.push({ x, y, z });
    }

    let targetRotationX = 0;
    let targetRotationY = 0;

    // Variáveis para que o globo acompanhe o cursor
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let time = 0; // Tempo continuo para a onda

    // Seguir o mouse
    document.addEventListener('mousemove', (e) => {
        // Obter posição do mouse na tela
        mouseX = e.clientX;
        mouseY = e.clientY;

        targetRotationY = (e.clientX - window.innerWidth / 2) * 0.0005;
        targetRotationX = (e.clientY - window.innerHeight / 2) * 0.0005;
    });

    function renderParticles() {
        ctx.clearRect(0, 0, width, height);

        time += 0.04; // Velocidade da onda

        // Rotação autônoma lenta
        targetRotationY -= 0.002;

        // Easing da rotação
        rotationX += (targetRotationX - rotationX) * 0.1;
        rotationY += (targetRotationY - rotationY) * 0.1;

        const cx = width / 2;
        const cy = height / 2;

        // Posição que tenta buscar vagarosamente a do mouse
        let dynamicCx = cx + (mouseX - cx) * 0.15;
        let dynamicCy = cy + (mouseY - cy) * 0.15;

        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);

        particles.forEach(p => {
            // Efeito de onda pulsante ("breathing/pulse")
            const waveAmplitude = 30; // Altura máxima do pulso
            const wave = Math.sin(time + p.y * 0.015 + p.x * 0.015) * waveAmplitude;

            // Expandimos a partícula pra fora do centro para criar o ripple
            const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
            let px = p.x + (p.x / len) * wave;
            let py = p.y + (p.y / len) * wave;
            let pz = p.z + (p.z / len) * wave;

            // Rotação Y (Z e X)
            let tempZ = pz * cosY - px * sinY;
            let tempX = pz * sinY + px * cosY;

            // Rotação X (Y e tempZ)
            let finalY = py * cosX - tempZ * sinX;
            let finalZ = py * sinX + tempZ * cosX;
            let finalX = tempX;

            // Projeção 3D
            const fov = 400;
            const zOffset = 500;
            const zPos = finalZ + zOffset;

            if (zPos > 0) {
                const scale = fov / zPos;

                // Em vez de usar cx/cy estático, usa o dynamic que desloca rumo ao mouse
                const x2d = dynamicCx + finalX * scale;
                const y2d = dynamicCy + finalY * scale;

                const alpha = Math.max(0.1, Math.min(1, (finalZ + sphereRadius) / (sphereRadius * 2)));

                // Radius com base na escala (pequenas linhas/pontos imitando a imagem)
                const radius = Math.max(0.5, 2 * scale);

                // Cor tema roxo/mix
                const hue = 270 + (alpha * 40);

                // Usando o fillStyle para o ponto
                ctx.fillStyle = `hsla(${hue}, 80%, 55%, ${alpha})`;

                // Para parecer um pequeno risco (traço dinâmico igual a imagem que mandou)
                // Usamos fillRect em vez de um aro redondo
                ctx.save();
                ctx.translate(x2d, y2d);
                // Rotação da partícula baseada na sua posição do centro (efeito radial)
                ctx.rotate(Math.atan2(y2d - dynamicCy, x2d - dynamicCx));
                ctx.fillRect(0, 0, radius * 3, radius * 0.8);
                ctx.restore();
            }
        });

        requestAnimationFrame(renderParticles);
    }

    renderParticles();
}

