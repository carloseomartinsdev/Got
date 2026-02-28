const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let rotX = 0, rotY = 0, zoom = 1;
let isDragging = false, lastX = 0, lastY = 0;
let nodes = [], edges = [];
let hoveredNode = null;
let filteredChar = null;
let imageCache = {};
let stars = [];
let lastTouchDist = 0;

document.getElementById('loading').style.display = 'none';
document.getElementById('controls').style.display = 'block';
document.getElementById('charCount').textContent = `${data.characters.length} personagens (5 principais + ${data.characters.length - 5} secundários)`;

// Criar estrelas fixas
for (let i = 0; i < 100; i++) {
    stars.push({
        x: (i * 137.5) % window.innerWidth,
        y: (i * 73.3) % window.innerHeight,
        opacity: 0.2 + Math.random() * 0.3
    });
}

createNodes();
createEdges();
console.log(`Carregados: ${nodes.length} nós, ${edges.length} arestas`);
draw();

// Criar nós em posições aleatórias 3D
function createNodes() {
    const chars = data.characters;
    const mainChars = chars.slice(0, 5);
    const otherChars = chars.slice(5);
    
    // Top 5 próximos ao centro
    mainChars.forEach((char, i) => {
        const radius = 400 + Math.random() * 300;
        const phi = Math.random() * Math.PI;
        const theta = Math.random() * Math.PI * 2;
        nodes.push({
            name: char.name,
            falas: char.falas,
            relations: char.relations,
            color: getColor(i),
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi),
            size: 30 + (char.falas / 30),
            isMain: true
        });
    });
    
    // Outros espalhados aleatoriamente
    otherChars.forEach((char, i) => {
        const radius = 300 + Math.random() * 400;
        const phi = Math.random() * Math.PI;
        const theta = Math.random() * Math.PI * 2;
        nodes.push({
            name: char.name,
            falas: char.falas,
            relations: char.relations,
            color: getColor(i + 5),
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi),
            size: 20 + (char.falas / 50),
            isMain: false
        });
    });
}

function getColor(i) {
    const colors = ['#FFD700','#DC143C','#FF1493','#4169E1','#32CD32','#FF6347','#8B4513','#2F4F4F','#9370DB','#CD853F',
                    '#4682B4','#DAA520','#228B22','#FF4500','#6A5ACD','#20B2AA','#B8860B','#8B0000','#556B2F','#800080',
                    '#FF8C00','#2E8B57','#DC143C','#4B0082','#D2691E','#8B4513','#483D8B','#2F4F4F','#8B008B','#B22222'];
    return colors[i % colors.length];
}

// Criar arestas
function createEdges() {
    data.edges.forEach(e => {
        const n1 = nodes.find(n => n.name === e.from);
        const n2 = nodes.find(n => n.name === e.to);
        if (n1 && n2) {
            edges.push({from: n1, to: n2, weight: e.weight, opacity: Math.min(e.weight / 300, 0.6)});
        }
    });
}

// Projeção 3D
function project(x, y, z) {
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    
    const scale = (800 / (800 + z2)) * zoom;
    return {
        x: x1 * scale + canvas.width / 2,
        y: y1 * scale + canvas.height / 2,
        z: z2,
        scale
    };
}

// Desenhar
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrelas
    stars.forEach(s => {
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fillRect(s.x, s.y, 1, 1);
    });
    
    // Projetar e ordenar por profundidade Z
    const projected = nodes.map(n => {
        const proj = project(n.x, n.y, n.z);
        return {node: n, proj, z: proj.z};
    }).sort((a, b) => a.z - b.z);
    
    // Desenhar arestas (atrás)
    edges.forEach(e => {
        // Filtro: mostrar apenas arestas relacionadas
        if (filteredChar && e.from !== filteredChar && e.to !== filteredChar) return;
        
        const p1 = project(e.from.x, e.from.y, e.from.z);
        const p2 = project(e.to.x, e.to.y, e.to.z);
        if (p1.z > -2000 && p2.z > -2000) {
            const avgZ = (p1.z + p2.z) / 2;
            const opacity = Math.max(0.1, (1000 - avgZ) / 1500);
            const intensity = Math.min(e.weight / 300, 1);
            const r = Math.floor(100 + 155 * intensity);
            const g = Math.floor(150 * (1 - intensity * 0.5));
            const b = Math.floor(255 * (1 - intensity * 0.3));
            ctx.strokeStyle = `rgba(${r},${g},${b},${opacity * 0.6})`;
            const lineWidth = (1 + (e.weight / 100)) * (filteredChar ? 5 : 1);
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    });
    
    // Desenhar nós (ordenados por Z - mais distante primeiro)
    projected.forEach(({node, proj, z}) => {
        if (proj.z < -2000) return;
        
        // Filtro: ocultar nós sem relação
        if (filteredChar && node !== filteredChar) {
            const hasRelation = edges.some(e => 
                (e.from === filteredChar && e.to === node) || 
                (e.to === filteredChar && e.from === node)
            );
            if (!hasRelation) return;
        }
        
        const r = node.size * proj.scale;
        const isHovered = hoveredNode === node;
        const brightness = Math.max(0.5, Math.min(1, (1500 - proj.z) / 2000));
        
        // Foto
        if (!imageCache[node.name]) {
            imageCache[node.name] = new Image();
            imageCache[node.name].src = `personagens_fotos/${node.name.toLowerCase()}_got.jpg`;
        }
        const img = imageCache[node.name];
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        if (img.complete && img.naturalWidth > 0) {
            ctx.globalAlpha = brightness;
            ctx.drawImage(img, proj.x - r, proj.y - r, r * 2, r * 2);
            ctx.globalAlpha = 1;
        } else {
            const grad = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, r);
            grad.addColorStop(0, node.color);
            grad.addColorStop(1, '#000');
            ctx.fillStyle = grad;
            ctx.globalAlpha = brightness;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.restore();
        
        // Borda
        ctx.strokeStyle = node.isMain ? '#ff0000' : (isHovered ? '#fff' : `rgba(255,255,255,${0.5 * brightness})`);
        ctx.lineWidth = node.isMain ? 5 : (isHovered ? 4 : 2);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
        ctx.stroke();
        
        if (isHovered || node.isMain) {
            ctx.shadowColor = node.isMain ? '#ff0000' : '#fff';
            ctx.shadowBlur = 20;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Nome
        if (node.isMain || isHovered) {
            ctx.fillStyle = `rgba(255,255,255,${brightness})`;
            ctx.font = `bold ${12 * proj.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(node.name, proj.x, proj.y + r + 20);
            ctx.shadowBlur = 0;
        }
        
        node.screenX = proj.x;
        node.screenY = proj.y;
        node.screenR = r;
    });
    
    requestAnimationFrame(draw);
}

// Mouse
canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mousemove', e => {
    if (isDragging) {
        rotY += (e.clientX - lastX) * 0.005;
        rotX += (e.clientY - lastY) * 0.005;
        lastX = e.clientX;
        lastY = e.clientY;
    } else {
        hoveredNode = null;
        for (const node of nodes) {
            if (node.screenX && node.screenY) {
                const dx = e.clientX - node.screenX;
                const dy = e.clientY - node.screenY;
                if (Math.sqrt(dx*dx + dy*dy) < node.screenR) {
                    hoveredNode = node;
                    
                    // Mostrar tooltip se houver personagem filtrado
                    if (filteredChar && hoveredNode !== filteredChar) {
                        const edge = edges.find(e => 
                            (e.from === filteredChar && e.to === hoveredNode) ||
                            (e.to === filteredChar && e.from === hoveredNode)
                        );
                        if (edge) {
                            canvas.title = `${hoveredNode.name} - ${edge.weight} interações`;
                        } else {
                            canvas.title = '';
                        }
                    } else {
                        canvas.title = '';
                    }
                    break;
                }
            }
        }
        if (!hoveredNode) canvas.title = '';
    }
});

canvas.addEventListener('mouseup', () => isDragging = false);

canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - canvas.width / 2;
    const mouseY = e.clientY - rect.top - canvas.height / 2;
    
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const oldZoom = zoom;
    zoom *= zoomFactor;
    zoom = Math.max(0.3, Math.min(3, zoom));
    
    // Ajustar rotação para zoom no mouse
    const factor = (zoom / oldZoom - 1) * 0.001;
    rotY += mouseX * factor;
    rotX += mouseY * factor;
});

canvas.addEventListener('click', e => {
    if (hoveredNode) {
        const selectedNode = hoveredNode;
        const visibleRelations = edges.filter(e => 
            e.from === selectedNode || e.to === selectedNode
        ).length;
        
        const photoEl = document.getElementById('charPhoto');
        photoEl.src = `personagens_fotos/${selectedNode.name.toLowerCase()}_got.jpg`;
        photoEl.style.display = 'block';
        
        document.getElementById('charName').textContent = selectedNode.name;
        document.getElementById('charFalas').textContent = `Falas: ${selectedNode.falas}`;
        document.getElementById('charRelacoes').textContent = `Relações visíveis: ${visibleRelations}`;
        document.getElementById('info').style.display = 'block';
        
        const filterBtn = document.getElementById('filterBtn');
        filterBtn.textContent = 'Filtrar Relações';
        filterBtn.onclick = () => {
            if (filteredChar === selectedNode) {
                filteredChar = null;
                filterBtn.textContent = 'Filtrar Relações';
            } else {
                filteredChar = selectedNode;
                filterBtn.textContent = 'Mostrar Todos';
            }
        };
    } else if (!filteredChar) {
        document.getElementById('info').style.display = 'none';
    }
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Touch
canvas.addEventListener('touchstart', e => {
    if (e.target !== canvas) return;
    e.preventDefault();
    if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx*dx + dy*dy);
    }
});

canvas.addEventListener('touchmove', e => {
    if (e.target !== canvas) return;
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
        rotY += (e.touches[0].clientX - lastX) * 0.005;
        rotX += (e.touches[0].clientY - lastY) * 0.005;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (lastTouchDist > 0) {
            zoom *= dist / lastTouchDist;
            zoom = Math.max(0.3, Math.min(3, zoom));
        }
        lastTouchDist = dist;
    }
});

canvas.addEventListener('touchend', e => {
    isDragging = false;
    lastTouchDist = 0;
});
