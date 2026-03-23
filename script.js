
// --- BANCO DE DADOS (LOCAL STORAGE) ---
let db_users = JSON.parse(localStorage.getItem('atlas_users')) || [
    {nome:"Admin", email:"admin@atlas.com", senha:"123", nivel:"ilimitado"}
];
let db_live = JSON.parse(localStorage.getItem('atlas_live')) || [];
let userLogado = null;
let db_inj_hist = JSON.parse(localStorage.getItem('atlas_inj_hist')) || [];

// --- SISTEMA DE LOGIN ---
function fazerLogin() {
    const e = document.getElementById('login-email').value;
    const s = document.getElementById('login-senha').value;
    const u = db_users.find(x => x.email === e && x.senha === s);

    if(u) {
        userLogado = u;
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('app-principal').style.display = 'block';
        document.getElementById('user-display').innerText = u.nome;
        
        // Esconde o card de Gestão se não for ADM
        document.getElementById('card-gestao').style.display = u.nivel === 'ilimitado' ? 'flex' : 'none';
        
        mudarTema(localStorage.getItem('atlas_tema') || 'claro');
    } else { 
        alert("E-mail ou senha incorretos!"); 
    }
}

// --- NAVEGAÇÃO ---
function abrirModulo(m) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    document.getElementById('grid-home').style.display = 'none';

    if(m === 'Home') document.getElementById('grid-home').style.display = 'grid';
    if(m === 'Injeção') { document.getElementById('modulo-injecao').style.display = 'block'; atualizarLista(); }
    if(m === 'Bobines') document.getElementById('modulo-bobines').style.display = 'block';
    
    // NOVAS CONDIÇÕES
    if(m === 'Serra') document.getElementById('modulo-serra').style.display = 'block';
    if(m === 'Embalagem') document.getElementById('modulo-embalagem').style.display = 'block';
    
    if(m === 'Gestão') { 
        document.getElementById('modulo-gestao').style.display = 'block'; 
        listarUsuarios(); 
    }
    if(m === 'Configuração') document.getElementById('modulo-config').style.display = 'block';
}

function abrirSubModulo(sub) {
    document.getElementById('modulo-bobines').style.display = 'none';
    if(sub === 'calc') { document.getElementById('bobine-calc').style.display = 'block'; prepararCalculadora(); }
    if(sub === 'rel') document.getElementById('bobine-rel').style.display = 'block';
}

function voltarHome() { abrirModulo('Home'); }

// --- GESTÃO DE USUÁRIOS (A PARTE QUE NÃO ESTAVA FUNCIONANDO) ---
function salvarUsuario() {
    const nome = document.getElementById('g-nome').value;
    const email = document.getElementById('g-email').value;
    const senha = document.getElementById('g-senha').value;
    const nivel = document.getElementById('g-nivel').value;

    if (!nome || !email || !senha) {
        alert("Preencha todos os campos para cadastrar!");
        return;
    }

    // Verifica se e-mail já existe
    if (db_users.some(user => user.email === email)) {
        alert("Este e-mail já está cadastrado!");
        return;
    }

    const novoUser = { nome, email, senha, nivel };
    db_users.push(novoUser);
    
    // Salva no Navegador
    localStorage.setItem('atlas_users', JSON.stringify(db_users));
    
    // Limpa formulário
    document.getElementById('g-nome').value = "";
    document.getElementById('g-email').value = "";
    document.getElementById('g-senha').value = "";

    alert("Usuário cadastrado com sucesso!");
    listarUsuarios();
}

function listarUsuarios() {
    const listaDiv = document.getElementById('lista-usuarios');
    listaDiv.innerHTML = "<h3 style='margin-top:20px'>Usuários Cadastrados</h3>";
    
    db_users.forEach((u, index) => {
        const item = document.createElement('div');
        item.style = "background:#fff; padding:10px; margin:5px 0; border-radius:5px; display:flex; justify-content:space-between; align-items:center; color:#333; box-shadow: 0 1px 3px rgba(0,0,0,0.1)";
        item.innerHTML = `
            <div>
                <strong>${u.nome}</strong> <br> 
                <small>${u.email} | ${u.nivel === 'ilimitado' ? 'ADM' : 'Operador'}</small>
            </div>
            ${u.email !== 'admin@atlas.com' ? `<button onclick="excluirUser(${index})" style="background:#ff4d4d; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">Remover</button>` : ''}
        `;
        listaDiv.appendChild(item);
    });
}

function excluirUser(index) {
    if(confirm("Deseja realmente excluir este usuário?")) {
        db_users.splice(index, 1);
        localStorage.setItem('atlas_users', JSON.stringify(db_users));
        listarUsuarios();
    }
}

// --- LÓGICA CALCULADORA ---
let espSel = 0.32; let velSel = 10;
function prepararCalculadora() {
    const lSelect = document.getElementById("largura-calc");
    if (lSelect.options.length === 0) {
        for(let i=1; i<=50; i+=0.5){
            let o = document.createElement("option"); o.value = i;
            o.text = i + " cm"; lSelect.appendChild(o);
        }
        lSelect.onchange = calcBobine;
    }
    const espDiv = document.getElementById("espessuras-btns"); espDiv.innerHTML = "";
    [0.28, 0.30, 0.32, 0.35, 0.38, 0.40, 0.45].forEach(e => {
        let b = document.createElement("button"); b.innerText = e + " mm";
        if(e === espSel) b.classList.add("selecionado");
        b.onclick = () => { espDiv.querySelectorAll("button").forEach(x => x.classList.remove("selecionado")); b.classList.add("selecionado"); espSel = e; calcBobine(); };
        espDiv.appendChild(b);
    });
    const velDiv = document.getElementById("velocidades-btns"); velDiv.innerHTML = "";
    [5, 6, 7, 8, 9, 10, 11, 12].forEach(v => {
        let b = document.createElement("button"); b.innerText = v + " m/min";
        if(v === velSel) b.classList.add("selecionado");
        b.onclick = () => { velDiv.querySelectorAll("button").forEach(x => x.classList.remove("selecionado")); b.classList.add("selecionado"); velSel = v; calcBobine(); };
        velDiv.appendChild(b);
    });
    calcBobine();
}

function calcBobine() {
    const interno = 500; const pi = 3.14;
    const largura_cm = parseFloat(document.getElementById("largura-calc").value) || 1;
    const largura_mm = largura_cm * 10;
    const metros = Math.round(((largura_mm / espSel) * pi * (interno + largura_mm)) / 1000);
    const tempoTotalMin = Math.round(metros / velSel);
    const fim = new Date(); fim.setMinutes(fim.getMinutes() + tempoTotalMin);
    document.getElementById("res-metros").innerText = "Falta: " + metros + " metros";
    document.getElementById("res-tempo").innerText = "Tempo: " + tempoTotalMin + " min";
    document.getElementById("res-hora").innerText = "Acaba às: " + fim.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

// --- FUNÇÕES INJEÇÃO ---
function iniciarRodada() {
    const esp = document.getElementById('inj-esp').value;
    if(!esp) return alert("Selecione a espessura!");
    db_live.push({ painel: document.getElementById('inj-painel').value, esp: esp + " mm", metros: "", vel: "", ocorrencias: [], quimicos: {}, op: userLogado.nome });
    localStorage.setItem('atlas_live', JSON.stringify(db_live)); 
    atualizarLista();
}

function salvarEdicao() {
    const i = document.getElementById('edit-idx').value;
    db_live[i].metros = document.getElementById('ed-m').value;
    db_live[i].vel = document.getElementById('ed-v').value;
    localStorage.setItem('atlas_live', JSON.stringify(db_live));
    document.getElementById('area-edicao').style.display='none'; 
    atualizarLista();
}

function atualizarLista() {
    const lista = document.getElementById('lista-rodadas');
    if(lista) {
        lista.innerHTML = db_live.map((it, i) => `
            <div class="form-section" style="display:flex; justify-content:space-between; align-items:center; gap: 10px;">
                <div style="flex: 1;">
                    <strong>${it.painel}</strong> <small>(${it.esp})</small>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="abrirEdicao(${i})" class="btn-save blue" style="width:auto; padding:5px 15px; font-size: 12px;">EDITAR</button>
                    <button onclick="removerRodadaInjecao(${i})" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">APAGAR</button>
                </div>
            </div>
        `).join('');
    }
}
function removerRodadaInjecao(index) {
    if(confirm("Deseja apagar esta rodada de injeção?")) {
        // Remove do array temporário da injeção
        db_live.splice(index, 1);
        
        // Salva a alteração no LocalStorage
        localStorage.setItem('atlas_live', JSON.stringify(db_live));
        
        // Atualiza a visualização na tela
        atualizarLista();
    }
}

function abrirEdicao(i) { 
    document.getElementById('edit-idx').value = i; 
    document.getElementById('area-edicao').style.display='block'; 
}

function fecharPasta() { 
    if(db_live.length === 0) return alert("Não há nada para salvar na Injeção.");

    if(confirm("Deseja fechar o dia da Injeção? Os dados serão enviados para o Histórico.")) {
        // Cria o objeto do relatório
        const relatorioInjecao = {
            data: document.getElementById('inj-data').value || new Date().toLocaleDateString(),
            operador: userLogado.nome,
            tipo: 'Injeção',
            dados: [...db_live] // Copia os dados atuais
        };

        // Salva no Histórico da Injeção
        db_inj_hist.push(relatorioInjecao);
        localStorage.setItem('atlas_inj_hist', JSON.stringify(db_inj_hist));

        // Limpa a produção atual
        db_live = []; 
        localStorage.setItem('atlas_live', JSON.stringify(db_live));
        
        atualizarLista(); 
        listarHistoricoInjecao(); // Atualiza a aba de histórico
        alert("Dia fechado e salvo com sucesso!");
    }
}

function mudarAba(a) { 
    document.getElementById('aba-relatorio').style.display = a==='relatorio'?'block':'none'; 
    document.getElementById('aba-historico').style.display = a==='historico'?'block':'none'; 
    
    if(a === 'historico') {
        listarHistoricoInjecao(); // ADICIONE ISSO AQUI
    }

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function mudarTema(t) { 
    document.body.className = t==='escuro'?'tema-escuro':''; 
    localStorage.setItem('atlas_tema', t); 
}
// --- BANCO DE DADOS ESPECÍFICO PARA BOBINES ---
let db_bobine_live = JSON.parse(localStorage.getItem('atlas_bobine_live')) || [];
let db_bobine_hist = JSON.parse(localStorage.getItem('atlas_bobine_hist')) || [];

function mudarAbaBobine(aba) {
    document.getElementById('aba-bobine-producao').style.display = aba === 'producao' ? 'block' : 'none';
    document.getElementById('aba-bobine-historico').style.display = aba === 'historico' ? 'block' : 'none';
    
    // Atualiza visual dos botões
    document.getElementById('tab-bob-prod').classList.toggle('active', aba === 'producao');
    document.getElementById('tab-bob-hist').classList.toggle('active', aba === 'historico');

    if(aba === 'historico') listarHistoricoBobine();
    atualizarListaBobine();
}

function toggleCamposBobine() {
    const tipo = document.getElementById('bob-tipo-entrada').value;
    const container = document.getElementById('campos-dinamicos-bobine');
    container.innerHTML = "";

    if (tipo === 'filme') {
        container.innerHTML = `
            <label>Posição:</label>
            <select id="bob-posicao" onchange="toggleSubFilme()">
                <option value="Superior">Superior</option>
                <option value="Inferior">Inferior</option>
            </select>
            <div id="sub-campos-filme">
                <input type="text" id="bob-nome-filme" placeholder="Nome/Tipo do Filme Superior">
            </div>
        `;
    } else if (tipo === 'bobina') {
        container.innerHTML = `
            <label>Posição:</label>
            <select id="bob-posicao">
                <option value="Superior">Superior</option>
                <option value="Inferior">Inferior</option>
            </select>
            <input type="text" id="bob-num" placeholder="Número da Bobina (ex: ABC123)">
            <label>Status:</label>
            <select id="bob-status">
                <option value="Sim">Acabou (Sim)</option>
                <option value="Não">Acabou (Não)</option>
                <option value="Andamento">Em Andamento</option>
            </select>
        `;
    }
}

function toggleSubFilme() {
    const pos = document.getElementById('bob-posicao').value;
    const sub = document.getElementById('sub-campos-filme');
    
    if (pos === 'Inferior') {
        sub.innerHTML = `
            <label>Tipo de Filme Inferior:</label>
            <select id="bob-nome-filme">
                <option value="5 Ondas">5 Ondas</option>
                <option value="Telha">Telha</option>
                <option value="Fachada">Fachada</option>
                <option value="Ondulada">Ondulada</option>
                <option value="Plana">Plana</option>
            </select>
            <input type="number" id="bob-qtd-filme" placeholder="Quantidade (ex: 1)" value="1">
        `;
    } else {
        // Filme Superior: Apenas inserção simples de quantidade
        sub.innerHTML = `
            <label>Quantidade de Filme Superior:</label>
            <input type="number" id="bob-qtd-filme" placeholder="Qtd de filmes superiores" value="1">
        `;
    }
}

function adicionarLancamentoBobine() {
    const tipo = document.getElementById('bob-tipo-entrada').value;
    if (!tipo) return alert("Selecione o tipo!");

    let novo = {
        tipo: tipo,
        posicao: document.getElementById('bob-posicao').value,
        hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        qtd: 0 // Inicializa a quantidade
    };

    if (tipo === 'filme') {
        const nomeFilme = document.getElementById('bob-nome-filme') ? document.getElementById('bob-nome-filme').value : "Superior";
        const qtdFilme = parseInt(document.getElementById('bob-qtd-filme').value) || 0;
        
        novo.info = `Filme: ${nomeFilme} | Quantidade: ${qtdFilme}`;
        novo.qtd = qtdFilme; // Salva para a soma posterior
    } else {
        // Lógica da Bobina (mantém a trava de status)
        const statusVal = document.getElementById('bob-status').value;
        const statusTexto = document.getElementById('bob-status').options[document.getElementById('bob-status').selectedIndex].text;
        novo.status = statusVal;
        novo.info = `Bobine: ${document.getElementById('bob-num').value} | Status: ${statusTexto}`;
    }

    db_bobine_live.push(novo);
    localStorage.setItem('atlas_bobine_live', JSON.stringify(db_bobine_live));
    atualizarListaBobine();
}
function atualizarListaBobine() {
    const lista = document.getElementById('lista-lancamentos-bobine');
    lista.innerHTML = db_bobine_live.map(it => `
        <div class="form-section" style="border-left: 5px solid ${it.tipo === 'filme' ? '#9c27b0' : '#2196f3'}">
            <small>${it.hora}</small> | <strong>${it.tipo.toUpperCase()} ${it.posicao}</strong><br>
            <span>${it.info}</span>
        </div>
    `).join('');
}

function fimProducaoBobine() {
    if(db_bobine_live.length === 0) return;
    db_bobine_live.push({ tipo: 'divisor', info: '--- MUDANÇA DE PAINEL / PRODUÇÃO ---', hora: new Date().toLocaleTimeString() });
    localStorage.setItem('atlas_bobine_live', JSON.stringify(db_bobine_live));
    atualizarListaBobine();
}

function fecharDiaBobine() {
    if(db_bobine_live.length === 0) return;
    if(confirm("Deseja fechar o relatório do dia?")) {
        const relatorio = {
            data: new Date().toLocaleDateString(),
            operador: userLogado.nome,
            dados: [...db_bobine_live]
        };
        db_bobine_hist.push(relatorio);
        localStorage.setItem('atlas_bobine_hist', JSON.stringify(db_bobine_hist));
        
        gerarVisualizacaoRelatorio(relatorio);
        
        db_bobine_live = [];
        localStorage.setItem('atlas_bobine_live', JSON.stringify(db_bobine_live));
        atualizarListaBobine();
    }
}

function gerarVisualizacaoRelatorio(rel) {
    // CALCULAR SOMAS
    let totalSuperior = 0;
    let totalInferior = 0;

    rel.dados.forEach(d => {
        if (d.tipo === 'filme') {
            if (d.posicao === 'Superior') totalSuperior += d.qtd;
            if (d.posicao === 'Inferior') totalInferior += d.qtd;
        }
    });

    let janela = window.open('', '_blank');
    let conteudo = `
        <html>
        <head>
            <title>Relatório Atlas - Bobines</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #333; }
                .header { text-align: center; border-bottom: 3px solid #c41e24; padding-bottom: 10px; margin-bottom: 20px; }
                .logo { width: 120px; }
                .resumo-caixa { background: #f8f9fa; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-around; }
                .resumo-item { text-align: center; }
                .resumo-item h2 { margin: 0; color: #c41e24; }
                .item { padding: 8px; border-bottom: 1px solid #eee; font-size: 14px; }
                .divisor { background: #333; color: white; font-weight: bold; text-align: center; padding: 5px; margin: 15px 0; border-radius: 4px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="logo.png" class="logo">
                <h1>Relatório de Produção (Bobines/Filmes)</h1>
                <p>Data: <strong>${rel.data}</strong> | Operador: <strong>${rel.operador}</strong></p>
            </div>

            <div class="resumo-caixa">
                <div class="resumo-item">
                    <span>Total Filmes Superiores</span>
                    <h2>${totalSuperior}</h2>
                </div>
                <div class="resumo-item">
                    <span>Total Filmes Inferiores</span>
                    <h2>${totalInferior}</h2>
                </div>
                <div class="resumo-item">
                    <span>Soma Total Geral</span>
                    <h2>${totalSuperior + totalInferior}</h2>
                </div>
            </div>

            <h3>Detalhamento de Lançamentos:</h3>
            ${rel.dados.map(d => d.tipo === 'divisor' ? 
                `<div class="divisor">${d.info}</div>` : 
                `<div class="item"><strong>[${d.hora}] ${d.posicao}:</strong> ${d.info}</div>`
            ).join('')}

            <br>
            <button onclick="window.print()" class="no-print" style="padding: 10px 20px; background: #2196f3; color: white; border: none; cursor: pointer; border-radius: 5px;">
                🖨️ Imprimir Relatório
            </button>
        </body>
        </html>
    `;
    janela.document.write(conteudo);
}


function listarHistoricoBobine() {
    const lista = document.getElementById('lista-historico-bobine');
    if (!db_bobine_hist || db_bobine_hist.length === 0) {
        lista.innerHTML = "<p style='text-align:center; color:#666; padding:20px;'>Nenhum relatório salvo no histórico.</p>";
        return;
    }

    lista.innerHTML = db_bobine_hist.map((h, i) => {
        // Conta quantos filmes tem nesse relatório
        let totalF = h.dados.reduce((acc, d) => d.tipo === 'filme' ? acc + (d.qtd || 0) : acc, 0);

        return `
            <div class="card-historico-vivo" onclick='gerarVisualizacaoRelatorio(${JSON.stringify(h)})'>
                <div class="hist-info">
                    <div class="hist-data">📅 ${h.data}</div>
                    <div class="hist-op">👤 Operador: <strong>${h.operador}</strong></div>
                    <div class="hist-badges">
                        <span class="badge badge-filme">📦 ${totalF} Filmes</span>
                        <span class="badge badge-view">📄 Ver PDF</span>
                    </div>
                </div>
                <div style="font-size: 20px; color: #ccc;">❯</div>
            </div>
        `;
    }).reverse().join('');
}
function atualizarListaBobine() {
    const lista = document.getElementById('lista-lancamentos-bobine');
    if (!lista) return;

    lista.innerHTML = db_bobine_live.map((it, index) => {
        if (it.tipo === 'divisor') {
            return `
                <div class="form-section" style="background: #eee; text-align: center; display: flex; justify-content: space-between; align-items: center;">
                    <span style="flex: 1;"><strong>${it.info}</strong></span>
                    <button onclick="removerLancamentoBobine(${index})" style="background:none; border:none; color:red; cursor:pointer; font-weight:bold; padding: 0 10px;">X</button>
                </div>`;
        }

        const corCorpo = it.tipo === 'filme' ? '#9c27b0' : '#2196f3';
        
        return `
            <div class="form-section" style="border-left: 5px solid ${corCorpo}; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="flex: 1;">
                    <small>${it.hora}</small> | <strong>${it.tipo.toUpperCase()} ${it.posicao}</strong><br>
                    <span>${it.info}</span>
                </div>
                
                <div style="display: flex; gap: 5px; align-items: center;">
                    ${it.tipo === 'bobina' ? `
                        <button onclick="alternarStatusBobine(${index})" class="btn-save blue" style="width: auto; padding: 5px 10px; font-size: 11px;">
                            STATUS
                        </button>
                    ` : ''}
                    
                    <button onclick="removerLancamentoBobine(${index})" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        APAGAR
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
function removerLancamentoBobine(index) {
    if (confirm("Deseja realmente apagar este lançamento?")) {
        // Remove 1 item do array na posição index
        db_bobine_live.splice(index, 1);
        
        // Atualiza o banco de dados local
        localStorage.setItem('atlas_bobine_live', JSON.stringify(db_bobine_live));
        
        // Atualiza a tela
        atualizarListaBobine();
    }
}

// Função para alternar o status sem precisar deletar o lançamento
function alternarStatusBobine(index) {
    const statusAtual = db_bobine_live[index].status;
    let novoStatus = "";
    let novoSimNao = "";

    if (statusAtual === "Andamento") {
        novoStatus = "Sim";
        novoSimNao = "Acabou (Sim)";
    } else if (statusAtual === "Sim") {
        novoStatus = "Não";
        novoSimNao = "Acabou (Não)";
    } else {
        novoStatus = "Andamento";
        novoSimNao = "Em Andamento";
    }

    // Atualiza o objeto interno
    db_bobine_live[index].status = novoStatus;
    // Atualiza o texto da info que vai pro relatório
    const numBobina = db_bobine_live[index].info.split('|')[0]; // Pega a parte do número
    db_bobine_live[index].info = `${numBobina} | Status: ${novoSimNao}`;

    localStorage.setItem('atlas_bobine_live', JSON.stringify(db_bobine_live));
    atualizarListaBobine();
}

// Versão atualizada do Fechar Dia com a trava de segurança
function fecharDiaBobine() {
    if(db_bobine_live.length === 0) return alert("Não há lançamentos para fechar.");

    // BUSCA POR BOBINAS EM ANDAMENTO
    const pendente = db_bobine_live.find(it => it.tipo === 'bobina' && it.status === 'Andamento');

    if (pendente) {
        alert(`ATENÇÃO: Não é possível fechar o relatório! \n\nA ${pendente.info.split('|')[0]} ainda está com status "Em Andamento". finalize-a antes de continuar.`);
        return; // Interrompe a função aqui
    }

    if(confirm("Deseja fechar o relatório do dia? Todos os status estão verificados.")) {
        const relatorio = {
            data: new Date().toLocaleDateString(),
            operador: userLogado.nome,
            dados: [...db_bobine_live]
        };
        db_bobine_hist.push(relatorio);
        localStorage.setItem('atlas_bobine_hist', JSON.stringify(db_bobine_hist));
        
        gerarVisualizacaoRelatorio(relatorio);
        
        db_bobine_live = [];
        localStorage.setItem('atlas_bobine_live', JSON.stringify(db_bobine_live));
        atualizarListaBobine();
    }
}
function listarHistoricoInjecao() {
    const lista = document.getElementById('lista-pastas'); // ID que já estava no seu HTML
    if (!lista) return;

    if (db_inj_hist.length === 0) {
        lista.innerHTML = "<p style='text-align:center; color:#666; padding:20px;'>Nenhum histórico de injeção.</p>";
        return;
    }

    lista.innerHTML = db_inj_hist.map((h, i) => `
        <div class="card-historico-vivo" onclick='gerarVisualizacaoRelatorioInjecao(${JSON.stringify(h)})'>
            <div class="hist-info">
                <div class="hist-data">⚙️ Injeção - ${h.data}</div>
                <div class="hist-op">Operador: <strong>${h.operador}</strong></div>
                <div class="hist-badges">
                    <span class="badge badge-filme">${h.dados.length} Rodadas</span>
                    <span class="badge badge-view">Ver Detalhes</span>
                </div>
            </div>
        </div>
    `).reverse().join('');
}

// Função para abrir o relatório da Injeção em uma nova aba (estilo PDF)
function gerarVisualizacaoRelatorioInjecao(rel) {
    let janela = window.open('', '_blank');
    let conteudo = `
        <html>
        <head>
            <title>Relatório Injeção - Atlas</title>
            <style>
                body { font-family: sans-serif; padding: 30px; }
                .header { text-align: center; border-bottom: 2px solid #c41e24; margin-bottom: 20px; }
                .item { padding: 10px; border-bottom: 1px solid #eee; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; }
                th { background: #f4f4f4; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="logo.png" style="width:120px">
                <h1>Relatório de Injeção</h1>
                <p>Data: ${rel.data} | Operador: ${rel.operador}</p>
            </div>
            ${rel.dados.map(d => `
                <div class="item">
                    <strong>Painel: ${d.painel} (${d.esp})</strong><br>
                    <table>
                        <tr>
                            <th>Metros</th><th>Veloc.</th><th>MDI</th><th>PUR</th><th>PIR</th><th>C1</th><th>C4</th><th>PENT</th>
                        </tr>
                        <tr>
                            <td>${d.metros || '-'}</td><td>${d.vel || '-'}</td>
                            <td>${d.quimicos?.mdi || '-'}</td><td>${d.quimicos?.pur || '-'}</td>
                            <td>${d.quimicos?.pir || '-'}</td><td>${d.quimicos?.c1 || '-'}</td>
                            <td>${d.quimicos?.c4 || '-'}</td><td>${d.quimicos?.pent || '-'}</td>
                        </tr>
                    </table>
                </div>
            `).join('')}
            <button onclick="window.print()" style="margin-top:20px;">Imprimir</button>
        </body>
        </html>
    `;
    janela.document.write(conteudo);
}
// --- FUNÇÃO PARA MOSTRAR/ESCONDER SENHA ---
function toggleVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    
    if (input.type === 'password') {
        // Ação: Mostrar a senha
        input.type = 'text';
        iconElement.textContent = '👁️'; // Olho aberto = Senha visível
    } else {
        // Ação: Esconder a senha
        input.type = 'password';
        iconElement.textContent = '🔒'; // Cadeado fechado = Senha oculta
    }
}
// --- NAVEGAÇÃO INTERNA DAS CONFIGURAÇÕES ---
function mudarAbaConfig(aba) {
    // Seleciona as seções e botões
    const abaPerfil = document.getElementById('aba-config-perfil');
    const abaAparencia = document.getElementById('aba-config-aparencia');
    const btnPerfil = document.getElementById('tab-config-perfil');
    const btnAparencia = document.getElementById('tab-config-aparencia');

    // Esconde tudo primeiro
    abaPerfil.style.display = 'none';
    abaAparencia.style.display = 'none';
    btnPerfil.classList.remove('active');
    btnAparencia.classList.remove('active');

    if (aba === 'perfil') {
        abaPerfil.style.display = 'block';
        btnPerfil.classList.add('active');
        
        // Preenche os dados do usuário logado nos campos
        if (userLogado) {
            document.getElementById('perfil-nome-display').innerText = userLogado.nome;
            document.getElementById('perfil-nivel-display').innerText = userLogado.nivel === 'ilimitado' ? 'Administrador' : 'Operador';
            document.getElementById('config-nome').value = userLogado.nome;
        }
    } else {
        abaAparencia.style.display = 'block';
        btnAparencia.classList.add('active');
    }
}
function atualizarPerfil() {
    const novoNome = document.getElementById('config-nome').value;
    const novaSenha = document.getElementById('config-senha-nova').value;

    if (!novoNome) return alert("O nome não pode estar vazio!");

    // 1. Atualiza o objeto do usuário logado na memória
    userLogado.nome = novoNome;
    if (novaSenha) userLogado.senha = novaSenha;

    // 2. Atualiza no Banco de Dados (Array principal)
    const index = db_users.findIndex(u => u.email === userLogado.email);
    if (index !== -1) {
        db_users[index] = userLogado;
        localStorage.setItem('atlas_users', JSON.stringify(db_users));
    }

    // 3. Atualiza a interface visual (Header e campos)
    document.getElementById('user-display').innerText = userLogado.nome;
    document.getElementById('perfil-nome-display').innerText = userLogado.nome;
    document.getElementById('config-senha-nova').value = ""; // limpa campo senha

    alert("Perfil atualizado com sucesso!");
}
// 1. Função para salvar as preferências do usuário
function salvarVisibilidade() {
    const checkboxes = document.querySelectorAll('.toggle-vis');
    const preferencias = {};

    checkboxes.forEach(chk => {
        preferencias[chk.getAttribute('data-target')] = chk.checked;
    });

    localStorage.setItem('config_visibilidade', JSON.stringify(preferencias));
    alert("Preferências de visualização salvas!");
    aplicarVisibilidade(); // Aplica na hora
}

// 2. Função para ler o que está salvo e esconder os cards
function aplicarVisibilidade() {
    const prefs = JSON.parse(localStorage.getItem('config_visibilidade'));
    
    if (prefs) {
        for (const [idCard, visivel] of Object.entries(prefs)) {
            const el = document.getElementById(idCard);
            const chk = document.querySelector(`[data-target="${idCard}"]`);
            
            if (el) {
                el.style.display = visivel ? 'flex' : 'none';
            }
            
            // Mantém o checkbox marcado corretamente na tela de configuração
            if (chk) {
                chk.checked = visivel;
            }
        }
    }
}

// 3. Chame essa função dentro do seu DOMContentLoaded ou logo após o login
// Exemplo:
document.addEventListener("DOMContentLoaded", () => {
    aplicarVisibilidade();
});
// --- 1. BANCO DE DADOS E ESTADO ---
let db_serra_live = JSON.parse(localStorage.getItem('atlas_serra_live')) || [];
let db_serra_hist = JSON.parse(localStorage.getItem('atlas_serra_hist')) || [];
let serra_modo_atual = 'pedido'; 

// --- 2. CONTROLE DE ABAS ---
function mudarAbaSerra(aba) {
    document.getElementById('aba-serra-producao').style.display = aba === 'producao' ? 'block' : 'none';
    document.getElementById('aba-serra-historico').style.display = aba === 'historico' ? 'block' : 'none';
    
    document.getElementById('tab-serra-prod').classList.toggle('active', aba === 'producao');
    document.getElementById('tab-serra-hist').classList.toggle('active', aba === 'historico');

    if(aba === 'historico') listarHistoricoSerra();
}

// --- 3. LÓGICA DE PRODUÇÃO ---
function iniciarProducaoSerra() {
    const tipo = document.getElementById('serra-tipo-chapa').value;
    const esp = document.getElementById('serra-espessura').value;

    if (!tipo || !esp) return alert("Selecione Tipo e Espessura!");

    document.getElementById('serra-setup-header').style.display = 'none';
    document.getElementById('serra-form-lancamento').style.display = 'block';
    document.getElementById('lista-serra-temp').style.display = 'block';
    
    document.getElementById('resumo-config-ativa').innerText = `AGORA: ${tipo} ${esp}mm`;
    selecionarModoSerra(serra_modo_atual);
    atualizarListaSerra();
}

function selecionarModoSerra(modo) {
    serra_modo_atual = modo;
    const campos = document.getElementById('campos-dinamicos-serra');
    const rals = `<option value="9010">9010</option><option value="3009">3009</option><option value="9005">9005</option><option value="7016">7016</option>`;

    if (modo === 'pedido') {
        campos.innerHTML = `
            <input type="text" id="serra-pedido" placeholder="Nº Pedido" style="width:100%; margin-bottom:10px; background:#444; color:white; padding:10px; border:1px solid #666;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                <select id="serra-ral-sup" style="background:#444; color:white; padding:10px;">${rals}</select>
                <select id="serra-ral-inf" style="background:#444; color:white; padding:10px;">${rals}</select>
            </div>
            <input type="number" id="serra-comp" placeholder="Metros" oninput="calcSerraPrevia()" style="width:100%; background:#444; color:white; padding:10px; border:1px solid #666;">
            <input type="hidden" id="serra-qtd" value="1">
            <div id="serra-previa" style="text-align:right; color:#4caf50; font-size:12px; margin-top:5px;">Total: 0.00m</div>
        `;
    } else {
        campos.innerHTML = `
            <select id="serra-qualidade" onchange="toggleSerraDescarte(this.value)" style="width:100%; margin-bottom:10px; background:#444; color:white; padding:10px;">
                <option value="P1">P1</option><option value="P2">P2</option><option value="PPC">PPC</option><option value="Descarte">Descarte</option>
            </select>
            <div id="area-stock-rals" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                <select id="serra-ral-sup" style="background:#444; color:white; padding:10px;">${rals}</select>
                <select id="serra-ral-inf" style="background:#444; color:white; padding:10px;">${rals}</select>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <input type="number" id="serra-qtd" placeholder="Qtd" oninput="calcSerraPrevia()" style="background:#444; color:white; padding:10px; border:1px solid #666;">
                <input type="number" id="serra-comp" placeholder="Metros" oninput="calcSerraPrevia()" style="background:#444; color:white; padding:10px; border:1px solid #666;">
            </div>
            <div id="serra-previa" style="text-align:right; color:#4caf50; font-size:12px; margin-top:5px;">Total: 0.00m</div>
        `;
    }
    document.getElementById('btn-modo-pedido').style.background = modo === 'pedido' ? '#2196f3' : '#444';
    document.getElementById('btn-modo-stock').style.background = modo === 'stock' ? '#2196f3' : '#444';
}

function calcSerraPrevia() {
    const q = parseFloat(document.getElementById('serra-qtd').value) || 0;
    const m = parseFloat(document.getElementById('serra-comp').value) || 0;
    document.getElementById('serra-previa').innerText = `Total: ${(q * m).toFixed(2)}m`;
}

function inserirLinhaSerra() {
    const m = parseFloat(document.getElementById('serra-comp').value);
    const q = parseFloat(document.getElementById('serra-qtd').value);
    const tipo = document.getElementById('serra-tipo-chapa').value;
    const esp = document.getElementById('serra-espessura').value;

    if (!m || !q) return alert("Preencha os valores corretamente!");

    let info = "";
    if (serra_modo_atual === 'pedido') {
        const ped = document.getElementById('serra-pedido').value || "S/N";
        info = `PED: ${ped} | RAL: ${document.getElementById('serra-ral-sup').value}/${document.getElementById('serra-ral-inf').value}`;
    } else {
        const qual = document.getElementById('serra-qualidade').value;
        info = qual === 'Descarte' ? `DESCARTE` : `${qual} | RAL: ${document.getElementById('serra-ral-sup').value}/${document.getElementById('serra-ral-inf').value}`;
    }

    db_serra_live.push({
        tipo, esp, detalhes: info, metros: (m * q).toFixed(2),
        hora: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
    });
    
    localStorage.setItem('atlas_serra_live', JSON.stringify(db_serra_live));
    document.getElementById('serra-comp').value = "";
    if(serra_modo_atual === 'stock') document.getElementById('serra-qtd').value = "";
    document.getElementById('serra-previa').innerText = "Total: 0.00m";
    atualizarListaSerra();
}

function atualizarListaSerra() {
    const corpo = document.getElementById('tabela-serra-corpo');
    let totalGeral = 0;
    let html = "";
    const espessuras = [...new Set(db_serra_live.map(it => it.esp))];

    espessuras.forEach(e => {
        const itens = db_serra_live.filter(it => it.esp === e);
        let sub = 0;
        html += `<div style="background:#444; color:#ffeb3b; padding:8px; margin-top:10px; border-radius:4px;">ESPESSURA: ${e}mm</div>`;
        itens.forEach(it => {
            sub += parseFloat(it.metros);
            totalGeral += parseFloat(it.metros);
            html += `
                <div style="background:#333; padding:10px; margin-top:5px; display:flex; justify-content:space-between; border-radius:4px; border-left:4px solid #c41e24;">
                    <span>${it.metros}m - <small>${it.detalhes}</small></span>
                    <button onclick="removerItemSerra(${db_serra_live.indexOf(it)})" style="color:red; background:none; border:none; font-weight:bold; cursor:pointer;">X</button>
                </div>`;
        });
        html += `<div style="text-align:right; font-size:11px; color:#4caf50;">Sub-total ${e}mm: ${sub.toFixed(2)}m</div>`;
    });

    corpo.innerHTML = html;
    document.getElementById('soma-metros-serra').innerText = totalGeral.toFixed(2);
}

function removerItemSerra(i) {
    db_serra_live.splice(i, 1);
    localStorage.setItem('atlas_serra_live', JSON.stringify(db_serra_live));
    atualizarListaSerra();
}

function finalizarEspessuraSerra() {
    if(confirm("Mudar espessura? A lista atual será mantida.")) {
        document.getElementById('serra-form-lancamento').style.display = 'none';
        document.getElementById('serra-setup-header').style.display = 'block';
    }
}

function fecharDiaSerra() {
    if (db_serra_live.length === 0) return alert("Lista vazia!");
    if (confirm("Encerrar dia e gerar relatório?")) {
        const rel = {
            data: new Date().toLocaleDateString(),
            total_geral: document.getElementById('soma-metros-serra').innerText,
            itens: [...db_serra_live]
        };
        db_serra_hist.push(rel);
        localStorage.setItem('atlas_serra_hist', JSON.stringify(db_serra_hist));
        db_serra_live = [];
        localStorage.setItem('atlas_serra_live', "[]");
        location.reload();
    }
}

function listarHistoricoSerra() {
    const lista = document.getElementById('lista-historico-serra');
    if (db_serra_hist.length === 0) {
        lista.innerHTML = "<p style='text-align:center; padding:20px;'>Sem registros.</p>";
        return;
    }
    lista.innerHTML = db_serra_hist.map((h, i) => `
        <div onclick='gerarPDFSerra(${i})' style="background:#333; padding:15px; margin-bottom:10px; border-radius:8px; cursor:pointer; border-left:5px solid #c41e24;">
            <strong>Data: ${h.data}</strong> | <span style="color:#4caf50;">Total: ${h.total_geral}m</span>
        </div>
    `).reverse().join('');
}

function gerarPDFSerra(index) {
    const rel = db_serra_hist[index];
    const janela = window.open('', '_blank');
    const espessuras = [...new Set(rel.itens.map(it => it.esp))];
    let tabelas = "";

    espessuras.forEach(e => {
        const itens = rel.itens.filter(it => it.esp === e);
        let sub = 0;
        tabelas += `
            <h3 style="background:#eee; padding:5px;">ESPESSURA: ${e}mm</h3>
            <table border="1" style="width:100%; border-collapse:collapse; margin-bottom:10px;">
                <tr><th>Hora</th><th>Tipo</th><th>Detalhes</th><th>Metros</th></tr>
                ${itens.map(it => {
                    sub += parseFloat(it.metros);
                    return `<tr><td align="center">${it.hora}</td><td align="center">${it.tipo}</td><td>${it.detalhes}</td><td align="center">${it.metros}m</td></tr>`;
                }).join('')}
                <tr style="background:#f9f9f9;"><td colspan="3" align="right"><b>Sub-total ${e}mm:</b></td><td align="center"><b>${sub.toFixed(2)}m</b></td></tr>
            </table>`;
    });

    janela.document.write(`
        <html><body style="font-family:sans-serif; padding:20px;">
            <h1 style="text-align:center; border-bottom:2px solid #c41e24;">RELATÓRIO SERRA - ${rel.data}</h1>
            ${tabelas}
            <div style="margin-top:20px; text-align:right; font-size:1.5rem; border-top:2px solid #000;">
                TOTAL GERAL DO DIA: <strong>${rel.total_geral} metros</strong>
            </div>
            <script>window.print();</script>
        </body></html>`);
}

function toggleSerraDescarte(v) {
    document.getElementById('area-stock-rals').style.display = v === 'Descarte' ? 'none' : 'grid';
}
// --- CORREÇÃO DA FUNÇÃO DE FECHAR DIA (SEM DESLOGAR) ---
function fecharDiaSerra() {
    if (db_serra_live.length === 0) return alert("Lista vazia!");
    
    if (confirm("Encerrar produção e salvar no histórico?")) {
        // Calcula o total real antes de salvar
        const totalCalculado = document.getElementById('soma-metros-serra').innerText;
        
        const rel = {
            data: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            total_geral: totalCalculado, // Nome exato para o PDF não dar undefined
            itens: [...db_serra_live]
        };

        db_serra_hist.push(rel);
        localStorage.setItem('atlas_serra_hist', JSON.stringify(db_serra_hist));
        
        // Limpa a lista live
        db_serra_live = [];
        localStorage.setItem('atlas_serra_live', "[]");

        alert("Produção finalizada com sucesso!");
        
        // Em vez de location.reload() (que desloga), apenas limpamos a tela e mudamos de aba
        atualizarListaSerra();
        document.getElementById('serra-form-lancamento').style.display = 'none';
        document.getElementById('serra-setup-header').style.display = 'block';
        mudarAbaSerra('historico'); 
    }
}

// --- CORREÇÃO DO PDF (PARA MOSTRAR OS METROS CORRETAMENTE) ---
function gerarPDFSerra(index) {
    const rel = db_serra_hist[index];
    const janela = window.open('', '_blank');
    
    // Identificar espessuras únicas
    const espessuras = [...new Set(rel.itens.map(it => it.esp))];
    let tabelas = "";
    let somaTotalConfirmada = 0;

    espessuras.forEach(e => {
        const itens = rel.itens.filter(it => it.esp === e);
        let sub = 0;
        
        tabelas += `
            <h3 style="background:#eee; padding:8px; border-left:5px solid #c41e24; font-family:sans-serif;">ESPESSURA: ${e}mm</h3>
            <table border="1" style="width:100%; border-collapse:collapse; font-family:sans-serif; margin-bottom:10px;">
                <tr style="background:#f4f4f4;">
                    <th style="padding:8px;">Hora</th>
                    <th style="padding:8px;">Tipo</th>
                    <th style="padding:8px;">Detalhes</th>
                    <th style="padding:8px;">Metros</th>
                </tr>
                ${itens.map(it => {
                    const m = parseFloat(it.metros) || 0;
                    sub += m;
                    somaTotalConfirmada += m;
                    return `<tr>
                        <td align="center" style="padding:5px;">${it.hora || '--:--'}</td>
                        <td align="center" style="padding:5px;">${it.tipo || 'Serra'}</td>
                        <td style="padding:5px;">${it.detalhes}</td>
                        <td align="center" style="padding:5px;">${m.toFixed(2)}m</td>
                    </tr>`;
                }).join('')}
                <tr style="background:#fff9c4;">
                    <td colspan="3" align="right" style="padding:8px;"><b>Sub-total ${e}mm:</b></td>
                    <td align="center"><b>${sub.toFixed(2)}m</b></td>
                </tr>
            </table>`;
    });

    // Se o total_geral veio errado do banco, usamos a soma total confirmada agora
    const totalExibir = rel.total_geral && rel.total_geral !== "undefined" ? rel.total_geral : somaTotalConfirmada.toFixed(2);

    janela.document.write(`
        <html>
        <head><title>Relatório Serra</title></head>
        <body style="padding:20px; font-family:sans-serif;">
            <h1 style="text-align:center; border-bottom:2px solid #c41e24; padding-bottom:10px;">RELATÓRIO SERRA - ${rel.data}</h1>
            ${tabelas}
            <div style="margin-top:20px; text-align:right; font-size:1.4rem; border-top:2px solid #000; padding-top:10px;">
                TOTAL GERAL DO DIA: <strong>${totalExibir} metros</strong>
            </div>
            <script>window.print();</script>
        </body>
        </html>`);
    janela.document.close();
}
// --- FUNÇÃO PARA GERAR PDF (AGORA COM LOGOTIPO) ---
function gerarRelatorioSerra(rel) {
    const janela = window.open('', '_blank');
    
    // Identificar espessuras únicas
    const espessuras = [...new Set(rel.itens.map(it => it.esp))];
    let tabelas = "";
    let somaTotalConfirmada = 0;

    espessuras.forEach(e => {
        const itens = rel.itens.filter(it => it.esp === e);
        let sub = 0;
        
        tabelas += `
            <h3 style="background:#eee; padding:8px; border-left:5px solid #c41e24; font-family:sans-serif; margin-top:20px;">ESPESSURA: ${e}mm</h3>
            <table border="1" style="width:100%; border-collapse:collapse; font-family:sans-serif; margin-bottom:10px;">
                <tr style="background:#f4f4f4;">
                    <th style="padding:8px; width: 10%;">Hora</th>
                    <th style="padding:8px; width: 15%;">Tipo</th>
                    <th style="padding:8px;">Detalhes</th>
                    <th style="padding:8px; width: 15%;">Metros</th>
                </tr>
                ${itens.map(it => {
                    const m = parseFloat(it.metros) || 0;
                    sub += m;
                    somaTotalConfirmada += m;
                    return `<tr>
                        <td align="center" style="padding:5px;">${it.hora || '--:--'}</td>
                        <td align="center" style="padding:5px;">${it.tipo || 'Serra'}</td>
                        <td style="padding:5px;">${it.detalhes}</td>
                        <td align="center" style="padding:5px;">${m.toFixed(2)}m</td>
                    </tr>`;
                }).join('')}
                <tr style="background:#fff9c4;">
                    <td colspan="3" align="right" style="padding:8px;"><b>Sub-total ${e}mm:</b></td>
                    <td align="center"><b>${sub.toFixed(2)}m</b></td>
                </tr>
            </table>`;
    });

    // Se o total_geral veio errado do banco, usamos a soma total confirmada agora
    const totalExibir = rel.total_geral && rel.total_geral !== "undefined" ? rel.total_geral : somaTotalConfirmada.toFixed(2);

    janela.document.write(`
        <html>
        <head>
            <title>Relatório Serra Atlas Painel</title>
            <style>
                body { padding: 20px; font-family: sans-serif; color: #333; }
                
                /* Estilização do Cabeçalho com Logo */
                .cabecalho {
                    display: flex;
                    align-items: center; /* Alinha o logo e o título verticalmente */
                    justify-content: space-between; /* Espaça o logo e o título */
                    border-bottom: 3px solid #c41e24; /* Linha decorativa vermelha */
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                
                .logo-container img {
                    max-height: 60px; /* Limita a altura do logo para não ocupar muito espaço */
                    display: block;
                }
                
                .titulo-container h1 {
                    margin: 0;
                    font-size: 1.6rem;
                    text-align: right; /* Título alinhado à direita */
                }
                
                .info-relatorio {
                    margin-top: 5px;
                    font-size: 1.1rem;
                }

                .total-container {
                    margin-top: 30px;
                    text-align: right;
                    font-size: 1.5rem;
                    border-top: 2px solid #000;
                    padding-top: 15px;
                }

                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="cabecalho">
                <div class="logo-container">
                    <src="img/logo.png" alt="Logo Atlas Painel">
                    </div>
                <div class="titulo-container">
                    <h1>RELATÓRIO DE PRODUÇÃO - SERRA</h1>
                    <div class="info-relatorio">
                        Data: <strong>${rel.data}</strong> | Operador: <strong>${rel.operador}</strong>
                    </div>
                </div>
            </div>

            ${tabelas}

            <div class="total-container">
                TOTAL GERAL DO DIA: <strong>${totalExibir} metros</strong>
            </div>

            <button onclick="window.print()" class="no-print" style="margin-top: 25px; padding: 12px 24px; background: #c41e24; color: white; border: none; cursor: pointer; border-radius: 5px; font-weight: bold;">
                🖨️ Imprimir / Salvar PDF
            </button>
        </body>
        </html>`);
    janela.document.close();
}
function gerarPDFSerra(index) {
    const rel = db_serra_hist[index];
    const janela = window.open('', '_blank');
    
    // Identificar espessuras únicas
    const espessuras = [...new Set(rel.itens.map(it => it.esp))];
    let tabelas = "";
    let somaTotalConfirmada = 0;

    espessuras.forEach(e => {
        const itens = rel.itens.filter(it => it.esp === e);
        let sub = 0;
        
        tabelas += `
            <h3 style="background:#f4f4f4; padding:8px; border-left:5px solid #c41e24; font-family:sans-serif; margin-top:20px;">ESPESSURA: ${e}mm</h3>
            <table border="1" style="width:100%; border-collapse:collapse; font-family:sans-serif; margin-bottom:10px;">
                <tr style="background:#eee;">
                    <th style="padding:8px; width: 10%;">Hora</th>
                    <th style="padding:8px; width: 15%;">Tipo</th>
                    <th style="padding:8px;">Detalhes</th>
                    <th style="padding:8px; width: 15%;">Metros</th>
                </tr>
                ${itens.map(it => {
                    const m = parseFloat(it.metros) || 0;
                    sub += m;
                    somaTotalConfirmada += m;
                    return `<tr>
                        <td align="center" style="padding:5px;">${it.hora || '--:--'}</td>
                        <td align="center" style="padding:5px;">${it.tipo || 'Serra'}</td>
                        <td style="padding:5px;">${it.detalhes || it.detalhe}</td>
                        <td align="center" style="padding:5px;">${m.toFixed(2)}m</td>
                    </tr>`;
                }).join('')}
                <tr style="background:#fff9c4;">
                    <td colspan="3" align="right" style="padding:8px;"><b>Sub-total ${e}mm:</b></td>
                    <td align="center"><b>${sub.toFixed(2)}m</b></td>
                </tr>
            </table>`;
    });

    const totalExibir = rel.total_geral && rel.total_geral !== "undefined" ? rel.total_geral : somaTotalConfirmada.toFixed(2);

    janela.document.write(`
        <html>
        <head>
            <title>Relatório Serra Atlas Painel</title>
            <style>
                body { padding: 30px; font-family: sans-serif; color: #333; }
                .header-table { width: 100%; border-bottom: 3px solid #c41e24; margin-bottom: 20px; padding-bottom: 10px; }
                .logo { max-height: 80px; }
                .titulo-relatorio { text-align: right; }
                .titulo-relatorio h1 { margin: 0; color: #000; font-size: 22px; }
                .total-box { margin-top: 30px; text-align: right; font-size: 1.5rem; border-top: 2px solid #000; padding-top: 10px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td width="30%">
                        <img src="logo.png" class="logo" onerror="this.src='https://via.placeholder.com/150x60?text=Logo+Nao+Encontrado'">
                    </td>
                    <td class="titulo-relatorio">
                        <h1>RELATÓRIO DE PRODUÇÃO - SERRA</h1>
                        <p>Data: <strong>${rel.data}</strong> | Turno: <strong>Geral</strong></p>
                    </td>
                </tr>
            </table>

            ${tabelas}

            <div class="total-box">
                TOTAL GERAL DO DIA: <strong>${totalExibir} metros</strong>
            </div>

            <p style="margin-top: 60px; text-align: center;">________________________________________________<br>Assinatura Responsável</p>

            <button onclick="window.print()" class="no-print" style="margin-top: 20px; padding: 10px 20px; background: #c41e24; color: white; border: none; cursor: pointer; border-radius: 5px; font-weight: bold;">
                🖨️ IMPRIMIR RELATÓRIO
            </button>
        </body>
        </html>`);
    janela.document.close();
}
function fecharDiaSerra() {
    if (db_serra_live.length === 0) return alert("Não há produção para salvar!");

    if (confirm("Deseja encerrar a produção da Serra e gerar o relatório?")) {
        // Captura o nome do usuário logado (ajuste 'userLogado.nome' se sua variável for diferente)
        const nomeOperador = (typeof userLogado !== 'undefined' && userLogado.nome) ? userLogado.nome : "Operador Geral";

        const relatorio = {
            id: Date.now(),
            data: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            operador: nomeOperador, // Salva o nome do usuário aqui
            total_geral: document.getElementById('soma-metros-serra').innerText,
            itens: [...db_serra_live]
        };

        db_serra_hist.push(relatorio);
        localStorage.setItem('atlas_serra_hist', JSON.stringify(db_serra_hist));

        db_serra_live = [];
        localStorage.setItem('atlas_serra_live', JSON.stringify(db_serra_live));

        alert("Relatório salvo no histórico!");
        
        // Atualiza a tela sem dar reload (para não deslogar)
        atualizarListaSerra();
        document.getElementById('serra-form-lancamento').style.display = 'none';
        document.getElementById('serra-setup-header').style.display = 'block';
        mudarAbaSerra('historico');
    }
}
function gerarPDFSerra(index) {
    const rel = db_serra_hist[index];
    const janela = window.open('', '_blank');
    
    const espessuras = [...new Set(rel.itens.map(it => it.esp))];
    let tabelasHtml = "";
    let somaReal = 0;

    espessuras.forEach(esp => {
        const itensFiltrados = rel.itens.filter(it => it.esp === esp);
        let somaEsp = 0;

        tabelasHtml += `
            <div style="margin-top: 20px;">
                <h3 style="background: #f4f4f4; padding: 8px; border-left: 5px solid #c41e24; font-family: sans-serif;">
                    ESPESSURA: ${esp}mm
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
                    <thead>
                        <tr style="background: #eee;">
                            <th style="border: 1px solid #ddd; padding: 8px;">Hora</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Tipo</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Detalhes</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Metros</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itensFiltrados.map(it => {
                            const m = parseFloat(it.metros) || 0;
                            somaEsp += m;
                            somaReal += m;
                            return `
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align:center;">${it.hora || '--:--'}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align:center;">${it.tipo}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${it.detalhes || it.detalhe}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align:center;"><strong>${m.toFixed(2)} m</strong></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: #fff9c4;">
                            <td colspan="3" style="text-align: right; padding: 10px; font-weight: bold;">Subtotal ${esp}mm:</td>
                            <td style="text-align: center; border: 1px solid #ddd;"><strong>${somaEsp.toFixed(2)} m</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    });

    janela.document.write(`
        <html>
        <head>
            <title>Relatório Serra - Atlas Painel</title>
            <style>
                body { font-family: sans-serif; margin: 30px; color: #333; }
                .header-table { width: 100%; border-bottom: 3px solid #c41e24; margin-bottom: 20px; }
                .logo { max-height: 70px; }
                .footer { margin-top: 40px; text-align: right; font-size: 1.4rem; border-top: 2px solid #333; padding-top: 10px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td><img src="logo.png" class="logo" onerror="this.src='https://via.placeholder.com/150x60?text=ATLAS+PAINEL'"></td>
                    <td style="text-align: right;">
                        <h1 style="margin:0;">RELATÓRIO DE PRODUÇÃO - SERRA</h1>
                        <p style="margin:5px 0;">Data: <strong>${rel.data}</strong> | Operador: <strong>${rel.operador}</strong></p>
                    </td>
                </tr>
            </table>

            ${tabelasHtml}

            <div class="footer">
                TOTAL GERAL: <strong>${somaReal.toFixed(2)} metros</strong>
            </div>

            <p style="margin-top: 80px; text-align: center; font-size: 12px;">
                ________________________________________________<br>
                Assinatura de Conferência (${rel.operador})
            </p>

            <button onclick="window.print()" class="no-print" style="margin-top: 20px; padding: 12px; background: #c41e24; color: white; border: none; cursor: pointer; border-radius: 5px; font-weight: bold; width: 100%;">
                🖨️ IMPRIMIR / SALVAR PDF
            </button>
        </body>
        </html>
    `);
    janela.document.close();
}
