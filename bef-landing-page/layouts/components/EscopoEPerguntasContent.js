export const trustedCompanies = [
  "ArcelorMittal",
  "Chevron",
  "Volkswagen",
  "Nissan",
  "Hyundai Heavy Industries",
  "Meritor",
  "Texaco",
  "IMBEL",
];

export const comparisonRows = [
  {
    criterion: "Aceito em auditoria ISO 9001 / 17025",
    kometro: "Sem ressalvas",
    other: "Pode ser questionado",
  },
  {
    criterion: "Rastreabilidade documentada ao Inmetro",
    kometro: "Garantida",
    other: "Não comprovável",
  },
  {
    criterion: "Escopo verificável no site do Inmetro",
    kometro: "Sim, público",
    other: "Não",
  },
  {
    criterion: "Risco de não-conformidade / reprovação",
    kometro: "Mínimo",
    other: "Alto",
  },
  {
    criterion: "Custo de refazer e parar a auditoria",
    kometro: "Evitado",
    other: "Provável",
  },
];

export const differentials = [
  {
    title: "Acreditação RBC 0686",
    description:
      "Certificados sob acreditação Inmetro, com rastreabilidade documentada e escopo público — o que sustenta sua conformidade em qualquer auditoria.",
  },
  {
    title: "Logística facilitada",
    description:
      "Retiramos e devolvemos os instrumentos na sua planta pela nossa rota. Sua equipe não desloca, a operação não para e você ganha tempo.",
  },
  {
    title: "Prazo reduzido",
    description:
      "Tempo de calibração abaixo da média regional. Você recebe os certificados a tempo do vencimento e da auditoria.",
  },
  {
    title: "Gestão metrológica",
    description:
      "Organizamos seu parque de instrumentos com alertas de vencimento pela plataforma Kometro. Nunca mais pego por certificado vencido.",
  },
  {
    title: "Consultoria e auditoria",
    description:
      "Apoio técnico em ISO/IEC 17025 e ISO 9001. Você fala com quem entende de metrologia, não com atendente de balcão.",
  },
  {
    title: "Aprovado por quem exige",
    description:
      "Montadoras, siderúrgicas e óleo & gás calibram com a Kometro porque a conformidade delas não pode escorregar.",
  },
];

export const scopeGroups = [
  {
    name: "Dimensional",
    badge: "Acreditado RBC",
    accredited: true,
    description:
      "Paquímetros, micrômetros e relógios comparadores fora de calibração comprometem todo o seu controle dimensional — e são o primeiro alvo do auditor. Calibramos com rastreabilidade RBC e certificado a tempo do vencimento.",
    instruments: [
      "Paquímetro",
      "Micrômetro",
      "Medidor de altura",
      "Relógio comparador",
      "Bloco padrão",
      "Calibrador de rosca",
      { name: "Trena / Trena a laser", label: "Trena · a laser" },
      "Goniômetro",
      "Calibre de folga",
      {
        name: "Medidor de espessura de camada de tinta seca",
        label: "Espessura de tinta seca",
      },
      "Anel padrão",
      {
        name: "Calibrador tampão liso / passa-não-passa",
        label: "Calibrador tampão / passa-não-passa",
      },
      "Peneira granulométrica",
      "Projetor de perfil",
    ],
    ctaLabel: "Não achou o seu? Fale com a gente",
    ctaInstrument: "instrumentos da área Dimensional",
  },
  {
    name: "Massa",
    badge: "Acreditado RBC",
    accredited: true,
    description:
      "Balança descalibrada é matéria-prima perdida, dosagem errada e não-conformidade na hora da pesagem. Calibração acreditada de balanças e pesos padrão (classes M1, M2 e M3) para produção e laboratório.",
    instruments: [
      "Balança",
      {
        name: "Pesos padrão (M1 / M2 / M3)",
        label: "Pesos padrão M1/M2/M3",
      },
      "Massa diversa",
    ],
    ctaLabel: "Não achou o seu? Fale com a gente",
    ctaInstrument: "instrumentos da área Massa",
  },
  {
    name: "Pressão",
    badge: "Acreditado RBC",
    accredited: true,
    description:
      "Manômetro fora de faixa é risco de segurança e de processo — e reprovação certa em auditoria. Calibração RBC de manômetros, transdutores, pressostatos e válvulas de segurança, com laudo rastreável ao Inmetro.",
    instruments: [
      { name: "Manômetro analógico ou digital", label: "Manômetro" },
      "Transdutor de pressão",
      "Pressostato",
      "Vacuômetro",
      "Válvula de segurança",
    ],
    ctaLabel: "Não achou o seu? Fale com a gente",
    ctaInstrument: "instrumentos da área Pressão",
  },
  {
    name: "Temperatura",
    badge: "Acreditado RBC",
    accredited: true,
    description:
      "Controle térmico confiável depende de sensor calibrado — crítico para farma, alimentício e tratamento térmico. Calibramos termômetros, termopares, PT100, infravermelho e câmaras climáticas/estufas.",
    instruments: [
      "Termohigrômetro",
      {
        name: "Termômetro de líquido ou mecânico",
        label: "Termômetro líquido/mecânico",
      },
      "Termopar",
      { name: "Termorresistência PT100", label: "PT100" },
      { name: "Termômetro infravermelho", label: "Infravermelho" },
      "Câmara climática / estufa",
    ],
    ctaLabel: "Não achou o seu? Fale com a gente",
    ctaInstrument: "instrumentos da área Temperatura",
  },
  {
    name: "Torque",
    badge: "Rastreável",
    accredited: false,
    description:
      "Aperto fora de especificação gera retrabalho, folga e falha de montagem. Calibração de torquímetros com rastreabilidade para linhas de montagem e manutenção industrial.",
    instruments: [
      "Torquímetro",
      "Torquímetro de estalo",
      "Torquímetro digital",
    ],
    ctaLabel: "Não achou o seu? Fale com a gente",
    ctaInstrument: "instrumentos da área Torque",
  },
  {
    name: "Outras grandezas",
    badge: "Volume · Dureza · Elétrica · Físico-química",
    accredited: false,
    description:
      "Também atendemos Volume (vidraria e micropipetas), Dureza, grandezas elétricas, calibre de solda e serviços físico-químicos rastreáveis. Se o seu instrumento não está nas áreas acima, envie a lista que confirmamos item a item.",
    instruments: [
      {
        name: "Micropipeta / vidraria (Volume)",
        label: "Micropipeta / vidraria",
      },
      { name: "Durômetro (Rockwell / Shore)", label: "Durômetro" },
      {
        name: "Multímetro / alicate amperímetro",
        label: "Multímetro",
      },
      "Calibre de solda",
      "pHmetro",
      "Refratômetro",
      "Condutivímetro",
      "Cronômetro",
    ],
    ctaLabel: "Enviar minha lista de instrumentos",
    ctaInstrument: "outras grandezas",
  },
];

export const testimonials = [
  {
    initials: "VW",
    quote:
      "Fornecedor confiável e comprometido com a qualidade. Excelente atendimento e cumpre rigorosamente os prazos acordados.",
    name: "Júlia Graziella",
    company: "Volkswagen",
  },
  {
    initials: "AM",
    quote:
      "Compromisso com o cliente, cumpre os prazos e presta um serviço de qualidade e excelência.",
    name: "Sheila Patrícia",
    company: "ArcelorMittal · Barra Mansa",
  },
  {
    initials: "NI",
    quote:
      "Empresa muito atenciosa e ágil no atendimento. Trabalho de qualidade que superou nossas expectativas.",
    name: "Jean",
    company: "Nissan",
  },
  {
    initials: "IM",
    quote:
      "Suporte fantástico e atendimento rápido. Ficamos felizes com os serviços e o comprometimento para conosco.",
    name: "Rosimara Magalhães",
    company: "IMBEL",
  },
];

export const processSteps = [
  {
    title: "Você solicita",
    description:
      "Envia a lista de instrumentos pelo WhatsApp ou formulário. Retornamos com orçamento no mesmo dia útil.",
  },
  {
    title: "Coletamos",
    description:
      "Retiramos os instrumentos na sua planta pela nossa rota, sem você precisar deslocar equipe.",
  },
  {
    title: "Calibramos",
    description:
      "Calibração sob acreditação RBC, com prazo reduzido e emissão do certificado rastreável ao Inmetro.",
  },
  {
    title: "Devolvemos",
    description:
      "Instrumentos de volta na sua planta, com certificado válido para auditoria e alerta do próximo vencimento.",
  },
];

export const questions = [
  {
    question: "O que é acreditação RBC e por que importa para minha auditoria?",
    answer:
      "RBC é a Rede Brasileira de Calibração, coordenada pelo Inmetro. Um certificado acreditado RBC comprova, de forma documentada e rastreável, que a medição está ligada aos padrões nacionais — exatamente o que um auditor ISO 9001 ou 17025 exige. Sem acreditação, o certificado pode ser questionado ou reprovado, e você refaz tudo com a auditoria em andamento.",
  },
  {
    question: "O certificado da Kometro é mesmo rastreável ao Inmetro?",
    answer:
      "Sim. Nosso escopo de acreditação (RBC 0686) é público e verificável direto no site do Inmetro — você confere grandezas e faixas antes de fechar.",
    showAccreditationLink: true,
  },
  {
    question: "Preciso parar a produção ou deslocar equipe para calibrar?",
    answer:
      "Não. Coletamos e devolvemos os instrumentos na sua planta pela nossa rota na região. Sua equipe não perde tempo e a operação segue enquanto cuidamos da calibração.",
  },
  {
    question: "Com que frequência preciso recalibrar meus instrumentos?",
    answer:
      "Depende do instrumento, do uso e da sua norma interna — geralmente entre 6 e 12 meses. O que pega a maioria das empresas é perder o vencimento e descobrir na véspera da auditoria. Por isso controlamos seu parque com alerta de vencimento na plataforma Kometro: você recalibra no tempo certo, sem susto.",
  },
  {
    question: "Vocês calibram o meu tipo de instrumento?",
    answer:
      "Temos escopo acreditado em Dimensional, Massa, Pressão e Temperatura, além de calibração de Torque e outras grandezas rastreáveis. Mande sua lista no WhatsApp que confirmamos item a item.",
  },
  {
    question: "Qual o prazo e como recebo o orçamento?",
    answer:
      "Você envia a lista de instrumentos e retornamos com orçamento no mesmo dia útil. O prazo de calibração é abaixo da média regional. Atendemos o Sul Fluminense, Médio Paraíba e Vale do Paraíba.",
  },
];

export const cities = [
  "Volta Redonda",
  "Barra Mansa",
  "Resende",
  "Pinheiral",
  "Porto Real",
  "Vale do Paraíba (SP)",
  "Outra",
];
