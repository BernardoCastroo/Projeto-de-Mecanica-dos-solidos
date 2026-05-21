// Array para armazenar os nós criados
let nosTrelica = [];

function adicionarNo() {
    // Captura os valores dos inputs
    const id = document.getElementById('node-id').value.toUpperCase();
    const x = document.getElementById('node-x').value;
    const y = document.getElementById('node-y').value;

    // Validação simples para evitar campos vazios
    if(!id || x === '' || y === '') {
        alert("Por favor, preencha todos os campos do nó.");
        return;
    }

    // Adiciona o novo nó no Array
    nosTrelica.push({ id: id, x: parseFloat(x), y: parseFloat(y) });

    // Atualiza a interface
    atualizarListaNos();

    // Limpa os campos para o usuário digitar o próximo
    document.getElementById('node-id').value = '';
    document.getElementById('node-x').value = '';
    document.getElementById('node-y').value = '';
    
    // Devolve o foco (cursor piscando) para o primeiro campo
    document.getElementById('node-id').focus();
}

function atualizarListaNos() {
    const ul = document.getElementById('ul-nos');
    ul.innerHTML = ''; // Limpa a lista atual

    // Percorre a lista de nós e cria um item na tela para cada um
    nosTrelica.forEach(no => {
        const li = document.createElement('li');
        li.textContent = `Nó ${no.id}: X = ${no.x}, Y = ${no.y}`;
        ul.appendChild(li);
    });
}

function calcularPropriedadesSecao() {
    const base = parseFloat(document.getElementById('viga-base').value);
    const altura = parseFloat(document.getElementById('viga-altura').value);

    if (!base || !altura) {
        alert("Por favor, preencha a base e a altura da seção retangular.");
        return;
    }

    // Fórmulas de Hibbeler para seção retangular:
    // Centróide (c) = h / 2
    // Momento de Inércia (I) = (b * h^3) / 12
    const c = altura / 2;
    const I = (base * Math.pow(altura, 3)) / 12;

    // Converte I de mm^4 para cm^4 para melhor leitura em engenharia
    const I_cm4 = I / 10000;

    const resultadoDiv = document.getElementById('resultado-perfil');
    resultadoDiv.innerHTML = `
        <div style="margin-top: 1rem; padding: 1rem; background-color: #f4f4f4; border-left: 4px solid #a19d85;">
            <strong>Propriedades Calculadas (Seção Retangular):</strong><br>
            • Posição da Linha Neutra (c): <strong>${c.toFixed(2)} mm</strong><br>
            • Momento de Inércia (I<sub>z</sub>): <strong>${I_cm4.toFixed(2)} cm<sup>4</sup></strong> (${I.toExponential(2)} mm<sup>4</sup>)
        </div>
    `;

    // Libera visualmente o próximo passo alterando a opacidade
    document.getElementById('viga-passo2').style.opacity = "1";
    document.getElementById('viga-passo3').style.opacity = "1";
    document.getElementById('viga-passo4').style.opacity = "1";
}
