// Banco de dados da estrutura
let nos = {}; // { 'A': {x: 0, y:0}, 'B': {x:3, y:0} }
let barras = []; // [ ['A', 'B'], ['B', 'C'] ]

// Configurações do Canvas
const canvas = document.getElementById('canvasTrelica');
const ctx = canvas.getContext('2d');
const padding = 40; // Espaço nas bordas

// --- Funções de Interface ---

function adicionarNo() {
    const idInput = document.getElementById('node-id');
    const xInput = document.getElementById('node-x');
    const yInput = document.getElementById('node-y');

    const id = idInput.value.toUpperCase().trim();
    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);

    if (!id || isNaN(x) || isNaN(y)) {
        alert("Preencha ID (ex: A), X e Y corretamente.");
        return;
    }

    if (nos[id]) {
        alert("Um nó com esse ID já existe.");
        return;
    }

    // Salva no banco
    nos[id] = { x: x, y: y };

    // Atualiza lista HTML
    const ul = document.getElementById('ul-nos');
    const li = document.createElement('li');
    li.textContent = `Nó ${id}: (${x.toFixed(1)}, ${y.toFixed(1)}) m`;
    ul.appendChild(li);

    // Limpa inputs e foca
    idInput.value = '';
    xInput.value = '';
    yInput.value = '';
    idInput.focus();

    desenharEstrutura();
}

function adicionarBarra() {
    const startInput = document.getElementById('bar-start');
    const endInput = document.getElementById('bar-end');

    const n1 = startInput.value.toUpperCase().trim();
    const n2 = endInput.value.toUpperCase().trim();

    if (!nos[n1] || !nos[n2] || n1 === n2) {
        alert("Verifique se ambos os nós existem e são diferentes.");
        return;
    }

    // Verifica se barra já existe (em qualquer ordem)
    const existe = barras.some(b => (b[0] === n1 && b[1] === n2) || (b[0] === n2 && b[1] === n1));
    if (existe) {
        alert("Esta barra já foi adicionada.");
        return;
    }

    barras.push([n1, n2]);

    // Calcula comprimento (Pitágoras)
    const dx = nos[n2].x - nos[n1].x;
    const dy = nos[n2].y - nos[n1].y;
    const comp = Math.sqrt(dx*dx + dy*dy);

    // Atualiza lista HTML
    const ul = document.getElementById('ul-barras');
    const li = document.createElement('li');
    li.textContent = `Barra ${n1}-${n2}: L = ${comp.toFixed(2)} m`;
    ul.appendChild(li);

    startInput.value = '';
    endInput.value = '';
    startInput.focus();

    desenharEstrutura();
}

function limparTudo() {
    nos = {};
    barras = [];
    document.getElementById('ul-nos').innerHTML = '';
    document.getElementById('ul-barras').innerHTML = '';
    desenharEstrutura();
}

// --- Motor Gráfico 2D ---

function desenharEstrutura() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const idsNos = Object.keys(nos);
    if (idsNos.length === 0) return;

    // 1. Encontrar limites para fator de escala
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    idsNos.forEach(id => {
        const no = nos[id];
        if (no.x < minX) minX = no.x;
        if (no.x > maxX) maxX = no.x;
        if (no.y < minY) minY = no.y;
        if (no.y > maxY) maxY = no.y;
    });

    // Evita divisão por zero se houver só um nó ou nós na mesma linha
    let rangeX = maxX - minX;
    let rangeY = maxY - minY;
    if (rangeX === 0) rangeX = 1;
    if (rangeY === 0) rangeY = 1;

    // Fatores de escala para ajustar ao canvas mantendo proporção (proporção não mantida estrita para preencher melhor)
    const scaleX = (canvas.width - 2 * padding) / rangeX;
    const scaleY = (canvas.height - 2 * padding) / rangeY;
    
    // Usar a menor escala para manter proporção real (opcional)
    // const scale = Math.min(scaleX, scaleY);

    // Função auxiliar para converter coordenada real em pixel do canvas
    // Nota: O Y do canvas é invertido (0 é no topo)
    const toPx = (xReal, yReal) => {
        return {
            x: padding + (xReal - minX) * scaleX,
            y: canvas.height - (padding + (yReal - minY) * scaleY)
        };
    };

    // 2. Desenhar Grelha de Referência (Opcional, profissional)
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    for(let i=0; i<=5; i++) {
        // Linhas verticais
        let xGrelha = minX + (rangeX / 5) * i;
        let p1 = toPx(xGrelha, minY);
        let p2 = toPx(xGrelha, maxY);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        
        // Linhas horizontais
        let yGrelha = minY + (rangeY / 5) * i;
        let p3 = toPx(minX, yGrelha);
        let p4 = toPx(maxX, yGrelha);
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
    }

    // 3. Desenhar Barras
    ctx.strokeStyle = '#333'; // Cor das barras
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    barras.forEach(barra => {
        const p1Real = nos[barra[0]];
        const p2Real = nos[barra[1]];
        const p1Px = toPx(p1Real.x, p1Real.y);
        const p2Px = toPx(p2Real.x, p2Real.y);

        ctx.beginPath();
        ctx.moveTo(p1Px.x, p1Px.y);
        ctx.lineTo(p2Px.x, p2Px.y);
        ctx.stroke();

        // Desenhar texto do comprimento no meio da barra (Informação solicitada)
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        const dx = p2Real.x - p1Real.x;
        const dy = p2Real.y - p1Real.y;
        const comp = Math.sqrt(dx*dx + dy*dy);
        const midX = (p1Px.x + p2Px.x) / 2;
        const midY = (p1Px.y + p2Px.y) / 2;
        // ctx.fillText(`${comp.toFixed(1)}m`, midX, midY - 5); // Desativado para não poluir
    });

    // 4. Desenhar Nós
    idsNos.forEach(id => {
        const noReal = nos[id];
        const noPx = toPx(noReal.x, noReal.y);

        // Círculo do nó
        ctx.beginPath();
        ctx.arc(noPx.x, noPx.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#d4af37'; // Ouro/Safariaccent
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Texto do ID e Coordenadas (Informação solicitada)
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Segoe UI';
        ctx.textAlign = 'left';
        ctx.fillText(id, noPx.x + 10, noPx.y - 10);
        
        ctx.fillStyle = '#555';
        ctx.font = '10px Arial';
        ctx.fillText(`(${noReal.x.toFixed(1)}, ${noReal.y.toFixed(1)})`, noPx.x + 10, noPx.y + 2);
    });
}

// Inicializa canvas vazio
desenharEstrutura();
