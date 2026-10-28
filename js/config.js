/* ==========================================================
   CONFIG.JS — TODOS OS TEXTOS EDITÁVEIS FICAM AQUI ❤️
   Troque as mensagens, piadas internas e lembranças à vontade.
   (Mantenha as aspas e as vírgulas no lugar!)
   ========================================================== */
window.CONFIG = {

  siteTitle: 'Um pedacinho do meu amor ❤️',

  /* ---------------- JOGO 1 — AMOR INFINITO ---------------- */
  game1: {
    completeAt: 500, // pontos para o jogo ser marcado como "concluído"
    completeText:
      'Você coletou amor suficiente para encher um universo... e mesmo assim ainda tem mais. ' +
      'O Amor Infinito está concluído, mas pode continuar coletando pelo tempo que quiser. 💗',

    // Uma mensagem aparece a cada 100 pontos (na ordem, e depois recomeça)
    messages: [
      'Meu amor por você não tem fim.',
      'Você é meu lugar favorito.',
      'Se eu pudesse escolher de novo, escolheria você.',
      'Até no infinito, eu continuaria escolhendo você.',
      'Seu sorriso é o meu pôr do sol favorito.',
      'Com você, até segunda-feira fica bonita.',
      'Você é a minha parte favorita de todos os dias.',
      'Cada coração aqui é um pedacinho do que sinto por você.'
    ],

    // Mensagens especiais (aparecem ao atingir a pontuação, com efeitos extras)
    specials: [
      { at: 300,  text: '✨ 300 pontos! A noite chegou, e você continua brilhando mais que as estrelas.' },
      { at: 500,  text: '💗 500 pontos! Você completou o Amor Infinito! Mas o amor... esse continua.' },
      { at: 1000, text: '🌌 1000 pontos! Já estamos no universo, e você ainda é a coisa mais linda que eu vejo.' },
      { at: 2000, text: '🚀 2000! Nem o universo é grande o bastante para caber o que eu sinto por você.' },
      { at: 4000, text: '♾️ 4000! Você é oficialmente a pessoa que mais coleta amor no mundo.' }
    ]
  },

  /* ---------------- JOGO 2 — MÁQUINA DE PRESENTES ---------------- */
  game2: {
    machineTitle: 'PRESENTES',
    startTries: 5,   // fichas iniciais
    coinTries: 3,    // fichas ganhas ao pegar a moeda dourada
    noTriesText:
      'Sem fichas! Mas calma: peça uma ficha ao Manu. Aperte PEGAR bem na hora em que ' +
      'a barrinha passar pela zona verde.',

    // type: teddy | heart | flower | star | gift | cat | bunny | cupcake
    // difficulty: 0 (fácil) a 1 (bem difícil). Acima de 0.6 o presente fica balançando!
    // kind: o tipo do presente (aparece como etiqueta)
    prizes: [
      { id: 'ursinho',  type: 'teddy',   name: 'Ursinho do Abraço',   kind: 'Elogio',
        difficulty: 0.2,
        text: 'Você tem o sorriso mais bonito que eu já vi.' },
      { id: 'coracao',  type: 'heart',   name: 'Coração Gigante',     kind: 'Declaração',
        difficulty: 0.3,
        text: 'Eu te amo, no vazio e na existência, em todos os planos.' },
      { id: 'flor',     type: 'flower',  name: 'Florzinha',           kind: 'Lembrança',
        difficulty: 0.35,
        text: 'Lembra quando comemos sushi juntos, eu estava caidinho por você' },
      { id: 'estrela',  type: 'star',    name: 'Estrela Fujona',      kind: 'Lembrança',
        difficulty: 0.75,
        text: 'Você não é pescoço, mas mexeu com a minha cabeça.' },
      { id: 'presente', type: 'gift',    name: 'Presente Misterioso', kind: 'Mensagem surpresa',
        difficulty: 0.5,
        text: 'Surpresa! Você ganhou um vale-abraço de 30 séculos. Pode resgatar quando quiser.' },
      { id: 'gatinho',  type: 'cat',     name: 'Gatinho Dengoso',     kind: 'Elogio',
        difficulty: 0.45,
        text: 'Você é a pessoa mais gentil e engraçada que eu conheço. E ainda é linda!' },
      { id: 'coelho',   type: 'bunny',   name: 'Coelhinho Apaixonado', kind: 'Declaração',
        difficulty: 0.55,
        text: 'Todo dia eu escolho você de novo, e sempre vou escolher.' },
      { id: 'cupcake',  type: 'cupcake', name: 'Cupcake de Amor',     kind: 'Lembrança',
        difficulty: 0.4,
        text: 'Nossa saudade tem gosto de coisa boa. Obrigado por cada momento ao seu lado.' }
    ],

    allDoneTitle: 'Coleção completa! 🎁',
    allDoneText:
      'Você pegou TODOS os presentes! Mas o maior presente é ter você na minha vida. 💗'
  },

  /* ---------------- JOGO 3 — RESGATE DO MANU ---------------- */
  game3: {
    villain: 'Barão Bananão', // nome do vilão (personagem fictício)
    intro:
      'O Emanuel foi capturado pelo Barão Bananão e está preso lá no topo! ' +
      'Suba as plataformas, pule os barris e salve o seu amor!',

    // Balões que o vilão e o Manu falam durante a fase (rodam em ciclo)
    bossTaunts: [
      'MUAHAHA! Ele é meu!',
      'Rolem os barris!',
      'Ninguém passa pelo Barão!',
      'Eu vou tirar o Bolsonaro da cadeia!',
      'Af, que saco...'
    ],
    manuCries: [
      'SOCORRO!',
      'Isa, me salva!',
      'Tô com sdds!',
      'Esse macaco é miliciano!',
      'Eu sabia que você vinha!'
    ],

    // Diálogo da cena final (who: "boss" ou "isa")
    cutscene: [
      { who: 'boss', text: 'QUÊ?! Você chegou até aqui?! Af, que saco!' },
      { who: 'isa',  text: 'Solta o meu amor agora, Barão Bananão!' },
      { who: 'boss', text: 'Nunca! Eu vou acabar com todos os esquerdistas!' },
      { who: 'isa',  text: 'Ah não, é um macaco de direita!!' },
      { who: 'boss', text: 'Você não é pareo para mim hahahahaha' },
      { who: 'isa',  text: 'Posso não ser, mas juntinhos, nosso amor ganha de tudo!' }
    ],
    actionPrompt: 'Aperte AÇÃO (ESPAÇO) para usar o amor de vocês',
    hitLines: [
      'Ai! Que fofo!',
      'Para! O amor de vocês é muito forte!',
      'Não aguento tanto amor!!'
    ],
    exitLine: 'Vou morar nos EUA!!',
    manuLine: 'Amor! Eu sabia que você vinha!',
    endTitle: 'Resgate concluído!',
    endMessage: 'Resgate concluído! O amor venceu e eles viveram felizes para sempre.',
    gameOverText: 'O Barão Bananão deu uma gargalhada... mas a minha princesa nunca desiste! Tente de novo!'
  },

  /* ---------------- SURPRESA FINAL ---------------- */
  finalTitle: 'Para o meu amor ❤️',
  finalText:
    'Amor, esses joguinhos são pequenos, mas foram feitos pensando em você. ' +
    'Meu amor por você não cabe em um jogo, nem em um universo inteiro. ' +
    'Obrigado por fazer parte da minha vida. Eu te escolheria em todas as fases.'
};
