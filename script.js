// ==========================================
// MÓDULO 1: CALCULADORA DE TRELIÇAS (Seu Código Original Mantido)
// ==========================================
let nosTrelica = [];

function adicionarNo() {
    const id = document.getElementById('node-id').value.toUpperCase();
    const x = document.getElementById('node-x').value;
    const y = document.getElementById('node-y').value;

    if(!id || x === '' || y === '') {
        alert("Por favor, preencha todos os campos do nó.");
        return;
    }

    nosTrelica.push({ id: id, x: parseFloat(x), y: parseFloat(y) });
    atualizarListaNos();

    document.getElementById('node-id').value = '';
    document.getElementById('node-x').value = '';
    document.getElementById('node-y').value = '';
    document.getElementById('node-id').focus();
}

function atualizarListaNos() {
    const ul = document.getElementById('ul-nos');
    if (!ul) return; // Proteção caso não esteja na página de treliça
    ul.innerHTML = ''; 

    nosTrelica.forEach(no => {
        const li = document.createElement('li');
        li.textContent = `Nó ${no.id}: X = ${no.x}, Y = ${no.y}`;
        ul.appendChild(li);
    });
}


// ==========================================
// MÓDULO 2: ANÁLISE DE VIGAS & MOTOR GRÁFICO 2D
// ==========================================
let listaCargasViga = [];
let dadosInercia = null;

function calcularPropriedadesSecao() {
    const base = parseFloat(document.getElementById('viga-base').value);
    const altura = parseFloat(document.getElementById('viga-altura').value);

    if (!base || !altura || base <= 0 || altura <= 0) {
        alert("Por favor, preencha a base e a altura da seção retangular com valores válidos.");
        return;
    }

    // Fórmulas de Hibbeler para seção retangular:
    const c = altura / 2;
    const I = (base * Math.pow(altura, 3)) / 12;
    const I_cm4 = I / 10000;

    dadosInercia = { base: base, altura: altura, c: c, I: I };

    const resultadoDiv = document.getElementById('resultado-perfil');
    resultadoDiv.innerHTML = `
        <div style="margin-top: 1rem; padding: 1rem; background-color: #f4f4f4; border-left: 4px solid #a19d85;">
            <strong>Propriedades Calculadas (Seção Retangular):</strong><br>
            • Posição da Linha Neutra (c): <strong>${c.toFixed(2)} mm</strong><br>
            • Momento de Inércia (I<sub>z</sub>): <strong>${I_cm4.toFixed(2)} cm<sup>4</sup></strong> (${I.toExponential(2)} mm<sup>4</sup>)
        </div>
    `;

    // Libera visualmente as seções seguintes alterando a opacidade
    document.getElementById('viga-passo2').style.opacity = "1";
    document.getElementById('viga-passo3').style.opacity = "1";
    document.getElementById('viga-passo4').style.opacity = "1";
}

function adicionarCargaViga() {
    const val = parseFloat(document.getElementById('viga-carga-val').value);
    const pos = parseFloat(document.getElementById('viga-carga-pos').value);
    const comprimentoViga = parseFloat(document.getElementById('viga-comprimento').value) || 4.0;

    if (isNaN(val) || isNaN(pos) || val === 0) {
        alert("Por favor, especifique um valor de carga e sua posição.");
        return;
    }

    if (pos < 0 || pos > comprimentoViga) {
        alert(`A posição da carga deve estar contida dentro do vão da viga (0 a ${comprimentoViga}m).`);
        return;
    }

    listaCargasViga.push({ magnitude: val, posicao: pos });

    // Atualiza a listagem textual
    const ul = document.getElementById('ul-cargas-viga');
    const li = document.createElement('li');
    li.style.borderBottom = "1px solid #eee";
    li.style.padding = "4px 0";
    li.style.fontSize = "0.9rem";
    li.textContent = `Carga Concentrada: ${Math.abs(val)} kN em X = ${pos.toFixed(2)} m`;
    ul.appendChild(li);

    desenharViga();
}

function limparCargasViga() {
    listaCargasViga = [];
    const ul = document.getElementById('ul-cargas-viga');
    if(ul) ul.innerHTML = '';
    const resDiv = document.getElementById('resultado-final-calculo');
    if(resDiv) resDiv.innerHTML = '';
    desenharViga();
}

// --- MOTOR GRÁFICO 2D VIA CANVAS (VIGAS) ---
function desenharViga() {
    const canvas = document.getElementById('canvasViga');
    if (!canvas) return; // Evita erros se o usuário estiver em outra aba
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const L = parseFloat(document.getElementById('viga-comprimento').value);
    if (isNaN(L) || L <= 0) return;

    const tipoApoio = document.getElementById('viga-apoio').value;

    // Configurações de margens do gráfico
    const paddingH = 60;
    const vigaWidthPx = canvas.width - (2 * paddingH);
    const scaleX = vigaWidthPx / L;
    const yViga = canvas.height / 2 - 10;

    const realToPxX = (x) => paddingH + (x * scaleX);

    // 1. DESENHAR CORPO DA VIGA (Barra Física)
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(paddingH, yViga - 6, vigaWidthPx, 12);

    // 2. DESENHAR LINHA DE COTA DO TAMANHO TOTAL (Dimensões)
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingH, yViga + 35);
    ctx.lineTo(canvas.width - paddingH, yViga + 35);
    ctx.stroke();
    // Extremidades da cota
    ctx.beginPath(); ctx.moveTo(paddingH, yViga + 28); ctx.lineTo(paddingH, yViga + 42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(canvas.width - paddingH, yViga + 28); ctx.lineTo(canvas.width - paddingH, yViga + 42); ctx.stroke();
    // Texto descritivo da cota
    ctx.fillStyle = '#000';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`L = ${L.toFixed(2)} m`, canvas.width / 2, yViga + 52);

    // 3. DESENHAR OS APOIOS E VÍNCULOS ESTRUTURAIS
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2;

    if (tipoApoio === 'biapoiada') {
        // Apoio Esquerdo Fixo (x = 0)
        const xA = realToPxX(0);
        ctx.beginPath();
        ctx.moveTo(xA, yViga + 6);
        ctx.lineTo(xA - 10, yViga + 22);
        ctx.lineTo(xA + 10, yViga + 22);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Linha de engaste inferior do apoio
        ctx.beginPath(); ctx.moveTo(xA - 14, yViga + 22); ctx.lineTo(xA + 14, yViga + 22); ctx.stroke();
        ctx.fillText("A", xA - 18, yViga + 18);

        // Apoio Direito Móvel (x = L)
        const xB = realToPxX(L);
        ctx.beginPath();
        ctx.moveTo(xB, yViga + 6);
        ctx.lineTo(xB - 10, yViga + 20);
        ctx.lineTo(xB + 10, yViga + 20);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Rodinhas do rolete
        ctx.beginPath(); ctx.arc(xB - 5, yViga + 23, 2.5, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(xB + 5, yViga + 23, 2.5, 0, 2 * Math.PI); ctx.stroke();
        ctx.fillText("B", xB + 18, yViga + 18);
    } else if (tipoApoio === 'balanco') {
        // Engaste total na esquerda (x = 0)
        const xA = realToPxX(0);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xA, yViga - 20);
        ctx.lineTo(xA, yViga + 20);
        ctx.stroke();
        // Hachuras clássicas de engaste
        ctx.lineWidth = 1;
        for (let yH = yViga - 20; yH <= yViga + 20; yH += 6) {
            ctx.beginPath(); ctx.moveTo(xA, yH); ctx.lineTo(xA - 6, yH - 4); ctx.stroke();
        }
        ctx.fillText("Engaste", xA + 25, yViga - 15);
    }

    // 4. PLOTAR SINALIZAÇÃO DE CARGAS E VETORES (Forças)
    ctx.strokeStyle = '#cc0000';
    ctx.fillStyle = '#cc0000';
    ctx.lineWidth = 2;

    listaCargasViga.forEach(carga => {
        const cx = realToPxX(carga.posicao);
        const tamanhoSeta = 40;
        const yStart = yViga - 6 - tamanhoSeta;
        const yEnd = yViga - 8;

        // Linha principal do vetor força
        ctx.beginPath();
        ctx.moveTo(cx, yStart);
        ctx.lineTo(cx, yEnd);
        ctx.stroke();

        // Cabeça da Seta (Apontando para baixo)
        ctx.beginPath();
        ctx.moveTo(cx, yEnd);
        ctx.lineTo(cx - 5, yEnd - 8);
        ctx.lineTo(cx + 5, yEnd - 8);
        ctx.closePath();
        ctx.fill();

        // Informações textuais acopladas ao vetor gráfico
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${carga.magnitude} kN`, cx, yStart - 5);
        
        ctx.fillStyle = '#444';
        ctx.font = '10px sans-serif';
        ctx.fillText(`x = ${carga.posicao.toFixed(1)}m`, cx, yViga - 14);
        ctx.fillStyle = '#cc0000'; // Restaura cor para o próximo loop
    });
}

// --- EQUAÇÕES MATEMÁTICAS DE ESFORÇOS ---
function calcularEsforcosFinais() {
    const L = parseFloat(document.getElementById('viga-comprimento').value);
    const tipoApoio = document.getElementById('viga-apoio').value;

    if (!dadosInercia) {
        alert("Defina o perfil geométrico da seção transversal (Passo 1) primeiro!");
        return;
    }
    if (listaCargasViga.length === 0) {
        alert("Insira ao menos uma força aplicada na viga para o processamento.");
        return;
    }

    let RA = 0;
    let RB = 0;
    let Mmax = 0;

    // Resolução Estática por Configuração Estrutural (Hibbeler Capítulo 6)
    if (tipoApoio === 'biapoiada') {
        let somaMomentosA = 0;
        let somaForcas = 0;

        listaCargasViga.forEach(c => {
            somaMomentosA += c.magnitude * c.posicao;
            somaForcas += c.magnitude;
        });

        RB = somaMomentosA / L;
        RA = somaForcas - RB;

        // Estimativa do momento fletor no centro ou ponto da carga
        listaCargasViga.forEach(c => {
            let M_ponto = RA * c.posicao;
            if (M_ponto > Mmax) Mmax = M_ponto;
        });
    } else {
        // Modelo em Balanço / Engastado
        listaCargasViga.forEach(c => {
            RA += c.magnitude;              // Força cortante no engaste
            Mmax += c.magnitude * c.posicao; // Momento fletor máximo ocorre no apoio fixado
        });
    }

    // Tensão Normal de Flexão: sigma = (M * c) / I
    // Convertendo Mmax de kN.m para N.mm para resultar em MPa direto: multiplicar por 10^6
    const M_Nmm = Mmax * 1e6;
    const sigmaMax = (M_Nmm * dadosInercia.c) / dadosInercia.I;

    const divResultados = document.getElementById('resultado-final-calculo');
    divResultados.innerHTML = `
        <div class="result-box" style="margin-top:1.5rem; padding:1.2rem; background:#f0f4f8; border-left:5px solid #000; border-radius:4px;">
            <strong style="color:var(--primary-color); font-size:1.05rem;">Resultados Técnicos Obtidos:</strong><br><br>
            • Reação de Apoio R<sub>A</sub>: <strong>${RA.toFixed(2)} kN</strong><br>
            ${tipoApoio === 'biapoiada' ? `• Reação de Apoio R<sub>B</sub>: <strong>${RB.toFixed(2)} kN</strong><br>` : ''}
            • Momento Fletor Máximo (M<sub>max</sub>): <strong>${Mmax.toFixed(2)} kN·m</strong><br>
            • Tensão Normal Máxima (<span style="font-family:serif; font-style:italic;">σ</span><sub>max</sub>): <strong style="color:#d9534f; font-size:1.1rem;">${sigmaMax.toFixed(2)} MPa (N/mm²)</strong>
        </div>
    `;
}

// Aciona o motor assim que a janela HTML terminar de estruturar a árvore DOM
window.onload = function() {
    desenharViga();
};
