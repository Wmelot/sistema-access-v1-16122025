"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight, CheckCircle2, Calendar, Brain, TrendingUp,
  ShieldCheck, Clock, Users, Mic, MessageCircle, FileText,
  Star, Quote, Activity, History, Zap, Stethoscope
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-emerald-500/30 overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <Brain className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Axiom</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">
              Área do Cliente
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-emerald-900/20 shadow-lg">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -z-10 opacity-50" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-6 text-center z-10 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 text-xs font-medium text-emerald-400 mb-8 animate-fade-in-up backdrop-blur cursor-default hover:bg-slate-900 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Nova Versão: Ditado Inteligente com IA Disponível
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent leading-[1.1]">
            A Revolução na Gestão <br className="hidden md:block" />
            de <span className="text-emerald-500 inline-block relative">
              Fisioterapia
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-emerald-600 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            O único sistema que une <strong>Inteligência Artificial</strong>, Prontuários PBE e Automação de Marketing. Desenvolvido para clínicas que buscam excelência clínica e financeira.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-14 px-10 text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 rounded-xl">
                Começar Grátis Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white h-14 px-8 text-lg rounded-xl">
                Ver Diferenciais
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 14 dias grátis
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sem cartão necessário
            </div>
          </div>
        </div>
      </section>

      {/* ORIGIN STORY SECTION */}
      <section className="py-24 bg-slate-900/30 border-y border-slate-900 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl opacity-20 blur-xl"></div>
              <div className="relative bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-emerald-500">
                    <Users className="w-8 h-8 text-slate-400" /> {/* Placeholder Foto */}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white">De Fisioterapeuta para Fisioterapeuta</h3>
                    <p className="text-emerald-400 text-sm">20+ anos de Experiência Clínica</p>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed italic text-lg">
                  "Cansei de sistemas genéricos que não entendiam a complexidade da nossa profissão. Criei o Axiom para ser o 'segundo cérebro' do fisioterapeuta: Automatizando o que é chato e potencializando o raciocínio clínico."
                </p>
                <div className="mt-4 flex gap-1 text-emerald-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="inline-flex items-center gap-2 text-emerald-400 font-bold mb-4 uppercase tracking-wider text-sm">
                <History className="w-4 h-4" /> Nossa Origem
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
                Tecnologia nascida da <span className="text-emerald-500">Prática Real</span>
              </h2>
              <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                Diferente de softwares criados apenas por programadores, o Axiom carrega o DNA da fisioterapia baseada em evidências. Cada funcionalidade foi testada no campo de batalha da clínica diária.
              </p>
              <ul className="space-y-4">
                <ListItem text="Protocolos validados internacionalmente já integrados." />
                <ListItem text="Fluxo de raciocínio clínico intuitivo, não apenas campos de texto." />
                <ListItem text="Ferramentas visuais para educar o paciente." />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Funcionalidades Premium</h2>
            <p className="text-slate-400 text-lg">Ferramentas avançadas que você só encontra aqui. Esqueça a digitação interminável e os pacientes perdidos.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <FeatureCard
                icon={<Mic className="w-8 h-8 text-emerald-400" />}
                title="Ditado Inteligente (IA)"
                description="Fale e o sistema escreve. Nossa IA transcreve sua evolução clínica instantaneamente, economizando horas de digitação todos os dias. Focada no vocabulário técnico de saúde."
                large
              />
            </div>
            <FeatureCard
              icon={<MessageCircle className="w-8 h-8 text-green-400" />}
              title="WhatsApp Automático"
              description="Confirmações, lembretes e mensagens de aniversário enviados automaticamente. Reduza faltas em até 40%."
            />
            <FeatureCard
              icon={<Activity className="w-8 h-8 text-purple-400" />}
              title="Follow-up Avançado"
              description="Monitore a dor e evolução do paciente pós-alta com questionários automáticos enviados por link inteligente."
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8 text-blue-400" />}
              title="Relatórios Personalizáveis"
              description="Crie laudos e relatórios impressionantes com um clique. Gráficos de evolução, radar visual e linguagem acessível."
            />
            <FeatureCard
              icon={<Brain className="w-8 h-8 text-pink-400" />}
              title="Prontuário PBE"
              description="Templates prontos baseados nas melhores evidências científicas para cada patologia."
            />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF SECTION */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">O que dizem nossos parceiros</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Em 15 anos de clínica, nunca usei nada igual. O ditado por voz reduziu meu tempo de papelada pela metade."
              author="Dr. Ricardo S."
              role="Fisioterapeuta Osteopata"
            />
            <TestimonialCard
              quote="O follow-up automático recuperou pacientes que eu nem lembrava. O sistema se paga sozinho só com isso."
              author="Dra. Camila M."
              role="Clínica de Pilates"
            />
            <TestimonialCard
              quote="Os relatórios visuais encantam os pacientes. Eles finalmente entendem a evolução do tratamento."
              author="Dr. João Paulo"
              role="Fisioterapeuta Esportivo"
            />
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="py-24 bg-slate-950 relative border-t border-slate-800/50">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Dúvidas? <span className="text-emerald-500">A Gente Responde.</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Perguntas frequentes sobre como o Axiom vai transformar sua prática clínica.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-slate-900/30 border border-slate-800 rounded-2xl px-6">
              <AccordionTrigger className="text-lg font-semibold text-slate-200 hover:text-emerald-400 py-6 text-left hover:no-underline">
                O Axiom serve para a minha clínica?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 pb-6 text-base leading-relaxed">
                Com certeza. O Axiom foi desenhado para escalar com você, desde o consultório individual até grandes clínicas com múltiplos profissionais e unidades. Nossas ferramentas de gestão e avaliação biomecânica se adaptam ao tamanho e ritmo do seu negócio.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-slate-900/30 border border-slate-800 rounded-2xl px-6">
              <AccordionTrigger className="text-lg font-semibold text-slate-200 hover:text-emerald-400 py-6 text-left hover:no-underline">
                Preciso instalar algum programa no computador?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 pb-6 text-base leading-relaxed">
                Não. O Axiom é 100% online e roda diretamente no seu navegador. Você pode acessar de qualquer computador, tablet ou celular, em qualquer lugar do mundo, com total segurança e backups automáticos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-slate-900/30 border border-slate-800 rounded-2xl px-6">
              <AccordionTrigger className="text-lg font-semibold text-slate-200 hover:text-emerald-400 py-6 text-left hover:no-underline">
                Como funciona a Inteligência Artificial nas avaliações?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 pb-6 text-base leading-relaxed">
                Nossa IA analisa os dados inseridos e, em breve, vídeos dos movimentos do paciente para gerar insights biomecânicos precisos automaticamente. Ela auxilia no diagnóstico funcional, sugerindo correlações que poderiam passar despercebidas e economizando tempo precioso no laudo.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-slate-900/30 border border-slate-800 rounded-2xl px-6">
              <AccordionTrigger className="text-lg font-semibold text-slate-200 hover:text-emerald-400 py-6 text-left hover:no-underline">
                Meus dados e os dos pacientes estão seguros?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 pb-6 text-base leading-relaxed">
                Segurança é nossa prioridade máxima. Utilizamos criptografia de ponta a ponta e seguimos rigorosamente a LGPD. Seus dados são armazenados em servidores seguros com backups diários, garantindo que você nunca perca o histórico dos seus pacientes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-slate-900/30 border border-slate-800 rounded-2xl px-6">
              <AccordionTrigger className="text-lg font-semibold text-slate-200 hover:text-emerald-400 py-6 text-left hover:no-underline">
                Existe fidelidade ou multa de cancelamento?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 pb-6 text-base leading-relaxed">
                Nenhuma. Acreditamos na qualidade do nosso produto para manter você conosco. Você pode cancelar sua assinatura a qualquer momento, sem burocracia ou letras miúdas.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <p className="text-slate-400 mb-4">Ainda tem alguma pergunta específica?</p>
            <Link href="https://wa.me/5531991856084" target="_blank">
              <Button variant="outline" className="border-emerald-600/50 text-emerald-500 hover:bg-emerald-600 hover:text-white px-8 h-12 rounded-full font-semibold transition-all hover:scale-105 shadow-lg shadow-emerald-900/20 group">
                <MessageCircle className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Fale Conosco no WhatsApp
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-900/10 blur-3xl -z-10"></div>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Sua clínica em outro nível</h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-12 text-xl">
            Junte-se a uma comunidade de profissionais que não aceita o básico. Teste a potência máxima do Axiom.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-16 px-12 text-xl shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 rounded-xl w-full sm:w-auto">
                <Zap className="w-5 h-5 mr-2 fill-current" />
                Começar Teste Grátis
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-slate-500 text-sm">Acesso imediato • Cancele a hora que quiser</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-slate-900 text-slate-500 text-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
              <Brain className="w-3 h-3 text-emerald-500" />
            </div>
            <span className="font-semibold text-slate-300">Axiom</span>
          </div>
          <div className="text-center md:text-right">
            <p className="mb-2">Desenvolvido com ❤️ e Evidência Científica.</p>
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 bg-emerald-500/10 p-1 rounded-full">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      </div>
      <span className="text-slate-300">{text}</span>
    </li>
  )
}

function FeatureCard({ icon, title, description, large }: { icon: any, title: string, description: string, large?: boolean }) {
  return (
    <div className={`p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-900 transition-all duration-300 group h-full ${large ? 'bg-gradient-to-br from-slate-900 to-emerald-900/10' : ''}`}>
      <div className="mb-6 p-3 bg-slate-950 rounded-xl w-fit border border-slate-800 group-hover:scale-110 transition-transform shadow-lg">
        {icon}
      </div>
      <h3 className={`text-xl font-bold mb-3 text-white ${large ? 'text-2xl' : ''}`}>{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 relative">
      <Quote className="absolute top-6 right-6 w-8 h-8 text-slate-800 fill-slate-800" />
      <div className="mb-6 flex gap-1 text-emerald-500">
        <Star className="w-4 h-4 fill-current" />
        <Star className="w-4 h-4 fill-current" />
        <Star className="w-4 h-4 fill-current" />
        <Star className="w-4 h-4 fill-current" />
        <Star className="w-4 h-4 fill-current" />
      </div>
      <p className="text-slate-300 italic mb-6 leading-relaxed">"{quote}"</p>
      <div>
        <strong className="block text-white font-semibold">{author}</strong>
        <span className="text-sm text-slate-500">{role}</span>
      </div>
    </div>
  )
}
