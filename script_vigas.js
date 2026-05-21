let cargasP = []; 
let propSessao = null; 

const canvas = document.getElementById('canvasViga');
const ctx = canvas.getContext('2d');
const paddingH = 50; 
const paddingV = 60; 

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
        <div class="result-box" style="margin-top: 1rem; padding: 1rem; background-color: #f4f4f2; border-left: 4px solid #a19d85;">
            <strong>Propriedades da Seção:</strong><br>
            • Inércia (I<sub>z</sub>): <strong>${I.toExponential(2)} mm<sup>4</sup></strong><br>
            • Linha Neutra (c): <strong>${c.toFixed(1)} mm</strong>
        </div>
    `;
}

// Função auxiliar para reconstruir a lista de cargas na interface (HTML)
function atualizarListaCargasUI() {
    const ul = document.getElementById('ul-cargas-viga');
    ul.innerHTML = ''; 

    cargasP.forEach(carga => {
        const li = document.createElement('li');
        const seta = carga.P > 0 ? "⬇" : "⬆";
        li.textContent = `Força ${seta} de ${Math.abs(carga.P).toFixed(2)} kN em x = ${carga.a.toFixed(2)} m`;
        ul.appendChild(li);
    });
}

function adicionarCargaP() {
    let L = parseFloat(document.getElementById('viga-L').value) || 4.0;
    
    if (L > 10) {
        alert("O comprimento máximo permitido para a viga é 10m.");
        document.getElementById('viga-L').value = 10;
        L = 10;
    }

    const P = parseFloat(document.getElementById('load-P').value);
    const a = parseFloat(document.getElementById('load-a').value);

    if (isNaN(P) || isNaN(a) || P === 0) {
        alert("Introduza a magnitude da força (kN) e a posição (m).");
        return;
    }

    if (a < 0 || a > L) {
        alert(`A posição da carga (${a}m) não pode exceder o comprimento da viga (${L}m).`);
        return;
    }

    // Lógica de soma/subtração exata no mesmo ponto x
    const cargaExistente = cargasP.find(carga => Math.abs(carga.a - a) < 1e-4);

    if (cargaExistente) {
        cargaExistente.P += P;

        if (Math.abs(cargaExistente.P) < 1e-4) {
            cargasP = cargasP.filter(carga => carga !== cargaExistente);
            alert(`As forças em x = ${a.toFixed(2)}m se anularam e foram removidas.`);
        } else {
            alert(`Carga updated em x = ${a.toFixed(2)}m. Nova magnitude: ${Math.abs(cargaExistente.P).toFixed(2)} kN`);
        }
    } else {
        cargasP.push({ P: P, a: a });
    }

    atualizarListaCargasUI();
    desenharViga();
}

function limparViga() {
    cargasP = [];
    document.getElementById('ul-cargas-viga').innerHTML = '';
    document.getElementById('result-calculo-final').innerHTML = '';
    desenharViga();
}

function executarCalculoCompleto() {
    const L = parseFloat(document.getElementById('viga-L').value);
    
    if (L > 10) {
        alert("O comprimento da viga não pode ser maior que 10m.");
        return;
    }
    if (!propSessao) {
        alert("Defina as dimensões da Seção Transversal no Passo 2!");
        return;
    }
    if (cargasP.length === 0) {
        alert("Adicione pelo menos uma carga concentrada.");
        return;
    }

    let somaMomentosA = 0;
    let somaForcas = 0;
    cargasP.forEach(carga => {
        somaMomentosA += carga.P * carga.a;
        somaForcas += carga.P;
    });

    const RB = somaMomentosA / L;
    const RA = somaForcas - RB;

    let Mmax = 0;
    cargasP.forEach(carga => {
        const M_local = RA * carga.a;
        if (Math.abs(M_local) > Math.abs(Mmax)) Mmax = M_local;
    });

    const M_Nmm = Math.abs(Mmax) * 1e6;
    const sigma = (M_Nmm * propSessao.c) / propSessao.I;

    const finalDiv = document.getElementById('result-calculo-final');
    finalDiv.innerHTML = `
        <div class="result-box" style="background-color: #eef2f7; border-left: 4px solid #000; margin-top:1rem; padding:1rem;">
            <strong>Resultados da Análise Estática:</strong><br>
            • R<sub>A</sub>: <strong>${RA.toFixed(2)} kN</strong> | R<sub>B</sub>: <strong>${RB.toFixed(2)} kN</strong><br>
            • M<sub>max</sub>: <strong>${Math.abs(Mmax).toFixed(2)} kN·m</strong><br>
            • Tensão Máxima (<span style="font-family:serif;">σ</span><sub>max</sub>): <strong style="color: #b22222;">${sigma.toFixed(2)} MPa</strong>
        </div>
    `;
}

function desenharViga() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let L = parseFloat(document.getElementById('viga-L').value);
    if (isNaN(L) || L <= 0) return;
    
    if (L > 10) {
        L = 10;
        document.getElementById('viga-L').value = 10;
    }

    const vigaWidthPx = canvas.width - 2 * paddingH;
    const scaleX = vigaWidthPx / L;
    const yViga = canvas.height / 2 - 10; 

    const toPxX = (xReal) => paddingH + xReal * scaleX;

    // A. Corpo da Viga
    ctx.fillStyle = '#111'; 
    ctx.fillRect(paddingH, yViga - 6, vigaWidthPx, 12);

    // B. RÉGUA NUMÉRICA GRADUADA
    ctx.strokeStyle = '#888';
    ctx.fillStyle = '#555';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(paddingH, yViga + 35);
    ctx.lineTo(canvas.width - paddingH, yViga + 35);
    ctx.stroke();

    for (let i = 0; i <= L; i++) {
        const marcaPx = toPxX(i);
        ctx.beginPath();
        ctx.moveTo(marcaPx, yViga + 31);
        ctx.lineTo(marcaPx, yViga + 39);
        ctx.stroke();
        ctx.fillText(`${i}m`, marcaPx, yViga + 52);
    }

    // C. Apoios
    ctx.strokeStyle = '#000'; 
    ctx.fillStyle = '#fff'; 
    ctx.lineWidth = 2;
    
    const pxA = toPxX(0);
    ctx.beginPath(); ctx.moveTo(pxA, yViga + 6); ctx.lineTo(pxA - 12, yViga + 22); ctx.lineTo(pxA + 12, yViga + 22); ctx.closePath(); ctx.fill(); ctx.stroke();

    const pxB = toPxX(L);
    ctx.beginPath(); ctx.moveTo(pxB, yViga + 6); ctx.lineTo(pxB - 12, yViga + 20); ctx.lineTo(pxB + 12, yViga + 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(pxB - 5, yViga + 24, 3, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(pxB + 5, yViga + 24, 3, 0, 2 * Math.PI); ctx.stroke();

    // D. Cargas Concentradas com Evitação de Sobreposição Estética
    const baseArrowHeight = 35; 
    const stepHeight = 20;      
    const alturasOcupadas = []; 

    // Mapeamento prévio para calcular a geometria de todas as setas antes de desenhar
    const cargasCalculadas = cargasP.map(carga => {
        const cxPx = toPxX(carga.a);
        const setaParaBaixo = carga.P > 0;
        const direcao = setaParaBaixo ? 'baixo' : 'cima';

        let currentArrowHeight = baseArrowHeight;
        let conflito = true;

        while (conflito) {
            conflito = false;
            for (let outra of alturasOcupadas) {
                if (outra.direcao === direcao) {
                    if (Math.abs(outra.cxPx - cxPx) < 45 && outra.height === currentArrowHeight) {
                        currentArrowHeight += stepHeight;
                        conflito = true;
                        break;
                    }
                }
            }
        }

        alturasOcupadas.push({ cxPx: cxPx, direcao: direcao, height: currentArrowHeight });

        const yStart = setaParaBaixo ? yViga - 6 - currentArrowHeight : yViga + 6 + currentArrowHeight;
        const yEnd = setaParaBaixo ? yViga - 9 : yViga + 9;

        return {
            carga,
            cxPx,
            setaParaBaixo,
            yStart,
            yEnd
        };
    });

    // CAMADA 1: Desenhar as estruturas físicas de todas as setas primeiro
    ctx.strokeStyle = '#d9534f'; 
    ctx.fillStyle = '#d9534f'; 
    ctx.lineWidth = 2.5;

    cargasCalculadas.forEach(item => {
        ctx.beginPath(); 
        ctx.moveTo(item.cxPx, item.yStart); 
        ctx.lineTo(item.cxPx, item.yEnd); 
        ctx.stroke();

        ctx.beginPath();
        if (item.setaParaBaixo) {
            ctx.moveTo(item.cxPx, item.yEnd); 
            ctx.lineTo(item.cxPx - 5, item.yEnd - 8); 
            ctx.lineTo(item.cxPx + 5, item.yEnd - 8);
        } else {
            ctx.moveTo(item.cxPx, item.yEnd); 
            ctx.lineTo(item.cxPx - 5, item.yEnd + 8); 
            ctx.lineTo(item.cxPx + 5, item.yEnd + 8);
        }
        ctx.closePath(); 
        ctx.fill();
    });

    // CAMADA 2: Desenhar os balões de texto por cima (garante isolamento total)
    cargasCalculadas.forEach(item => {
        ctx.font = 'bold 11px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const texto = `${Math.abs(item.carga.P).toFixed(2)} kN`;
        const txtWidth = ctx.measureText(texto).width;
        const txtOffsetY = item.setaParaBaixo ? item.yStart - 10 : item.yStart + 10;

        // Configuração geométrica do badge (fundo do texto)
        const padW = 8;
        const padH = 14;
        const bx = item.cxPx - (txtWidth + padW) / 2;
        const by = txtOffsetY - padH / 2;

        // Desenha o fundo branco sólido (recorta as setas que passam por trás)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, by, txtWidth + padW, padH);

        // Desenha a moldura fina do badge
        ctx.strokeStyle = '#d9534f';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, txtWidth + padW, padH);

        // Escreve o texto final no topo absoluto
        ctx.fillStyle = '#d9534f';
        ctx.fillText(texto, item.cxPx, txtOffsetY);
    });
}

window.onload = function() {
    desenharViga();
};
