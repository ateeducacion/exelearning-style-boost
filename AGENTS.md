# Boost

- `theme/` es la fuente del estilo; la raíz es el ejemplo ELPX descomprimido.
- No modificar eXeLearning, Moodle ni los otros repositorios de estilos para arreglar Boost.
- Los colores, medidas y tipografía salen del tema Boost de Moodle 5 (`public/theme/boost/scss`
  y los tokens de `lib/bundles/design-system`): azul `#0f6cbf`, grises del sistema de diseño,
  Noto Sans, barra de 60 px, cajón de 285 px y contenido de 830 px.
- `style.js` añade `html.boost-js` en el `<head>` (y `boost-drawer-closed` si toca), así el
  cajón se coloca por CSS antes de pintar. Todo el diseño cuelga de esas clases; sin JavaScript
  o al imprimir, el contenido es una página normal.
- El cajón es el propio `#siteNav`; barra, migas, pestañas, «Ir a…» y el botón del pie se
  construyen desde el `#siteNav` exportado. Mover nodos, no clonar ni reescribir iDevices.
- Los iconos de iDevice son los SVG del estilo Zen (Material Symbols) con el color de propósito
  de Moodle escrito en cada archivo, como en los demás estilos. Se regeneran con
  `python3 scripts/color_icons.py /ruta/a/exelearning/public/files/perm/themes/base/zen/icons`;
  después hay que reexportar el ejemplo para que el HTML apunte a los `.svg`.
- El botón «Edit with eXeLearning» es solo del ejemplo publicado: vive en `edit-in-exelearning.js`
  (raíz) y `package.py` lo añade al HTML. Nunca en `theme/`, o saldría en los recursos exportados.
- `python3 scripts/package.py` reconstruye ambos paquetes, el manifiesto de descarga y el enlace anterior.
- Validar con `python3 scripts/check.py` y `NODE_PATH=/ruta/a/exelearning/node_modules node scripts/check-browser.cjs`.
- Para regenerar el HTML del ejemplo, usar el CLI de eXeLearning desde su propio directorio:
  `bun dist/cli.js elp:export /ruta/al/ciclo-del-agua.elpx /tmp/boost elpx` y copiar
  `index.html`, `html/` y `search_index.js` (no el `content.xml`, que añade la captura en base64).
- El repositorio y el estilo son GPL-3.0 (como Moodle; `LICENSE` es el texto íntegro para que GitHub lo detecte); Noto Sans conserva OFL; los iconos, Apache 2.0; el
  material didáctico es CC0.
