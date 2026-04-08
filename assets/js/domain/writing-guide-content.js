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
    id: 'character-three-pillars',
    title: 'Los tres pilares de los personajes atractivos',
    category: 'Personajes',
    excerpt:
      'Proactividad, relatabilidad y capacidad — enseñanza de Brandon Sanderson: por qué casi nadie destaca en los tres y cómo eso alimenta el arco.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4"><strong class="text-slate-200">«¿Cómo se escribe un personaje interesante?»</strong> Es una pregunta engañosamente simple que, según señala Brandon Sanderson, sorprendentemente está ausente en muchos cursos universitarios de escritura creativa.</p>
      <p class="text-slate-300 leading-relaxed mb-4">Él cuenta que, al volver de una misión en Corea, decidió tomarse en serio entender cómo escribir una buena novela: cambió de química a inglés y se inscribió en todos los cursos de escritura creativa que pudo. Sorprendentemente, <strong class="text-slate-200">muy pocos hablaban de cómo crear personajes sólidos</strong>; solo un profesor abordó el tema en profundidad. Por eso Sanderson considera esencial enseñar este concepto con detalle.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Los tres atributos clave</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Su enfoque se apoya en tres pilares que hacen interesante a un personaje:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Proactividad</strong> — empuja la historia.</li>
        <li><strong class="text-slate-200">Relatabilidad</strong> (capacidad de generar conexión con el lector).</li>
        <li><strong class="text-slate-200">Capacidad</strong> — poder de actuar con efecto en el relato.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-4">Lo habitual es que <strong class="text-slate-200">casi nadie destaque en los tres</strong>: suele ser fuerte en uno, medio en otro, y desarrollar el tercero a lo largo de la historia. Eso funciona como base para el <strong class="text-slate-200">arco del personaje</strong>.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Proactividad: el motor de la historia</h3>
      <p class="text-slate-300 leading-relaxed mb-4">La proactividad es probablemente el elemento más importante. Al entrar en una historia queremos ver <strong class="text-slate-200">progreso</strong>; los personajes proactivos hacen avanzar la trama. <em>Ejemplo:</em> Jack en <em>Lost</em>, que tras un accidente toma el control de inmediato. Los que actúan generan conexión; los pasivos frustran.</p>
      <h4 class="text-xs font-semibold text-slate-200 mt-4 mb-2">El problema del villano</h4>
      <p class="text-slate-300 leading-relaxed mb-4">Los villanos suelen ser <strong class="text-slate-200">más proactivos que los héroes</strong>. Soluciones: mostrar pequeñas acciones proactivas del protagonista; darle deseos claros (aunque sean simples); usar acciones pequeñas que reflejen grandes temas. <em>Ejemplo:</em> <em>Mulán</em> muestra proactividad desde el inicio en detalles cotidianos, lo que justifica decisiones mayores después.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Relatabilidad: el puente con el lector</h3>
      <p class="text-slate-300 leading-relaxed mb-4">No significa que el personaje sea «agradable»: se trata de <strong class="text-slate-200">generar conexión</strong>. Estrategias: <strong class="text-slate-200">«Save the Cat»</strong> (ayudar a otros genera empatía); <strong class="text-slate-200">autoconciencia</strong> (reconocer defectos); <strong class="text-slate-200">experiencias compartidas</strong> (motivos universales); <strong class="text-slate-200">perspectiva externa</strong> (ver al personaje a través de otros).</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Capacidad: el poder de actuar</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Nos gusta ver personajes competentes, pero <strong class="text-slate-200">demasiada capacidad reduce la conexión</strong>. El equilibrio ideal: muy capaz en algunas áreas y débil en otras. Las versiones modernas de James Bond muestran más vulnerabilidad por eso.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Arcos de personaje</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Un arco implica crecimiento en <strong class="text-slate-200">uno de los tres ejes</strong>: aumentar relatabilidad (superar defectos), aumentar capacidad (aprender habilidades) o aumentar proactividad (tomar el control del destino).</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Antihéroes</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Antihéroe clásico:</strong> rechaza actuar; rompe expectativas del héroe tradicional.</li>
        <li><strong class="text-slate-200">Antihéroe moderno:</strong> muy capaz, poco relatable; funciona porque sus enemigos son peores. No tiene que ser «bueno», solo <strong class="text-slate-200">más comprensible que el antagonista</strong>.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Defectos y limitaciones</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Tres tipos a distinguir:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Defectos:</strong> cosas que debe superar.</li>
        <li><strong class="text-slate-200">Restricciones:</strong> limitaciones autoimpuestas.</li>
        <li><strong class="text-slate-200">Limitaciones:</strong> restricciones externas.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Si el personaje no puede actuar</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Mostrar <strong class="text-slate-200">proactividad mental</strong>, acciones pequeñas, intentos fallidos; desarrollar otros atributos mientras tanto.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Equilibrio</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Piensa los tres atributos como escalas: ¿dónde es fuerte? ¿dónde debe crecer? ¿cuál será débil?</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Motivación</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Es clave: si un personaje falla, muchas veces es por motivación. Preguntas útiles: ¿qué quiere? ¿sus acciones coinciden con eso? ¿se entienden sus decisiones?</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Errores comunes</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Personajes con una sola característica.</li>
        <li>Villanos más interesantes que protagonistas.</li>
        <li>Personajes demasiado perfectos.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Resumen (puntos clave)</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300">
        <li>Un buen personaje se apoya en <strong class="text-slate-200">tres pilares</strong>: proactividad, relatabilidad, capacidad.</li>
        <li>No debe ser perfecto en los tres: destaca en uno, medio en otro, crece en el tercero.</li>
        <li><strong class="text-slate-200">Proactividad</strong> es lo más importante para avanzar la historia.</li>
        <li><strong class="text-slate-200">Relatabilidad</strong> no es ser agradable, sino generar conexión.</li>
        <li><strong class="text-slate-200">Capacidad</strong> debe estar equilibrada (demasiada reduce empatía).</li>
        <li>Los arcos implican crecimiento en uno de los tres ejes.</li>
        <li>Los villanos suelen ser más proactivos: hay que compensar al protagonista.</li>
        <li>Los antihéroes funcionan si son más comprensibles que sus enemigos.</li>
        <li>Diferencia defectos, restricciones y limitaciones.</li>
        <li>La motivación es central; muchos problemas vienen de ahí.</li>
      </ul>
    `,
  },
  {
    id: 'character-customization',
    title: 'Cómo personalizar personajes',
    category: 'Personajes',
    excerpt:
      'Personajes icónicos que no cambian; motivación, personalidad y valores; diálogo, quirks, POV y autenticidad al escribir fuera de tu experiencia.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">No todos los personajes necesitan evolucionar profundamente. Hay algunos que funcionan precisamente porque se mantienen iguales, y ahí está su gracia: son personajes <strong class="text-slate-200">icónicos</strong> — no cambian mucho, pero impactan el mundo a su alrededor.</p>
      <p class="text-slate-300 leading-relaxed mb-4">En ellos la tensión no viene de «¿va a crecer?», sino de preguntas como:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>¿Será suficiente su habilidad esta vez?</li>
        <li>¿Podrá vencer a un enemigo aún más fuerte?</li>
        <li>¿Logrará salvar a todos o habrá un coste?</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-4">La historia gira más en <strong class="text-slate-200">cómo afectan al mundo</strong> que en cómo el mundo los cambia a ellos.</p>
      <p class="text-slate-300 leading-relaxed mb-4">Dejando esos casos especiales, la mayoría de personajes se construyen sobre <strong class="text-slate-200">tres elementos</strong> que definen su identidad.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">1. Motivación</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Es lo primero y más importante: <strong class="text-slate-200">qué quiere</strong> el personaje y <strong class="text-slate-200">por qué</strong>. Es la base de todo.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Su <strong class="text-slate-200">pasado</strong> influye en lo que quiere.</li>
        <li>Sus <strong class="text-slate-200">decisiones pasadas</strong> lo definen.</li>
        <li><strong class="text-slate-200">Miedos, fracasos y secretos</strong> profundizan esa motivación.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-4">Si la motivación no está clara, el personaje simplemente <strong class="text-slate-200">no funciona</strong>.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">2. Personalidad</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Es <strong class="text-slate-200">cómo</strong> el personaje busca lo que quiere; ahí se vuelve interesante. Dos personas pueden querer lo mismo, pero una ser directa y agresiva, otra sutil y manipuladora, otra improvisar en vez de planificar. Eso define cómo se le percibe. La personalidad es lo que el lector <strong class="text-slate-200">siente en cada acción</strong>.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">3. Valores</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Son los principios que guían al personaje: explican <strong class="text-slate-200">por qué</strong> toma ciertas decisiones, permiten entender incluso figuras moralmente cuestionables y dan <strong class="text-slate-200">coherencia interna</strong> a sus actos. Puede hacer cosas terribles, pero si sus valores están claros, se vuelve comprensible.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Técnicas para darles vida</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Para construirlos mejor:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Hacer <strong class="text-slate-200">preguntas específicas</strong> (qué haría en situaciones cotidianas, cómo trata a otros).</li>
        <li>Definir qué quiere, por qué no lo tiene y qué está dispuesto a <strong class="text-slate-200">sacrificar</strong>.</li>
        <li>Establecer <strong class="text-slate-200">rasgos base</strong> que permitan anticipar su comportamiento.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Diálogo</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Es una de las herramientas más potentes para mostrar personalidad. Para diferenciar personajes:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Cambiar <strong class="text-slate-200">patrones de habla</strong> (frases cortas, largas, caóticas, estructuradas).</li>
        <li>Ajustar el <strong class="text-slate-200">vocabulario</strong> (formal, técnico, simple).</li>
        <li>Evitar <strong class="text-slate-200">estereotipos superficiales</strong>.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-4">Cada uno debería sonar único incluso sin descripciones.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Quirks (rasgos distintivos)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Ayudan a que un personaje sea memorable, pero funcionan mejor cuando están <strong class="text-slate-200">conectados a su esencia</strong>: un buen quirk refuerza la personalidad; uno forzado se siente artificial.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Puntos de vista</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Pocos puntos de vista → más control y claridad. Múltiples → más complejidad, pero más difícil de manejar. Agrupar personajes relacionados puede simplificar la narrativa.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Personajes difíciles</h3>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Si no son agradables, deben ser <strong class="text-slate-200">interesantes</strong>.</li>
        <li>Si son introspectivos, su voz debe ser atractiva o necesitan <strong class="text-slate-200">presión externa</strong>.</li>
        <li>No todas las historias dependen de la trama; a veces la <strong class="text-slate-200">voz</strong> o el estilo es lo principal.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Contextos distintos al propio</h3>
      <p class="text-slate-300 leading-relaxed mb-4">La clave es la <strong class="text-slate-200">autenticidad</strong>:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300">
        <li>Investigar fuentes reales.</li>
        <li>Escuchar a personas con esa experiencia.</li>
        <li>Entender que cada individuo es distinto.</li>
        <li>Evitar estereotipos dañinos.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mt-4">Esto no solo evita errores, sino que mejora la calidad de la historia en general.</p>
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
    id: 'narrative-three-pillars',
    title: 'Los tres pilares de la narrativa (trama y plot)',
    category: 'Estructura',
    excerpt:
      'Trama, personajes y ambientación unidos por el conflicto; Big P / little p plot; y el marco Promise, Progress, Payoff para enganchar y cerrar.',
    body: `
      <p class="text-slate-300 leading-relaxed mb-4">La narrativa, en este enfoque, se construye sobre <strong class="text-slate-200">tres pilares fundamentales</strong>: <strong class="text-slate-200">trama</strong>, <strong class="text-slate-200">personajes</strong> y <strong class="text-slate-200">ambientación</strong>, unidos por el <strong class="text-slate-200">conflicto</strong>. La trama no es una sola cosa: se divide en dos niveles que trabajan juntos.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Big P Plot:</strong> la historia principal, lo que responde «de qué trata el libro».</li>
        <li><strong class="text-slate-200">little p plot:</strong> los eventos y problemas pequeños capítulo a capítulo que, acumulados, construyen el conflicto mayor.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Promise, Progress, Payoff</h3>
      <p class="text-slate-300 leading-relaxed mb-4">El núcleo del storytelling se resume en un marco práctico: <strong class="text-slate-200">Promise, Progress, Payoff</strong>. Explica cómo <strong class="text-slate-200">enganchar</strong>, <strong class="text-slate-200">mantener</strong> y <strong class="text-slate-200">satisfacer</strong> al lector.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">La promesa (Promise)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Ocurre al inicio y define qué puede esperar el lector. No es solo el argumento, sino la <strong class="text-slate-200">experiencia completa</strong> que se anticipa.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Define el <strong class="text-slate-200">tono</strong> (oscuro, humorístico, épico…).</li>
        <li>Introduce el <strong class="text-slate-200">conflicto</strong> y los <strong class="text-slate-200">objetivos</strong>.</li>
        <li>Establece el <strong class="text-slate-200">tipo de historia</strong> (género / estructura).</li>
        <li>Las <strong class="text-slate-200">primeras páginas</strong> son decisivas para retener al lector.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">El progreso (Progress)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Es lo que mantiene viva la historia. No basta con que «pasen cosas»: el lector debe <strong class="text-slate-200">sentir que avanza</strong>. Ese progreso puede tomar formas distintas:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Información:</strong> descubrimiento de pistas o respuestas.</li>
        <li><strong class="text-slate-200">Relaciones:</strong> evolución entre personajes.</li>
        <li><strong class="text-slate-200">Interno:</strong> crecimiento o cambio personal.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-4">Para que funcione se usan <strong class="text-slate-200">señales de progreso</strong> (<em>signposting</em>), que indican al lector que la historia avanza:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Nuevos datos importantes.</li>
        <li>Decisiones relevantes.</li>
        <li>Obstáculos o cambios de dirección.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-4"><strong class="text-slate-200">Evitar el estancamiento</strong> es clave: variar el ritmo y asegurar que cada escena aporte algo (trama, personaje o conflicto).</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">El payoff (recompensa)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Es el cierre, pero no cualquiera: una resolución que se sienta <strong class="text-slate-200">sorprendente e inevitable</strong>. Donde se cumple (o se transforma) la promesa inicial.</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Debe <strong class="text-slate-200">responder</strong> a lo que la historia prometió.</li>
        <li>Tiene que generar <strong class="text-slate-200">duda</strong> antes de ocurrir.</li>
        <li>Debe sentirse <strong class="text-slate-200">ganada</strong>, no conveniente.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Los giros (twists)</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Encajan en el mismo principio: se establece una expectativa, se <strong class="text-slate-200">redirige</strong> gradualmente y se entrega un resultado <strong class="text-slate-200">inesperado pero coherente</strong>.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Tensión narrativa</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Hacer que el lector <strong class="text-slate-200">dude</strong> de que la promesa se cumplirá. Cuanto más imposible parezca, más potente puede ser la recompensa. Herramientas: introducir <strong class="text-slate-200">obstáculos reales</strong>, <strong class="text-slate-200">escalar el conflicto</strong>, hacer olvidar momentáneamente la promesa.</p>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Conclusión</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Escribir bien no es seguir reglas rígidas ni buscar la historia «perfecta», sino lograr un <strong class="text-slate-200">equilibrio</strong>:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Cumplir expectativas del lector.</li>
        <li>Sorprender con inteligencia.</li>
        <li>Entregar una experiencia satisfactoria.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed">Incluso <strong class="text-slate-200">romper reglas</strong> puede funcionar si el resultado es más interesante y coherente con la historia.</p>
    `,
  },
  {
    id: 'narrator',
    title: 'Tipos de narrador',
    category: 'Técnica',
    excerpt:
      'Primera persona, tercera limitada y omnisciente, segunda persona, narrador testigo: cuándo usar cada uno y regla práctica de elección.',
    body: `
      <h3 class="text-sm font-semibold text-indigo-300 mt-2 mb-2">1. Narrador en primera persona</h3>
      <p class="text-slate-300 leading-relaxed mb-4">El personaje cuenta la historia desde su propia perspectiva («yo»).</p>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Características</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Acceso total a pensamientos y emociones del narrador.</li>
        <li>Visión limitada (solo sabe lo que él sabe).</li>
        <li>Puede ser <strong class="text-slate-200">poco confiable</strong>.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Cuándo conviene</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Historias íntimas o emocionales.</li>
        <li>Cuando buscas fuerte conexión con el lector.</li>
        <li>Narrativas centradas en la psicología del personaje.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Ejemplos de uso ideal</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Novelas de crecimiento personal.</li>
        <li>Historias con giros basados en percepción.</li>
        <li>Narradores poco confiables.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">2. Narrador en tercera persona limitada</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Cuenta la historia desde fuera, pero sigue a un personaje específico.</p>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Características</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Usa «él / ella».</li>
        <li>Acceso a pensamientos de un personaje (o pocos).</li>
        <li>Más flexible que la primera persona.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Cuándo conviene</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Balance entre inmersión y claridad.</li>
        <li>Historias centradas en un protagonista pero con algo de amplitud.</li>
        <li>Narrativas modernas (es el más usado hoy).</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Ejemplos de uso ideal</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Fantasía, ciencia ficción.</li>
        <li>Thriller.</li>
        <li>Historias con desarrollo de personaje fuerte.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">3. Narrador en tercera persona omnisciente</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Sabe todo: pensamientos, pasado, futuro, de todos los personajes.</p>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Características</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Visión total del mundo.</li>
        <li>Puede cambiar entre personajes libremente.</li>
        <li>Tono más «autor» o narrador clásico.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Cuándo conviene</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Historias complejas o épicas.</li>
        <li>Cuando quieres mostrar múltiples perspectivas.</li>
        <li>Narrativas más literarias o clásicas.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Ejemplos de uso ideal</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Sagas grandes.</li>
        <li>Historias con muchos personajes.</li>
        <li>Narrativas tipo «cuento contado».</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">4. Narrador en segunda persona</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Habla directamente al lector («tú haces esto…»).</p>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Características</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Muy inmersivo, pero poco común.</li>
        <li>Puede sentirse experimental o extraño.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Cuándo conviene</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Experimentos narrativos.</li>
        <li>Historias psicológicas o introspectivas.</li>
        <li>Videojuegos o narrativa interactiva.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">5. Narrador testigo</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Un personaje secundario cuenta la historia de otro.</p>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Características</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>No es el protagonista.</li>
        <li>Observa y relata.</li>
        <li>Tiene visión parcial.</li>
      </ul>
      <p class="text-slate-300 leading-relaxed mb-2"><strong class="text-slate-200">Cuándo conviene</strong></p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>Cuando quieres crear misterio sobre el protagonista.</li>
        <li>Para mostrar admiración, duda o interpretación externa.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Cómo elegir el narrador</h3>
      <p class="text-slate-300 leading-relaxed mb-4">La elección depende de lo que quieres lograr:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li><strong class="text-slate-200">Conexión emocional fuerte</strong> → primera persona.</li>
        <li><strong class="text-slate-200">Equilibrio (opción segura)</strong> → tercera persona limitada.</li>
        <li><strong class="text-slate-200">Amplitud y complejidad</strong> → tercera persona omnisciente.</li>
        <li><strong class="text-slate-200">Algo experimental o distinto</strong> → segunda persona.</li>
        <li><strong class="text-slate-200">Misterio sobre el protagonista</strong> → narrador testigo.</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Regla práctica</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Antes de elegir, pregúntate:</p>
      <ul class="list-disc pl-5 space-y-2 text-slate-300 mb-4">
        <li>¿Qué tan cerca quiero que el lector esté del personaje?</li>
        <li>¿Cuánta información necesita el lector?</li>
        <li>¿La historia depende más de la emoción o del mundo?</li>
      </ul>
      <h3 class="text-sm font-semibold text-indigo-300 mt-6 mb-2">Recomendación directa</h3>
      <p class="text-slate-300 leading-relaxed mb-4">Para la mayoría de proyectos (sobre todo si empiezas o buscas algo sólido), <strong class="text-slate-200">tercera persona limitada</strong> suele ser la mejor opción; luego puedes experimentar según lo que pida la historia.</p>
      <p class="text-slate-300 leading-relaxed">Puedes registrar el tipo de narrador en <strong class="text-slate-200">Metadatos del libro</strong> para mantener coherencia en revisiones. Con <strong class="text-slate-200">múltiples POVs</strong>, define claridad de cabecera o sección y que cada voz suene distinta.</p>
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
