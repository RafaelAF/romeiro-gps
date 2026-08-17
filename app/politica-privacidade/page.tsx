import type { Metadata } from "next";
import { Shield } from "lucide-react";
import BotaoVoltar from "@/components/BotaoVoltar";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade (LGPD) do RomeiroGPS - Aparecida SP. Entenda como seus dados são tratados.",
};

const SECOES: { titulo: string; texto: string }[] = [
  {
    titulo: "1. Quem somos",
    texto:
      "O RomeiroGPS é um aplicativo web (PWA) de turismo e apoio a romeiros em Aparecida - SP, que funciona como mapa pessoal com ponto de encontro compartilhável por link temporário.",
  },
  {
    titulo: "2. Dados coletados",
    texto:
      "Coletamos apenas os dados mínimos necessários ao funcionamento: o número de celular do líder (usado exclusivamente para gerar o identificador do link de compartilhamento), o ponto de encontro marcado no mapa e a localização (quando você ativa o GPS). Pontos de interesse, rotas e trajetos criados ficam salvos somente no seu dispositivo.",
  },
  {
    titulo: "3. Finalidade do tratamento",
    texto:
      "Os dados são utilizados exclusivamente para: identificar o líder, gerar o link temporário do ponto de encontro, exibir a sua localização no mapa e compartilhar posição com quem recebeu o link. Não realizamos qualquer outra finalidade.",
  },
  {
    titulo: "4. Armazenamento",
    texto:
      "O número de celular, o ponto de encontro, os pontos de interesse, as rotas e os trajetos são armazenados localmente no seu dispositivo (localStorage). Não enviamos esses dados para servidores ou bancos de dados externos.",
  },
  {
    titulo: "5. Compartilhamento de dados",
    texto:
      "Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros. A localização enviada em tempo real é transmitida somente para os aparelhos que receberam o link de compartilhamento, e fica ativa apenas enquanto você compartilha.",
  },
  {
    titulo: "6. Link temporário",
    texto:
      "O link de compartilhamento é temporário e expira automaticamente em 24 horas. Após a expiração, ele deixa de funcionar e nenhum dado é conservado em servidores.",
  },
  {
    titulo: "7. Seus direitos (LGPD)",
    texto:
      "Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a qualquer momento: confirmação do tratamento de dados, correção, anonimização, bloqueio ou eliminação, e revogação do consentimento. Para exercer seus direitos, entre em contato pelo e-mail abaixo.",
  },
  {
    titulo: "8. Consentimento",
    texto:
      "Ao identificar-se como líder ou ao usar o app, você concorda com esta política. Você pode apagar todos os dados locais a qualquer momento, desinstalando o app ou limpando os dados de navegação do navegador.",
  },
  {
    titulo: "9. Contato",
    texto:
      "Para dúvidas ou solicitações relacionadas à privacidade, envie um e-mail para: contato@romeirogps.app.br.",
  },
  {
    titulo: "10. Alterações desta política",
    texto:
      "Esta política pode ser atualizada a qualquer momento. A versão vigente estará sempre disponível nesta página.",
  },
];

export default function PaginaPoliticaPrivacidade() {
  return (
    <main className="min-h-dvh bg-zinc-100">
      <div className="mx-auto max-w-2xl px-5 py-6">
        <BotaoVoltar />

        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <Shield className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900">Política de Privacidade</h1>
            <p className="text-sm font-medium text-zinc-500">RomeiroGPS · Lei Geral de Proteção de Dados (LGPD)</p>
          </div>
        </div>

        <div className="mt-5 space-y-3 rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm leading-6 text-zinc-600">
            Última atualização: 17/08/2026. Esta política explica como o RomeiroGPS trata os dados
            pessoais dos usuários, em conformidade com a Lei nº 13.709/2018 (LGPD).
          </p>

          {SECOES.map((secao) => (
            <section key={secao.titulo}>
              <h2 className="text-base font-extrabold text-blue-900">{secao.titulo}</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">{secao.texto}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}