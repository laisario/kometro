import Reveal from "@components/Reveal";
import {
  cities,
  comparisonRows,
  differentials,
  processSteps,
  questions,
  scopeGroups,
  testimonials,
  trustedCompanies,
} from "@components/EscopoEPerguntasContent";
import { Check, MessageCircle, Plus, X } from "lucide-react";
import { Fragment, useState } from "react";

const INMETRO_URL =
  "http://www.inmetro.gov.br/laboratorios/rbc/lista_laboratorios.asp?num_certificado=0686&";
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=5524988095115&text=";

const getWhatsappUrl = (message) =>
  `${WHATSAPP_URL}${encodeURIComponent(message)}`;

const budgetMessage =
  "Olá, preciso de um orçamento de calibração. Meus instrumentos: ";

const pageSections = [
  { id: "escopo", label: "Escopo" },
  { id: "diferenca", label: "Acreditado x Rastreável" },
  { id: "clientes", label: "Clientes" },
  { id: "faq", label: "Dúvidas" },
];

const PageNavigation = () => {
  const handleNavigation = (event, sectionId) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);

    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    window.history.pushState(null, "", `#${sectionId}`);
  };

  return (
    <nav
      aria-label="Navegação interna de Escopo e Perguntas"
      className="overflow-x-auto border-b border-gray-200 bg-white"
    >
      <div className="mx-auto flex w-max min-w-full items-center justify-center gap-6 px-4 py-4 sm:gap-8">
        {pageSections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(event) => handleNavigation(event, section.id)}
            className="shrink-0 whitespace-nowrap text-sm font-normal text-text transition hover:text-primary focus:text-primary active:text-primary md:text-base"
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
};

const SectionHeading = ({ eyebrow, title, description }) => (
  <Reveal className="mb-10 max-w-3xl md:mb-12">
    <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
      {eyebrow}
    </span>
    <h2 className="mb-3 mt-3">{title}</h2>
    {description && (
      <p className="text-base leading-relaxed text-text md:text-lg">
        {description}
      </p>
    )}
  </Reveal>
);

const WhatsAppButton = ({ children, message, className = "" }) => (
  <a
    href={getWhatsappUrl(message)}
    target="_blank"
    rel="noopener noreferrer"
    className={`btn btn-primary inline-flex items-center justify-center gap-2 ${className}`}
  >
    <MessageCircle aria-hidden="true" className="h-5 w-5" />
    {children}
  </a>
);

const Hero = () => {
  const scrollToScope = (event) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.getElementById("escopo")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[22px] overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(253,118,34,.55) 0 1.5px, transparent 1.5px 70px), repeating-linear-gradient(90deg, #e5e7eb 0 1px, transparent 1px 14px)",
        }}
      />
      <section className="section pb-6 pt-[62px]">
        <div className="grid items-center gap-9 lg:grid-cols-[1.16fr_0.84fr] lg:gap-[52px]">
          <div>
            <span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white py-2 pl-2 pr-4 text-[13px] font-bold text-text shadow-lg">
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-primary text-center text-[9px] font-bold leading-none text-primary">
                RBC
                <br />
                0686
              </span>
              Laboratório acreditado pela CGCRE/INMETRO
            </span>

            <p className="mb-2 mt-6 text-sm font-bold text-primary">
              Seu sucesso é a nossa medida.
            </p>
            <h1 className="mb-5 max-w-[760px] text-[clamp(2rem,4.7vw,3.125rem)]">
              Calibração de instrumentos de medição
            </h1>
            <p className="max-w-[620px] text-[clamp(1.03rem,1.5vw,1.16rem)] leading-relaxed text-text">
              Certificados rastreáveis à Rede Brasileira de Calibração e prazo
              reduzido, com{" "}
              <strong className="text-dark">
                coleta e devolução dos instrumentos na sua planta
              </strong>{" "}
              — sua equipe não desloca e a operação não para. Passe na auditoria
              com tranquilidade.
            </p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <WhatsAppButton message={budgetMessage}>
                Solicitar orçamento no WhatsApp
              </WhatsAppButton>
              <a
                href="#escopo"
                onClick={scrollToScope}
                className="btn inline-flex items-center rounded-[5px] border-primary bg-white text-dark transition hover:bg-orange-50 hover:text-primary"
              >
                Ver escopo de calibração
              </a>
            </div>
          </div>

          <Reveal className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 shadow-lg">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[5px]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #FD7622 0 1.5px, transparent 1.5px 12px)",
              }}
            />
            <h2 className="mb-1 text-base">Certificado de calibração</h2>
            <p className="mb-5 text-[13px] font-bold text-primary">
              acreditação CGCRE/INMETRO conforme{" "}
              <a
                href={INMETRO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition hover:text-orange-600"
              >
                escopo 0686
              </a>
            </p>
            {[
              ["Rastreabilidade", "Inmetro ✓", true],
              ["Válido em auditoria ISO 9001 / 17025", "Sim ✓", true],
              ["Prazo médio de entrega", "reduzido"],
              ["Logística de coleta e devolução", "na sua planta"],
            ].map(([label, value, positive], index) => (
              <div
                key={label}
                className={`flex items-center justify-between gap-5 py-3 text-sm ${
                  index ? "border-t border-gray-200" : ""
                }`}
              >
                <span className="text-gray-500">{label}</span>
                <strong
                  className={`text-right ${
                    positive ? "text-green-700" : "text-dark"
                  }`}
                >
                  {value}
                </strong>
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
};

const TrustBar = () => (
  <div className="rounded-xl border-y border-gray-200 bg-[#F5F5F5] px-4 py-9">
    <p className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
      Confiança de indústrias que não podem falhar em auditoria
    </p>
    <Reveal
      as="ul"
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8"
    >
      {trustedCompanies.map(({ name, image }) => (
        <li
          key={name}
          className="flex min-h-[64px] items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-center"
        >
          {image ? (
            <img
              src={image}
              alt={`Logo ${name}`}
              className="h-10 w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-sm font-bold text-text">{name}</span>
          )}
        </li>
      ))}
    </Reveal>
  </div>
);

const Comparison = () => (
  <section
    id="diferenca"
    className="section mt-16 scroll-mt-24 rounded-xl border-y border-gray-200 bg-[#F5F5F5] px-4 sm:px-8"
  >
    <SectionHeading
      eyebrow="A conta que ninguém faz"
      title="Laboratório acreditado na 17025 pela CGCRE/INMETRO não é a mesma coisa que rastreável à RBC."
      description="Na hora de comparar três cotações, o preço parece próximo. Na hora da auditoria, a diferença aparece — e refazer sai muito mais caro. Veja o que está em jogo:"
    />

    <Reveal className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg md:grid md:grid-cols-[1.4fr_1fr_1fr]">
      <div className="border-b border-gray-300 p-4 text-sm font-bold text-gray-500">
        Critério
      </div>
      <div className="border-b border-gray-300 bg-green-50 p-4 text-sm font-bold text-dark">
        Kometro · RBC 0686
      </div>
      <div className="border-b border-gray-300 p-4 text-sm font-bold text-gray-500">
        Lab. sem acreditação
      </div>
      {comparisonRows.map((row) => (
        <Fragment key={row.criterion}>
          <div className="flex items-center border-b border-gray-200 p-4 text-sm font-bold text-dark last:border-b-0">
            {row.criterion}
          </div>
          <div className="flex items-center gap-2 border-b border-gray-200 bg-green-50 p-4 text-sm text-dark">
            <Check
              aria-hidden="true"
              className="h-4 w-4 flex-none text-green-600"
            />
            {row.kometro}
          </div>
          <div className="flex items-center gap-2 border-b border-gray-200 p-4 text-sm text-gray-500">
            <X aria-hidden="true" className="h-4 w-4 flex-none text-red-500" />
            {row.other}
          </div>
        </Fragment>
      ))}
    </Reveal>

    <div className="space-y-3 md:hidden">
      {comparisonRows.map((row) => (
        <Reveal
          key={row.criterion}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <h3 className="bg-gray-50 p-4 text-base">{row.criterion}</h3>
          <div className="flex items-center gap-2 border-t border-gray-200 bg-green-50 p-4 text-sm">
            <Check
              aria-hidden="true"
              className="h-4 w-4 flex-none text-green-600"
            />
            <strong className="text-primary">Kometro (RBC):</strong>{" "}
            {row.kometro}
          </div>
          <div className="flex items-center gap-2 border-t border-gray-200 p-4 text-sm text-gray-500">
            <X aria-hidden="true" className="h-4 w-4 flex-none text-red-500" />
            <strong className="text-red-500">Sem acreditação:</strong>{" "}
            {row.other}
          </div>
        </Reveal>
      ))}
    </div>

    <Reveal
      as="p"
      className="mt-6 border-l-4 border-primary pl-5 text-lg font-bold text-dark md:text-xl"
    >
      Calibrar barato e ter o certificado recusado na auditoria é o cálculo mais
      caro que existe.
    </Reveal>
  </section>
);

const Differentials = () => (
  <section id="diferenciais" className="section scroll-mt-24">
    <SectionHeading
      eyebrow="Por que a Kometro"
      title="O primeiro laboratório acreditado RBC do Sul Fluminense."
      description="Rigor técnico de grande centro, com a logística e o prazo de quem está do seu lado."
    />
    <div className="grid gap-4 lg:grid-cols-3">
      {differentials.map((item, index) => (
        <Reveal
          as="article"
          key={item.title}
          className="rounded-xl border border-gray-200 bg-white p-7 shadow-lg"
        >
          <span className="text-xs font-bold tracking-widest text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mb-2 mt-4 text-xl">{item.title}</h3>
          <p className="text-[15px] leading-relaxed text-gray-500">
            {item.description}
          </p>
        </Reveal>
      ))}
    </div>
  </section>
);

const Scope = () => (
  <section
    id="escopo"
    className="section scroll-mt-24 rounded-xl border-y border-gray-200 bg-[#F5F5F5] px-4 sm:px-8"
  >
    <SectionHeading
      eyebrow="Escopo de calibração"
      title="Que instrumento você precisa calibrar?"
      description="Clique no seu instrumento e fale direto com a Kometro no WhatsApp — já enviamos o orçamento com o item preenchido."
    />
    <div className="grid gap-4 md:grid-cols-2">
      {scopeGroups.map((group) => (
        <Reveal
          as="article"
          key={group.name}
          className="flex scroll-mt-24 flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-lg md:p-7"
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-xl">{group.name}</h3>
            <span
              className={`rounded-md border px-2.5 py-1 text-[11px] font-bold leading-tight ${
                group.accredited
                  ? "border-green-100 bg-green-100 text-primary"
                  : "border-gray-200 bg-theme-lighter text-gray-500"
              }`}
            >
              {group.badge}
            </span>
          </div>
          <p className="mb-5 text-[15px] leading-relaxed text-text">
            {group.description}
          </p>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            Clique para orçar
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            {group.instruments.map((instrument) => {
              const name = instrument.name || instrument;
              const label = instrument.label || name;

              return (
                <a
                  key={name}
                  href={getWhatsappUrl(
                    `Olá, gostaria de um orçamento de calibração de ${name}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Solicitar orçamento para ${name} pelo WhatsApp`}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] leading-none text-text transition hover:border-primary hover:bg-orange-50 hover:text-dark"
                >
                  {label}
                  <MessageCircle
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-primary opacity-60 transition-opacity group-hover:opacity-100"
                  />
                </a>
              );
            })}
          </div>
          <a
            href={getWhatsappUrl(
              `Olá, gostaria de um orçamento de calibração de ${group.ctaInstrument}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center font-bold text-primary transition hover:text-orange-600"
          >
            {group.ctaLabel} <span aria-hidden="true">→</span>
          </a>
        </Reveal>
      ))}
    </div>
    <Reveal as="p" className="mt-5 text-center text-sm text-gray-500">
      Escopo de acreditação público e verificável:{" "}
      <a
        href={INMETRO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-green-700 underline transition hover:text-green-600"
      >
        consultar RBC 0686 no Inmetro →
      </a>
    </Reveal>
  </section>
);

const Testimonials = () => (
  <section id="clientes" className="section scroll-mt-24">
    <SectionHeading
      eyebrow="Quem já confia"
      title="A escolha certa de quem responde pela qualidade."
    />
    <div className="grid gap-4 md:grid-cols-2">
      {testimonials.map((testimonial) => (
        <Reveal
          as="article"
          key={`${testimonial.name}-${testimonial.company}`}
          className="rounded-xl border border-gray-200 bg-white p-7 shadow-lg"
        >
          <span
            aria-hidden="true"
            className="text-5xl leading-none text-primary opacity-50"
          >
            “
          </span>
          <p className="mb-5 mt-1 text-base leading-relaxed text-text">
            {testimonial.quote}
          </p>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 bg-green-50 text-sm font-bold text-green-700">
              {testimonial.initials}
            </span>
            <div>
              <strong className="block text-sm text-dark">
                {testimonial.name}
              </strong>
              <span className="text-[13px] text-gray-500">
                {testimonial.company}
              </span>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);

const Process = () => (
  <section
    id="processo"
    className="section scroll-mt-24 rounded-xl border-y border-gray-200 bg-[#F5F5F5] px-4 sm:px-8"
  >
    <SectionHeading
      eyebrow="Como funciona"
      title="Do orçamento ao certificado em 4 passos."
      description="Simples para você, rigoroso onde importa."
    />
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute left-8 right-8 top-[23px] hidden h-px bg-gray-300 lg:block"
      />
      <div className="relative grid gap-7 lg:grid-cols-4 lg:gap-0">
        {processSteps.map((step, index) => (
          <Reveal key={step.title} className="lg:px-5">
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-full border-2 border-primary bg-white text-xl font-bold text-primary">
              {index + 1}
            </span>
            <h3 className="mb-2 text-lg">{step.title}</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              {step.description}
            </p>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const Faq = () => {
  const [openQuestion, setOpenQuestion] = useState(null);

  return (
    <section id="faq" className="section scroll-mt-24">
      <div className="mx-auto max-w-[840px]">
        <SectionHeading
          eyebrow="Tire suas dúvidas"
          title="Perguntas frequentes"
        />
        <Reveal>
          {questions.map((item, index) => {
            const isOpen = openQuestion === index;
            const answerId = `faq-answer-${index}`;

            return (
              <div key={item.question} className="border-b border-gray-200">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenQuestion(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-5 bg-transparent py-5 text-left text-base font-bold leading-snug text-dark transition hover:text-primary md:text-lg"
                >
                  <span>{item.question}</span>
                  <Plus
                    aria-hidden="true"
                    className={`h-5 w-5 flex-none text-primary transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  />
                </button>
                <div
                  id={answerId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-0 text-[15px] leading-relaxed text-text md:pr-10 md:text-base">
                      {item.answer}
                      {item.showAccreditationLink && (
                        <>
                          {" "}
                          <a
                            href={INMETRO_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-green-700 underline transition hover:text-green-600"
                          >
                            Consultar acreditação 0686 →
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
};

const FinalBudget = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fields = [
      ["nome", "Nome"],
      ["empresa", "Empresa"],
      ["instrumentos", "Instrumentos"],
      ["cidade", "Cidade"],
    ];
    let message = "Olá, gostaria de um orçamento de calibração.";

    fields.forEach(([name, label]) => {
      const value = formData.get(name)?.trim();
      if (value) message += `\n${label}: ${value}`;
    });

    window.open(getWhatsappUrl(message), "_blank", "noopener,noreferrer");
  };

  return (
    <section className="section mb-12 rounded-xl bg-[#F5F5F5] px-4 sm:px-8 md:mb-16">
      <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-[52px]">
        <Reveal>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Solicite agora
          </span>
          <h2 className="mb-4 mt-3 text-dark">
            Peça seu orçamento de calibração acreditada.
          </h2>
          <p className="mb-7 text-lg leading-relaxed text-text">
            Envie a lista dos seus instrumentos e receba a proposta no mesmo dia
            útil. Sem compromisso.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-gray-500">
            {[
              "Resposta no mesmo dia útil",
              "Coleta na sua planta",
              "Certificado RBC/Inmetro",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check aria-hidden="true" className="h-4 w-4 text-green-500" />
                {item}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal
          as="form"
          className="rounded-2xl bg-white p-6 shadow-lg md:p-7"
          onSubmit={handleSubmit}
        >
          <h3 className="mb-1 text-xl text-dark">Solicitar orçamento</h3>
          <p className="mb-5 text-sm text-gray-500">
            Leva 30 segundos. Enviamos direto pelo seu WhatsApp.
          </p>
          <div className="mb-4">
            <label
              htmlFor="budget-name"
              className="mb-1.5 block text-xs font-bold text-text"
            >
              Nome
            </label>
            <input
              id="budget-name"
              name="nome"
              type="text"
              placeholder="Seu nome"
              className="form-input w-full rounded-lg border-gray-300 bg-theme-lighter px-3.5 py-3 text-[15px] focus:border-primary focus:bg-white focus:ring-primary"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="budget-company"
              className="mb-1.5 block text-xs font-bold text-text"
            >
              Empresa
            </label>
            <input
              id="budget-company"
              name="empresa"
              type="text"
              placeholder="Nome da empresa"
              className="form-input w-full rounded-lg border-gray-300 bg-theme-lighter px-3.5 py-3 text-[15px] focus:border-primary focus:bg-white focus:ring-primary"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="budget-instruments"
              className="mb-1.5 block text-xs font-bold text-text"
            >
              Instrumentos a calibrar
            </label>
            <input
              id="budget-instruments"
              name="instrumentos"
              type="text"
              placeholder="Ex.: 3 paquímetros, 2 balanças, 5 manômetros"
              className="form-input w-full rounded-lg border-gray-300 bg-theme-lighter px-3.5 py-3 text-[15px] focus:border-primary focus:bg-white focus:ring-primary"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="budget-city"
              className="mb-1.5 block text-xs font-bold text-text"
            >
              Cidade
            </label>
            <select
              id="budget-city"
              name="cidade"
              defaultValue=""
              className="form-select w-full rounded-lg border-gray-300 bg-theme-lighter px-3.5 py-3 text-[15px] focus:border-primary focus:bg-white focus:ring-primary"
            >
              <option value="">Selecione</option>
              {cities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary mt-1 inline-flex w-full items-center justify-center gap-2"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            Enviar pelo WhatsApp
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            Ao enviar, você abre uma conversa no WhatsApp com a Kometro.
          </p>
        </Reveal>
      </div>
    </section>
  );
};

const EscopoEPerguntas = () => (
  <div className="overflow-hidden">
    <PageNavigation />
    <Hero />
    <TrustBar />
    <Comparison />
    <Differentials />
    <Scope />
    <Testimonials />
    <Process />
    <Faq />
    <FinalBudget />

    <div className="fixed inset-x-0 bottom-0 z-[10000] border-t border-gray-200 bg-white/95 p-3 backdrop-blur lg:hidden">
      <WhatsAppButton message={budgetMessage} className="w-full">
        Solicitar orçamento no WhatsApp
      </WhatsAppButton>
    </div>
  </div>
);

export default EscopoEPerguntas;
