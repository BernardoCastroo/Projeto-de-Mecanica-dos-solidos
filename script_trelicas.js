let nos = {}; 
let barras = []; 
let apoios = {}; 
let forcas = []; 

let resultadosBarras = [];
let resultadosReacoes = [];

const canvas = document.getElementById('canvasTrelica');
const ctx = canvas.getContext('2d');
const padding = 40; 
const escala = (canvas.width - 2 * padding) / 10; 

//  CONFIGURAÇÃO DOS EVENT LISTENERS 
document.getElementById('btn-add-no').addEventListener('click', adicionarNo);
document.getElementById('btn-add-barra').addEventListener('click', adicionarBarra);
document.getElementById('btn-add-apoio').addEventListener('click', adicionarApoio);
document.getElementById('btn-add-forca').addEventListener('click', adicionarForca);
document.getElementById('btn-calcular-esforcos').addEventListener('click', calcularEsforcos);
document.getElementById('btn-limpar-tudo').addEventListener('click', limparTudo);
document.getElementById('btn-fechar-alerta').addEventListener('click', fecharAlerta);

// FUNÇÃO DE ALERTA 
function mostrarAlerta(titulo, mensagem) {
    document.getElementById('alerta-titulo').textContent = titulo;
    document.getElementById('alerta-mensagem').textContent = mensagem;
    document.getElementById('modal-alerta').style.display = 'flex';
}

function fecharAlerta() {
    document.getElementById('modal-alerta').style.display = 'none';
}

// NÓS 
function adicionarNo() {
    const idInput = document.getElementById('node-id');
    const xInput = document.getElementById('node-x');
    const yInput = document.getElementById('node-y');

    const id = idInput.value.toUpperCase().trim();
    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);

    if (!id || isNaN(x) || isNaN(y)) return mostrarAlerta("Atenção", "Preencha ID (ex: A), X e Y corretamente.");
    if (x < 0 || x > 10 || y < 0 || y > 10) return mostrarAlerta("Atenção", "As coordenadas devem estar entre 0.0 e 10.0 metros.");
    if (nos[id]) return mostrarAlerta("Atenção", "Um nó com esse ID já existe.");
    
    const coordExiste = Object.values(nos).some(n => n.x === x && n.y === y);
    if (coordExiste) return mostrarAlerta("Atenção", `Já existe um nó nessas exatas coordenadas (${x}, ${y}).`);

    nos[id] = { x: x, y: y };
    atualizarListaNos();
    desenharEstrutura();

    idInput.value = ''; xInput.value = ''; yInput.value = ''; idInput.focus();
}

function atualizarListaNos() {
    const ul = document.getElementById('ul-nos');
    ul.innerHTML = ''; 
    Object.keys(nos).forEach(id => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = `Nó ${id}: (${nos[id].x.toFixed(1)}, ${nos[id].y.toFixed(1)}) m`;
        
        const btn = document.createElement('button');
        btn.textContent = 'x'; 
        btn.classList.add('btn-remover-item');
        btn.onclick = () => removerNo(id);
        
        li.appendChild(span); li.appendChild(btn); ul.appendChild(li);
    });
}

function removerNo(idParaRemover) {
    delete nos[idParaRemover];
    barras = barras.filter(b => b[0] !== idParaRemover && b[1] !== idParaRemover);
    delete apoios[idParaRemover]; 
    forcas = forcas.filter(f => f.node !== idParaRemover); 
    resultadosBarras = []; resultadosReacoes = []; 
    atualizarListaNos(); atualizarListaBarras(); atualizarListaApoios(); atualizarListaForcas();
    desenharEstrutura();
}

//  BARRAS 
function linhasSeCruzam(p1, p2, p3, p4) {
    const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

function adicionarBarra() {
    const startInput = document.getElementById('bar-start');
    const endInput = document.getElementById('bar-end');
    const n1 = startInput.value.toUpperCase().trim();
    const n2 = endInput.value.toUpperCase().trim();

    if (!nos[n1] || !nos[n2] || n1 === n2) return mostrarAlerta("Atenção", "Verifique se ambos os nós existem e são diferentes.");
    
    const existe = barras.some(b => (b[0] === n1 && b[1] === n2) || (b[0] === n2 && b[1] === n1));
    if (existe) return mostrarAlerta("Atenção", "Esta barra já foi adicionada.");

    const p1 = nos[n1]; const p2 = nos[n2];
    for (let i = 0; i < barras.length; i++) {
        const n3 = barras[i][0]; const n4 = barras[i][1];
        if (n1 === n3 || n1 === n4 || n2 === n3 || n2 === n4) continue; 
        const p3 = nos[n3]; const p4 = nos[n4];
        if (linhasSeCruzam(p1, p2, p3, p4)) {
            return mostrarAlerta("Erro de Estrutura", `A nova barra ${n1}-${n2} cruza a barra existente ${n3}-${n4} sem ter um nó no meio! O método dos nós não permite isso.`);
        }
    }

    barras.push([n1, n2]);
    resultadosBarras = []; 
    atualizarListaBarras(); desenharEstrutura();
    startInput.value = ''; endInput.value = ''; startInput.focus();
}

function atualizarListaBarras() {
    const ul = document.getElementById('ul-barras');
    ul.innerHTML = '';
    barras.forEach((b, i) => {
        const dx = nos[b[1]].x - nos[b[0]].x; const dy = nos[b[1]].y - nos[b[0]].y;
        const comp = Math.sqrt(dx*dx + dy*dy);
        const li = document.createElement('li');
        const span = document.createElement('span'); span.textContent = `Barra ${b[0]}-${b[1]}: L = ${comp.toFixed(2)} m`;
        
        const btn = document.createElement('button'); 
        btn.textContent = 'x'; 
        btn.classList.add('btn-remover-item');
        btn.onclick = () => removerBarra(i);
        
        li.appendChild(span); li.appendChild(btn); ul.appendChild(li);
    });
}

function removerBarra(i) {
    barras.splice(i, 1); resultadosBarras = []; atualizarListaBarras(); desenharEstrutura();
}

// APOIOS 
function adicionarApoio() {
    const nodeInput = document.getElementById('apoio-node'); const tipoInput = document.getElementById('apoio-tipo');
    const id = nodeInput.value.toUpperCase().trim(); const tipo = tipoInput.value;

    if (!id) return mostrarAlerta("Atenção", "Informe a letra do nó.");
    if (!nos[id]) return mostrarAlerta("Atenção", `O nó "${id}" não existe!`);
    if (apoios[id]) return mostrarAlerta("Atenção", `Já existe apoio no nó "${id}".`);

    apoios[id] = tipo; resultadosReacoes = []; atualizarListaApoios(); desenharEstrutura();
    nodeInput.value = ''; nodeInput.focus();
}

function atualizarListaApoios() {
    const ul = document.getElementById('ul-apoios');
    ul.innerHTML = '';
    Object.keys(apoios).forEach(id => {
        const li = document.createElement('li');
        const span = document.createElement('span'); span.textContent = `Nó ${id}: ${apoios[id] === 'pino' ? 'Pino (Fixo)' : 'Rolete (Móvel)'}`;
        
        const btn = document.createElement('button'); 
        btn.textContent = 'x'; 
        btn.classList.add('btn-remover-item');
        btn.onclick = () => removerApoio(id);
        
        li.appendChild(span); li.appendChild(btn); ul.appendChild(li);
    });
}

function removerApoio(id) {
    delete apoios[id]; resultadosReacoes = []; atualizarListaApoios(); desenharEstrutura();
}

//  FORÇAS 
function adicionarForca() {
    const nodeInput = document.getElementById('forca-node'); const modInput = document.getElementById('forca-mod');
    const angInput = document.getElementById('forca-ang'); const sentidoInput = document.getElementById('forca-sentido');
    const id = nodeInput.value.toUpperCase().trim(); const mod = parseFloat(modInput.value);
    const ang = parseFloat(angInput.value); const sentido = sentidoInput.value;

    if (!id || isNaN(mod) || isNaN(ang)) return mostrarAlerta("Atenção", "Preencha todos os campos da força.");
    if (mod <= 0) return mostrarAlerta("Atenção", "O valor da força deve ser maior que zero.");
    if (ang < -180 || ang > 180) return mostrarAlerta("Atenção", "O ângulo deve estar entre -180° e 180°.");
    if (!nos[id]) return mostrarAlerta("Atenção", `O nó "${id}" não existe!`);

const rad = ang * Math.PI / 180;
    const sinal = sentido === 'entrando' ? -1 : 1; 
    
    const fx = sinal * mod * Math.cos(rad); 
    const fy = sinal * mod * Math.sin(rad);

    forcas.push({ node: id, mod: mod, ang: ang, sentido: sentido, fx: fx, fy: fy });
    resultadosBarras = []; resultadosReacoes = []; atualizarListaForcas(); desenharEstrutura();
    nodeInput.value = ''; modInput.value = ''; angInput.value = ''; nodeInput.focus();
}

function atualizarListaForcas() {
    const ul = document.getElementById('ul-forcas');
    ul.innerHTML = '';
    forcas.forEach((f, i) => {
        const li = document.createElement('li');
        const span = document.createElement('span'); span.textContent = `Nó ${f.node}: ${f.mod} kN a ${f.ang}° (${f.sentido === 'saindo' ? 'Puxando' : 'Empurrando'})`;
        
        const btn = document.createElement('button'); 
        btn.textContent = 'x'; 
        btn.classList.add('btn-remover-item');
        btn.onclick = () => removerForca(i);
        
        li.appendChild(span); li.appendChild(btn); ul.appendChild(li);
    });
}

function removerForca(i) {
    forcas.splice(i, 1); resultadosBarras = []; resultadosReacoes = []; atualizarListaForcas(); desenharEstrutura();
}

function limparTudo() {
    nos = {}; barras = []; apoios = {}; forcas = []; resultadosBarras = []; resultadosReacoes = [];
    atualizarListaNos(); atualizarListaBarras(); atualizarListaApoios(); atualizarListaForcas(); desenharEstrutura();
}

// MODELO MATEMÁTICO 
function resolverMatriz(A, b) {
    let n = A.length; let M = [];
    for (let i = 0; i < n; i++) M.push([...A[i], b[i]]);
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) { if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k; }
        let temp = M[i]; M[i] = M[maxRow]; M[maxRow] = temp;
        if (Math.abs(M[i][i]) < 1e-9) return null; 
        let pivot = M[i][i];
        for (let j = i; j <= n; j++) M[i][j] /= pivot;
        for (let k = 0; k < n; k++) {
            if (k !== i) { let factor = M[k][i]; for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j]; }
        }
    }
    return M.map(row => row[n]);
}

function calcularEsforcos() {
    const idsNos = Object.keys(nos);
    const numNos = idsNos.length;
    const numEqs = numNos * 2; 

    let numReacoes = 0;
    let variaveisReacao = []; 

    Object.keys(apoios).forEach(id => {
        if (apoios[id] === 'pino') {
            numReacoes += 2; variaveisReacao.push({ node: id, dir: 'x' }); variaveisReacao.push({ node: id, dir: 'y' });
        } else if (apoios[id] === 'rolete') {
            numReacoes += 1; variaveisReacao.push({ node: id, dir: 'y' }); 
        }
    });

    const numBarras = barras.length;
    const numIncognitas = numBarras + numReacoes;

    if (numEqs !== numIncognitas) {
        return mostrarAlerta("Erro de Isostaticidade", `A treliça não é isostática! Temos ${numEqs} equações para ${numIncognitas} incógnitas. Faltam ou sobram barras/apoios.`);
    }

    let A = Array(numEqs).fill(0).map(() => Array(numIncognitas).fill(0));
    let b = Array(numEqs).fill(0);

    barras.forEach((barra, indexBarra) => {
        const id1 = barra[0]; const id2 = barra[1];
        const idxNo1 = idsNos.indexOf(id1); const idxNo2 = idsNos.indexOf(id2);
        const dx = nos[id2].x - nos[id1].x; const dy = nos[id2].y - nos[id1].y;
        const L = Math.sqrt(dx*dx + dy*dy);
        const cos = dx / L; const sin = dy / L;

        A[idxNo1 * 2][indexBarra] = cos;     A[idxNo1 * 2 + 1][indexBarra] = sin; 
        A[idxNo2 * 2][indexBarra] = -cos;    A[idxNo2 * 2 + 1][indexBarra] = -sin; 
    });

    variaveisReacao.forEach((reacao, i) => {
        const idxIncognita = numBarras + i;
        const idxNo = idsNos.indexOf(reacao.node);
        if (reacao.dir === 'x') A[idxNo * 2][idxIncognita] = 1;
        else if (reacao.dir === 'y') A[idxNo * 2 + 1][idxIncognita] = 1;
    });

    forcas.forEach(f => {
        const idxNo = idsNos.indexOf(f.node);
        b[idxNo * 2] -= f.fx;     
        b[idxNo * 2 + 1] -= f.fy; 
    });

    const res = resolverMatriz(A, b);

    if (!res) {
        return mostrarAlerta("Estrutura Instável", "O sistema não possui solução (divisão por zero). A treliça é instável e vai desmoronar!");
    }

    resultadosBarras = [];
    for (let i = 0; i < numBarras; i++) {
        let valor = res[i];
        let tipo = "Zero";
        if (Math.abs(valor) > 1e-4) { tipo = valor > 0 ? "Tração" : "Compressão"; } else { valor = 0; }
        resultadosBarras.push({ n1: barras[i][0], n2: barras[i][1], valor: Math.abs(valor), tipo: tipo });
    }

    resultadosReacoes = [];
    for (let i = 0; i < variaveisReacao.length; i++) {
        resultadosReacoes.push({ node: variaveisReacao[i].node, dir: variaveisReacao[i].dir, valor: res[numBarras + i] });
    }

    desenharEstrutura(); 

    const lousa = document.getElementById('lousa-resultados');
    const lousaTexto = document.getElementById('lousa-texto');
    
    let htmlRelatorio = `<p><strong>>> REAÇÕES DE APOIO:</strong></p>`;
    resultadosReacoes.forEach(r => {
        let direcao = r.dir === 'x' ? 'Horizontal (Fx)' : 'Vertical (Fy)';
        let valorArredondado = Math.abs(r.valor) < 0.01 ? "0.00" : r.valor.toFixed(2); 
        htmlRelatorio += `<p>• Nó ${r.node} - ${direcao}: <strong>${valorArredondado} kN</strong></p>`;
    });

    htmlRelatorio += `<br><p><strong>>> ESFORÇOS NAS BARRAS:</strong></p>`;
    resultadosBarras.forEach(b => {
        let classeCores = ''; let sigla = '';
        if (b.tipo === 'Tração') { classeCores = 'destaque-tracao'; sigla = '(T)'; } 
        else if (b.tipo === 'Compressão') { classeCores = 'destaque-compressao'; sigla = '(C)'; } 
        else { classeCores = 'destaque-zero'; sigla = '(Nula)'; }
        htmlRelatorio += `<p class="${classeCores}">• Barra ${b.n1}-${b.n2}: ${b.valor.toFixed(2)} kN ${sigla}</p>`;
    });

    lousaTexto.innerHTML = htmlRelatorio;
    lousa.style.display = 'block'; 
}

// GRÁFICO 2D
const toPx = (xReal, yReal) => { return { x: padding + (xReal * escala), y: canvas.height - padding - (yReal * escala) }; };

function desenharEstrutura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const lousa = document.getElementById('lousa-resultados');
    if (lousa && resultadosBarras.length === 0) lousa.style.display = 'none';

    // Fundo (Grade)
    ctx.strokeStyle = '#eee'; ctx.fillStyle = '#555'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
    const pOrigem = toPx(0, 0);
    ctx.beginPath(); ctx.moveTo(pOrigem.x, pOrigem.y); ctx.lineTo(toPx(10, 0).x, pOrigem.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pOrigem.x, pOrigem.y); ctx.lineTo(pOrigem.x, toPx(0, 10).y); ctx.stroke();

    for (let i = 0; i <= 10; i++) {
        const pX = toPx(i, 0); const pY = toPx(0, i);
        ctx.beginPath(); ctx.moveTo(pX.x, pOrigem.y); ctx.lineTo(pX.x, toPx(i, 10).y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pOrigem.x, pY.y); ctx.lineTo(toPx(10, i).x, pY.y); ctx.stroke();
        if (i > 0) { ctx.fillText(i, pX.x, pOrigem.y + 15); ctx.fillText(i, pOrigem.x - 15, pY.y); } else { ctx.fillText('0', pOrigem.x - 12, pOrigem.y + 12); }
    }

    // Desenho as Barras 
    barras.forEach((barra, index) => {
        if (nos[barra[0]] && nos[barra[1]]) {
            const p1Px = toPx(nos[barra[0]].x, nos[barra[0]].y);
            const p2Px = toPx(nos[barra[1]].x, nos[barra[1]].y);

            ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.setLineDash([]); 
            let cor = '#333'; let textoValor = '';

            if (resultadosBarras.length > 0) {
                const res = resultadosBarras[index];
                if (res.tipo === 'Tração') { cor = '#0d6efd'; } 
                else if (res.tipo === 'Compressão') { cor = '#dc3545'; } 
                else { cor = '#999'; ctx.setLineDash([8, 8]); }
                textoValor = `${res.valor.toFixed(2)} kN`;
            }

            ctx.strokeStyle = cor;
            ctx.beginPath(); ctx.moveTo(p1Px.x, p1Px.y); ctx.lineTo(p2Px.x, p2Px.y); ctx.stroke();

            if (textoValor) {
                ctx.fillStyle = cor; ctx.font = 'bold 12px Arial';
                const midX = (p1Px.x + p2Px.x) / 2; const midY = (p1Px.y + p2Px.y) / 2;
                const txtWidth = ctx.measureText(textoValor).width;
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.fillRect(midX - txtWidth/2 - 2, midY - 18, txtWidth + 4, 14);
                ctx.fillStyle = cor; ctx.fillText(textoValor, midX, midY - 10);
            }
        }
    });
    ctx.setLineDash([]); 

    // Desenho Apoios
    Object.keys(apoios).forEach(id => {
        const px = toPx(nos[id].x, nos[id].y);
        ctx.strokeStyle = '#333'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2;
        if (apoios[id] === 'pino') {
            ctx.beginPath(); ctx.moveTo(px.x, px.y + 6); ctx.lineTo(px.x - 12, px.y + 25); ctx.lineTo(px.x + 12, px.y + 25); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(px.x - 18, px.y + 25); ctx.lineTo(px.x + 18, px.y + 25); ctx.stroke();
        } else if (apoios[id] === 'rolete') {
            ctx.beginPath(); ctx.moveTo(px.x, px.y + 6); ctx.lineTo(px.x - 10, px.y + 20); ctx.lineTo(px.x + 10, px.y + 20); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(px.x - 5, px.y + 24, 4, 0, 2*Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(px.x + 5, px.y + 24, 4, 0, 2*Math.PI); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(px.x - 18, px.y + 28); ctx.lineTo(px.x + 18, px.y + 28); ctx.stroke();
        }
    });

    // Desenho das Forças Externas
    forcas.forEach(f => {
        const px = toPx(nos[f.node].x, nos[f.node].y);
        const rad = f.ang * Math.PI / 180; const canvasAngle = -rad; const arrowLength = 40; const offset = 18; 
        let startX, startY, endX, endY, textX, textY;
        if (f.sentido === 'saindo') {
            startX = px.x + Math.cos(canvasAngle) * offset; startY = px.y + Math.sin(canvasAngle) * offset;
            endX = startX + Math.cos(canvasAngle) * arrowLength; endY = startY + Math.sin(canvasAngle) * arrowLength;
            textX = endX + Math.cos(canvasAngle) * 15; textY = endY + Math.sin(canvasAngle) * 15;
        } else {
            endX = px.x - Math.cos(canvasAngle) * offset; endY = px.y - Math.sin(canvasAngle) * offset;
            startX = endX - Math.cos(canvasAngle) * arrowLength; startY = endY - Math.sin(canvasAngle) * arrowLength;
            textX = startX - Math.cos(canvasAngle) * 15; textY = startY - Math.sin(canvasAngle) * 15;
        }
        ctx.strokeStyle = '#d9534f'; ctx.fillStyle = '#d9534f'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.save(); ctx.translate(endX, endY); ctx.rotate(canvasAngle); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.font = 'bold 11px Arial'; ctx.fillText(`${f.mod} kN`, textX, textY);
    });

    // Desenho Nós
    Object.keys(nos).forEach(id => {
        const noPx = toPx(nos[id].x, nos[id].y);
        ctx.beginPath(); ctx.arc(noPx.x, noPx.y, 6, 0, 2 * Math.PI); ctx.fillStyle = '#d4af37'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#000'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(id, noPx.x + 10, noPx.y - 10);
    });

    // Resultados
    if (resultadosBarras.length > 0) {
        ctx.fillStyle = '#0d6efd'; ctx.fillText("■ Tração (T)", padding, 30);
        ctx.fillStyle = '#dc3545'; ctx.fillText("■ Compressão (C)", padding, 45);
        ctx.fillStyle = '#999';    ctx.fillText("■ Força Zero", padding, 60);
    }
}
desenharEstrutura();