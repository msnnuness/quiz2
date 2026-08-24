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
  embedUrl: 'https://customer-9oh3tset0qkwn7ag.cloudflarestream.com/94e495b5a1bdf0396f651fbfc06df17b/iframe',

  // --- modo mp4 ---
  mp4Url: '',

  // --- modo script ---
  scriptSrc: '',
  containerId: 'vsl-player',

  /** Imagem de capa. Vazio = capa gerada com o próprio design. */
  posterUrl: 'https://customer-9oh3tset0qkwn7ag.cloudflarestream.com/94e495b5a1bdf0396f651fbfc06df17b/thumbnails/thumbnail.jpg?height=600',

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
  aspectRatio: '9 / 16',

  headline: 'Antes de continuar, assista a este vídeo',
  sublead: 'Explico em 3 minutos como a jornada de 21 dias organiza exatamente as prioridades que apareceram na sua análise.',

  /**
   * Trava da oferta.
   * 0     = oferta sempre visível (recomendado começar assim)
   * 90    = oferta só aparece 90s depois do play
   * Ver a nota no README antes de ligar isso.
   */
  revealOfferAfterSeconds: 0,
}

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
