/* Catálogo de Verellen: arma categoria.html y producto.html a partir de data/productos.js.
   Las URLs son /productos/<categoria> y /productos/<categoria>/<modelo> (ver vercel.json).
   Sin servidor también se puede probar con ?categoria=salamandras&modelo=st-v-060. */
(function () {
  var WA = '5492494595007';
  var CATS = window.CATEGORIAS || [];
  var PRODS = window.PRODUCTOS || [];
  var LINEAS = {
    calefaccion: { nombre: 'Calefacción', url: '/#calefaccion' },
    parrilla: { nombre: 'Parrilla y accesorios', url: '/#parrilla' }
  };
  // Artículo para "Consultar por la ST-V 060", "por el Hogar 085", etc.
  var ARTICULO = { salamandras: 'la', 'con-horno': 'la', parrillas: 'la', hogares: 'el', fogones: 'el',
    leneros: 'el', hornos: 'el', convectores: 'los' };
  var SUBLINEAS = ['ST', 'Compact', 'M'];
  // Rangos del filtro de salamandras (los datos van de 40 a 290 m²); los vacíos no se muestran
  var RANGOS = [
    { id: 'hasta-60', texto: 'Hasta 60 m²', min: 0, max: 60 },
    { id: '61-100', texto: '61 a 100 m²', min: 61, max: 100 },
    { id: '101-150', texto: '101 a 150 m²', min: 101, max: 150 },
    { id: 'mas-150', texto: 'Más de 150 m²', min: 151, max: Infinity }
  ];

  var app = document.getElementById('app');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function wa(msg) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg); }
  function src(ruta) { return '/' + ruta; }
  function urlCat(slug) { return '/productos/' + slug; }
  function urlProd(p) { return '/productos/' + p.categoria + '/' + p.slug; }
  function cat(slug) { return CATS.filter(function (c) { return c.slug === slug; })[0]; }
  function deCat(slug) { return PRODS.filter(function (p) { return p.categoria === slug; }); }

  function ruta() {
    var partes = location.pathname.split('/').filter(Boolean);
    var i = partes.indexOf('productos');
    var q = new URLSearchParams(location.search);
    return {
      categoria: (i >= 0 && partes[i + 1]) || q.get('categoria'),
      modelo: (i >= 0 && partes[i + 2]) || q.get('modelo')
    };
  }

  function meta(titulo, descripcion) {
    document.title = titulo + ' · Verellen';
    var m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', descripcion);
  }

  // Datos técnicos
  function dato(p, re) {
    var d = p.datos.filter(function (x) { return re.test(x.etiqueta); })[0];
    return d ? d.valor : null;
  }
  function fmt(v) {
    return String(v)
      .replace(/\b(\d{4,})\b/g, function (n) { return Number(n).toLocaleString('es-AR'); })
      .replace(/\s*"/g, '″').replace(/Kcal/g, 'kcal').replace(/\bKg\b/g, 'kg');
  }
  function claves(p) {
    var filas = [];
    if (p.m2) filas.push('Hasta ' + p.m2 + ' m²');
    var pot = dato(p, /^potencia/i);
    if (pot) filas.push(fmt(pot));
    var ancho = dato(p, /^ancho/i);
    if (ancho) filas.push('Ancho ' + fmt(ancho));
    return filas;
  }
  // Nombres más claros para las etiquetas del sitio viejo (los valores no se tocan)
  var NOMBRES = {
    'alto con pié o leñero': 'Alto con leñero', 'altura sin suplemento': 'Alto',
    'rendimiento térmico': 'Calefacciona', 'salida de recuperador': 'Salida para recuperador'
  };
  function nombreDato(et) {
    var n = NOMBRES[et.toLowerCase()] || et;
    return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
  }
  // Orden de la tabla: primero las medidas, después lo técnico y al final el resto
  var ORDEN = [/^alt(ura|o)( sin suplemento| total)?$/i, /^alto con/i, /^ancho/i, /^profundidad/i, /^peso/i,
    /^salida de humos/i, /^salida de recuperador/i];
  function puesto(d) {
    for (var i = 0; i < ORDEN.length; i++) if (ORDEN[i].test(d.etiqueta)) return i;
    return ORDEN.length;
  }
  function specs(p, excluir) {
    var datos = p.datos.filter(function (d) { return !excluir || excluir.indexOf(d) < 0; })
      .map(function (d, i) { return { d: d, i: i }; })
      .sort(function (a, b) { return puesto(a.d) - puesto(b.d) || a.i - b.i; })
      .map(function (x) { return x.d; });
    if (!datos.length) return '';
    return '<dl class="specs specs-lista">' + datos.map(function (d) {
      return '<div><dt>' + esc(nombreDato(d.etiqueta)) + '</dt><dd>' + esc(fmt(d.valor)) + '</dd></div>';
    }).join('') + '</dl>';
  }

  // Tres datos clave de la ficha. Calefacción: m², autonomía y potencia. El resto (o si no hay ninguno de esos): ancho, alto y peso
  var CALOR = ['salamandras', 'con-horno', 'hogares', 'convectores'];
  function buscar(p, re) { return p.datos.filter(function (d) { return re.test(d.etiqueta); })[0]; }
  function destacados(p) {
    var lista = [];
    if (CALOR.indexOf(p.categoria) >= 0) {
      if (p.m2) lista.push({ valor: p.m2 + ' m²', etiqueta: 'Calefacciona', dato: buscar(p, /^rendimiento/i) });
      var aut = buscar(p, /^autonom/i);
      if (aut) lista.push({ valor: fmt(aut.valor), etiqueta: 'Autonomía', dato: aut });
      var pot = buscar(p, /^potencia/i);
      if (pot) lista.push({ valor: fmt(pot.valor).replace(/\s*kcal\/h/i, ''), etiqueta: 'kcal/h', dato: pot });
    }
    if (!lista.length) {
      [[/^ancho/i, 'Ancho'], [/^alt/i, 'Alto'], [/^peso/i, 'Peso']].forEach(function (x) {
        var d = buscar(p, x[0]);
        if (d) lista.push({ valor: fmt(d.valor).replace(/\s*aprox\.?$/i, ''), etiqueta: x[1], dato: d });
      });
    }
    return lista;
  }
  function destacadosHTML(lista) {
    return lista.length ? '<dl class="destacados">' + lista.map(function (x) {
      // Número grande y unidad más chica, así "1.160 mm" entra en el recuadro en celular
      var m = String(x.valor).match(/^([\d.,]+)\s*(.*)$/);
      return '<div><dt>' + esc(x.etiqueta) + '</dt><dd>' + (m ? esc(m[1]) + (m[2] ? '<small>' + esc(m[2]) + '</small>' : '') : esc(x.valor)) + '</dd></div>';
    }).join('') + '</dl>' : '';
  }

  function foto(p, i, clase) {
    if (!p.fotos.length) return '<div class="foto"><small>' + esc(p.nombre) + '</small></div>';
    return '<div class="media' + (clase ? ' ' + clase : '') + '"><img src="' + esc(src(p.fotos[i || 0])) +
      '" alt="' + esc(p.nombre) + '" loading="lazy" decoding="async"></div>';
  }

  function tarjeta(p) {
    return '<a class="cat prod" href="' + urlProd(p) + '" data-m2="' + (p.m2 || '') + '">' + foto(p) +
      '<div class="cat-txt"><b>' + esc(p.nombre) + ' <i>→</i></b>' +
      '<ul class="clave">' + claves(p).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div></a>';
  }

  function miga(partes) {
    return '<nav class="miga" aria-label="Estás en"><ol>' + partes.map(function (x, i) {
      var ultimo = i === partes.length - 1;
      return '<li>' + (ultimo ? '<span aria-current="page">' + esc(x[0]) + '</span>'
        : '<a href="' + x[1] + '">' + esc(x[0]) + '</a>') + '</li>';
    }).join('') + '</ol></nav>';
  }

  function cabeza(titulo, subtitulo) {
    return '<div class="cabeza"><div class="titulo"><h1>' + esc(titulo) + '</h1>' +
      (subtitulo ? '<p class="subtitulo">' + esc(subtitulo) + '</p>' : '') + '</div></div>';
  }

  function noEncontrado(que) {
    meta('No encontrado', 'Este producto no está en el catálogo de Verellen.');
    app.innerHTML = '<div class="wrap pagina">' + miga([['Inicio', '/'], ['No encontrado']]) +
      '<div class="no-encontrado">' + cabeza('No encontrado', 'No encontramos ' + que + '.') +
      '<p class="lead">Puede que el link esté mal escrito o que el producto ya no esté. Mirá todas las líneas o escribinos.</p>' +
      '<div class="ctas"><a class="btn btn-fuego" href="/#productos">Ver productos</a>' +
      '<a class="btn btn-linea" href="' + wa('Hola! Quisiera más información sobre sus productos.') + '" target="_blank" rel="noopener">Consultar por WhatsApp</a></div></div></div>';
  }

  /* ---------- Página de categoría ---------- */
  function paginaCategoria() {
    var r = ruta();
    var c = cat(r.categoria);
    if (!c) return noEncontrado('esa categoría');
    var prods = deCat(c.slug);
    // Una categoría con un solo producto va directo a su ficha
    if (prods.length === 1) return location.replace(urlProd(prods[0]));

    var linea = LINEAS[c.linea];
    meta(c.nombre, c.nombre + ' Verellen: ' + c.texto + ' Fabricados en Tandil desde 1987.');
    var html = '<div class="wrap pagina">' +
      miga([['Inicio', '/'], [linea.nombre, linea.url], [c.nombre]]) + cabeza(c.nombre, c.texto);

    if (c.proximamente) {
      var nombre = c.nombre.toLowerCase();
      html += '<div class="proximo">' + (c.fotos ? '<div class="proximo-fotos">' + c.fotos.map(function (f, i) {
        return '<div class="media"><img src="' + esc(src(f)) + '" alt="' + esc(c.nombre) + ' Verellen' + (i ? ', detalle del logo' : '') +
          '"' + (i ? ' loading="lazy"' : '') + ' decoding="async"></div>';
      }).join('') + '</div>' : '') + '<p class="lead">Estamos terminando los modelos de ' + esc(nombre) +
        '. Escribinos y te contamos qué medidas va a haber y cuándo salen.</p>' +
        '<a class="btn btn-fuego" href="' + wa('Hola! Quisiera consultar por ' + nombre + '.') +
        '" target="_blank" rel="noopener">Consultar por ' + esc(nombre) + '</a></div>';
    } else if (prods.length === 2) {
      html += '<div class="duo">' + prods.map(function (p) {
        return '<article class="duo-item"><a href="' + urlProd(p) + '" tabindex="-1" aria-hidden="true">' + foto(p, 0) + '</a>' +
          // Solo los datos clave: la tabla completa queda en la ficha
          '<h2><a href="' + urlProd(p) + '">' + esc(p.nombre) + '</a></h2>' + destacadosHTML(destacados(p)) +
          '<div class="ctas"><a class="btn btn-linea" href="' + urlProd(p) + '">Ver ficha</a>' +
          '<a class="btn btn-fuego" href="' + wa('Hola! Quisiera consultar por ' + ARTICULO[c.slug] + ' ' + p.nombre + '.') +
          '" target="_blank" rel="noopener">Consultar</a></div></article>';
      }).join('') + '</div>';
    } else if (c.slug === 'salamandras') {
      html += filtroHTML(prods) + '<div class="mundos">' + SUBLINEAS.map(function (s) {
        var deLinea = prods.filter(function (p) { return p.sublinea === s; });
        if (!deLinea.length) return '';
        return '<div class="mundo" data-sublinea="' + s + '"><h2 class="grupo-titulo">Línea ' + s + '</h2>' +
          '<div class="cats">' + deLinea.map(tarjeta).join('') + '</div></div>';
      }).join('') + '</div>' +
        '<div class="vacio" hidden><p class="lead">No tenemos salamandras para ese rango. Contanos los metros del ambiente y te recomendamos un modelo.</p>' +
        '<a class="btn btn-fuego" href="' + wa('Hola! Quisiera saber qué salamandra me conviene para mi ambiente.') +
        '" target="_blank" rel="noopener">Consultar por WhatsApp</a></div>';
    } else {
      html += '<div class="cats">' + prods.map(tarjeta).join('') + '</div>';
    }
    app.innerHTML = html + '</div>';
    if (c.slug === 'salamandras' && !c.proximamente) activarFiltro();
  }

  function enRango(m2, r) { return m2 >= r.min && m2 <= r.max; }

  function filtroHTML(prods) {
    var rangos = RANGOS.filter(function (r) {
      return prods.some(function (p) { return p.m2 && enRango(p.m2, r); });
    });
    return '<div class="filtro" role="group" aria-labelledby="filtro-m2"><p class="filtro-titulo" id="filtro-m2">¿Cuántos m² querés calefaccionar?</p>' +
      '<div class="chips"><button type="button" class="chip" data-rango="" aria-pressed="true">Todas<span>' + prods.length + '</span></button>' +
      rangos.map(function (r) {
        var n = prods.filter(function (p) { return p.m2 && enRango(p.m2, r); }).length;
        return '<button type="button" class="chip" data-rango="' + r.id + '" aria-pressed="false">' + r.texto + '<span>' + n + '</span></button>';
      }).join('') + '</div></div>';
  }

  function activarFiltro() {
    var chips = app.querySelectorAll('.chip');
    function aplicar(id) {
      var r = RANGOS.filter(function (x) { return x.id === id; })[0];
      if (!r) id = '';
      chips.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-rango') === id)); });
      var visibles = 0;
      app.querySelectorAll('.mundo').forEach(function (g) {
        var enGrupo = 0;
        g.querySelectorAll('.prod').forEach(function (t) {
          var m2 = Number(t.getAttribute('data-m2'));
          var ok = !r || (m2 && enRango(m2, r));
          t.hidden = !ok;
          if (ok) enGrupo++;
        });
        g.hidden = !enGrupo;
        visibles += enGrupo;
      });
      app.querySelector('.vacio').hidden = visibles > 0;
      // El rango queda en la URL para que "volver" desde una ficha lo recuerde
      history.replaceState(null, '', location.pathname + (id ? '?m2=' + id : ''));
    }
    chips.forEach(function (b) {
      b.addEventListener('click', function () { aplicar(b.getAttribute('data-rango')); });
    });
    aplicar(new URLSearchParams(location.search).get('m2') || '');
  }

  /* ---------- Ficha de producto ---------- */
  function paginaProducto() {
    var r = ruta();
    var p = PRODS.filter(function (x) { return x.slug === r.modelo; })[0];
    if (!p) return noEncontrado('ese modelo');
    if (p.categoria !== r.categoria) return location.replace(urlProd(p));
    var c = cat(p.categoria);
    var linea = LINEAS[p.linea];
    var unico = deCat(c.slug).length === 1;
    var art = ARTICULO[c.slug] || 'el';
    var nombreConsulta = art === 'los' ? p.nombre.toLowerCase() : p.nombre;

    var primera = p.descripcion ? p.descripcion.split(/\.\s/)[0].replace(/\.?$/, '.') : '';
    meta(p.nombre, p.nombre + ' de Verellen. ' + (primera || c.texto));

    var galeria = '<div class="visor">' + (p.fotos.length
      ? '<div class="media"><img id="foto-grande" src="' + esc(src(p.fotos[0])) + '" alt="' + esc(p.nombre) + ', foto 1"></div>' +
        (p.fotos.length > 1 ? '<div class="miniaturas">' + p.fotos.map(function (f, i) {
          return '<button type="button" data-i="' + i + '" aria-label="Ver foto ' + (i + 1) + '"' + (i ? '' : ' aria-current="true"') + '>' +
            '<img src="' + esc(src(f)) + '" alt="" loading="lazy"></button>';
        }).join('') + '</div>' : '')
      : '<div class="foto"><small>' + esc(p.nombre) + '</small></div>') + '</div>';

    var desc = p.descripcion ? '<div class="prod-desc">' + p.descripcion.split(/\n\n+/).map(function (par) {
      return '<p>' + esc(par).replace(/\n/g, '<br>') + '</p>';
    }).join('') + '</div>' : '';
    function lista(titulo, items) {
      return items.length ? '<div class="prod-lista"><h2>' + titulo + '</h2><ul>' +
        items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '';
    }

    var fichas = p.descargas.filter(function (d) { return d.tipo === 'ficha-tecnica'; });
    var botones = '<a class="btn btn-fuego" href="' + wa('Hola! Quisiera consultar por ' + art + ' ' + nombreConsulta + '.') +
      // Con nombres largos el botón no entra en un renglón en celular: ahí dice "Consultar por WhatsApp"
      '" target="_blank" rel="noopener">' + (nombreConsulta.length > 16
        ? '<span class="btn-largo">Consultar por ' + art + ' ' + esc(nombreConsulta) + '</span><span class="btn-corto">Consultar por WhatsApp</span>'
        : 'Consultar por ' + art + ' ' + esc(nombreConsulta)) + '</a>' +
      fichas.concat(p.descargas.filter(function (d) { return d.tipo !== 'ficha-tecnica'; })).map(function (d) {
        var texto = d.tipo === 'manual' ? 'Descargar manual'
          : fichas.length > 1 ? 'Ficha técnica ' + (d.titulo.match(/\d+\.\d+\s*$/) || [''])[0] : 'Descargar ficha técnica';
        return '<a class="btn btn-linea" href="' + esc(src(d.archivo)) + '" download>' + esc(texto.trim()) + '</a>';
      }).join('');

    var etiqueta = c.nombre + (p.sublinea ? ' · Línea ' + p.sublinea : '');
    var claveFicha = destacados(p);
    var info = '<div class="ficha-info"><p class="eyebrow">' + esc(etiqueta) + '</p>' +
      '<h1 class="modelo' + (p.nombre.length > 14 ? ' largo' : '') + '">' + esc(p.nombre) + '</h1>' +
      (p.subtitulo && !p.subtitulo_dudoso ? '<p class="prod-sub">' + esc(p.subtitulo) + '</p>' : '') +
      desc + lista('Componentes', p.componentes) + lista('Accesorios opcionales', p.accesorios_opcionales) +
      destacadosHTML(claveFicha) + specs(p, claveFicha.map(function (x) { return x.dato; })) +
      '<div class="ctas">' + botones + '</div></div>';

    // Otros modelos: primero los de la misma sublínea
    var otros = deCat(c.slug).filter(function (x) { return x.slug !== p.slug; })
      .sort(function (a, b) { return (b.sublinea === p.sublinea) - (a.sublinea === p.sublinea); }).slice(0, 4);
    var otrosHTML = otros.length ? '<div class="mundo otros"><h2 class="grupo-titulo">Otros modelos de esta línea</h2>' +
      '<div class="cats cuatro">' + otros.map(tarjeta).join('') + '</div></div>' : '';

    app.innerHTML = '<div class="wrap pagina">' +
      // En categorías de un solo producto (Convectores) la categoría y el modelo se llaman igual
      miga(unico ? [['Inicio', '/'], [linea.nombre, linea.url], [p.nombre]]
        : [['Inicio', '/'], [linea.nombre, linea.url], [c.nombre, urlCat(c.slug)], [p.nombre]]) +
      '<div class="producto">' + galeria + info + '</div>' + otrosHTML + '</div>';

    var grande = document.getElementById('foto-grande');
    app.querySelectorAll('.miniaturas button').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = Number(b.getAttribute('data-i'));
        grande.src = src(p.fotos[i]);
        grande.alt = p.nombre + ', foto ' + (i + 1);
        app.querySelectorAll('.miniaturas button').forEach(function (x) { x.removeAttribute('aria-current'); });
        b.setAttribute('aria-current', 'true');
      });
    });
  }

  if (document.body.getAttribute('data-pagina') === 'producto') paginaProducto();
  else paginaCategoria();
})();
