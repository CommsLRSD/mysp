(function()
	{

		// Collapse sidebar groups by default on phones
		if (window.innerWidth <= 768)
		{
			document.querySelectorAll('.side-collapse').forEach(function(d) { d.removeAttribute('open'); });
		}
		var wrapper = document.getElementById('wide-wrapper');
		if (wrapper) wrapper.classList.add('js-ready');

		// Staggered card entrance for all grids
		document.querySelectorAll('.cards-grid').forEach(function(grid)
		{
			grid.querySelectorAll('.scorecard').forEach(function(card, i)
			{
				setTimeout(function() { card.classList.add('visible'); }, 80 + i * 80);
			});
		});

		// Detail tabs
		document.querySelectorAll('.card-details').forEach(function(details)
		{
			details.addEventListener('toggle', function()
			{
				if (details.open)
				{
					var inner = details.querySelector('.details-inner');
					if (!inner.querySelector('.detail-tab-pane.active'))
					{
						inner.querySelectorAll('.detail-tab-pane')[0].classList.add('active');
						inner.querySelectorAll('.detail-tab-btn')[0].classList.add('active');
					}
				}
			});
			details.addEventListener('click', function(e)
			{
				var btn = e.target.closest('.detail-tab-btn');
				if (!btn) return;
				var tabKey = btn.getAttribute('data-tab');
				var inner = details.querySelector('.details-inner');
				inner.querySelectorAll('.detail-tab-btn').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
				inner.querySelectorAll('.detail-tab-pane').forEach(function(p) { p.classList.remove('active'); });
				btn.classList.add('active');
				btn.setAttribute('aria-selected', 'true');
				inner.querySelector('[data-pane="' + tabKey + '"]').classList.add('active');
			});
		});

		// Filters
		var activePriority = 'all';
		var activeStage = 'all';
		var activeData = 'all';
		var searchTerm = '';
		var searchIndex = new Map();
		document.querySelectorAll('.scorecard').forEach(function(card)
		{
			searchIndex.set(card, card.textContent.toLowerCase());
		});

		function applyFilters()
		{
			document.querySelectorAll('.wide-section').forEach(function(section)
			{
				var sectionId = section.id.replace('section-', '');
				var priorityMatch = (activePriority === 'all') || (sectionId === activePriority);
				section.classList.toggle('priority-hidden', !priorityMatch);
			});
			document.querySelectorAll('.wide-section:not(.priority-hidden) .scorecard').forEach(function(card)
			{
				var stageMatch = (activeStage === 'all') || (card.getAttribute('data-stage') === activeStage);
				var hasData = (card.getAttribute('data-datahub') || '') !== '';
				var dataMatch = (activeData === 'all') || (activeData === 'has' && hasData) || (activeData === 'none' && !hasData);
				var searchMatch = (searchTerm === '') || (searchIndex.get(card) || '').indexOf(searchTerm) !== -1;
				card.classList.toggle('js-filtered-out', !(stageMatch && dataMatch && searchMatch));
			});
			var totalVisible = 0;
			document.querySelectorAll('.wide-section').forEach(function(section)
			{
				var sectionId = section.id.replace('section-', '');
				var visibleCards = section.classList.contains('priority-hidden') ? 0 : section.querySelectorAll('.scorecard:not(.js-filtered-out)').length;
				totalVisible += visibleCards;
				var navItem = document.querySelector('.pnav-item[data-section="' + sectionId + '"]');
				if (navItem)
				{
					var badge = navItem.querySelector('.pnav-badge');
					if (badge) badge.textContent = visibleCards;
				}
			});
			var badgeAll = document.getElementById('badge-all');
			if (badgeAll) badgeAll.textContent = totalVisible;
			document.querySelectorAll('.wide-section:not(.priority-hidden)').forEach(function(section)
			{
				var visible = section.querySelectorAll('.scorecard:not(.js-filtered-out)').length;
				var note = section.querySelector('.empty-note');
				if (visible === 0)
				{
					if (!note)
					{
						note = document.createElement('p');
						note.className = 'empty-note';
						note.textContent = 'No actions in this priority match the current filters.';
						section.insertBefore(note, section.querySelector('.totop'));
					}
					note.hidden = false;
				}
				else if (note) note.hidden = true;
			});
			document.dispatchEvent(new CustomEvent('mysp:filters-applied'));
		}

		var priorityNav = document.getElementById('priority-nav');
		if (priorityNav)
		{
			priorityNav.addEventListener('click', function(e)
			{
				var item = e.target.closest('.pnav-item, .pnav-item-all');
				if (!item) return;
				activePriority = item.getAttribute('data-section');
				priorityNav.querySelectorAll('.pnav-item, .pnav-item-all').forEach(function(i) { i.classList.remove('active'); });
				item.classList.add('active');
				applyFilters();
				updateClearVisibility();
				var target = document.getElementById(activePriority === 'all' ? 'section-belonging' : 'section-' + activePriority);
				if (target && activePriority !== 'all') target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
				if (activePriority === 'all') window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
			});
		}

		document.querySelectorAll('.filter-chip').forEach(function(chip)
		{
			chip.addEventListener('click', function()
			{
				var type = chip.getAttribute('data-filter-type');
				if (type === 'stage')
				{
					activeStage = chip.getAttribute('data-stage');
					document.querySelectorAll('.filter-chip[data-filter-type="stage"]').forEach(function(c) { c.classList.remove('active'); });
				}
				else if (type === 'datahub')
				{
					activeData = chip.getAttribute('data-datahub-filter');
					document.querySelectorAll('.filter-chip[data-filter-type="datahub"]').forEach(function(c) { c.classList.remove('active'); });
				}
				chip.classList.add('active');
				applyFilters();
				updateClearVisibility();
			});
		});

		// Smooth scroll for on-page nav
		document.querySelectorAll('.onpage-link').forEach(function(link)
		{
			link.addEventListener('click', function(e)
			{
				var target = document.querySelector(link.getAttribute('href'));
				if (!target) return;
				e.preventDefault();
				if (window.MYSP && typeof window.MYSP.goToSection === 'function')
				{
					window.MYSP.goToSection(target);
					return;
				}
				target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
			});
		});


		// Search + clear all filters
		var searchInput = document.getElementById('action-search');
		var clearBtn = document.getElementById('clear-filters');
		function updateClearVisibility()
		{
			var active = (activeStage !== 'all') || (activeData !== 'all') || (searchTerm !== '') || (activePriority !== 'all');
			clearBtn.hidden = !active;
		}
		var searchTimer = null;
		searchInput.addEventListener('input', function()
		{
			clearTimeout(searchTimer);
			searchTimer = setTimeout(function()
			{
				searchTerm = searchInput.value.trim().toLowerCase();
				if (searchTerm !== '' && activePriority !== 'all')
				{
					activePriority = 'all';
					document.querySelectorAll('.pnav-item, .pnav-item-all').forEach(function(i) { i.classList.remove('active'); });
					var allBtn = document.querySelector('.pnav-item-all');
					if (allBtn) allBtn.classList.add('active');
				}
				applyFilters();
				updateClearVisibility();
			}, 140);
		});
		clearBtn.addEventListener('click', function()
		{
			activeStage = 'all'; activeData = 'all'; activePriority = 'all'; searchTerm = '';
			searchInput.value = '';
			document.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
			document.querySelectorAll('.filter-chip[data-stage="all"], .filter-chip[data-datahub-filter="all"]').forEach(function(c) { c.classList.add('active'); });
			document.querySelectorAll('.pnav-item, .pnav-item-all').forEach(function(i) { i.classList.remove('active'); });
			var allBtn = document.querySelector('.pnav-item-all');
			if (allBtn) allBtn.classList.add('active');
			applyFilters();
			updateClearVisibility();
			searchInput.focus();
		});


		var onpageSelect = document.querySelector('.onpage-select');
		if (onpageSelect)
		{
			onpageSelect.addEventListener('change', function()
			{
				var t = document.querySelector(onpageSelect.value);
				if (t && window.MYSP && typeof window.MYSP.goToSection === 'function')
				{
					window.MYSP.goToSection(t);
				}
				else if (t)
				{
					t.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
				}
				onpageSelect.selectedIndex = 0;
			});
		}
		document.querySelectorAll('.totop').forEach(function(link)
		{
			link.addEventListener('click', function(e)
			{
				e.preventDefault();
				window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
			});
		});

		// Reveal an action card: clear any filter hiding it, open it, scroll to it
		function revealActionCard(card)
		{
			if (!card) return;
			if (window.MYSP && typeof window.MYSP.expandSection === 'function') { window.MYSP.expandSection(card); }
			if (card.classList.contains('js-filtered-out') || card.closest('.priority-hidden'))
			{
				var cf = document.getElementById('clear-filters');
				if (cf) cf.click();
			}
			var details = card.querySelector('.card-details');
			if (details) details.open = true;
			card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
		}

		// Deep links: #action-2-4 opens and highlights the card
		function openHashCard()
		{
			if (!location.hash || location.hash.indexOf('#action-') !== 0) return;
			revealActionCard(document.querySelector(location.hash));
		}
		window.addEventListener('hashchange', openHashCard);
		openHashCard();

		// Signs of Change links. Handled on click rather than left to the hash,
		// because fragment navigation is blocked in sandboxed preview iframes,
		// so hashchange never fires and the link appears dead. Same pattern the
		// on-page nav already uses. The href stays as a no-JS fallback.
		document.querySelectorAll('a.change-link').forEach(function(link)
		{
			link.addEventListener('click', function(e)
			{
				var card = document.querySelector(link.getAttribute('href'));
				if (!card) return;
				e.preventDefault();
				revealActionCard(card);
			});
		});

		// Back to top
		var topBtn = document.createElement('button');
		topBtn.className = 'back-to-top';
		topBtn.setAttribute('aria-label', 'Back to top');
		topBtn.innerHTML = '&uarr;';
		document.body.appendChild(topBtn);
		window.addEventListener('scroll', function() { topBtn.classList.toggle('show', window.scrollY > 600); }, { passive: true });
		topBtn.addEventListener('click', function()
		{
			window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
		});

		// Print: open all card details, restore after
		var wereClosed = [];
		window.addEventListener('beforeprint', function()
		{
			wereClosed = [];
			document.querySelectorAll('.card-details:not([open])').forEach(function(d) { wereClosed.push(d); d.open = true; });
		});
		window.addEventListener('afterprint', function()
		{
			wereClosed.forEach(function(d) { d.open = false; });
			wereClosed = [];
		});

	})();

/* ══════════════════════════════════════════════════════════════════
	   Single-section flow for top-level content sections.
	   One section is visible at a time, with jump links and per-section
	   next buttons for linear reading.
	   ══════════════════════════════════════════════════════════════════ */
	(function ()
	{
		var sections = Array.prototype.slice.call(document.querySelectorAll('section[id^="section-"]'));
		if (!sections.length) { return; }

		var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var activeSection = null;

		function isSectionVisible(section)
		{
			return !!section && !section.classList.contains('priority-hidden');
		}

		function visibleSections()
		{
			return sections.filter(isSectionVisible);
		}

		function sectionTitle(section)
		{
			if (!section) { return 'this section'; }
			var heading = section.querySelector('h2');
			return heading ? heading.textContent.trim() : 'this section';
		}

		function updateJumpState()
		{
			document.querySelectorAll('.onpage-link').forEach(function (link)
			{
				var match = activeSection && link.getAttribute('href') === ('#' + activeSection.id);
				link.classList.toggle('active', !!match);
			});
		}

		function updateNextButtons()
		{
			var visible = visibleSections();
			visible.forEach(function (section, i)
			{
				var btn = section.querySelector('.section-next-btn');
				if (!btn) { return; }
				if (i < visible.length - 1)
				{
					btn.disabled = false;
					btn.textContent = 'Next: ' + sectionTitle(visible[i + 1]);
				}
				else
				{
					btn.disabled = true;
					btn.textContent = 'You are at the final section';
				}
			});
		}

		function setActiveSection(section, options)
		{
			options = options || {};
			var target = section;
			if (typeof target === 'string') { target = document.getElementById(target); }
			if (!target || !sections.length) { return; }
			if (!isSectionVisible(target))
			{
				var fallback = visibleSections()[0];
				if (!fallback) { return; }
				target = fallback;
			}
			sections.forEach(function (item)
			{
				var active = item === target && isSectionVisible(item);
				item.classList.toggle('single-section-hidden', !active);
				item.classList.toggle('single-section-active', active);
				item.setAttribute('aria-hidden', active ? 'false' : 'true');
			});
			activeSection = target;
			updateJumpState();
			updateNextButtons();
			if (options.updateHash !== false)
			{
				if (location.hash !== ('#' + target.id)) { history.replaceState(null, '', '#' + target.id); }
			}
			if (options.scroll !== false)
			{
				target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
			}
		}

		function appendSectionImage(sectionId, imageName, altText, captionText)
		{
			var section = document.getElementById(sectionId);
			if (!section || section.querySelector('.story-break-image')) { return; }
			var anchor = section.querySelector('.story-body');
			if (!anchor) { return; }
			var figure = document.createElement('figure');
			figure.className = 'story-break-image';
			var img = document.createElement('img');
			img.src = '/mysp/public/images/' + imageName;
			img.alt = altText;
			img.loading = 'lazy';
			img.decoding = 'async';
			img.addEventListener('error', function () { figure.style.display = 'none'; });
			figure.appendChild(img);
			if (captionText)
			{
				var caption = document.createElement('figcaption');
				caption.textContent = captionText;
				figure.appendChild(caption);
			}
			anchor.insertAdjacentElement('afterend', figure);
		}

		function addNextButtons()
		{
			sections.forEach(function (section, i)
			{
				if (section.querySelector('.section-next-nav')) { return; }
				var nav = document.createElement('div');
				nav.className = 'section-next-nav';
				var btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'section-next-btn';
				btn.addEventListener('click', function ()
				{
					var visible = visibleSections();
					var idx = visible.indexOf(section);
					if (idx === -1 || idx >= visible.length - 1) { return; }
					setActiveSection(visible[idx + 1], { updateHash: true, scroll: true });
				});
				nav.appendChild(btn);
				var toTop = section.querySelector('.totop');
				if (toTop && toTop.parentNode === section) section.insertBefore(nav, toTop);
				else section.appendChild(nav);
			});
		}

		function sectionFromHash()
		{
			var hash = location.hash;
			if (!hash || hash.length < 2) { return null; }
			var node = document.getElementById(hash.slice(1));
			if (!node) { return null; }
			return node.closest ? node.closest('section[id^="section-"]') : null;
		}

		appendSectionImage('section-change', 'nutrition.jpg', 'Students sharing a meal in school', 'Nutrition programs are one of the most visible changes on the dashboard.');
		appendSectionImage('section-foundations', 'indigenous-ed.jpg', 'Classroom activity grounded in Indigenous learning', 'Closing equity gaps remains the central foundation for the next cycle.');
		appendSectionImage('section-ahead', 'sustainability.jpg', 'Students collaborating outdoors', 'The next cycle focuses on sustainable systems that hold over time.');
		addNextButtons();

		document.addEventListener('mysp:filters-applied', function ()
		{
			updateNextButtons();
			if (!activeSection || !isSectionVisible(activeSection))
			{
				var fallback = visibleSections()[0];
				if (fallback) setActiveSection(fallback, { updateHash: false, scroll: false });
			}
		});

		window.MYSP = window.MYSP || {};
		window.MYSP.goToSection = function (target)
		{
			var section = target && target.closest ? target.closest('section[id^="section-"]') : null;
			if (!section && target && target.id) { section = document.getElementById(target.id); }
			if (section) { setActiveSection(section, { updateHash: true, scroll: true }); }
		};
		window.MYSP.expandSection = function (el)
		{
			if (!el || !el.closest) { return; }
			var section = el.closest('section[id^="section-"]');
			if (!section) { return; }
			setActiveSection(section, { updateHash: false, scroll: false });
		};

		function applyHashSection()
		{
			var section = sectionFromHash();
			if (section) { setActiveSection(section, { updateHash: false, scroll: false }); }
		}
		window.addEventListener('hashchange', applyHashSection);
		setActiveSection(sectionFromHash() || visibleSections()[0] || sections[0], { updateHash: false, scroll: false });
		applyHashSection();
	})();

		/* ══ Mobile orientation: sticky section bar + drawer (v43) ══ */
		(function () {
			var bar     = document.getElementById('section-bar');
			var label   = document.getElementById('section-bar-label');
			var toggle  = document.getElementById('nav-toggle');
			var closeBt = document.getElementById('nav-close');
			var scrim   = document.getElementById('nav-scrim');
			var drawer  = document.getElementById('side-nav');
			if (!bar || !label || !toggle || !scrim || !drawer) return;

			var mq = window.matchMedia('(max-width: 768px)');
			var sections = Array.prototype.slice.call(
				document.querySelectorAll('section[id^="section-"]'));
			var hero = document.querySelector('.wide-hero');
			var BAR_H = 52;

			bar.hidden = false;
			scrim.hidden = false;

			/* ── section tracking ── */
			function currentLabel() {
				var found = null;
				for (var i = 0; i < sections.length; i++) {
					var r = sections[i].getBoundingClientRect();
					/* A display:none section reports an all-zero rect, so top is 0 and
					   would always test as 'above the line'. Priority filtering hides
					   sections exactly that way, which pinned the label to the last
					   hidden one in DOM order. Skip anything not actually rendered. */
					if (!r.width && !r.height) continue;
					if (r.top <= BAR_H + 12) found = sections[i];
				}
				if (!found) return 'Multi-Year Strategic Plan';
				var h2 = found.querySelector('h2');
				return h2 ? h2.textContent.trim() : 'Multi-Year Strategic Plan';
			}
			function update() {
				if (!mq.matches) { bar.classList.remove('visible'); return; }
				var past = hero ? (hero.getBoundingClientRect().bottom < BAR_H) : (window.scrollY > 120);
				bar.classList.toggle('visible', past);
				var next = currentLabel();
				if (label.textContent !== next) label.textContent = next;
			}
			var ticking = false;
			function onScroll() {
				if (ticking) return;
				ticking = true;
				window.requestAnimationFrame(function () { update(); ticking = false; });
			}
			window.addEventListener('scroll', onScroll, { passive: true });
			window.addEventListener('resize', onScroll);
			/* Filtering changes which sections exist without scrolling, so the bar
			   has to re-read after any sidebar interaction. */
			document.addEventListener('click', function (e) {
				if (e.target.closest('.pnav-item, .pnav-item-all, .filter-chip, .clear-filters')) {
					setTimeout(onScroll, 0);
				}
			}, true);
			update();

			/* ── drawer ── */
			function focusables() {
				return Array.prototype.filter.call(
					drawer.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'),
					function (n) { return n.offsetWidth > 0 || n.offsetHeight > 0; });
			}
			function openNav() {
				if (!mq.matches) return;
				drawer.classList.add('open');
				scrim.classList.add('visible');
				document.body.classList.add('nav-open');
				toggle.setAttribute('aria-expanded', 'true');
				drawer.setAttribute('role', 'dialog');
				drawer.setAttribute('aria-modal', 'true');
				drawer.setAttribute('aria-label', 'Navigation and filters');
				var f = focusables();
				if (f.length) f[0].focus();
				document.addEventListener('keydown', onKey, true);
			}
			function closeNav(returnFocus) {
				drawer.classList.remove('open');
				scrim.classList.remove('visible');
				document.body.classList.remove('nav-open');
				toggle.setAttribute('aria-expanded', 'false');
				drawer.removeAttribute('role');
				drawer.removeAttribute('aria-modal');
				drawer.removeAttribute('aria-label');
				document.removeEventListener('keydown', onKey, true);
				if (returnFocus !== false) toggle.focus({ preventScroll: true });
			}
			function isOpen() { return drawer.classList.contains('open'); }
			function onKey(e) {
				if (!isOpen()) return;
				if (e.key === 'Escape') { e.preventDefault(); closeNav(); return; }
				if (e.key !== 'Tab') return;
				var f = focusables();
				if (!f.length) return;
				var first = f[0], last = f[f.length - 1];
				if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
				else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
			}
			toggle.addEventListener('click', function () { isOpen() ? closeNav() : openNav(); });
			if (closeBt) closeBt.addEventListener('click', function () { closeNav(); });
			scrim.addEventListener('click', function () { closeNav(); });

			/* Picking anything inside the drawer should dismiss it, or the
			   result is hidden behind the panel the person just used. */
			drawer.addEventListener('click', function (e) {
				if (!isOpen()) return;
				if (e.target.closest('a[href], .onpage-link, .pnav-item, .pnav-item-all, .filter-chip, .clear-filters')) {
					setTimeout(function () { closeNav(); }, 60);
				}
			});
			drawer.addEventListener('change', function (e) {
				if (isOpen() && e.target.tagName === 'SELECT') setTimeout(function () { closeNav(); }, 60);
			});

			/* Leaving mobile width with the drawer open would strand the page
			   scroll-locked behind an invisible panel. */
			function onMQ() { if (!mq.matches && isOpen()) closeNav(false); update(); }
			mq.addEventListener ? mq.addEventListener('change', onMQ) : mq.addListener(onMQ);
		})();

/* ══════════════════════════════════════════════════════════════════
		   Google website translation, v50.

		   READ THIS BEFORE DEBUGGING. The LRSD site theme ALREADY provides a
		   translation control in its header, on every CMS page. Two Google
		   translate instances in one document fight each other, so this block
		   suppresses itself when it detects the theme's control. In the CMS the
		   expected and correct behaviour is that this block never appears and
		   the header control does the work. It exists for the standalone case:
		   local preview, a PDF-style archive copy, or a host page with no
		   translate control of its own.

		   Google's element.js needs a real http(s) origin and first-party
		   cookies. It will NOT initialize from file:// or inside a sandboxed
		   preview iframe. That is not a bug in this page and it is not
		   fixable from here. Test on a served URL.

		   The block carries data-translate-state so a failure is diagnosable
		   instead of silent: read document.getElementById('translate-block')
		   .dataset.translateState in the console. Values: suppressed-host-
		   control, ready, or blocked.
		   ══════════════════════════════════════════════════════════════════ */
		(function () {
			var block = document.getElementById('translate-block');
			if (!block) { return; }

			function state(v) { block.setAttribute('data-translate-state', v); }

			/* Does the host page already offer translation? Three signatures:
			   the gtranslate-style link list used by the LRSD theme, a Google
			   combo already in the DOM, or a second element container. */
			function hostHasTranslate() {
				if (typeof window.doGTranslate === 'function') { return true; }
				if (document.querySelector('.goog-te-combo, .goog-te-gadget')) { return true; }
				var containers = document.querySelectorAll('#google_translate_element, .google_translate_element');
				if (containers.length > 1) { return true; }
				return false;
			}

			if (hostHasTranslate()) {
				state('suppressed-host-control');
				if (window.console) { console.info('[MYSP] Translate block suppressed: host page provides its own translation control.'); }
				return;
			}

			window.googleTranslateElementInit = function () {
				try {
					new google.translate.TranslateElement({
						pageLanguage: 'en',
						autoDisplay: false,
						layout: google.translate.TranslateElement.InlineLayout.VERTICAL
					}, 'google_translate_element');
					block.hidden = false;
					state('ready');
				} catch (err) {
					state('blocked');
					if (window.console) { console.warn('[MYSP] Google Translate failed to initialize:', err); }
				}
			};

			var tag = document.createElement('script');
			tag.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
			tag.onerror = function () {
				state('blocked');
				if (window.console) { console.warn('[MYSP] Google Translate script did not load. Expected when served from file:// or inside a sandboxed iframe, or if the CMS strips external scripts.'); }
			};
			document.head.appendChild(tag);

			/* Belt and braces: onerror does not always fire when a script is
			   blocked by a sandbox or CSP rather than failing to fetch. */
			setTimeout(function () {
				if (block.getAttribute('data-translate-state') !== 'ready') {
					state('blocked');
					if (window.console) { console.warn('[MYSP] Google Translate did not initialize within 6s. The control stays hidden by design.'); }
				}
			}, 6000);
		})();

/* ══════════════════════════════════════════════════════════════════
	   Glossary links, v82.
	   Three jobs: remember where the reader was, open the collapsed
	   glossary group they are being sent into, and offer them the way
	   back. Everything degrades to a plain in-page anchor if JS fails,
	   which is why the links are real hrefs and not buttons.
	   ══════════════════════════════════════════════════════════════════ */
	(function ()
	{
		var bar    = document.getElementById('gloss-return');
		if (!bar) { return; }
		var link   = bar.querySelector('.gloss-return-link');
		var label  = bar.querySelector('.gloss-return-text');
		var origin = null;      /* {cardId, pane, fallbackId} */

		/* Open the <details> group a term sits inside, then flag it. */
		function reveal(id)
		{
			var dt = document.getElementById(id);
			if (!dt) { return; }
			/* Expand the parent story-section if it is currently collapsed */
			if (window.MYSP && window.MYSP.expandSection) { window.MYSP.expandSection(dt); }
			var group = dt.closest('details.glossary-group');
			if (group && !group.open) { group.open = true; }
			document.querySelectorAll('.glossary-list dt.gloss-hit')
				.forEach(function (e) { e.classList.remove('gloss-hit'); });
			dt.classList.add('gloss-hit');
			/* The group may have just opened, so scroll after layout. */
			requestAnimationFrame(function ()
			{
				dt.scrollIntoView({ block: 'center',
					behavior: (window.matchMedia('(prefers-reduced-motion: reduce)').matches
						? 'auto' : 'smooth') });
			});
		}

		document.addEventListener('click', function (ev)
		{
			var a = ev.target.closest ? ev.target.closest('.gloss-link') : null;
			if (!a) { return; }

			var card = a.closest('article.scorecard');
			var pane = a.closest('.detail-tab-pane');
			var near = a.closest('[id]');
			origin = {
				cardId:     card ? card.id : null,
				pane:       pane ? pane.getAttribute('data-pane') : null,
				fallbackId: near ? near.id : null
			};

			if (label)
			{
				var num = card ? card.id.replace('action-', '').replace(/-/g, '.') : null;
				label.textContent = num ? ('Back to Action ' + num) : 'Back to where you were';
			}
			if (link)
			{
				link.setAttribute('href', '#' + (origin.cardId || origin.fallbackId || 'wide-content'));
			}
			bar.hidden = false;

			reveal(a.getAttribute('href').slice(1));
		});

		/* Someone arriving on a #g- link from outside, or using back/forward. */
		function onHash()
		{
			if (location.hash.indexOf('#g-') === 0) { reveal(location.hash.slice(1)); }
		}
		window.addEventListener('hashchange', onHash);
		onHash();

		/* Going back: re-open the card and restore the tab they were reading. */
		if (link)
		{
			link.addEventListener('click', function ()
			{
				if (!origin || !origin.cardId) { return; }
				var card = document.getElementById(origin.cardId);
				if (!card) { return; }
				var det = card.querySelector('details.card-details');
				if (det && !det.open) { det.open = true; }
				if (origin.pane)
				{
					var btn = card.querySelector('.detail-tab-btn[data-tab="' + origin.pane + '"]');
					if (btn) { btn.click(); }
				}
				bar.hidden = true;
			});
		}
	})();