/**
 * Contenido estático de la guía de escritura — Narrative Lab
 * Referencias ilustrativas a autores conocidos (enseñanza, no afiliación).
 */

/** @typedef {{ id: string, title: string, category: string, excerpt: string, body: string }} WritingGuideArticle */

/** @type {WritingGuideArticle[]} */
export const WRITING_GUIDE_ARTICLES = [
  {
    id: 'intro',
    title: 'Escribir ficción con intención',
    category: 'Fundamentos',
    excerpt: 'Propósito del lector, promesa del género y coherencia entre idea y ejecución.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">Un buen libro no es solo una acumulación de escenas: es una <strong class="text-slate-200">promesa cumplida</strong>. Antes de pulir frases, aclara qué experiencia quieres ofrecer (asombro, tensión romántica, inquietud filosófica…) y qué reglas internas respetará tu historia.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Premisa</strong>: una frase que combina personaje, conflicto y singularidad.</li>
        <li><strong class="text-slate-200">Tema</strong>: la pregunta moral o emocional que atraviesa la trama.</li>
        <li><strong class="text-slate-200">Contrato con el lector</strong>: si prometes misterio, entrega pistas; si prometes romance, no abandones el arco emocional.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">Las fichas siguientes profundizan en géneros, personajes, estructura y voz. Úsalas como mapa, no como fórmula rígida.</p>
    `,
  },
  {
    id: 'scifi',
    title: 'Ciencia ficción: premisa, reglas y consecuencias',
    category: 'Géneros',
    excerpt: 'Ideas claras, límites del mundo y el legado de Asimov en historias conceptuales.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">La ciencia ficción sólida suele partir de un <strong class="text-slate-200">«y si…?»</strong> bien delimitado: un cambio en la tecnología, la sociedad o el conocimiento, explorado con rigor.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Isaac Asimov como referencia</h3>
      <p class="text-slate-300 leading-relaxed mb-4">En obras como la saga de la <em>Fundación</em> o los relatos de robots, Asimov combina <strong class="text-slate-200">ideas grandes</strong> con reglas explícitas (p. ej. las Tres Leyes de la Robótica) que generan conflictos lógicos. No imitas el estilo: estudias cómo <strong class="text-slate-200">las reglas del mundo empujan la trama</strong>.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300">
        <li>Define 2–4 <strong class="text-slate-200">leyes o límites</strong> de tu universo (viaje, IA, biología…).</li>
        <li>Cada capítulo debería <strong class="text-slate-200">probar o tensar</strong> esas reglas.</li>
        <li>Evita info-dumps: la ciencia se revela cuando <strong class="text-slate-200">afecta decisiones</strong>.</li>
      </ul>
    `,
  },
  {
    id: 'fantasy',
    title: 'Fantasía: mitos, sistemas y peso emocional',
    category: 'Géneros',
    excerpt: 'Tolkien y Sanderson: profundidad histórica frente a magia con reglas explícitas.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">La fantasía funciona cuando el lector <strong class="text-slate-200">cree en el coste</strong> de lo maravilloso: tiempo, sangre, memoria, lealtad.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">J. R. R. Tolkien</h3>
      <p class="text-slate-300 leading-relaxed mb-4">En <em>El Señor de los Anillos</em>, el mundo se siente antiguo porque hay <strong class="text-slate-200">lenguas, ruinas y canciones</strong> que respaldan el mito. No necesitas un silmarillion completo, pero sí <strong class="text-slate-200">restos creíbles</strong> de historia (topónimos, tabúes, guerras pasadas) que expliquen el presente.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Brandon Sanderson</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Sanderson popularizó la idea de <strong class="text-slate-200">magia con reglas claras</strong> (coste, fuente, límites) para que el lector anticipe y se sorprenda dentro del marco. Pregunta clave: ¿qué no puede hacer tu sistema y por qué importa para el clímax?</p>
    `,
  },
  {
    id: 'romance',
    title: 'Romance y subtramas emocionales',
    category: 'Géneros',
    excerpt: 'Deseo, obstáculo creíble y evolución del vínculo en cualquier género.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">El romance fuerte no es solo química: es <strong class="text-slate-200">compatibilidad narrativa en tensión</strong>. Hace falta un obstáculo que importe (interno, social, de supervivencia…) y escenas donde la relación <strong class="text-slate-200">avance o fracture</strong> por decisiones.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Deseo mutuo</strong> con matices: miedos, pactos tácitos, malentendidos activos.</li>
        <li><strong class="text-slate-200">Ritmo</strong>: alterna intimidad (pequeños gestos) con presión externa.</li>
        <li>En fantasía o CF, el romance debe <strong class="text-slate-200">tocar las reglas del mundo</strong> (deber, clan, ley, peligro).</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">Puedes integrar romance como trama principal o como subtrama que humanice la aventura.</p>
    `,
  },
  {
    id: 'characters',
    title: 'Personajes memorables: deseo, miedo y arco',
    category: 'Personajes',
    excerpt: 'Motivaciones claras, contradicciones y progreso a lo largo del libro.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">Un personaje se vuelve memorable cuando el lector entiende <strong class="text-slate-200">qué quiere de verdad</strong>, <strong class="text-slate-200">qué teme perder</strong> y qué está dispuesto a sacrificar.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Herramientas prácticas</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Contradicción productiva</strong>: el héroe cobarde que actúa con valentía por alguien; el villano con código propio.</li>
        <li><strong class="text-slate-200">Arco</strong>: inicio (creencia o carencia) → pruebas que fuerzan elección → desenlace (cambio o tragedia coherente).</li>
        <li><strong class="text-slate-200">Voz</strong>: vocabulario, ritmo de frase y tabúes propios; se nota en diálogo y en pensamiento.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">En obras extensas (Sanderson, Tolkien), los repartos funcionan porque cada figura <strong class="text-slate-200">encierra un conflicto</strong> que choca con el mundo o con el grupo.</p>
    `,
  },
  {
    id: 'chapters',
    title: 'Capítulos que funcionan: propósito y ritmo',
    category: 'Estructura',
    excerpt: 'Objetivo narrativo, cambio al final y longitud al servicio del tono.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">Trata cada capítulo como una <strong class="text-slate-200">unidad con intención</strong>: al terminar, algo debe haber cambiado (información, poder emocional, peligro, relación).</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Pregunta dramática</strong>: formula al inicio qué duda mantendrá al lector (¿escaparán? ¿dirá la verdad?).</li>
        <li><strong class="text-slate-200">Gancho final</strong>: mini-cliffhanger, revelación o decisión que empuje al siguiente.</li>
        <li><strong class="text-slate-200">Variación</strong>: alterna capítulos densos de acción con otros de consecuencia o intimidad.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">En Rinconcito narrativo puedes anotar el <strong class="text-slate-200">objetivo del capítulo</strong> en el campo dedicado para no perder el hilo.</p>
    `,
  },
  {
    id: 'scenes',
    title: 'Escenas: unidad de tiempo, lugar y conflicto',
    category: 'Estructura',
    excerpt: 'Microtensión, objetivos de personaje y transiciones limpias.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">Una escena fuerte suele concentrar <strong class="text-slate-200">un conflicto local</strong> (aunque sea silencioso) y terminar con un cambio claro: nueva información, nueva alianza o nueva herida.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">POV</strong>: decide quién «posee» la escena y filtra todo por su percepción.</li>
        <li><strong class="text-slate-200">Objetivo / obstáculo / desenlace</strong>: mini-acto dentro de la escena.</li>
        <li><strong class="text-slate-200">Microtensión</strong>: gestos, silencios, detalles del entorno que mantengan la atención sin depender solo del clímax.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">Si una escena «informa» pero nadie quiere nada, recórtala o funde el dato en otra con presión dramática.</p>
    `,
  },
  {
    id: 'worldbuilding',
    title: 'Ambientación y mundo: profundidad antes que enciclopedia',
    category: 'Mundo',
    excerpt: 'Detalle con función, culturas en conflicto y el mapa emocional del lector.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">El worldbuilding excelente se nota cuando <strong class="text-slate-200">cada detalle hace trabajo</strong>: refuerza conflicto, carácter o tono.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Tolkien</h3>
      <p class="text-slate-300 leading-relaxed mb-4">La sensación de profundidad viene de <strong class="text-slate-200">capas lingüísticas y históricas</strong> que trascienden la trama inmediata. Puedes sugerir lo mismo con menos: un refrán, un tabú, una ruina nombrada con peso.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Sanderson</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Los sistemas (magia, política, economía) tienen <strong class="text-slate-200">costes y límites</strong> que el lector aprende por el uso, no por manual.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300">
        <li>Prioriza <strong class="text-slate-200">3–5 pilares culturales o físicos</strong> que choquen entre sí.</li>
        <li>Evita bloques de exposición: muestra el mundo en <strong class="text-slate-200">decisiones bajo presión</strong>.</li>
      </ul>
    `,
  },
  {
    id: 'architecture',
    title: 'Arquitectura del libro: actos, tramas y tensión',
    category: 'Estructura',
    excerpt: 'Tres actos, puntos de inflexión y cómo repartir revelaciones.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">Muchas novelas se apoyan en una estructura de <strong class="text-slate-200">tres actos</strong>: presentación del problema, complicación y resolución. No es obligatoria, pero ayuda a repartir <strong class="text-slate-200">revelaciones y reveses</strong>.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Incidente incitante</strong>: rompe el equilibrio inicial.</li>
        <li><strong class="text-slate-200">Punto sin retorno</strong>: el protagonista queda comprometido.</li>
        <li><strong class="text-slate-200">Crisis / clímax</strong>: confronta tema y trama; el coste debe sentirse real.</li>
        <li><strong class="text-slate-200">Trama A / B</strong>: trama externa (misión) e interna (miedo, relación) entrelazadas.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">La vista <strong class="text-slate-200">Actos</strong> de Rinconcito narrativo te permite alinear capítulos con macro-bloques narrativos.</p>
    `,
  },
  {
    id: 'narrator',
    title: 'Narrador y punto de vista',
    category: 'Técnica',
    excerpt: 'Primera, tercera, omnisciente, múltiples POVs y límites de conocimiento.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">El narrador decide <strong class="text-slate-200">qué sabe el lector y cuándo</strong>. Elegir POV es elegir contrato de suspense y empatía.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Primera persona</strong>: intimidad y voz fuerte; cuidado con la credibilidad de lo que el narrador puede saber.</li>
        <li><strong class="text-slate-200">Tercera limitada</strong>: una conciencia por escena; muy usada en fantasía y CF contemporáneas.</li>
        <li><strong class="text-slate-200">Omnisciente</strong>: libertad panorámica; requiere control del tono para no dispersar.</li>
        <li><strong class="text-slate-200">Múltiples POVs</strong>: claridad de cabecera o sección; cada voz debe sonar distinta.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">Puedes registrar el tipo de narrador en <strong class="text-slate-200">Metadatos del libro</strong> para mantener coherencia en revisiones.</p>
    `,
  },
  {
    id: 'masters',
    title: 'Tres maestros de referencia: Asimov, Tolkien, Sanderson',
    category: 'Referencias',
    excerpt: 'Qué estudiar en cada uno sin copiar su voz.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">Usa a estos autores como <strong class="text-slate-200">laboratorio de técnicas</strong>, no como plantilla de estilo.</p>
      <dl class="space-y-4 text-slate-300">
        <div>
          <dt class="text-sm font-semibold text-indigo-300">Isaac Asimov</dt>
          <dd class="mt-1">Ideas claras, dilemas lógicos, reglas explícitas que generan conflicto. Útil para CF conceptual y sociedades futuras.</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-indigo-300">J. R. R. Tolkien</dt>
          <dd class="mt-1">Mito, lenguaje y continuidad histórica. Útil para dar peso épico y sensación de tiempo profundo.</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-indigo-300">Brandon Sanderson</dt>
          <dd class="mt-1">Sistemas con límites, planificación de series, escenas de acción con claridad espacial y payoff de setup.</dd>
        </div>
      </dl>
      <p class="text-slate-300 leading-relaxed mt-6">Lee un capítulo como escritor: subraya <strong class="text-slate-200">qué pregunta plantea</strong> y <strong class="text-slate-200">cómo cierra el ciclo</strong> antes de pasar página.</p>
    `,
  },
  {
    id: 'dialogue',
    title: 'Diálogo, voz y escenas habladas',
    category: 'Técnica',
    excerpt: 'Subtexto, ritmo y cómo evitar la exposición disfrazada.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">El buen diálogo avanza conflicto o revela carácter; el malo solo <strong class="text-slate-200">informa</strong> con la boca de los personajes.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Subtexto</strong>: lo que no se dice; miedos, cortesías, poder.</li>
        <li><strong class="text-slate-200">Variedad</strong>: frases cortas para tensión; silencios y gestos como respuesta.</li>
        <li><strong class="text-slate-200">Voz</strong>: léxico y ritmo distintivos por personaje, sin caricatura constante.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">El panel lateral de Rinconcito narrativo puede ayudarte a vigilar <strong class="text-slate-200">ritmo y repeticiones</strong> en la escena activa.</p>
    `,
  },
];

/**
 * @param {string} id
 * @returns {WritingGuideArticle | undefined}
 */
export function getWritingGuideArticle(id) {
  return WRITING_GUIDE_ARTICLES.find((a) => a.id === id);
}
