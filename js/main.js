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
			// Update stage and datahub chip counts based on cards in priority-visible sections
		var stageCounts = { emerging: 0, developing: 0, embedded: 0 };
		var datahubCounts = { has: 0, none: 0 };
		document.querySelectorAll('.wide-section:not(.priority-hidden) .scorecard').forEach(function(card)
		{
			var stage = card.getAttribute('data-stage');
			if (stage && Object.prototype.hasOwnProperty.call(stageCounts, stage)) stageCounts[stage]++;
			var hasData = (card.getAttribute('data-datahub') || '') !== '';
			if (hasData) datahubCounts.has++; else datahubCounts.none++;
		});
		['emerging', 'developing', 'embedded'].forEach(function(s)
		{
			var chip = document.querySelector('.filter-chip[data-stage="' + s + '"]');
			if (!chip) return;
			var textNode = Array.from(chip.childNodes).find(function(n) { return n.nodeType === 3; });
			var label = s.charAt(0).toUpperCase() + s.slice(1) + ' (' + stageCounts[s] + ')';
			if (textNode) textNode.textContent = label;
			else chip.appendChild(document.createTextNode(label));
		});
		var hasChip = document.querySelector('.filter-chip[data-datahub-filter="has"]');
		if (hasChip) hasChip.textContent = 'Has public data (' + datahubCounts.has + ')';
		var noneChip = document.querySelector('.filter-chip[data-datahub-filter="none"]');
		if (noneChip) noneChip.textContent = 'No public source yet (' + datahubCounts.none + ')';
		document.dispatchEvent(new CustomEvent('mysp:filters-applied'));
		}

		function syncPriorityChips(priority)
		{
			document.querySelectorAll('.filter-chip[data-filter-type="priority"]').forEach(function(c) { c.classList.remove('active'); });
			var chip = document.querySelector('.filter-chip[data-filter-type="priority"][data-priority="' + priority + '"]');
			if (chip) chip.classList.add('active');
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
				syncPriorityChips(activePriority);
				applyFilters();
				updateClearVisibility();
				if (activePriority === 'all')
				{
					if (window.MYSP && typeof window.MYSP.showAllPriorities === 'function') window.MYSP.showAllPriorities();
					else window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
				}
				else
				{
					var target = document.getElementById('section-' + activePriority);
					if (target)
					{
						if (window.MYSP && typeof window.MYSP.goToSection === 'function') window.MYSP.goToSection(target);
						else target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
					}
				}
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

		function triggerAllPriorities()
		{
			var allBtn = document.querySelector('.pnav-item-all[data-section="all"]');
			if (allBtn)
			{
				allBtn.click();
				return true;
			}
			if (window.MYSP && typeof window.MYSP.showAllPriorities === 'function')
			{
				window.MYSP.showAllPriorities();
				return true;
			}
			return false;
		}

		// Smooth scroll for on-page nav
		document.querySelectorAll('.onpage-link').forEach(function(link)
		{
			link.addEventListener('click', function(e)
			{
				if (link.getAttribute('href') === '#section-belonging' && triggerAllPriorities())
				{
					e.preventDefault();
					return;
				}
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
					syncPriorityChips('all');
					if (window.MYSP && typeof window.MYSP.showAllPriorities === 'function') window.MYSP.showAllPriorities({ scroll: false });
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
			syncPriorityChips('all');
			document.querySelectorAll('.pnav-item, .pnav-item-all').forEach(function(i) { i.classList.remove('active'); });
			var allBtn = document.querySelector('.pnav-item-all');
			if (allBtn) allBtn.classList.add('active');
			applyFilters();
			if (window.MYSP && typeof window.MYSP.showAllPriorities === 'function') window.MYSP.showAllPriorities();
			updateClearVisibility();
			searchInput.focus();
		});

		// Priority filter chips in the "Review and Filter" sidebar section
		document.querySelectorAll('.filter-chip[data-filter-type="priority"]').forEach(function(chip)
		{
			chip.addEventListener('click', function()
			{
				activePriority = chip.getAttribute('data-priority');
				syncPriorityChips(activePriority);
				var pnav = document.getElementById('priority-nav');
				if (pnav)
				{
					pnav.querySelectorAll('.pnav-item, .pnav-item-all').forEach(function(i) { i.classList.remove('active'); });
					var matchingNavItem = pnav.querySelector('[data-section="' + activePriority + '"]');
					if (matchingNavItem) matchingNavItem.classList.add('active');
				}
				applyFilters();
				updateClearVisibility();
				if (activePriority === 'all')
				{
					if (window.MYSP && typeof window.MYSP.showAllPriorities === 'function') window.MYSP.showAllPriorities();
					else window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
				}
				else
				{
					var target = document.getElementById('section-' + activePriority);
					if (target)
					{
						if (window.MYSP && typeof window.MYSP.goToSection === 'function') window.MYSP.goToSection(target);
						else target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
					}
				}
			});
		});


		var onpageSelect = document.querySelector('.onpage-select');
		if (onpageSelect)
		{
			onpageSelect.addEventListener('change', function()
			{
				if (onpageSelect.value === '#section-belonging' && triggerAllPriorities())
				{
					onpageSelect.selectedIndex = 0;
					return;
				}
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

		// Signs of Change links — open action popup dialog instead of navigating directly.
		// The href stays as a no-JS fallback.
		// "Read the full picture" summaries in priority sections also use this popup.
		(function()
		{
			var overlay   = document.getElementById('action-popup-overlay');
			var popupBody = document.getElementById('action-popup-body');
			var closeX    = document.getElementById('action-popup-close-x');
			var closeBtn  = document.getElementById('action-popup-close-btn');
			var gotoBtn   = document.getElementById('action-popup-goto-btn');
			if (!overlay || !popupBody || !closeX || !closeBtn || !gotoBtn) return;

			var currentTarget = null;
			var triggerEl = null;

			function wireDetailTabs(details)
			{
				details.addEventListener('toggle', function()
				{
					if (details.open)
					{
						var inner = details.querySelector('.details-inner');
						if (inner && !inner.querySelector('.detail-tab-pane.active'))
						{
							var panes = inner.querySelectorAll('.detail-tab-pane');
							var btns  = inner.querySelectorAll('.detail-tab-btn');
							if (panes[0]) panes[0].classList.add('active');
							if (btns[0])  btns[0].classList.add('active');
						}
					}
				});
				details.addEventListener('click', function(e)
				{
					var btn = e.target.closest('.detail-tab-btn');
					if (!btn) return;
					var tabKey = btn.getAttribute('data-tab');
					var inner  = details.querySelector('.details-inner');
					if (!inner) return;
					inner.querySelectorAll('.detail-tab-btn').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
					inner.querySelectorAll('.detail-tab-pane').forEach(function(p) { p.classList.remove('active'); });
					btn.classList.add('active');
					btn.setAttribute('aria-selected', 'true');
					var pane = inner.querySelector('[data-pane="' + tabKey + '"]');
					if (pane) pane.classList.add('active');
				});
			}

			function openPopup(targetHref, label, trigger, showGoto)
			{
				var card = document.querySelector(targetHref);
				if (!card) return false;
				currentTarget = targetHref;
				triggerEl = trigger || null;

				popupBody.innerHTML = '';
				var clone = card.cloneNode(true);
				// Strip all id attributes from the clone to prevent duplicate ids in the DOM
				clone.removeAttribute('id');
				clone.querySelectorAll('[id]').forEach(function(el) { el.removeAttribute('id'); });
				var clonedDetails = clone.querySelector('.card-details');
				if (clonedDetails)
				{
					clonedDetails.open = true;
					wireDetailTabs(clonedDetails);
					var inner = clonedDetails.querySelector('.details-inner');
					if (inner)
					{
						var firstPane = inner.querySelector('.detail-tab-pane');
						var firstBtn  = inner.querySelector('.detail-tab-btn');
						if (firstPane && !firstPane.classList.contains('active')) firstPane.classList.add('active');
						if (firstBtn  && !firstBtn.classList.contains('active'))  { firstBtn.classList.add('active'); firstBtn.setAttribute('aria-selected', 'true'); }
					}
				}
				popupBody.appendChild(clone);

				var titleEl = document.getElementById('action-popup-title');
				if (titleEl) titleEl.textContent = label || 'Strategic Action';

				gotoBtn.hidden = (showGoto === false);
				overlay.classList.add('open');
				overlay.removeAttribute('aria-hidden');
				document.body.style.overflow = 'hidden';
				closeX.focus();
				return true;
			}

			function closePopup()
			{
				overlay.classList.remove('open');
				overlay.setAttribute('aria-hidden', 'true');
				document.body.style.overflow = '';
				currentTarget = null;
				gotoBtn.hidden = false;
				if (triggerEl) { triggerEl.focus(); triggerEl = null; }
			}

			closeX.addEventListener('click', closePopup);
			closeBtn.addEventListener('click', closePopup);

			gotoBtn.addEventListener('click', function()
			{
				if (!currentTarget) { closePopup(); return; }
				var card = document.querySelector(currentTarget);
				closePopup();
				if (card) revealActionCard(card);
			});

			overlay.addEventListener('click', function(e)
			{
				if (e.target === overlay) closePopup();
			});

			document.addEventListener('keydown', function(e)
			{
				if ((e.key === 'Escape' || e.key === 'Esc') && overlay.classList.contains('open')) closePopup();
			});

			document.querySelectorAll('a.change-link').forEach(function(link)
			{
				link.addEventListener('click', function(e)
				{
					var targetHref = link.getAttribute('href');
					var label = link.getAttribute('aria-label') || link.textContent.trim();
					if (openPopup(targetHref, label, link)) e.preventDefault();
				});
			});

			// "Read the full picture" in priority-section scorecards → popup (no goto button).
			document.querySelectorAll('.wide-section .scorecard').forEach(function(card)
			{
				var summary = card.querySelector('.card-details > summary');
				if (!summary || !card.id) return;
				summary.addEventListener('click', function(e)
				{
					e.preventDefault();
					var numLabel = card.querySelector('.card-band-num-label');
					var label = numLabel ? numLabel.textContent.trim() : 'Strategic Action';
					openPopup('#' + card.id, label, summary, false);
				});
			});
		}());

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
		var NEXT_LABEL_PREFIX = 'Next: ';
		var PRIORITY_SECTION_IDS = ['section-belonging', 'section-mastery', 'section-independence', 'section-generosity'];

		var activeSection = null;
		var imageBasePath = '/mysp';
		var cssLink = document.querySelector('link[href*="/css/style.css"]');
		if (cssLink && cssLink.getAttribute('href'))
		{
			var href = cssLink.getAttribute('href');
			var base = href.replace(/\/css\/style\.css(?:\?.*)?$/, '');
			if (base) { imageBasePath = base; }
		}

		function isSectionVisible(section)
		{
			return !!section && !section.classList.contains('priority-hidden');
		}

		function visibleSections()
		{
			return sections.filter(isSectionVisible);
		}

		function prioritySectionIndex(section)
		{
			if (!section || !section.id) { return -1; }
			return PRIORITY_SECTION_IDS.indexOf(section.id);
		}

		function currentPrioritySelection()
		{
			var activeNavItem = document.querySelector('#priority-nav .pnav-item.active, #priority-nav .pnav-item-all.active');
			if (activeNavItem) { return activeNavItem.getAttribute('data-section') || 'all'; }
			var activeChip = document.querySelector('.filter-chip[data-filter-type="priority"].active');
			if (activeChip) { return activeChip.getAttribute('data-priority') || 'all'; }
			return 'all';
		}

		function nextSectionTarget(section)
		{
			var priorityIndex = prioritySectionIndex(section);
			if (priorityIndex !== -1 && currentPrioritySelection() !== 'all')
			{
				if (priorityIndex < PRIORITY_SECTION_IDS.length - 1)
				{
					return document.getElementById(PRIORITY_SECTION_IDS[priorityIndex + 1]);
				}
				return document.getElementById('section-ahead');
			}

			var visible = visibleSections();
			var visibleIndex = visible.indexOf(section);
			if (visibleIndex === -1 || visibleIndex >= visible.length - 1) { return null; }
			return visible[visibleIndex + 1];
		}

		function activatePrioritySection(section)
		{
			var priorityIndex = prioritySectionIndex(section);
			if (priorityIndex === -1) { return false; }
			var priority = section.id.replace('section-', '');
			var navItem = document.querySelector('#priority-nav [data-section="' + priority + '"]');
			if (navItem)
			{
				navItem.click();
				return true;
			}
			var chip = document.querySelector('.filter-chip[data-filter-type="priority"][data-priority="' + priority + '"]');
			if (chip)
			{
				chip.click();
				return true;
			}
			return false;
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
			sections.forEach(function (section)
			{
				var btn = section.querySelector('.section-next-btn');
				if (!btn) { return; }
				var next = nextSectionTarget(section);
				if (next)
				{
					btn.hidden = false;
					btn.disabled = false;
					btn.textContent = NEXT_LABEL_PREFIX + sectionTitle(next);
				}
				else
				{
					btn.hidden = true;
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
				item.inert = !active;
				if (active) item.removeAttribute('aria-hidden');
				else item.setAttribute('aria-hidden', 'true');
			});
			activeSection = target;
			updateJumpState();
			updateNextButtons();
			if (options.updateHash !== false)
			{
				if (location.hash !== ('#' + target.id))
				{
					if (options.historyMode === 'push') history.pushState(null, '', '#' + target.id);
					else history.replaceState(null, '', '#' + target.id);
				}
			}
			if (options.scroll !== false)
			{
				target.scrollIntoView({
					behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
					block: 'start'
				});
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
			img.src = imageBasePath + '/public/images/' + imageName;
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
					var target = nextSectionTarget(section);
					if (!target) { return; }
					if (prioritySectionIndex(target) !== -1 && currentPrioritySelection() !== 'all' && activatePrioritySection(target)) { return; }
					setActiveSection(target, { updateHash: true, scroll: true, historyMode: 'push' });
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

		[
			{
				id: 'section-change',
				file: 'nutrition.jpg',
				alt: 'Students sharing a meal in school'
			},
			{
				id: 'section-foundations',
				file: 'indigenous-ed.jpg',
				alt: 'Classroom activity grounded in Indigenous learning'
			},
			{
				id: 'section-ahead',
				file: 'sustainability.jpg',
				alt: 'Students collaborating outdoors'
			}
		].forEach(function (entry)
		{
			appendSectionImage(entry.id, entry.file, entry.alt);
		});
		addNextButtons();

		document.addEventListener('mysp:filters-applied', function ()
		{
			updateNextButtons();
			if (!activeSection || !isSectionVisible(activeSection))
			{
				var visible = visibleSections();
				/* Filtering by priority hides priority sections. Landing back on
				   the introduction would lose the reader's place entirely, so
				   fall back to another priority section when they were in one. */
				var preferred = null;
				if (activeSection && activeSection.classList.contains('wide-section'))
				{
					preferred = visible.filter(function (s) { return s.classList.contains('wide-section'); })[0];
				}
				var fallback = preferred || visible[0];
				if (fallback) setActiveSection(fallback, { updateHash: false, scroll: false });
			}
		});

		window.MYSP = window.MYSP || {};
		window.MYSP.goToSection = function (target)
		{
			var section = target && target.closest ? target.closest('section[id^="section-"]') : null;
			if (section)
			{
				setActiveSection(section, { updateHash: true, scroll: true, historyMode: 'push' });
				return;
			}
			if (target && target.scrollIntoView)
			{
				target.scrollIntoView({
					behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
					block: 'start'
				});
			}
		};
		window.MYSP.expandSection = function (el)
		{
			if (!el || !el.closest) { return; }
			var section = el.closest('section[id^="section-"]');
			if (!section) { return; }
			setActiveSection(section, { updateHash: false, scroll: false });
		};
		/* Show all four priority sections simultaneously (used by "All Priorities" nav). */
		window.MYSP.showAllPriorities = function (options)
		{
			options = options || {};
			var priorityIds = ['section-belonging', 'section-mastery', 'section-independence', 'section-generosity'];
			sections.forEach(function (item)
			{
				var isPriority = priorityIds.indexOf(item.id) !== -1;
				var visible = isPriority && isSectionVisible(item);
				item.classList.toggle('single-section-hidden', !visible);
				item.classList.toggle('single-section-active', visible);
				item.inert = !visible;
				if (visible) item.removeAttribute('aria-hidden');
				else item.setAttribute('aria-hidden', 'true');
			});
			activeSection = document.getElementById('section-belonging') || visibleSections()[0];
			updateJumpState();
			updateNextButtons();
			if (options.scroll !== false)
			{
				window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
			}
		};

		function applyHashSection()
		{
			var section = sectionFromHash();
			if (section) { setActiveSection(section, { updateHash: false, scroll: true }); }
		}
		window.addEventListener('hashchange', applyHashSection);
		window.addEventListener('popstate', applyHashSection);
		setActiveSection(sectionFromHash() || visibleSections()[0], { updateHash: false, scroll: false });
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
	   Glossary links, v84.
	   Clicking a term opens a popup dialog showing the definition.
	   The popup has a Close button and a link to the full Words We Use
	   section. Everything degrades to a plain in-page anchor if JS fails.
	   ══════════════════════════════════════════════════════════════════ */
	(function ()
	{
		/* Open the <details> group a term sits inside, then flag it. */
		function reveal(id)
		{
			var dt = document.getElementById(id);
			if (!dt) { return; }
			if (window.MYSP && window.MYSP.expandSection) { window.MYSP.expandSection(dt); }
			var group = dt.closest('details.glossary-group');
			if (group && !group.open) { group.open = true; }
			document.querySelectorAll('.glossary-list dt.gloss-hit')
				.forEach(function (e) { e.classList.remove('gloss-hit'); });
			dt.classList.add('gloss-hit');
			requestAnimationFrame(function ()
			{
				dt.scrollIntoView({ block: 'center',
					behavior: (window.matchMedia('(prefers-reduced-motion: reduce)').matches
						? 'auto' : 'smooth') });
			});
		}

		/* Build the popup once and reuse it. */
		var popup = document.createElement('div');
		popup.id = 'gloss-popup';
		popup.setAttribute('role', 'dialog');
		popup.setAttribute('aria-modal', 'true');
		popup.setAttribute('aria-labelledby', 'gloss-popup-title');
		popup.hidden = true;
		popup.innerHTML =
			'<div class="gloss-popup-backdrop"></div>' +
			'<div class="gloss-popup-box">' +
			  '<button class="gloss-popup-close" type="button" aria-label="Close">\u00d7</button>' +
			  '<p class="gloss-popup-eyebrow">What this means</p>' +
			  '<h3 id="gloss-popup-title" class="gloss-popup-term"></h3>' +
			  '<div class="gloss-popup-def"></div>' +
			  '<div class="gloss-popup-actions">' +
			    '<button class="gloss-popup-btn-close" type="button">Close</button>' +
			    '<a class="gloss-popup-btn-goto" href="#section-glossary">Go to Words We Use</a>' +
			  '</div>' +
			'</div>';
		document.body.appendChild(popup);

		var popupTerm = popup.querySelector('.gloss-popup-term');
		var popupDef  = popup.querySelector('.gloss-popup-def');
		var popupGoto = popup.querySelector('.gloss-popup-btn-goto');
		var currentTermId = null;

		function closePopup()
		{
			popup.hidden = true;
			currentTermId = null;
		}

		function openPopup(termId)
		{
			var dt = document.getElementById(termId);
			if (!dt) { return false; }
			var dd = dt.nextElementSibling;
			popupTerm.textContent = dt.textContent;
			popupDef.innerHTML = dd ? dd.innerHTML : '';
			/* Update the "Go to Words We Use" link to land on this term */
			popupGoto.setAttribute('href', '#' + termId);
			currentTermId = termId;
			popup.hidden = false;
			/* Move focus into the popup */
			var firstBtn = popup.querySelector('.gloss-popup-btn-close');
			if (firstBtn) { firstBtn.focus(); }
			return true;
		}

		/* Close buttons */
		popup.querySelector('.gloss-popup-close').addEventListener('click', closePopup);
		popup.querySelector('.gloss-popup-btn-close').addEventListener('click', closePopup);

		/* Backdrop click closes */
		popup.querySelector('.gloss-popup-backdrop').addEventListener('click', closePopup);

		/* Escape key closes */
		document.addEventListener('keydown', function (ev)
		{
			if (!popup.hidden && (ev.key === 'Escape' || ev.key === 'Esc')) { closePopup(); }
		});

		/* "Go to Words We Use" navigates and highlights the term */
		popupGoto.addEventListener('click', function (ev)
		{
			ev.preventDefault();
			var id = currentTermId;
			closePopup();
			if (id) { reveal(id); }
			/* Navigate to the glossary section */
			var section = document.getElementById('section-glossary');
			if (section)
			{
				if (window.MYSP && typeof window.MYSP.goToSection === 'function')
					{ window.MYSP.goToSection(section); }
				else
					{ section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
			}
		});

		/* Intercept gloss-link clicks — show popup instead of navigating */
		document.addEventListener('click', function (ev)
		{
			var a = ev.target.closest ? ev.target.closest('.gloss-link') : null;
			if (!a) { return; }
			ev.preventDefault();
			var termId = (a.getAttribute('href') || '').replace(/^#/, '');
			if (!openPopup(termId))
			{
				/* Fallback: no matching dt found, navigate normally */
				window.location.hash = '#' + termId;
			}
		});

		/* Someone arriving on a #g- link from outside, or using back/forward. */
		function onHash()
		{
			if (location.hash.indexOf('#g-') === 0) { reveal(location.hash.slice(1)); }
		}
		window.addEventListener('hashchange', onHash);
		onHash();
	})();
/* ══════════════════════════════════════════════════════════════════
   Priority filter sidebar, v84.
   One "Review and filter these actions" panel lives in the
   #priorities-filter-bar aside, to the right of all four priority
   sections on wide viewports and above them on narrow ones.
   IT HOLDS NO STATE OF ITS OWN. Every control proxies a click to the
   matching sidebar control and the whole panel re-reads the sidebar
   after each filter pass, so there is still one source of truth and
   nothing to keep in sync by hand.
   ══════════════════════════════════════════════════════════════════ */
(function ()
{
	var priorityNav = document.getElementById('priority-nav');
	var filterBar = document.getElementById('priorities-filter-bar');
	var sections = Array.prototype.slice.call(document.querySelectorAll('.wide-section'));
	var searchInput = document.getElementById('action-search');
	var clearBtn = document.getElementById('clear-filters');
	if (!priorityNav || !filterBar || !sections.length) { return; }

	var sourcePriorities = Array.prototype.slice.call(
		priorityNav.querySelectorAll('.pnav-item-all, .pnav-item'));
	var sourceStages = Array.prototype.slice.call(
		document.querySelectorAll('.filter-chip[data-filter-type="stage"]'));
	var sourceData = Array.prototype.slice.call(
		document.querySelectorAll('.filter-chip[data-filter-type="datahub"]'));
	var totalActions = document.querySelectorAll('.scorecard').length;

	function labelOf(el)
	{
		var title = el.querySelector('.pnav-title');
		return (title ? title.textContent : el.textContent).trim();
	}

	function radioRow(label, sourceButtons, entries, groupName)
	{
		var row = document.createElement('div');
		row.className = 'ptb-row';
		var caption = document.createElement('span');
		caption.className = 'ptb-label';
		caption.textContent = label;
		row.appendChild(caption);
		var list = document.createElement('div');
		list.className = 'ptb-radio-list';
		sourceButtons.forEach(function (source, i)
		{
			var id = 'ptb-radio-' + groupName + '-' + i;
			var lbl = document.createElement('label');
			lbl.className = 'ptb-radio-label';
			lbl.setAttribute('for', id);
			var inp = document.createElement('input');
			inp.type = 'radio';
			inp.name = 'ptb-' + groupName;
			inp.id = id;
			inp.className = 'ptb-radio';
			if (source.classList.contains('active')) { inp.checked = true; }
			inp.addEventListener('change', function () { source.click(); });
			lbl.appendChild(inp);
			lbl.appendChild(document.createTextNode('\u00a0' + labelOf(source)));
			list.appendChild(lbl);
			entries.push({ radio: inp, source: source });
		});
		row.appendChild(list);
		return row;
	}

	var bar = document.createElement('div');
	bar.className = 'priority-toolbar';

	var head = document.createElement('div');
	head.className = 'ptb-head';
	var titleEl = document.createElement('p');
	titleEl.className = 'ptb-title';
	titleEl.textContent = 'Review and filter';
	var count = document.createElement('p');
	count.className = 'ptb-count';
	head.appendChild(titleEl);
	head.appendChild(count);
	bar.appendChild(head);

	var entries = [];
	bar.appendChild(radioRow('Priority', sourcePriorities, entries, 'priority'));
	bar.appendChild(radioRow('Stage', sourceStages, entries, 'stage'));
	bar.appendChild(radioRow('Public data', sourceData, entries, 'data'));

	var searchRow = document.createElement('div');
	searchRow.className = 'ptb-row ptb-search';
	var searchLabel = document.createElement('label');
	searchLabel.className = 'ptb-label';
	searchLabel.textContent = 'Search';
	var input = document.createElement('input');
	input.type = 'search';
	input.className = 'ptb-search-input';
	input.placeholder = 'Search\u2026';
	input.autocomplete = 'off';
	input.id = 'ptb-search-global';
	searchLabel.setAttribute('for', input.id);
	var clear = document.createElement('button');
	clear.type = 'button';
	clear.className = 'ptb-clear';
	clear.textContent = 'Clear filters';
	clear.hidden = true;
	searchRow.appendChild(searchLabel);
	searchRow.appendChild(input);
	searchRow.appendChild(clear);
	bar.appendChild(searchRow);

	if (searchInput)
	{
		input.addEventListener('input', function ()
		{
			searchInput.value = input.value;
			searchInput.dispatchEvent(new Event('input', { bubbles: true }));
		});
	}
	if (clearBtn)
	{
		clear.addEventListener('click', function ()
		{
			clearBtn.click();
			input.focus();
		});
	}

	filterBar.appendChild(bar);

	/* clearBtn.hidden is set AFTER applyFilters dispatches its event, so it
	   would always be one pass stale here. Read the controls instead. */
	function filtersActive()
	{
		var defaults = sourcePriorities.concat(sourceStages).concat(sourceData)
			.filter(function (el)
			{
				return el.getAttribute('data-section') === 'all'
					|| el.getAttribute('data-stage') === 'all'
					|| el.getAttribute('data-datahub-filter') === 'all';
			});
		var allDefault = defaults.every(function (el) { return el.classList.contains('active'); });
		return !allDefault || !!(searchInput && searchInput.value.trim());
	}

	function render()
	{
		entries.forEach(function (entry)
		{
			entry.radio.checked = entry.source.classList.contains('active');
		});
		var total = totalActions;
		var shown = sections.reduce(function (sum, s)
		{
			return sum + (s.classList.contains('priority-hidden')
				? 0
				: s.querySelectorAll('.scorecard:not(.js-filtered-out)').length);
		}, 0);
		count.innerHTML = 'Showing <strong>' + shown + '</strong> of ' + total
			+ ' action' + (total === 1 ? '' : 's');
		if (searchInput && document.activeElement !== input)
		{
			input.value = searchInput.value;
		}
		clear.hidden = !filtersActive();
	}

	document.addEventListener('mysp:filters-applied', render);
	render();
})();
