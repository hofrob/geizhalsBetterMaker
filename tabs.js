$(function() {

	if(!/a\d+\.html/i.test(window.location.pathname))
		return;

	if(window.location.search || window.location.hash) {

		var a = $(document.createElement('a'))
				.addClass('ntd')
				.attr('href', window.location.pathname)
				.html('BetterMaker Tabs'),
			span = $(document.createElement('span'))
				.addClass('monav')
				.append(a);

		$('#monav span:first').after(span);
		return;
	}

	chrome.storage.sync.get(null, function(syncStorage) {
		var tabs = syncStorage['tabs'],
			standard_tab = syncStorage['standard_tab'],
			artikel = window.location.pathname.replace(/^.*a(\d+)\.html.*$/i, '$1');

		if(!tabs)
			return;

		$('#gh_afilterbox, #content_table, [name="filterbox"], #gh_content_wrapper > div.blaettern').wrapAll('<div id="allepreise" />');
		$('#allepreise').wrapAll('<div id="preistabs" />');
		$('#preistabs').prepend('<ul><li><a href="#allepreise">Alle Preise</a></li></ul>');

		for(var i = 0; i < tabs.length; i++) {
			$('#preistabs ul').append('<li><a href="#preistab_inhalt' + i + '">' + tabs[i].tabname + '&nbsp;</a></li>');
			$('#preistabs').append('<div id="preistab_inhalt' + i + '" />');
		}

		$('#preistabs').tabs({
			activate: function() {

				var i = $('#preistabs').tabs("option", "active") - 1;

				$('#preisagent').remove();
				if(i < 0)
					return;

				chrome.storage.sync.get('preisagenten', function(syncStorage) {

					var preisagenten = syncStorage['preisagenten'],
						div = $(document.createElement('div'))
								.attr('id', 'preisagent')
								.data({tab: i});

					if(preisagenten[get_region() + '_' + artikel + '_' + i])
						div.addClass('aktiv');

					$('#preistabs ul li:nth-child(' + eval(i+2) + ') a').append(div);

					$('#preisagent').click(function() {
						$('#preisagent').toggleClass('aktiv');
						chrome.storage.sync.get('preisagenten', function(syncStorage) {

							var preisagenten = syncStorage['preisagenten'],
								tab_id = $('#preisagent').data().tab;

							if($('#preisagent.aktiv').length) {

								var preis_span = $('#preistab_inhalt' + tab_id + ' tr:not(.haendler_ausblenden) span.price:first'),
									preis,
									haendler;

								if(preis_span.length) {
									preis = parseInt($('#preistab_inhalt' + tab_id + ' tr:not(.haendler_ausblenden) span.price:first')
											.text().replace(/,/, '').replace(/\-\-/, '00'), 10);
									haendler = $('#preistab_inhalt' + tab_id + ' #content_table tr:not(.haendler_ausblenden) td:nth-child(2) a:first').text();
								} else {
									preis = '--';
									haendler = '--';
								}

								preisagenten[get_region() + '_' + artikel + '_' + tab_id] = {
									titel: $('h1 span:first').text(),
									preis: preis,
									haendler: haendler,
									uhrzeit: Date.now()
								};
								chrome.storage.sync.set({preisagenten: preisagenten});
							} else {
								delete preisagenten[preisagent_index = get_region() + '_' + artikel + '_' + tab_id];
								chrome.storage.sync.set({preisagenten: preisagenten});
							}
						});
					});
				});

				if($('#preistab_inhalt' + i + ' #content_table').length > 0)
					return;

				data = getvars_fuer_tab(tabs[i]);

				$.ajax({
					data: data,
					dataType: 'html',
					success: function(data) {

						var important = $('#gh_important', data);
						if(important.length) {
							$('#preistab_inhalt' + i).append(important);
							return;
						}

						/* [name="filterbox"] enthaelt script tag mit javascript call der uncaught reference error verursacht
						 * $('[name="filterbox"]', data).find('script').remove() funktioniert nicht
						 */
						$('#gh_afilterbox, #content_table, #gh_content_wrapper > h3, #gh_content_wrapper > div.blaettern', data)
								.appendTo('#preistab_inhalt' + i);

						zeilen_einausblenden();

						if(tabs[i].filterbox_ausblenden)
							$('#preistab_inhalt' + i + ' #gh_afilterbox').hide();

						if(tabs[i].vkinfo_ausblenden && tabs[i].lagerstand_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(4)').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'e'}, function(value) {
									value.find('div.vk_inl').remove();
									var lagerstand = value.find('.av_inl');

									if(lagerstand.hasClass('av_l'))
										lagerstand.html('lagernd');
									else if(lagerstand.hasClass('av_k'))
										lagerstand.html('bis 4 Werktage');
									else
										lagerstand.html('4+ Werktage');

									return value.html();
								});
							});
						} else if(tabs[i].vkinfo_ausblenden) {
							$('#preistab_inhalt' + i + ' div.vk_inl').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'e'}, function() {
									return 'Versandkosten';
								});
							});
						} else if(tabs[i].lagerstand_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table div.av_l').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'e'}, function() {
									return 'lagernd';
								});
							});
							$('#preistab_inhalt' + i + ' #content_table div.av_k').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'e'}, function() {
									return 'bis 4 Werktage';
								});
							});
							$('#preistab_inhalt' + i + ' #content_table div.av_e').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'e'}, function() {
									return '4+ Werktage';
								});
							});
						}


						if(tabs[i].preisfeld_ausmisten && tabs[i].beschreibungstext_kuerzen) {
							var preis_von = [];
							setInterval(function() {
								$('.ghbm_zeit').each(function(index, value) {
									$(value).html(errechne_alter($(value).attr('title')));
								});
							}, 60*1000);
						}

						if(tabs[i].beschreibungstext_kuerzen)
							$('#preistab_inhalt' + i + ' .ty2').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'s'}, function(value) {

									var beschreibung_haendler = value.html().split("<p>")[0]
											.replace(/\<br\>|\<wbr\>/g, ' ')
											.substring(0,250);

									if(tabs[i].preis_vom_zeitdifferenz) {
										var datum = value.find('p b').text(),
											alter = errechne_alter(datum),
											small = $(document.createElement('small'))
												.html(alter)
												.attr('title', datum)
												.addClass('ghbm_zeit');

										preis_von.push(small[0].outerHTML);

										return beschreibung_haendler;
									} else {
										return beschreibung_haendler + '<br>' + small[0].outerHTML;
									}
								});
							});

						if(tabs[i].preisfeld_ausmisten)
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(1)').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'w'}, function(value) {

									if(value.attr('colspan') == 5)
										return;

									var preis = value.find('span.price').clone(),
										kkimg;

									if(!tabs[i].kreditkartenlogos_ausblenden)
										kkimg = value.find('p').last().clone();

									value.empty();

									var stand = '';
									if(tabs[i].preis_vom_zeitdifferenz)
										stand = preis_von.shift();

									if(typeof kkimg === 'undefined' || kkimg.length == 0 || /MwSt/.test(kkimg[0].innerText))
										return preis[0].outerHTML + '<br>' + stand;
									else
										return preis[0].outerHTML + '<br>' + stand + ' ' + kkimg[0].outerHTML;
								});
							});

						if(tabs[i].bewertungsinfo_kuerzen)
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(3)').each(function(index, value) {

								tooltip_anhaengen(value, {richtung:'e'}, function(value) {

									div_helper = $(document.createElement('div'));

									if(value.attr('colspan') == 5)
										return;

									var a = value.find('a').first().clone();
									if(/hat keine g.ltigen bewertungen/i.test(value.text())) {
										a.html('keine Bewertungen');
									} else {
										var bewertungen = value.find('small a').text().replace(/.*?(\d+)\s*Bewertung(en)?/i, '$1'),
											note = value.find('small:first').text().replace(/Note.*?([\d,]+).*/i, '$1');
										note = parseFloat(note.replace(/,/, '.')).toFixed(2).replace(/\./, ',');
										a.append('<br>' + note + '/' + bewertungen);
									}

									div_helper.append(a);

									if($('span.gh_stars', value).length)
										div_helper.append('<br>amazon: ', $('span.gh_stars', value));

									return div_helper.html();
								});
							});

						if(tabs[i].haendlerlink_kuerzen)
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(2)').each(function(index, value) {

								var processTooltip = function(div) {

									if($('.haendler_ausblenden', div).length)
										return div;

									var a = $(document.createElement('a'))
											.html('GHBM Optionen')
											.attr({
												href: '#',
												onClick: 'return false;'
											})
											.click(function() {
												$('#powerTip .haendler_ausblenden').show();
											});

									$('.gh_hl1', div).append(' ', a);

									var div_haendler_ausblenden = $(document.createElement('div')),
										img_temp_herv = $(document.createElement('img'))
											.attr('src', chrome.extension.getURL('img/hinzufuegen.png'))
											.addClass('haendler_bearbeiten_icon')
											.attr('data-ausblendart', 't_1'),
										img_perm_herv = img_temp_herv.clone().attr('data-ausblendart', 'p_1'),
										img_temp_haen = $(document.createElement('img'))
											.attr('src', chrome.extension.getURL('img/entfernen.png'))
											.addClass('haendler_bearbeiten_icon')
											.attr('data-ausblendart', 't_2'),
										img_perm_haen = img_temp_haen.clone().attr('data-ausblendart', 'p_2'),
										img_temp_region = img_temp_haen.clone().attr('data-ausblendart', 't_3'),
										img_perm_region = img_temp_haen.clone().attr('data-ausblendart', 'p_3');

									div_haendler_ausblenden
											.addClass('haendler_ausblenden')
											.append('<br>Händler hervorheben:<br>',
													img_temp_herv, ' temporär (4h)<br>',
													img_perm_herv, ' permanent<br>',
													'<br>Händler ausblenden:<br>',
													img_temp_haen, ' temporär (4h)<br>',
													img_perm_haen, ' permanent<br>',
													'<br>Region ', $('img:first', value).clone(), ' ausblenden:<br>',
													img_temp_region, ' temporär (4h)<br>',
													img_perm_region, ' permanent');

									$('.haendler_bearbeiten_icon', div_haendler_ausblenden).click(function(e) {

										$.powerTip.hide();

										var haendlername = $('#powerTip a:first').text();

										chrome.storage.sync.get('haendler', function(syncStorage) {

											var haendler = syncStorage['haendler'];
												art = $(e.target).attr('data-ausblendart').split('_'),
												temp = art[0] == 't',
												typ = parseInt(art[1], 10),
												name = art[1] == 3 ? get_region($('img:first', value)) : haendlername,
												eintrag = $.grep(haendler, function(e) {
													return e.name == name && (typ == 3 && e.typ == 3 || typ < 3 && e.typ < 3);
												});

											if(eintrag.length) {
												eintrag[0].temp = temp;
												eintrag[0].typ = typ;
												eintrag[0].zeit = Date.now();
												haendler = $.grep(haendler, function(e) {
													return e.name == name && (typ == 3 && e.typ == 3 || typ < 3 && e.typ < 3);
												}, true);
												haendler.push(eintrag[0]);
											} else {
												haendler.push({
													name: name,
													temp: temp,
													typ: typ,
													zeit: Date.now()
												});
											}

											chrome.storage.sync.set({haendler: haendler}, function() {
												chrome.runtime.sendMessage({typ: 'zeilen_einausblenden'});
											});
										});
									});

									div.append(div_haendler_ausblenden);
									return div;
								};

								var alte_flag = $(value).find('img.hlflg');

								if(alte_flag.length) {
									var div_haendler_ausblenden = $(document.createElement('div'))
											.html('Händler aus Region ausblenden'),
										img_region = $(document.createElement('img'))
											.attr('src', $(value).find('img.hlflg').attr('src')),
										div_flag = $(document.createElement('div'))
											.addClass('powerTip flag_links')
											.data('powertipjq', div_haendler_ausblenden)
											.append(img_region);

									alte_flag.remove();
								}

								tooltip_anhaengen(value, {richtung:'s', processTooltip: processTooltip}, function(value) {

									var haendlerlink_neu = $(document.createElement('div'))
											.addClass('haendlerlink');

									if(!tabs[i].info_agb_link_ausblenden)
										haendlerlink_neu.prepend(value.find('.gh_hl1'));

									var link = value.find('a:first').clone().empty(),
										haendlerlogo = value.find('a:first img');

									if(haendlerlogo.length) {
										var img_haendlerlogo = $(document.createElement('img'))
												.attr('src', haendlerlogo.attr('src'));

										link.append(img_haendlerlogo, '<br>', value.find('a small'));
									} else {
										link.html(value.find('a:first'))
												.prepend('<br>');
									}
									haendlerlink_neu.prepend(link);

									return haendlerlink_neu;
								});
								$(value).prepend(div_flag);
							});

						if(tabs[i].spaltenueberschriften_ausblenden)
							$('#preistab_inhalt' + i + ' #content_table tr:lt(2)').hide();

						$('.powerTip_e').powerTip({
							placement: 'e',
							mouseOnToPopup: true
						});

						$('.powerTip_s').powerTip({
							placement: 's',
							mouseOnToPopup: true
						});

						$('.powerTip_w').powerTip({
							placement: 'w',
							mouseOnToPopup: true
						});
					}
				});

			}
		});
		if(typeof tab_aktivieren == 'function')
			$('#preistabs').tabs('option', 'active', tab_aktivieren() + 1);
		else if(typeof standard_tab != 'undefined')
			$('#preistabs').tabs('option', 'active', standard_tab + 1);
	});
});