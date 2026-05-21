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

function adicionarCargaP() {
    let L = parseFloat(document.getElementById('viga-L').value) || 4.0;
    
    // Trava para o comprimento máximo da viga ser 10
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

    cargasP.push({ P: P, a: a });

    const ul = document.getElementById('ul-cargas-viga');
    const li = document.createElement('li');
    const seta = P > 0 ? "⬇" : "⬆";
    li.textContent = `Força ${seta} de ${Math.abs(P)} kN em x = ${a.toFixed(2)} m`;
    ul.appendChild(li);

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

    // B. RÉGUA NUMÉRICA GRADUADA (De 0 até L)
    ctx.strokeStyle = '#888';
    ctx.fillStyle = '#555';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;

    // Linha base da régua
    ctx.beginPath();
    ctx.moveTo(paddingH, yViga + 35);
    ctx.lineTo(canvas.width - paddingH, yViga + 35);
    ctx.stroke();

    // Laço para desenhar os metros na régua de 1 em 1 metro
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
    
    // Apoio A (Esquerdo)
    const pxA = toPxX(0);
    ctx.beginPath(); ctx.moveTo(pxA, yViga + 6); ctx.lineTo(pxA - 12, yViga + 22); ctx.lineTo(pxA + 12, yViga + 22); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Apoio B (Direito)
    const pxB = toPxX(L);
    ctx.beginPath(); ctx.moveTo(pxB, yViga + 6); ctx.lineTo(pxB - 12, yViga + 20); ctx.lineTo(pxB + 12, yViga + 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(pxB - 5, yViga + 24, 3, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(pxB + 5, yViga + 24, 3, 0, 2 * Math.PI); ctx.stroke();

    // D. Cargas Concentradas
    ctx.strokeStyle = '#d9534f'; 
    ctx.fillStyle = '#d9534f'; 
    ctx.lineWidth = 2.5;
    const arrowHeight = 35;

    cargasP.forEach(carga => {
        const cxPx = toPxX(carga.a);
        const setaParaBaixo = carga.P > 0;
        
        const yStart = setaParaBaixo ? yViga - 6 - arrowHeight : yViga + 6 + arrowHeight;
        const yEnd = setaParaBaixo ? yViga - 9 : yViga + 9;

        ctx.beginPath(); ctx.moveTo(cxPx, yStart); ctx.lineTo(cxPx, yEnd); ctx.stroke();

        ctx.beginPath();
        if (setaParaBaixo) {
            ctx.moveTo(cxPx, yEnd); ctx.lineTo(cxPx - 5, yEnd - 8); ctx.lineTo(cxPx + 5, yEnd - 8);
        } else {
            ctx.moveTo(cxPx, yEnd); ctx.lineTo(cxPx - 5, yEnd + 8); ctx.lineTo(cxPx + 5, yEnd + 8);
        }
        ctx.closePath(); ctx.fill();

        ctx.font = 'bold 11px Tahoma';
        const txtOffsetY = setaParaBaixo ? yStart - 6 : yStart + 14;
        ctx.fillText(`${Math.abs(carga.P)} kN`, cxPx, txtOffsetY);
    });
}

window.onload = function() {
    desenharViga();
};