import type { LegalSection } from "@/content/legal/types"
import { PRIVACY_CONTACT_EMAIL } from "@/content/legal/types"

export const privacidadeSections: LegalSection[] = [
  {
    id: "controlador",
    title: "1. Quem somos (controlador)",
    paragraphs: [
      "O controlador dos dados pessoais tratados neste site é a Rede de Adolescentes da Oitava Igreja Presbiteriana de Belo Horizonte, responsável pela organização do ENEM da Read.",
      `Para exercer direitos previstos na Lei Geral de Proteção de Dados (LGPD) ou esclarecer dúvidas sobre privacidade, entre em contato pelo e-mail ${PRIVACY_CONTACT_EMAIL}.`,
    ],
  },
  {
    id: "dados",
    title: "2. Quais dados tratamos",
    paragraphs: [
      "Participantes da prova: nome, registro de presença, alternativas marcadas em cada questão, notas (objetiva e redação) e demais informações necessárias à correção e ao ranking.",
      "Aplicadores: nome, vínculo à prova, status de aprovação (pendente, aprovado ou rejeitado) e ações de correção permitidas pelo ADM.",
      "Administradores (ADM): endereço de e-mail e senha (armazenada apenas em forma criptografada no servidor, nunca em texto puro).",
      "Dados técnicos: tokens de sessão (JWT e, quando aplicável, refresh token) guardados no navegador (localStorage) para manter o login; registros de acesso gerados pelos provedores de hospedagem (Cloudflare, Render e Neon), conforme suas políticas.",
    ],
  },
  {
    id: "finalidades",
    title: "3. Para que usamos os dados",
    paragraphs: [
      "Organizar cada edição do ENEM da Read, cadastrar participantes, aplicar e corrigir provas, calcular notas e ranking, divulgar resultados ao público no prazo definido e manter histórico das edições para a Rede.",
      "Autenticar ADMs e aplicadores aprovados, garantir segurança básica do sistema e responder a solicitações dos titulares ou responsáveis.",
    ],
  },
  {
    id: "bases-legais",
    title: "4. Bases legais (LGPD)",
    paragraphs: [
      "Execução de atividades educativas e de convivência promovidas pela Rede (art. 7º, VIII, e contexto de evento comunitário).",
      "Consentimento, quando aplicável — em especial para divulgação pública de nome e desempenho no site, obtido na inscrição (formulário externo ou procedimento informado pela Rede) ou por outro meio válido.",
      "Legítimo interesse para operação, segurança e integridade do sistema, sempre balanceado com os direitos dos titulares.",
    ],
  },
  {
    id: "compartilhamento",
    title: "5. Compartilhamento e operadores",
    paragraphs: [
      "Não vendemos dados pessoais. Compartilhamos dados apenas com prestadores necessários à operação do site e da API, na qualidade de operadores/subprocessadores:",
      "Neon — banco de dados PostgreSQL; Render — hospedagem da API (backend); Cloudflare — hospedagem do site (frontend). Cada provedor trata dados conforme seu contrato e política de privacidade.",
      "A inscrição inicial pode ocorrer em formulário externo (link divulgado pela Rede). Nesse caso, os dados coletados lá são usados conforme o aviso daquele formulário; a lista de participantes pode ser consolidada pelos organizadores no painel ADM deste sistema.",
    ],
  },
  {
    id: "publico",
    title: "6. Dados visíveis ao público",
    paragraphs: [
      "Após a liberação da divulgação, visitantes sem login podem ver ranking com nomes completos, pontuações e, ao expandir um participante, detalhes por questão (enunciado, alternativas, resposta marcada e gabarito).",
      "Essa publicação está alinhada ao consentimento informado na inscrição ou à comunicação da Rede aos participantes e responsáveis.",
    ],
  },
  {
    id: "criancas",
    title: "7. Crianças e adolescentes",
    paragraphs: [
      "O ENEM da Read é voltado principalmente a adolescentes da Rede. Dados de menores são tratados para fins do evento, com envolvimento dos responsáveis na inscrição e nas autorizações aplicáveis, conforme prática da Rede e do formulário de inscrição.",
    ],
  },
  {
    id: "retencao",
    title: "8. Por quanto tempo guardamos",
    paragraphs: [
      "Mantemos dados das provas por tempo indeterminado, para arquivo histórico e memória das edições da Rede, salvo pedido de exclusão ou necessidade de eliminação quando não houver mais base legal.",
      "Pedidos de exclusão serão analisados caso a caso. Resultados já divulgados publicamente podem ter cópias em cache ou registros que exijam tratamento específico; informaremos o titular ou responsável sobre o que for possível na prática.",
    ],
  },
  {
    id: "direitos",
    title: "9. Seus direitos",
    paragraphs: [
      "Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, informação sobre compartilhamento e revogação de consentimento quando esta for a base aplicável.",
      "Envie pedidos ao e-mail indicado na seção 1. Responderemos em prazo razoável, podendo solicitar informações para confirmar identidade ou vínculo com o participante.",
    ],
  },
  {
    id: "seguranca",
    title: "10. Segurança",
    paragraphs: [
      "Adotamos medidas compatíveis com a natureza do projeto: comunicação via HTTPS, controle de acesso por autenticação, senhas com hash no servidor e restrição de funções por perfil (ADM, aplicador, público).",
      "Nenhum sistema é totalmente invulnerável; em caso de incidente relevante, a organização buscará agir de forma proporcional e, quando cabível, comunicar titulares e autoridades.",
    ],
  },
  {
    id: "alteracoes-priv",
    title: "11. Alterações desta política",
    paragraphs: [
      "Podemos atualizar esta Política de Privacidade. A data da última revisão aparece no topo da página. Recomendamos revisitar esta página periodicamente.",
    ],
  },
]
