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