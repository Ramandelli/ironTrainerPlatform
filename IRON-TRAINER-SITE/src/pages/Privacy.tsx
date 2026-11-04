import React, { useEffect } from 'react';
import { Dumbbell, Shield, Lock, Server, Smartphone, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Política de Privacidade do Iron Trainer
 * Rota: /privacidade
 * Conteúdo mantido pelo App Owner e reflete as práticas atuais do app.
 */

const WHATSAPP = '5544999885573';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  'Olá! Tenho uma dúvida sobre a Política de Privacidade do Iron Trainer.',
)}`;

const Section: React.FC<{
  id?: string;
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ id, icon, title, children }) => (
  <section id={id} className="mb-10">
    <div className="flex items-center gap-3 mb-4">
      {icon && (
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-iron-orange/10 text-iron-orange">
          {icon}
        </span>
      )}
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
    </div>
    <div className="text-muted-foreground leading-relaxed space-y-4">{children}</div>
  </section>
);

const Privacy: React.FC = () => {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Política de Privacidade · Iron Trainer';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary shadow-primary">
              <Dumbbell className="w-4 h-4 text-foreground" />
            </span>
            <span className="text-lg tracking-tight">Iron Trainer</span>
          </a>
          <Button asChild size="sm" variant="ghost">
            <a href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao site
            </a>
          </Button>
        </div>
      </header>

      {/* HERO POLÍTICA */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-steel opacity-40 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 pt-14 pb-12 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-iron-orange mb-4">
            <Shield className="w-3.5 h-3.5" /> Privacidade
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Política de Privacidade
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Esta página é mantida pelo Iron Trainer para responder dúvidas comuns sobre segurança e
            privacidade do app.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} · Versão 2.0.0
          </p>
        </div>
      </section>

      {/* CONTEÚDO */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-card">
          <Section id="resumo" icon={<Lock className="w-5 h-5" />} title="Resumo da privacidade">
            <p>
              O Iron Trainer foi projetado para funcionar com o mínimo possível de dados pessoais.
              Não exigimos cadastro, e-mail, nome, telefone ou qualquer identificador tradicional.
            </p>
            <p>
              A única informação que associamos à sua licença Premium é o <strong>DeviceID</strong>{' '}
              do seu aparelho Android, usado apenas para ativar e validar o acesso ao Premium.
            </p>
            <p>
              Seus treinos, histórico, estatísticas e conquistas ficam armazenados localmente no seu
              dispositivo, exceto quando você opta por exportar um arquivo JSON manualmente.
            </p>
          </Section>

          <Section id="dados-coletados" icon={<Smartphone className="w-5 h-5" />} title="O que coletamos">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>DeviceID:</strong> identificador anônimo do aparelho, usado somente para
                ativação e reativação do Premium.
              </li>
              <li>
                <strong>Dados de treino:</strong> criados por você e salvos apenas no celular. Não
                são enviados para nossos servidores.
              </li>
              <li>
                <strong>Dados de uso da IA:</strong> quando você decide usar a geração de treinos por
                IA, informações de perfil (sexo, idade, nível e objetivo) são enviadas à API de IA
                (Groq) para montar o plano. Esses dados não são armazenados por nós.
              </li>
            </ul>
          </Section>

          <Section id="como-usamos" icon={<Server className="w-5 h-5" />} title="Como usamos as informações">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>DeviceID:</strong> exclusivamente para validar que a licença Premium está
                vinculada ao aparelho correto.
              </li>
              <li>
                <strong>Validação do Premium:</strong> a cada ciclo de 30 dias, o app pode fazer uma
                verificação silenciosa quando aberto com internet. Nenhum dado pessoal além do
                DeviceID é transmitido nesse processo.
              </li>
              <li>
                <strong>Troca de aparelho:</strong> quando você solicita a migração, inativamos o
                DeviceID antigo e ativamos o novo manualmente.
              </li>
            </ul>
          </Section>

          <Section id="nao-coletamos" icon={<Shield className="w-5 h-5" />} title="O que não coletamos">
            <p>
              Não coletamos nome, e-mail, CPF, telefone, foto, endereço, contatos, localização ou
              qualquer outra informação pessoal identificável. Não rastreamos sua navegação fora do
              app e não vendemos dados.
            </p>
          </Section>

          <Section id="armazenamento" icon={<Lock className="w-5 h-5" />} title="Armazenamento e segurança">
            <p>
              Todos os dados de treino, histórico e estatísticas são mantidos localmente no seu
              dispositivo. A licença Premium é salva no aparelho em formato de token assinado,
              com validade de 30 dias.
            </p>
            <p>
              Não mantemos banco de dados centralizado com seus treinos ou histórico. Isso significa
              que você tem controle total sobre seus dados, mas também deve fazer backups
              exportando seus treinos quando desejar migrá-los para outro aparelho.
            </p>
          </Section>

          <Section id="seus-direitos" icon={<Smartphone className="w-5 h-5" />} title="Seus direitos">
            <p>
              Como não armazenamos dados pessoais centralmente, você pode:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Exportar seus treinos a qualquer momento pela tela "Gerenciar".</li>
              <li>Apagar todos os dados do app diretamente nas configurações do Android.</li>
              <li>Solicitar a remoção do DeviceID vinculado ao Premium entrando em contato.</li>
            </ul>
          </Section>

          <Section id="contato" icon={<Mail className="w-5 h-5" />} title="Contato sobre privacidade">
            <p>
              Se tiver dúvidas sobre esta política ou quiser exercer algum direito relacionado aos
              seus dados, fale conosco pelo WhatsApp:
            </p>
            <p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="text-iron-orange hover:underline font-medium"
              >
                Falar no WhatsApp
              </a>
            </p>
          </Section>

          <div className="mt-8 pt-8 border-t border-border text-xs text-muted-foreground/80 leading-relaxed">
            <p>
              Esta política descreve as práticas do app Iron Trainer. Ela pode ser atualizada
              sempre que houver mudanças no funcionamento do app. Recomendamos consultar esta
              página periodicamente.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <a href="/" className="inline-flex items-center gap-2 font-bold text-foreground mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-primary">
              <Dumbbell className="w-4 h-4 text-foreground" />
            </span>
            Iron Trainer
          </a>
          <div className="flex items-center justify-center gap-4 text-xs mb-3">
            <a href="/" className="hover:text-foreground transition">Site</a>
            <a href="/privacidade" className="hover:text-foreground transition">Privacidade</a>
            <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="hover:text-foreground transition">
              Contato
            </a>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} Iron Trainer · Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
