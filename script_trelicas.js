// Banco de dados da estrutura
let nos = {}; 
let barras = []; 
let apoios = {}; // <--- NOVO: Guarda os apoios (ex: { 'A': 'pino' })

// Configurações do Canvas
const canvas = document.getElementById('canvasTrelica');
const ctx = canvas.getContext('2d');
const padding = 40; 

// Escala Fixa para caber de 0 a 10
const escala = (canvas.width - 2 * padding) / 10; 

// --- Funções de Interface e Validação ---

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

    if (x < 0 || x > 10 || y < 0 || y > 10) {
        alert("As coordenadas devem estar entre 0.0 e 10.0 metros.");
        return;
    }

    // 1. Verifica se o NOME (ID) já existe
    if (nos[id]) {
        alert("Um nó com esse ID já existe.");
        return;
    }

    // 2. NOVO: Verifica se as COORDENADAS já estão ocupadas por outro nó
    const coordExiste = Object.values(nos).some(n => n.x === x && n.y === y);
    if (coordExiste) {
        alert(`Já existe um nó nessas exatas coordenadas (${x}, ${y}). Escolha outra posição.`);
        return;
    }

    // Salva no objeto
    nos[id] = { x: x, y: y };

    // Atualiza a lista da tela e redesenha
    atualizarListaNos();
    desenharEstrutura();

    idInput.value = '';
    xInput.value = '';
    yInput.value = '';
    idInput.focus();
}

function atualizarListaNos() {
    const ul = document.getElementById('ul-nos');
    ul.innerHTML = ''; // Limpa a lista para reconstruir

    Object.keys(nos).forEach(id => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.marginBottom = '8px';

        const span = document.createElement('span');
        span.textContent = `Nó ${id}: (${nos[id].x.toFixed(1)}, ${nos[id].y.toFixed(1)}) m`;

        // Botão X Vermelho para deletar o Nó
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'x';
        btnRemover.style.padding = '2px 8px';
        btnRemover.style.backgroundColor = 'transparent';
        btnRemover.style.color = '#dc3545';
        btnRemover.style.border = 'none';
        btnRemover.style.cursor = 'pointer';
        btnRemover.style.fontWeight = 'bold';
        btnRemover.style.fontSize = '14px';
        
        btnRemover.onclick = () => removerNo(id);

        li.appendChild(span);
        li.appendChild(btnRemover);
        ul.appendChild(li);
    });
}

function removerNo(idParaRemover) {
    delete nos[idParaRemover];
    barras = barras.filter(barra => barra[0] !== idParaRemover && barra[1] !== idParaRemover);
    
    // NOVO: Remove o apoio se o nó for apagado
    delete apoios[idParaRemover]; 

    atualizarListaNos();
    atualizarListaBarras();
    atualizarListaApoios(); // Atualiza a tela
    desenharEstrutura();
}

function limparTudo() {
    nos = {};
    barras = [];
    apoios = {}; // Limpa os apoios
    atualizarListaNos();
    atualizarListaBarras();
    atualizarListaApoios();
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

    const existe = barras.some(b => (b[0] === n1 && b[1] === n2) || (b[0] === n2 && b[1] === n1));
    if (existe) {
        alert("Esta barra já foi adicionada.");
        return;
    }

    barras.push([n1, n2]);

    atualizarListaBarras();
    desenharEstrutura();

    startInput.value = '';
    endInput.value = '';
    startInput.focus();
}

function atualizarListaBarras() {
    const ul = document.getElementById('ul-barras');
    ul.innerHTML = '';

    barras.forEach((barra, index) => {
        const n1 = barra[0];
        const n2 = barra[1];

        // Cálculo do comprimento da barra (Pitágoras)
        const dx = nos[n2].x - nos[n1].x;
        const dy = nos[n2].y - nos[n1].y;
        const comp = Math.sqrt(dx*dx + dy*dy);

        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.marginBottom = '8px';

        const span = document.createElement('span');
        span.textContent = `Barra ${n1}-${n2}: L = ${comp.toFixed(2)} m`;

        // Botão X Vermelho para deletar a Barra
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'x';
        btnRemover.style.padding = '2px 8px';
        btnRemover.style.backgroundColor = 'transparent';
        btnRemover.style.color = '#dc3545';
        btnRemover.style.border = 'none';
        btnRemover.style.cursor = 'pointer';
        btnRemover.style.fontWeight = 'bold';
        btnRemover.style.fontSize = '14px';
        
        btnRemover.onclick = () => removerBarra(index);

        li.appendChild(span);
        li.appendChild(btnRemover);
        ul.appendChild(li);
    });
}

function removerBarra(indexParaRemover) {
    // Remove a barra do array usando o índice dela
    barras.splice(indexParaRemover, 1);
    
    atualizarListaBarras();
    desenharEstrutura();
}

// --- Lógica dos Apoios ---
function adicionarApoio() {
    const nodeInput = document.getElementById('apoio-node');
    const tipoInput = document.getElementById('apoio-tipo');

    const id = nodeInput.value.toUpperCase().trim();
    const tipo = tipoInput.value;

    if (!id) {
        alert("Informe a letra do nó para inserir o apoio.");
        return;
    }
    if (!nos[id]) {
        alert(`O nó "${id}" não existe! Crie o nó primeiro no Passo 1.`);
        return;
    }
    if (apoios[id]) {
        alert(`Já existe um apoio no nó "${id}". Remova-o antes de trocar.`);
        return;
    }

    apoios[id] = tipo;
    atualizarListaApoios();
    desenharEstrutura();

    nodeInput.value = '';
    nodeInput.focus();
}

function atualizarListaApoios() {
    const ul = document.getElementById('ul-apoios');
    ul.innerHTML = '';

    Object.keys(apoios).forEach(id => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.marginBottom = '8px';

        const span = document.createElement('span');
        const nomeApoio = apoios[id] === 'pino' ? 'Pino (Fixo)' : 'Rolete (Móvel)';
        span.textContent = `Nó ${id}: ${nomeApoio}`;

        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'x';
        btnRemover.style.padding = '2px 8px';
        btnRemover.style.backgroundColor = 'transparent';
        btnRemover.style.color = '#dc3545';
        btnRemover.style.border = 'none';
        btnRemover.style.cursor = 'pointer';
        btnRemover.style.fontWeight = 'bold';
        btnRemover.style.fontSize = '14px';
        
        btnRemover.onclick = () => removerApoio(id);

        li.appendChild(span);
        li.appendChild(btnRemover);
        ul.appendChild(li);
    });
}

function removerApoio(id) {
    delete apoios[id];
    atualizarListaApoios();
    desenharEstrutura();
}

// --- Motor Gráfico 2D ---

const toPx = (xReal, yReal) => {
    return {
        x: padding + (xReal * escala),
        y: canvas.height - padding - (yReal * escala)
    };
};

function desenharEstrutura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha Eixos e Números
    ctx.strokeStyle = '#bbb';
    ctx.fillStyle = '#555';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;

    const pOrigem = toPx(0, 0);
    ctx.beginPath(); ctx.moveTo(pOrigem.x, pOrigem.y); ctx.lineTo(toPx(10, 0).x, pOrigem.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pOrigem.x, pOrigem.y); ctx.lineTo(pOrigem.x, toPx(0, 10).y); ctx.stroke();

    for (let i = 0; i <= 10; i++) {
        const pX = toPx(i, 0);
        const pY = toPx(0, i);

        ctx.strokeStyle = '#eee';
        ctx.beginPath(); ctx.moveTo(pX.x, pOrigem.y); ctx.lineTo(pX.x, toPx(i, 10).y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pOrigem.x, pY.y); ctx.lineTo(toPx(10, i).x, pY.y); ctx.stroke();

        ctx.strokeStyle = '#999';
        ctx.beginPath(); ctx.moveTo(pX.x, pOrigem.y - 4); ctx.lineTo(pX.x, pOrigem.y + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pOrigem.x - 4, pY.y); ctx.lineTo(pOrigem.x + 4, pY.y); ctx.stroke();

        if (i === 0) {
            ctx.fillText('0', pOrigem.x - 12, pOrigem.y + 12);
        } else {
            ctx.fillText(i, pX.x, pOrigem.y + 15); 
            ctx.fillText(i, pOrigem.x - 15, pY.y); 
        }
    }

    // Desenha as Barras
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    barras.forEach(barra => {
        if (nos[barra[0]] && nos[barra[1]]) {
            const p1Px = toPx(nos[barra[0]].x, nos[barra[0]].y);
            const p2Px = toPx(nos[barra[1]].x, nos[barra[1]].y);

            ctx.beginPath();
            ctx.moveTo(p1Px.x, p1Px.y);
            ctx.lineTo(p2Px.x, p2Px.y);
            ctx.stroke();
        }
    });

    // ... (código dos eixos e barras)

    // DESENHAR APOIOS (VÍNCULOS)
    Object.keys(apoios).forEach(id => {
        const noReal = nos[id];
        if (!noReal) return;
        const px = toPx(noReal.x, noReal.y);

        ctx.strokeStyle = '#333';
        ctx.fillStyle = '#fff';
        ctx.lineWidth = 2;

        if (apoios[id] === 'pino') {
            // Desenha um triângulo para o Pino
            ctx.beginPath();
            ctx.moveTo(px.x, px.y + 6); 
            ctx.lineTo(px.x - 12, px.y + 25);
            ctx.lineTo(px.x + 12, px.y + 25);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            // Linha de terra
            ctx.beginPath(); ctx.moveTo(px.x - 18, px.y + 25); ctx.lineTo(px.x + 18, px.y + 25); ctx.stroke();
        } else if (apoios[id] === 'rolete') {
            // Desenha um triângulo com rodinhas para o Rolete
            ctx.beginPath();
            ctx.moveTo(px.x, px.y + 6);
            ctx.lineTo(px.x - 10, px.y + 20);
            ctx.lineTo(px.x + 10, px.y + 20);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            // Rodinhas
            ctx.beginPath(); ctx.arc(px.x - 5, px.y + 24, 4, 0, 2*Math.PI); ctx.stroke();
            ctx.beginPath(); ctx.arc(px.x + 5, px.y + 24, 4, 0, 2*Math.PI); ctx.stroke();
            // Linha de terra
            ctx.beginPath(); ctx.moveTo(px.x - 18, px.y + 28); ctx.lineTo(px.x + 18, px.y + 28); ctx.stroke();
        }
    });

    // 3. DESENHAR NÓS
    // ... (restante do código)
    Object.keys(nos).forEach(id => {
        const noReal = nos[id];
        const noPx = toPx(noReal.x, noReal.y);

        ctx.beginPath();
        ctx.arc(noPx.x, noPx.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#d4af37'; 
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Segoe UI';
        ctx.textAlign = 'left';
        ctx.fillText(id, noPx.x + 10, noPx.y - 10);
        
        ctx.fillStyle = '#555';
        ctx.font = '10px Arial';
        ctx.fillText(`(${noReal.x.toFixed(1)}, ${noReal.y.toFixed(1)})`, noPx.x + 10, noPx.y + 4);
    });
}

desenharEstrutura();