import React, { useEffect } from 'react';
import {
  Dumbbell,
  Download,
  Crown,
  WifiOff,
  ShieldCheck,
  Settings2,
  Brain,
  Sparkles,
  Check,
  X,
  ChevronDown,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Trophy,
  Zap,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

import screenHome from '../assets/site/screen-home.jpg.asset.json';
import screenStats from '../assets/site/screen-stats.jpg.asset.json';
import screenEvolution from '../assets/site/screen-evolution.jpg.asset.json';
import screenAi from '../assets/site/screen-ai.jpg.asset.json';
import screenAchievements from '../assets/site/screen-achievements.jpg.asset.json';
import screenManage from '../assets/site/screen-manage.jpg.asset.json';

/**
 * Site oficial Iron Trainer
 * Rota: /site
 * Identidade visual idêntica ao app (orange + steel blue, dark)
 */

const WHATSAPP = '5544999885573';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  'Olá! Quero ativar o Iron Trainer Premium.',
)}`;
// Substitua quando o link oficial do APK estiver pronto.
const APK_URL = '#download';

const PhoneFrame: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div className="relative mx-auto w-full max-w-[260px]">
    <div className="rounded-[2.2rem] border-[10px] border-steel-blue-dark bg-steel-blue-dark shadow-card overflow-hidden">
      <div className="rounded-[1.4rem] overflow-hidden bg-background">
        <img src={src} alt={alt} loading="lazy" className="w-full h-auto block" />
      </div>
    </div>
    <div className="absolute inset-x-0 -bottom-3 mx-auto h-6 w-24 rounded-full bg-iron-orange/20 blur-xl" />
  </div>
);

const Section: React.FC<{
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}> = ({ id, eyebrow, title, subtitle, children, className = '' }) => (
  <section id={id} className={`py-16 sm:py-24 px-4 ${className}`}>
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        {eyebrow && (
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-iron-orange mb-3">
            {eyebrow}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  </section>
);

const Site: React.FC = () => {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Iron Trainer — Treine. Evolua. Acompanhe.';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 font-bold">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary shadow-primary">
              <Dumbbell className="w-4 h-4 text-foreground" />
            </span>
            <span className="text-lg tracking-tight">Iron Trainer</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#como" className="hover:text-foreground transition">Como funciona</a>
            <a href="#capturas" className="hover:text-foreground transition">App</a>
            <a href="#premium" className="hover:text-foreground transition">Premium</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <Button asChild size="sm" variant="default">
            <a href={APK_URL}>
              <Download className="w-4 h-4" />
              Baixar
            </a>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-steel opacity-60 pointer-events-none" />
        <div
          className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'hsl(var(--iron-orange))' }}
        />
        <div
          className="absolute top-40 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'hsl(var(--iron-orange-light))' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-iron-orange mb-5 px-3 py-1 rounded-full border border-iron-orange/30 bg-iron-orange/10">
              <Sparkles className="w-3.5 h-3.5" /> Novo · App Android
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
              TREINE.{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">EVOLUA.</span>{' '}
              ACOMPANHE.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg md:mx-0 mx-auto">
              Seu treino completo no celular.
              <br />
              <span className="text-foreground/80">Sem conta. Sem complicação.</span>
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Button asChild size="lg" variant="workout" className="text-base">
                <a href={APK_URL}>
                  <Download className="w-5 h-5" />
                  Baixar grátis
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <a href="#premium">
                  <Crown className="w-5 h-5" />
                  Ver Premium
                </a>
              </Button>
            </div>

            <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-card/60 backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm">
                <span className="font-bold text-foreground">184.982 kg</span>{' '}
                <span className="text-muted-foreground">registrados pelos atletas — e subindo</span>
              </span>
            </div>
          </div>

          <div className="relative">
            <PhoneFrame src={screenHome.url} alt="Tela inicial do Iron Trainer" />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <Section
        id="como"
        eyebrow="Como funciona"
        title="3 passos. Sem fricção."
        subtitle="Do download ao primeiro treino em menos de 1 minuto."
      >
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { n: '01', title: 'Baixe', icon: Download, desc: 'Instale o APK no seu Android. Funciona offline desde o primeiro segundo.' },
            { n: '02', title: 'Treine', icon: Dumbbell, desc: 'Crie ou gere com IA seu plano. Execute, registre cargas e cronometre descansos.' },
            { n: '03', title: 'Desbloqueie Premium', icon: Crown, desc: 'Libere estatísticas avançadas, conquistas, IA e múltiplos treinos quando quiser.' },
          ].map(({ n, title, icon: Icon, desc }) => (
            <div
              key={n}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-card hover:border-iron-orange/50 transition"
            >
              <div className="absolute top-4 right-5 text-5xl font-black text-iron-orange/10 select-none">
                {n}
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary mb-4">
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CAPTURAS */}
      <Section
        id="capturas"
        eyebrow="Por dentro do app"
        title="Tudo o que você precisa para evoluir"
        subtitle="Capturas reais. Interface pensada para academia: rápida, escura e direta."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { src: screenHome.url, tag: 'Treinos', title: 'Treino do dia em destaque', desc: 'Veja o treino, tempo estimado e exercícios principais em uma tela.' },
            { src: screenManage.url, tag: 'Gestão', title: 'Crie, edite, organize', desc: 'Exporte/importe JSON, agrupe por dia e gere com IA em segundos.' },
            { src: screenStats.url, tag: 'Estatísticas', title: 'Volume mensal e cardio', desc: 'Volume total, tempo, distância, abdominais e séries — tudo medido.' },
            { src: screenEvolution.url, tag: 'Evolução', title: 'Progresso por dia', desc: 'Mín, média, máx e variação por dia da semana. Sem achismo.' },
          ].map((s) => (
            <div key={s.tag} className="flex flex-col items-center text-center gap-4">
              <PhoneFrame src={s.src} alt={s.title} />
              <div>
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-iron-orange">
                  {s.tag}
                </span>
                <h3 className="font-bold text-base mt-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-[240px]">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid sm:grid-cols-2 gap-8 items-center bg-card/50 border border-border rounded-3xl p-6 sm:p-10">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-iron-orange mb-3">
              <Brain className="w-3.5 h-3.5" /> Premium · IA
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gere treinos com IA em segundos
            </h3>
            <p className="mt-3 text-muted-foreground">
              Informe sexo, idade, nível e objetivo. A IA monta um plano semanal completo —
              séries, repetições, cargas sugeridas e cardio.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {['Hipertrofia, força ou resistência', 'Considera dias disponíveis', 'Pronto para iniciar e editar'].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" /> {t}
                  </li>
                ),
              )}
            </ul>
          </div>
          <PhoneFrame src={screenAi.url} alt="Geração de treino com IA" />
        </div>
      </Section>

      {/* DIFERENCIAIS */}
      <Section
        eyebrow="Diferenciais"
        title="Feito para quem treina de verdade"
        className="bg-gradient-steel/40"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: WifiOff, title: 'Offline', desc: 'Funciona sem internet, sempre.' },
            { icon: ShieldCheck, title: 'Sem cadastro', desc: 'Nenhuma conta. Nenhum email.' },
            { icon: Settings2, title: 'Controle total', desc: 'Você edita tudo, do warmup ao cardio.' },
            { icon: Brain, title: 'Evolução inteligente', desc: 'Sugestões de carga e detecção de platô.' },
            { icon: Crown, title: 'Premium opcional', desc: 'Use grátis. Suba de nível quando quiser.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5 hover:border-iron-orange/40 transition shadow-card"
            >
              <Icon className="w-6 h-6 text-iron-orange mb-3" />
              <h3 className="font-bold mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PREMIUM */}
      <Section
        id="premium"
        eyebrow="Premium vitalício"
        title="Free × Premium"
        subtitle="Pague uma vez. Use para sempre. 1 licença = 1 aparelho."
      >
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {/* FREE */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Free</h3>
              <span className="text-sm text-muted-foreground">R$ 0</span>
            </div>
            <ul className="space-y-3 text-sm flex-1">
              {[
                ['ok', '1 treino salvo'],
                ['ok', 'Execução completa de treino'],
                ['ok', 'Cronômetro de descanso'],
                ['ok', 'Funciona offline'],
                ['no', 'Estatísticas avançadas'],
                ['no', 'Histórico completo'],
                ['no', 'Conquistas e recordes'],
                ['no', 'Geração de treino com IA'],
                ['no', 'Múltiplos treinos por dia'],
              ].map(([k, t]) => (
                <li key={t} className="flex items-center gap-2">
                  {k === 'ok' ? (
                    <Check className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <span className={k === 'ok' ? 'text-foreground' : 'text-muted-foreground line-through'}>
                    {t}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-6">
              <a href={APK_URL}>Começar grátis</a>
            </Button>
          </div>

          {/* PREMIUM */}
          <div className="relative rounded-2xl border-2 border-iron-orange/60 bg-gradient-to-b from-iron-orange/10 to-card p-6 sm:p-8 flex flex-col shadow-primary">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-xs font-bold shadow-primary">
              MAIS POPULAR
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-iron-orange" /> Premium
              </h3>
              <span className="text-sm font-semibold text-iron-orange">Vitalício</span>
            </div>
            <ul className="space-y-3 text-sm flex-1">
              {[
                'Treinos ilimitados',
                'Estatísticas completas (volume, cardio, abdominal)',
                'Histórico ilimitado',
                'Conquistas e recordes pessoais',
                'Gráficos de evolução por dia e por exercício',
                'Detecção inteligente de platô',
                'Geração de treino com IA',
                'Dropsets, rest-pause e funcional',
                'Múltiplos treinos por dia',
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-iron-orange shrink-0" /> {t}
                </li>
              ))}
            </ul>
            <Button asChild variant="workout" size="lg" className="mt-6">
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                <MessageCircle className="w-5 h-5" />
                Desbloquear Premium
              </a>
            </Button>
            <p className="mt-3 text-[11px] text-center text-muted-foreground">
              Atendimento via WhatsApp · 1 licença = 1 DeviceID · Sem mensalidade
            </p>
          </div>
        </div>

        {/* Pequenos cards de prova */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { icon: BarChart3, label: 'Volume registrado', value: '184.982 kg' },
            { icon: Trophy, label: 'Conquistas', value: '37 desbloqueáveis' },
            { icon: Zap, label: 'Ativação', value: 'Instantânea' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-iron-orange/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-iron-orange" />
              </div>
              <div>
                <div className="font-bold leading-tight">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="Dúvidas" title="Perguntas frequentes">
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-2 sm:p-4">
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: 'Preciso de internet?',
                a: 'Não. O Iron Trainer funciona 100% offline. A internet só é usada para validar o Premium e gerar treinos com IA.',
              },
              {
                q: 'Perco meus dados se trocar de aparelho?',
                a: 'Você pode exportar todos os treinos em JSON pela tela "Gerenciar" e importar no novo aparelho. Histórico e estatísticas ficam no dispositivo de origem.',
              },
              {
                q: 'Como ativo o Premium?',
                a: 'Abra o app, copie seu DeviceID e envie pelo WhatsApp. Após a confirmação, toque em "Já paguei — Validar agora" e o Premium é ativado em segundos.',
              },
              {
                q: 'Troquei de celular, e agora?',
                a: 'Envie seu novo DeviceID pelo WhatsApp. Como o Premium é vitalício vinculado ao aparelho, fazemos a reassociação manualmente sem custo extra.',
              },
              {
                q: 'Como funciona o teste / versão grátis?',
                a: 'Você usa o app gratuitamente sem prazo. A versão Free inclui 1 treino, execução completa e cronômetros. Premium libera estatísticas, IA, conquistas e múltiplos treinos.',
              },
            ].map((it, i) => (
              <AccordionItem key={it.q} value={`q${i}`} className="border-border">
                <AccordionTrigger className="text-left text-base px-3 hover:no-underline hover:text-iron-orange">
                  {it.q}
                </AccordionTrigger>
                <AccordionContent className="px-3 text-muted-foreground">{it.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* CTA FINAL */}
      <section className="px-4 pb-20">
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-iron-orange/30 bg-gradient-to-br from-iron-orange/15 via-card to-card p-10 sm:p-14 text-center shadow-primary">
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30"
            style={{ background: 'hsl(var(--iron-orange))' }}
          />
          <div className="relative">
            <Smartphone className="w-10 h-10 text-iron-orange mx-auto mb-4" />
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Comece grátis hoje.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Treino que nunca se perde. Direto no seu Android.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" variant="workout" id="download" className="text-base">
                <a href={APK_URL}>
                  <Download className="w-5 h-5" />
                  Baixar APK
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                  <MessageCircle className="w-5 h-5" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 font-bold mb-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-primary">
                <Dumbbell className="w-4 h-4 text-foreground" />
              </span>
              Iron Trainer
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Treino que nunca se perde. Feito para quem leva academia a sério.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-foreground">Iron Trainer</div>
            <a href="#premium" className="block text-muted-foreground hover:text-foreground">
              Premium
            </a>
            <a href="#faq" className="block text-muted-foreground hover:text-foreground">
              FAQ
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="block text-muted-foreground hover:text-foreground"
            >
              Contato (WhatsApp)
            </a>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-foreground">Legal</div>
            <a href="#" className="block text-muted-foreground hover:text-foreground">
              Política de privacidade
            </a>
            <div className="text-muted-foreground text-xs">Versão atual: 2.0.0</div>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Iron Trainer · Todos os direitos reservados
        </div>
      </footer>

      {/* hidden image just to silence unused import lint for achievements asset (used as preload semantic) */}
      <link rel="prefetch" href={screenAchievements.url} />
    </div>
  );
};

export default Site;
