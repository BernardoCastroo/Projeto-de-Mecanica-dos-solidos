// Banco de dados interno da Viga
let cargasP = []; 
let propSessao = null; 

// Inicialização do Canvas
const canvas = document.getElementById('canvasViga');
const ctx = canvas.getContext('2d');
const paddingH = 50; 
const paddingV = 60; 

// --- 1. Propriedades Geométricas (Capítulo 6 - Hibbeler) ---
function calcularGeometria() {
    const b = parseFloat(document.getElementById('sect-b').value);
    const h = parseFloat(document.getElementById('sect-h').value);

    if (isNaN(b) || isNaN(h) || b <= 0 || h <= 0) {
        alert("Por favor, introduza valores válidos e maiores que zero para a base e altura.");
        return;
    }

    // Momento de Inércia para Retângulo: I = (b * h^3) / 12
    const I = (b * Math.pow(h, 3)) / 12;
    // Distância da Linha Neutra à fibra mais distante: c = h / 2
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

// --- 2. Gerenciamento de Cargas ---
function adicionarCargaP() {
    const P = parseFloat(document.getElementById('load-P').value);
    const a = parseFloat(document.getElementById('load-a').value);
    const L = parseFloat(document.getElementById('viga-L').value) || 4.0;

    if (isNaN(P) || isNaN(a) || P === 0) {
        alert("Introduza a magnitude da força (kN) e a respetiva posição (m).");
        return;
    }

    if (a < 0 || a > L) {
        alert(`A posição da carga (${a}m) não pode exceder o comprimento da viga (${L}m).`);
        return;
    }

    cargasP.push({ P: P, a: a });

    // Atualiza a listagem visual do painel direito
    const ul = document.getElementById('ul-cargas-viga');
    const li = document.createElement('li');
    const seta = P > 0 ? "⬇" : "⬆";
    li.textContent = `Força ${seta} de ${Math.abs(P)} kN posicionada em x = ${a.toFixed(2)} m`;
    ul.appendChild(li);

    desenharViga();
}

function limparViga() {
    cargasP = [];
    document.getElementById('ul-cargas-viga').innerHTML = '';
    document.getElementById('result-calculo-final').innerHTML = '';
    desenharViga();
}

// --- 3. Processamento de Esforços Estáticos ---
function executarCalculoCompleto() {
    const L = parseFloat(document.getElementById('viga-L').value);
    
    if (!propSessao) {
        alert("Primeiro defina as dimensões da Seção Transversal no Passo 2!");
        return;
    }
    if (cargasP.length === 0) {
        alert("Adicione pelo menos uma carga concentrada para realizar a análise.");
        return;
    }

    // Cálculo das Reações de Apoio (Somatório de Momentos em A = 0)
    // R_B * L = Sigma (P_i * a_i)
    let somaMomentosA = 0;
    let somaForcas = 0;

    cargasP.forEach(carga => {
        somaMomentosA += carga.P * carga.a;
        somaForcas += carga.P;
    });

    const RB = somaMomentosA / L;
    const RA = somaForcas - RB;

    // Cálculo simplificado do Momento Máximo (para fins didáticos do portal)
    let Mmax = 0;
    cargasP.forEach(carga => {
        // Momento na posição da carga numa viga biapoiada
        const M_local = RA * carga.a;
        if (Math.abs(M_local) > Math.abs(Mmax)) {
            Mmax = M_local;
        }
    });

    // Tensão Normal Máxima: sigma = (M * c) / I
    // Convertendo Mmax de kN.m para N.mm (multiplica por 10^6)
    const M_Nmm = Math.abs(Mmax) * 1e6;
    const sigma = (M_Nmm * propSessao.c) / propSessao.I; // Resultado em MPa (N/mm²)

    const finalDiv = document.getElementById('result-calculo-final');
    finalDiv.innerHTML = `
        <div class="result-box" style="background-color: #eef2f7; border-left: 4px solid #000; margin-top:1rem; padding:1rem;">
            <strong>Resultados da Análise Estática:</strong><br>
            • Reação Apoio Esquerdo (R<sub>A</sub>): <strong>${RA.toFixed(2)} kN</strong><br>
            • Reação Apoio Direito (R<sub>B</sub>): <strong>${RB.toFixed(2)} kN</strong><br>
            • Momento Fletor Estimado (M<sub>max</sub>): <strong>${Math.abs(Mmax).toFixed(2)} kN·m</strong><br>
            • Tensão Normal Máxima (<span style="font-family:serif;">σ</span><sub>max</sub>): <strong style="color: #b22222;">${sigma.toFixed(2)} MPa</strong>
        </div>
    `;
}

// --- 4. Motor Gráfico 2D (HTML5 Canvas) ---
function desenharViga() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const L = parseFloat(document.getElementById('viga-L').value);
    if (isNaN(L) || L <= 0) return;

    const vigaWidthPx = canvas.width - 2 * paddingH;
    const scaleX = vigaWidthPx / L;
    const yViga = canvas.height / 2 + 10; 

    const toPxX = (xReal) => paddingH + xReal * scaleX;

    // A. Desenho do Corpo Físico da Viga
    ctx.fillStyle = '#111'; 
    ctx.fillRect(paddingH, yViga - 6, vigaWidthPx, 12);

    // B. Linha de Cota e Tamanho da Barra (L)
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Comprimento Total L = ${L.toFixed(1)} m`, canvas.width / 2, yViga + 45);
    
    ctx.strokeStyle = '#888'; 
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(paddingH, yViga + 25); ctx.lineTo(paddingH, yViga + 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(canvas.width - paddingH, yViga + 25); ctx.lineTo(canvas.width - paddingH, yViga + 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(paddingH, yViga + 38); ctx.lineTo(canvas.width - paddingH, yViga + 38); ctx.stroke();

    // C. Desenho dos Vínculos/Apoios Estruturais
    ctx.strokeStyle = '#000'; 
    ctx.fillStyle = '#fff'; 
    ctx.lineWidth = 2;
    
    // Apoio Esquerdo Fixo (Pino em x=0)
    const pxA = toPxX(0);
    ctx.beginPath();
    ctx.moveTo(pxA, yViga + 6);
    ctx.lineTo(pxA - 12, yViga + 22);
    ctx.lineTo(pxA + 12, yViga + 22);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pxA - 15, yViga + 22); ctx.lineTo(pxA + 15, yViga + 22); ctx.stroke();

    // Apoio Direito Móvel (Rolete em x=L)
    const pxB = toPxX(L);
    ctx.beginPath();
    ctx.moveTo(pxB, yViga + 6);
    ctx.lineTo(pxB - 12, yViga + 20);
    ctx.lineTo(pxB + 12, yViga + 20);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(pxB - 6, yViga + 24, 3, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(pxB + 6, yViga + 24, 3, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pxB - 15, yViga + 27); ctx.lineTo(pxB + 15, yViga + 27); ctx.stroke();

    // D. Renderização de Vetores de Força (Cargas Ativas)
    ctx.strokeStyle = '#d9534f'; 
    ctx.fillStyle = '#d9534f'; 
    ctx.lineWidth = 2.5;
    const arrowHeight = 45;

    cargasP.forEach(carga => {
        const cxPx = toPxX(carga.a);
        const setaParaBaixo = carga.P > 0;
        
        const yStart = setaParaBaixo ? yViga - 6 - arrowHeight : yViga + 6 + arrowHeight;
        const yEnd = setaParaBaixo ? yViga - 9 : yViga + 9;

        // Corpo da seta indicadora
        ctx.beginPath();
        ctx.moveTo(cxPx, yStart);
        ctx.lineTo(cxPx, yEnd);
        ctx.stroke();

        // Ponta do vetor (triângulo)
        ctx.beginPath();
        if (setaParaBaixo) {
            ctx.moveTo(cxPx, yEnd); 
            ctx.lineTo(cxPx - 5, yEnd - 10); 
            ctx.lineTo(cxPx + 5, yEnd - 10);
        } else {
            ctx.moveTo(cxPx, yEnd); 
            ctx.lineTo(cxPx - 5, yEnd + 10); 
            ctx.lineTo(cxPx + 5, yEnd + 10);
        }
        ctx.closePath(); 
        ctx.fill();

        // Rótulos informativos de intensidade e posição da carga
        ctx.fillStyle = '#d9534f';
        ctx.font = 'bold 11px Tahoma';
        ctx.textAlign = 'center';
        const txtOffsetY = setaParaBaixo ? yStart - 6 : yStart + 14;
        ctx.fillText(`${Math.abs(carga.P)} kN`, cxPx, txtOffsetY);
        
        ctx.fillStyle = '#444';
        ctx.font = '10px Arial';
        ctx.fillText(`x = ${carga.a.toFixed(1)}m`, cxPx, yViga - 15);
    });
}

// Inicializar a viga limpa ao carregar a página
window.onload = function() {
    desenharViga();
};
