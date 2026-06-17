let cargasP = []; // Cargas Concentradas
let cargasQ = []; // Cargas Distribuídas
let propSessao = null; 

const canvas = document.getElementById('canvasViga');
const ctx = canvas.getContext('2d');
const paddingH = 50; 
const paddingV = 60; 

// CONFIGURAÇÃO DOS EVENT LISTENERS 
document.getElementById('viga-L').addEventListener('input', desenharViga);
document.getElementById('btn-calc-geometria').addEventListener('click', calcularGeometria);
document.getElementById('btn-add-pontual').addEventListener('click', adicionarCargaP);
document.getElementById('btn-add-distribuida').addEventListener('click', adicionarCargaQ);
document.getElementById('btn-calc-esforcos').addEventListener('click', executarCalculoCompleto);
document.getElementById('btn-limpar-viga').addEventListener('click', limparViga);


// FUNÇÕES DE LÓGICA E INTERFACE 
function calcularGeometria() {
    const b = parseFloat(document.getElementById('sect-b').value);
    const h = parseFloat(document.getElementById('sect-h').value);

    if (isNaN(b) || isNaN(h) || b <= 0 || h <= 0) {
        alert("Por favor, introduza valores válidos para base e altura.");
        return;
    }

    const I = (b * Math.pow(h, 3)) / 12;
    const c = h / 2;
    propSessao = { b: b, h: h, I: I, c: c };

    const resultDiv = document.getElementById('result-geometria');
    resultDiv.innerHTML = `
        <div class="result-box">
            <strong>Propriedades da Seção:</strong><br>
            • Inércia (I<sub>z</sub>): <strong>${I.toExponential(2)} mm<sup>4</sup></strong><br>
            • Linha Neutra (c): <strong>${c.toFixed(1)} mm</strong>
        </div>
    `;
}

function atualizarListaCargasUI() {
    const ul = document.getElementById('ul-cargas-viga');
    ul.innerHTML = ''; 

    // Renderiza Concentradas
    cargasP.forEach((carga, index) => {
        const li = document.createElement('li');
        const seta = carga.P > 0 ? "⬇" : "⬆";
        const span = document.createElement('span');
        span.innerHTML = `<span class="tag-pontual">[Pontual]</span> Força ${seta} ${Math.abs(carga.P).toFixed(2)} kN em x = ${carga.a.toFixed(2)} m`;
        
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'x'; 
        btnRemover.classList.add('btn-remover-item');
        btnRemover.onclick = () => removerCargaP(index);

        li.appendChild(span); li.appendChild(btnRemover); ul.appendChild(li);
    });

    // Renderiza Distribuídas
    cargasQ.forEach((carga, index) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.innerHTML = `<span class="tag-distribuida">[Distribuída]</span> ${carga.q.toFixed(2)} kN/m de x = ${carga.start.toFixed(2)} m até ${carga.end.toFixed(2)} m`;
        
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'x'; 
        btnRemover.classList.add('btn-remover-item');
        btnRemover.onclick = () => removerCargaQ(index);

        li.appendChild(span); li.appendChild(btnRemover); ul.appendChild(li);
    });
}

function removerCargaP(index) {
    cargasP.splice(index, 1);
    atualizarListaCargasUI(); desenharViga();
}

function removerCargaQ(index) {
    cargasQ.splice(index, 1);
    atualizarListaCargasUI(); desenharViga();
}

function adicionarCargaP() {
    let L = parseFloat(document.getElementById('viga-L').value) || 4.0;
    const P = parseFloat(document.getElementById('load-P').value);
    const a = parseFloat(document.getElementById('load-a').value);

    if (isNaN(P) || isNaN(a) || P === 0) return alert("Introduza a magnitude da força (kN) e a posição (m).");
    if (a < 0 || a > L) return alert(`A posição da carga (${a}m) não pode exceder o comprimento da viga (${L}m).`);

    const cargaExistente = cargasP.find(carga => Math.abs(carga.a - a) < 1e-4);
    if (cargaExistente) {
        cargaExistente.P += P;
        if (Math.abs(cargaExistente.P) < 1e-4) cargasP = cargasP.filter(carga => carga !== cargaExistente);
    } else {
        cargasP.push({ P: P, a: a });
    }

    document.getElementById('load-P').value = ''; document.getElementById('load-a').value = '';
    atualizarListaCargasUI(); desenharViga();
}

function adicionarCargaQ() {
    let L = parseFloat(document.getElementById('viga-L').value) || 4.0;
    const q = parseFloat(document.getElementById('load-q').value);
    const start = parseFloat(document.getElementById('load-q-start').value);
    const end = parseFloat(document.getElementById('load-q-end').value);

    if (isNaN(q) || isNaN(start) || isNaN(end) || q === 0) return alert("Preencha todos os campos da carga distribuída corretamente.");
    if (start < 0 || end > L || start >= end) return alert(`O trecho deve ser válido (início < fim) e estar contido na viga (0 a ${L}m).`);

    cargasQ.push({ q: q, start: start, end: end });

    document.getElementById('load-q').value = ''; document.getElementById('load-q-start').value = ''; document.getElementById('load-q-end').value = '';
    atualizarListaCargasUI(); desenharViga();
}

function limparViga() {
    cargasP = []; cargasQ = [];
    atualizarListaCargasUI();
    document.getElementById('result-calculo-final').innerHTML = '';
    desenharViga();
}

//  FÍSICA E MATEMÁTICA 
function executarCalculoCompleto() {
    const L = parseFloat(document.getElementById('viga-L').value);
    
    if (L > 10) return alert("O comprimento da viga não pode ser maior que 10m.");
    if (!propSessao) return alert("Defina as dimensões da Seção Transversal no Passo 2!");
    if (cargasP.length === 0 && cargasQ.length === 0) return alert("Adicione pelo menos uma carga na viga.");

    let somaMomentosA = 0;
    let somaForcas = 0;

    // Equilibrio Estático: Cargas Pontuais
    cargasP.forEach(carga => {
        somaMomentosA += carga.P * carga.a;
        somaForcas += carga.P;
    });

    // Equilibrio Estático: Cargas Distribuídas
    cargasQ.forEach(carga => {
        const Q = carga.q * (carga.end - carga.start); 
        const x_cg = (carga.start + carga.end) / 2;    
        somaMomentosA += Q * x_cg;
        somaForcas += Q;
    });

    const RB = somaMomentosA / L;
    const RA = somaForcas - RB;

    // Escaneamento do Momento Fletor
    let Mmax = 0;
    const numPassos = L * 100; 
    
    for (let i = 0; i <= numPassos; i++) {
        let x = i / 100;
        let M_local = RA * x; 
        
        cargasP.forEach(carga => {
            if (carga.a < x) { M_local -= carga.P * (x - carga.a); }
        });

        cargasQ.forEach(carga => {
            if (x > carga.start) {
                const fimReal = Math.min(x, carga.end);
                const comprimentoAtivo = fimReal - carga.start;
                const forcaAtiva = carga.q * comprimentoAtivo;
                const bracoAlavanca = x - (carga.start + comprimentoAtivo / 2);
                M_local -= forcaAtiva * bracoAlavanca;
            }
        });

        if (Math.abs(M_local) > Math.abs(Mmax)) Mmax = M_local;
    }

    const M_Nmm = Math.abs(Mmax) * 1e6;
    const sigma = (M_Nmm * propSessao.c) / propSessao.I;

    const finalDiv = document.getElementById('result-calculo-final');
    finalDiv.innerHTML = `
        <div class="result-box-final">
            <strong>Resultados da Análise Estática:</strong><br>
            • R<sub>A</sub>: <strong>${RA.toFixed(2)} kN</strong> | R<sub>B</sub>: <strong>${RB.toFixed(2)} kN</strong><br>
            • M<sub>max</sub> absoluto na viga: <strong>${Math.abs(Mmax).toFixed(2)} kN·m</strong><br>
            • Tensão Máxima (<span style="font-family:serif;">σ</span><sub>max</sub>): <strong class="texto-tensao">${sigma.toFixed(2)} MPa</strong>
        </div>
    `;
}

// GRÁFICO 2D 
function desenharViga() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let L = parseFloat(document.getElementById('viga-L').value);
    if (isNaN(L) || L <= 0) return;
    if (L > 10) { 
        L = 10; 
        document.getElementById('viga-L').value = 10; 
        alert("O tamanho da viga foi ajustado para o limite máximo visual de 10 metros.");
    }

    const vigaWidthPx = canvas.width - 2 * paddingH;
    const scaleX = vigaWidthPx / L;
    const yViga = canvas.height / 2 - 10; 

    const toPxX = (xReal) => paddingH + xReal * scaleX;

    // Corpo da Viga
    ctx.fillStyle = '#111'; 
    ctx.fillRect(paddingH, yViga - 6, vigaWidthPx, 12);

    // Régua Numérica
    ctx.strokeStyle = '#888'; ctx.fillStyle = '#555'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(paddingH, yViga + 35); ctx.lineTo(canvas.width - paddingH, yViga + 35); ctx.stroke();

    for (let i = 0; i <= L; i++) {
        const marcaPx = toPxX(i);
        ctx.beginPath(); ctx.moveTo(marcaPx, yViga + 31); ctx.lineTo(marcaPx, yViga + 39); ctx.stroke();
        ctx.fillText(`${i}m`, marcaPx, yViga + 52);
    }

    // Apoios
    ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2;
    const pxA = toPxX(0);
    ctx.beginPath(); ctx.moveTo(pxA, yViga + 6); ctx.lineTo(pxA - 12, yViga + 22); ctx.lineTo(pxA + 12, yViga + 22); ctx.closePath(); ctx.fill(); ctx.stroke();

    const pxB = toPxX(L);
    ctx.beginPath(); ctx.moveTo(pxB, yViga + 6); ctx.lineTo(pxB - 12, yViga + 20); ctx.lineTo(pxB + 12, yViga + 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(pxB - 5, yViga + 24, 3, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(pxB + 5, yViga + 24, 3, 0, 2 * Math.PI); ctx.stroke();

    // Cargas Distribuídas
    ctx.fillStyle = 'rgba(13, 110, 253, 0.2)'; 
    ctx.strokeStyle = '#0d6efd';
    ctx.lineWidth = 1.5;

    cargasQ.forEach(carga => {
        const pxStart = toPxX(carga.start);
        const pxEnd = toPxX(carga.end);
        const widthPx = pxEnd - pxStart;
        const rectHeight = 30; 
        const yTop = yViga - 6 - rectHeight;

        ctx.fillRect(pxStart, yTop, widthPx, rectHeight);
        ctx.strokeRect(pxStart, yTop, widthPx, rectHeight);

        const step = 15; 
        ctx.beginPath();
        for (let xp = pxStart + step/2; xp < pxEnd; xp += step) {
            ctx.moveTo(xp, yTop); ctx.lineTo(xp, yViga - 8);
            ctx.moveTo(xp, yViga - 8); ctx.lineTo(xp - 3, yViga - 12);
            ctx.moveTo(xp, yViga - 8); ctx.lineTo(xp + 3, yViga - 12);
        }
        ctx.stroke();

        const texto = `${carga.q.toFixed(2)} kN/m`;
        ctx.font = 'bold 11px Tahoma';
        const txtWidth = ctx.measureText(texto).width;
        const txtX = pxStart + widthPx / 2;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(txtX - txtWidth/2 - 4, yTop - 18, txtWidth + 8, 14);
        ctx.strokeRect(txtX - txtWidth/2 - 4, yTop - 18, txtWidth + 8, 14);
        ctx.fillStyle = '#0d6efd';
        ctx.fillText(texto, txtX, yTop - 11);
        ctx.fillStyle = 'rgba(13, 110, 253, 0.2)'; 
    });

    // Cargas Concentradas
    const baseArrowHeight = 35; const stepHeight = 20; const alturasOcupadas = []; 
    const cargasCalculadas = cargasP.map(carga => {
        const cxPx = toPxX(carga.a);
        const setaParaBaixo = carga.P > 0;
        const direcao = setaParaBaixo ? 'baixo' : 'cima';
        let currentArrowHeight = baseArrowHeight;
        let conflito = true;

        while (conflito) {
            conflito = false;
            for (let outra of alturasOcupadas) {
                if (outra.direcao === direcao && Math.abs(outra.cxPx - cxPx) < 45 && outra.height === currentArrowHeight) {
                    currentArrowHeight += stepHeight; conflito = true; break;
                }
            }
        }
        alturasOcupadas.push({ cxPx: cxPx, direcao: direcao, height: currentArrowHeight });
        const yStart = setaParaBaixo ? yViga - 6 - currentArrowHeight : yViga + 6 + currentArrowHeight;
        const yEnd = setaParaBaixo ? yViga - 9 : yViga + 9;
        return { carga, cxPx, setaParaBaixo, yStart, yEnd };
    });

    ctx.strokeStyle = '#d9534f'; ctx.fillStyle = '#d9534f'; ctx.lineWidth = 2.5;
    cargasCalculadas.forEach(item => {
        ctx.beginPath(); ctx.moveTo(item.cxPx, item.yStart); ctx.lineTo(item.cxPx, item.yEnd); ctx.stroke();
        ctx.beginPath();
        if (item.setaParaBaixo) { ctx.moveTo(item.cxPx, item.yEnd); ctx.lineTo(item.cxPx - 5, item.yEnd - 8); ctx.lineTo(item.cxPx + 5, item.yEnd - 8); } 
        else { ctx.moveTo(item.cxPx, item.yEnd); ctx.lineTo(item.cxPx - 5, item.yEnd + 8); ctx.lineTo(item.cxPx + 5, item.yEnd + 8); }
        ctx.closePath(); ctx.fill();
    });

    cargasCalculadas.forEach(item => {
        ctx.font = 'bold 11px Tahoma'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const texto = `${Math.abs(item.carga.P).toFixed(2)} kN`;
        const txtWidth = ctx.measureText(texto).width;
        const txtOffsetY = item.setaParaBaixo ? item.yStart - 10 : item.yStart + 10;
        const padW = 8; const padH = 14;
        const bx = item.cxPx - (txtWidth + padW) / 2; const by = txtOffsetY - padH / 2;

        ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, txtWidth + padW, padH);
        ctx.strokeStyle = '#d9534f'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, txtWidth + padW, padH);
        ctx.fillStyle = '#d9534f'; ctx.fillText(texto, item.cxPx, txtOffsetY);
    });
}

window.onload = function() {
    desenharViga();
};