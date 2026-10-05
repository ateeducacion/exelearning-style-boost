/*!
 * Boost — eXeLearning style script
 * Moodle's Boost layout around an eXeLearning export: top navbar, course index
 * drawer, breadcrumb, section tabs, activity navigation and footer popover.
 * Licensed under the GNU General Public License v3.0.
 */
(function () {
    'use strict';

    var root = document.documentElement;
    var KEY = 'exe-boost-drawer';
    var NARROW = '(max-width: 991.98px)';
    var assetBase = document.currentScript ? new URL('.', document.currentScript.src) : null;

    // Before the first paint: the drawer is placed by CSS, so the page never jumps.
    root.classList.add('boost-js');
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) { /* Storage may be blocked. */ }
    if (stored === 'closed' || window.matchMedia(NARROW).matches) root.classList.add('boost-drawer-closed');

    // Icons from Moodle's pix/e/sidebar_*.svg and Font Awesome equivalents, drawn with currentColor.
    var ICONS = {
        close: '<path d="M12.67 2H3.33C2.6 2 2 2.6 2 3.33v9.34C2 13.4 2.6 14 3.33 14h9.34c.73 0 1.33-.6 1.33-1.33V3.33C14 2.6 13.4 2 12.67 2zM6 2v12m4.67-4-2-2 2-2" fill="none" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>',
        open: '<path d="M3.33 2h9.34C13.4 2 14 2.6 14 3.33v9.34c0 .73-.6 1.33-1.33 1.33H3.33C2.6 14 2 13.4 2 12.67V3.33C2 2.6 2.6 2 3.33 2zM10 2v12M5.33 10l2-2-2-2" fill="none" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>',
        search: '<circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m10.5 10.5 3.75 3.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        chevron: '<path d="m5.5 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
        question: '<path d="M5.75 5.9a2.3 2.3 0 0 1 4.5.6c0 1.6-2.25 1.95-2.25 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="12.6" r="1" fill="currentColor"/>',
    };

    function svg(name) {
        return '<svg class="boost-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>';
    }

    function text(key, fallback) {
        return (window.$exe_i18n && window.$exe_i18n[key]) || fallback;
    }

    function element(tag, className, html) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (html) node.innerHTML = html;
        return node;
    }

    function samePage(a, b) {
        var x = new URL(a, location.href);
        var y = new URL(b, location.href);
        return x.origin + x.pathname === y.origin + y.pathname;
    }

    function init() {
        addOpenLink();
        var body = document.body;
        var nav = document.getElementById('siteNav');
        var main = document.querySelector('main.page');
        if (!body.classList.contains('exe-web-site') || !nav || !main || document.querySelector('.boost-navbar')) return;
        var links = Array.prototype.slice.call(nav.querySelectorAll('a[href]'));
        var current = nav.querySelector('a.active') || links.filter(function (link) { return samePage(link.href, location.href); })[0];
        var courseTitle = (document.querySelector('.package-title') || {}).textContent || document.title;
        courseTitle = courseTitle.trim();

        buildNavbar(body, links, courseTitle);
        buildDrawer(nav, links, courseTitle);
        buildHeader(main, current);
        buildActivityNavigation(main, links, current);
        buildFooter(body);
    }

    /* ---------- Navbar ---------- */

    function buildNavbar(body, links, courseTitle) {
        var bar = element('nav', 'boost-navbar');
        bar.setAttribute('aria-label', 'Barra del sitio');
        var brand = element('a', 'boost-brand');
        brand.href = links.length ? links[0].href : '#';
        var logo = element('img', 'boost-logo');
        logo.src = new URL('icons/exe-logo.svg', assetBase || location.href).href;
        logo.alt = '';
        brand.append(logo, element('span'));
        brand.lastChild.textContent = courseTitle;
        var tools = element('div', 'boost-usernav');
        bar.append(brand, tools);

        var search = document.getElementById('exe-client-search');
        if (search) {
            var toggle = element('button', 'boost-btn-icon boost-search-toggle', svg('search') + '<span class="visually-hidden">' + text('search', 'Buscar') + '</span>');
            toggle.type = 'button';
            toggle.title = text('search', 'Buscar');
            toggle.setAttribute('aria-controls', 'exe-client-search');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.addEventListener('click', function () {
                var open = !body.classList.contains('boost-search-open');
                body.classList.toggle('boost-search-open', open);
                toggle.setAttribute('aria-expanded', String(open));
                var input = document.getElementById('exe-client-search-text');
                if (open && input) input.focus();
            });
            tools.append(toggle);
        }
        var counter = document.querySelector('.page-counter');
        if (counter) {
            tools.append(element('span', 'boost-divider'));
            tools.append(counter);
        }
        // eXe adds the teacher-mode switch later; it belongs with Moodle's "Edit mode" switch.
        var moveTeacherSwitch = function () {
            var teacher = document.getElementById('teacher-mode-toggler-wrapper');
            if (!teacher || teacher.parentNode === tools) return false;
            tools.append(element('span', 'boost-divider'), teacher);
            return true;
        };
        if (!moveTeacherSwitch()) window.addEventListener('load', moveTeacherSwitch);
        body.prepend(bar);
    }

    /* ---------- Course index drawer ---------- */

    function buildDrawer(nav, links, courseTitle) {
        nav.setAttribute('aria-label', 'Índice del curso');
        nav.classList.add('boost-courseindex');
        var header = element('div', 'boost-drawerheader');
        var heading = element('a', 'boost-drawerheading');
        heading.href = links.length ? links[0].href : '#';
        heading.textContent = courseTitle;
        var close = element('button', 'boost-btn-icon boost-drawer-close', svg('close'));
        close.type = 'button';
        nav.prepend(header);
        header.append(heading, close);

        var open = element('button', 'boost-btn-icon boost-drawer-open', svg('open'));
        open.type = 'button';
        nav.after(open);
        var backdrop = element('div', 'boost-backdrop');
        open.after(backdrop);
        [open, close].forEach(function (button) {
            button.setAttribute('aria-controls', 'siteNav');
            button.addEventListener('click', function () { setDrawer(root.classList.contains('boost-drawer-closed'), true); });
        });
        backdrop.addEventListener('click', function () { setDrawer(false); });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && window.matchMedia(NARROW).matches && !root.classList.contains('boost-drawer-closed')) {
                setDrawer(false);
                open.focus();
            }
        });

        // Sections fold like Moodle's course index; the one holding this page starts open.
        Array.prototype.forEach.call(nav.querySelectorAll('li'), function (item) {
            var list = item.querySelector(':scope > ul');
            var link = item.querySelector(':scope > a');
            if (!list || !link) return;
            var expanded = item.classList.contains('active') || item.classList.contains('current-page-parent') || !!item.querySelector('a.active');
            var chevron = element('button', 'boost-chevron', svg('chevron') + '<span class="visually-hidden"></span>');
            chevron.type = 'button';
            chevron.querySelector('span').textContent = link.textContent.trim();
            list.id = list.id || 'boost-section-' + Math.random().toString(36).slice(2, 9);
            chevron.setAttribute('aria-controls', list.id);
            var fold = function (value) {
                item.classList.toggle('boost-collapsed', !value);
                chevron.setAttribute('aria-expanded', String(value));
            };
            fold(expanded);
            chevron.addEventListener('click', function () { fold(item.classList.contains('boost-collapsed')); });
            item.insertBefore(chevron, link);
        });

        function setDrawer(show, remember) {
            root.classList.toggle('boost-drawer-closed', !show);
            nav.inert = !show;
            open.setAttribute('aria-expanded', String(show));
            close.setAttribute('aria-expanded', String(show));
            open.title = 'Abrir el índice del curso';
            close.title = 'Cerrar el índice del curso';
            open.setAttribute('aria-label', open.title);
            close.setAttribute('aria-label', close.title);
            if (remember && !window.matchMedia(NARROW).matches) {
                try { localStorage.setItem(KEY, show ? 'open' : 'closed'); } catch (e) { /* Storage may be blocked. */ }
            }
            if (show && remember) close.focus();
        }
        setDrawer(!root.classList.contains('boost-drawer-closed'));
        var active = nav.querySelector('a.active');
        if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
    }

    /* ---------- Breadcrumb and section tabs ---------- */

    function ancestors(link) {
        var trail = [];
        var item = link && link.closest('li');
        while (item) {
            var own = item.querySelector(':scope > a');
            if (own) trail.unshift(own);
            item = item.parentElement.closest('#siteNav li');
        }
        return trail;
    }

    function buildHeader(main, current) {
        var header = main.querySelector('.main-header');
        var pageHeader = main.querySelector('.page-header');
        if (!header || !pageHeader || !current) return;
        var trail = ancestors(current);
        var home = document.querySelector('#siteNav > ul > li > a');
        if (home && trail[0] !== home) trail.unshift(home);
        if (trail.length > 1) {
            var crumbs = element('nav', 'boost-breadcrumb');
            crumbs.setAttribute('aria-label', 'Ruta de navegación');
            var list = element('ol');
            trail.forEach(function (link, index) {
                var item = element('li');
                var last = index === trail.length - 1;
                var node = element(last ? 'span' : 'a');
                if (last) node.setAttribute('aria-current', 'page');
                else node.href = link.href;
                node.textContent = link.textContent.trim();
                item.append(node);
                list.append(item);
            });
            crumbs.append(list);
            header.insertBefore(crumbs, pageHeader);
        }

        // Secondary navigation: the section and its pages as Moodle tabs.
        var section = trail.length > 1 ? trail[1] : null;
        var sectionItem = section && section.closest('li');
        var children = sectionItem ? sectionItem.querySelectorAll(':scope > ul > li > a') : [];
        if (!children.length) return;
        var tabs = element('nav', 'boost-secondary-navigation');
        tabs.setAttribute('aria-label', section.textContent.trim());
        var ul = element('ul');
        [section].concat(Array.prototype.slice.call(children)).forEach(function (link) {
            var li = element('li');
            var a = element('a');
            a.href = link.href;
            a.textContent = link.textContent.trim();
            if (samePage(link.href, current.href) || (link !== section && ancestors(current).indexOf(link) >= 0)) {
                a.className = 'active';
                a.setAttribute('aria-current', 'page');
            }
            li.append(a);
            ul.append(li);
        });
        tabs.append(ul);
        header.after(tabs);
    }

    /* ---------- Activity navigation ---------- */

    function buildActivityNavigation(main, links, current) {
        var buttons = document.querySelector('.nav-buttons');
        if (!buttons) return;
        buttons.classList.add('boost-activity-navigation');
        buttons.setAttribute('role', 'navigation');
        buttons.setAttribute('aria-label', 'Navegación entre páginas');
        Array.prototype.forEach.call(buttons.querySelectorAll('a.nav-button'), function (button) {
            var target = links.filter(function (link) { return samePage(link.href, button.href); })[0];
            if (!target) return;
            var previous = button.classList.contains('nav-button-left');
            var name = target.textContent.trim();
            button.innerHTML = '<span class="visually-hidden"></span>' + (previous ? '◀ ' : '') + '<span class="boost-nav-name"></span>' + (previous ? '' : ' ▶');
            button.firstChild.textContent = (previous ? text('previous', 'Anterior') : text('next', 'Siguiente')) + ': ';
            button.querySelector('.boost-nav-name').textContent = name;
            button.title = name;
        });
        if (links.length > 1) {
            var jump = element('div', 'boost-jump');
            var label = element('label', 'visually-hidden', 'Ir a…');
            label.setAttribute('for', 'boost-jump-to');
            var select = element('select', 'boost-select');
            select.id = 'boost-jump-to';
            select.append(new Option('Ir a…', ''));
            links.forEach(function (link) {
                var depth = 0;
                var item = link.closest('li');
                while ((item = item.parentElement.closest('#siteNav li'))) depth++;
                select.append(new Option('  '.repeat(depth) + link.textContent.trim(), link.href, false, false));
            });
            select.addEventListener('change', function () { if (select.value) location.href = select.value; });
            jump.append(label, select);
            buttons.querySelector('.nav-button-left').after(jump);
        }
        main.append(buttons);
    }

    /* ---------- Footer popover ---------- */

    function buildFooter(body) {
        var footer = document.getElementById('siteFooter');
        var made = document.getElementById('made-with-eXe');
        if (!footer) return;
        if (made) footer.append(made);
        footer.classList.add('boost-footer');
        footer.setAttribute('aria-label', 'Pie de página');
        var button = element('button', 'boost-footer-button', svg('question') + '<span class="visually-hidden">Mostrar pie de página</span>');
        button.type = 'button';
        button.title = 'Mostrar pie de página';
        button.setAttribute('aria-controls', 'siteFooter');
        button.setAttribute('aria-expanded', 'false');
        var show = function (open) {
            body.classList.toggle('boost-footer-open', open);
            button.setAttribute('aria-expanded', String(open));
        };
        button.addEventListener('click', function () { show(!body.classList.contains('boost-footer-open')); });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && body.classList.contains('boost-footer-open')) { show(false); button.focus(); }
        });
        document.addEventListener('click', function (event) {
            if (!footer.contains(event.target) && !button.contains(event.target)) show(false);
        });
        footer.before(button);
    }

    /* ---------- "Edit with eXeLearning" notice, shared by the style collection ---------- */

    function addOpenLink() {
        if (!document.querySelector('.exe-export') || document.querySelector('.exe-open-exelearning')) return;
        var link = element('a', 'exe-open-exelearning');
        link.href = 'https://static.exelearning.dev/?url=https://github-proxy.exelearning.dev/?repo=ateeducacion/exelearning-style-boost&branch=main';
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('aria-label', 'Abrir este recurso en eXeLearning');
        var logo = element('img', 'exe-open-logo');
        logo.src = new URL('icons/exe-logo.svg', assetBase || location.href).href;
        logo.alt = '';
        link.append(logo, element('span', '', 'Edit with eXeLearning'));
        var close = element('button', 'exe-open-close', '×');
        close.type = 'button';
        close.setAttribute('aria-label', 'Ocultar enlace de eXeLearning');
        close.addEventListener('click', function (event) { event.preventDefault(); event.stopPropagation(); link.remove(); });
        link.append(close);
        document.body.append(link);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
