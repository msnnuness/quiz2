/**
 * ============================================================
 *  CONFIGURAÇÃO CENTRAL — altere tudo por aqui.
 * ============================================================
 */

/** URL do checkout (Hotmart, Kiwify, Stripe, etc.) */
export const CHECKOUT_URL = 'COLOCAR_CHECKOUT_AQUI'

/** ID do container do Google Tag Manager. Deixe o placeholder para desativar. */
export const GTM_ID = 'GTM-XXXXXXX'

/** Preço da oferta */
export const PRICE = {
  amount: 97,
  currency: 'BRL',
  display: 'R$ 97',
  /** Texto opcional abaixo do preço. Use '' para esconder. */
  note: 'Pagamento único • acesso imediato',
  /** Preço "de" riscado. Use null para esconder (recomendado se não for real). */
  compareAt: null,
}

/** Nome do produto */
export const PRODUCT = {
  name: 'PROGRAMA 21D',
  durationDays: 21,
}

/**
 * ============================================================
 *  VÍDEO (VSL pós-resultado)
 * ============================================================
 * Três modos. Use UM:
 *
 *  mode: 'embed'  → iframe (YouTube, Vimeo, Panda, Bunny)
 *                   preencha embedUrl com a URL de EMBED, não a de compartilhar
 *
 *  mode: 'mp4'    → arquivo direto (CDN, Bunny, S3)
 *                   preencha mp4Url. É o único modo que rastreia
 *                   progresso real de reprodução.
 *
 *  mode: 'script' → players que injetam script (VTurb, Converteai)
 *                   preencha scriptSrc e containerId
 */
export const VIDEO = {
  enabled: true,
  mode: 'embed',

  // --- modo embed ---
  // YouTube:  https://www.youtube.com/embed/VIDEO_ID?rel=0&modestbranding=1
  // Vimeo:    https://player.vimeo.com/video/VIDEO_ID
  // Panda:    https://player-vz-XXXX.tv.pandavideo.com.br/embed/?v=VIDEO_ID
  embedUrl: 'https://customer-9oh3tset0qkwn7ag.cloudflarestream.com/e3a3df54b553e562e1209af0651e29d4/iframe',

  // --- modo mp4 ---
  mp4Url: '',

  // --- modo script ---
  scriptSrc: '',
  containerId: 'vsl-player',

  /** Imagem de capa. Vazio = capa gerada com o próprio design. */
  posterUrl: 'https://customer-9oh3tset0qkwn7ag.cloudflarestream.com/e3a3df54b553e562e1209af0651e29d4/thumbnails/thumbnail.jpg?height=600',

  /**
   * Autoplay ao abrir a página.
   * O vídeo começa sozinho MUDO (navegador móvel bloqueia som sem toque)
   * e aparece um aviso para ativar o áudio com um toque.
   * false = mostra capa com botão de play.
   */
  autoplay: true,

  /**
   * Esconde a barra de controles (padrão VSL).
   * A pessoa não consegue pular para o fim nem ver a duração.
   * Deixe false se quiser que ela possa pausar e voltar.
   */
  hideControls: true,

  /** Duração real, em segundos. Usada para os eventos de progresso. */
  durationSeconds: 180,

  /**
   * Proporção do quadro. Use a do arquivo original:
   *   '16 / 9'  → horizontal (padrão)
   *   '9 / 16'  → vertical (Reels, Stories, gravação de celular)
   *   '4 / 5'   → retrato do feed
   *   '1 / 1'   → quadrado
   * Errar isso gera tarja preta nas laterais e derruba a retenção no mobile.
   */
  aspectRatio: '16 / 9',

  /** Deixe vazio: no topo o H1/H2 já fazem esse papel. */
  headline: '',
  sublead: '',

  /**
   * Trava do conteúdo.
   * Depois de X segundos de vídeo assistido, todo o restante da
   * página é liberado: barras, prioridades, oferta, FAQ.
   * O H1/H2 e o vídeo aparecem sempre — nunca esconda os dois,
   * ou a pessoa não entende onde foi parar a análise dela.
   * 0 = nada travado.
   */
  revealAfterSeconds: 30,
}

/**
 * ============================================================
 *  ABERTURA DA PÁGINA DE RESULTADO (acima do vídeo)
 * ============================================================
 * H1 e H2 mudam conforme o primary_goal que a pessoa declarou.
 * É o que faz a abertura tocar na dor dela e não numa dor genérica.
 *
 * LIMITE QUE NÃO SE CRUZA: pode nomear o incômodo, não pode
 * diagnosticar nem prometer melhora de função sexual. "Sua
 * confiança já foi maior" é dor. "Você tem disfunção" é
 * diagnóstico — e é publicidade enganosa.
 */
export const HERO = {
  ENERGY: {
    h1: 'Não é falta de tempo. É falta de energia.',
    h2: 'Suas respostas apontam onde a disposição está sendo drenada antes mesmo do dia começar.',
  },
  LIBIDO: {
    h1: 'Quase nunca começa na cama.',
    h2: 'Sono, rotina e estresse chegam primeiro. Suas respostas mostram por onde começar.',
  },
  PERFORMANCE: {
    h1: 'A insegurança cansa mais do que o dia inteiro de trabalho.',
    h2: 'Suas respostas indicam o que está pesando e o que dá para reconstruir primeiro.',
  },
  CONTROL: {
    h1: 'Você não está sozinho nisso, e não precisa resolver tudo de uma vez.',
    h2: 'Suas respostas apontam por onde começar de forma estruturada nos próximos 21 dias.',
  },
  WELLBEING: {
    h1: 'Saber o que fazer nunca foi o problema.',
    h2: 'Suas respostas mostram quais hábitos merecem sua atenção primeiro — e em que ordem.',
  },
}

/**
 * ============================================================
 *  GARANTIA
 * ============================================================
 * O Código de Defesa do Consumidor já dá 7 dias de arrependimento
 * em compra online no Brasil (art. 49). Ou seja: os 7 dias você é
 * obrigado a honrar de qualquer forma. Anunciar isso não custa nada
 * e reduz atrito. Estender para 14 ou 30 é decisão sua.
 */
export const GUARANTEE = {
  enabled: true,
  days: 7,
  title: 'Garantia de {days} dias',
  text: 'Se você entrar, seguir o plano e sentir que não é para você, devolvemos o valor integral. Sem formulário e sem justificativa.',
}

/**
 * ============================================================
 *  PERGUNTAS FREQUENTES
 * ============================================================
 * Cada item aqui é uma objeção que impede a compra. Escreva
 * respostas curtas e honestas — resposta evasiva aumenta a
 * desconfiança em vez de reduzir.
 */
export const FAQ = [
  {
    q: 'Isso é um tratamento ou medicamento?',
    a: 'Não. O Programa 21D é educacional e trabalha rotina, sono, hábitos e consistência. Não faz diagnóstico, não prescreve nada e não substitui acompanhamento médico.',
  },
  {
    q: 'Quanto tempo por dia eu preciso ter?',
    a: 'As ações diárias foram desenhadas para caber em poucos minutos. A ideia é constância, não intensidade — por isso são 21 dias e não um plano de choque.',
  },
  {
    q: 'Preciso de academia ou equipamento?',
    a: 'Não. O plano parte da rotina que você já tem e ajusta a partir dela.',
  },
  {
    q: 'Alguém vai saber que eu entrei?',
    a: 'Não. A comunidade é opcional e usa apelidos. Você pode fazer o programa inteiro sem publicar nada.',
  },
  {
    q: 'E se não funcionar para mim?',
    a: 'Você tem garantia de 7 dias para pedir o reembolso integral.',
  },
]

/** Tempos de animação (ms) */
export const TIMING = {
  /** trava entre respostas — evita duplo clique */
  answerLock: 420,
  /** duração das telas de transição automática */
  interstitial: 2000,
  /** duração da tela de processamento */
  processing: 5000,
}

/** Chaves do localStorage */
export const STORAGE = {
  session: 'p21d.session.v1',
  lead: 'p21d.lead.v1',
}

/** Parâmetros de URL capturados para atribuição */
export const TRACKED_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'src',
  'fbclid',
  'gclid',
  'ttclid',
]
