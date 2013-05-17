$(function() {

	if(!/a\d+\.html/i.test(window.location.pathname))
		return;

	if(window.location.search || window.location.hash) {

		var a = $(document.createElement('a'));
		a.addClass('ntd');
		a.attr('href', window.location.pathname);
		a.html('BetterMaker Tabs');

		var span = $(document.createElement('span'));
		span.addClass('monav');
		span.append(a);

		$('#monav span:first').after(span);
		return;
	}

	chrome.storage.sync.get(null, function(syncStorage) {
		var tabs = syncStorage['tabs'];
		var standard_tab = syncStorage['standard_tab'];
		var artikel = window.location.pathname.replace(/^.*a(\d+)\.html.*$/i, '$1');

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

					var preisagenten = syncStorage['preisagenten'];
					var div = $(document.createElement('div'));

					div.attr('id', 'preisagent');
					div.data({tab: i});

					if(preisagenten[get_region() + '_' + artikel + '_' + i])
						div.addClass('aktiv');

					$('#preistabs ul li:nth-child(' + eval(i+2) + ') a').append(div);

					$('#preisagent').click(function() {
						$('#preisagent').toggleClass('aktiv');
						chrome.storage.sync.get('preisagenten', function(syncStorage) {

							var preisagenten = syncStorage['preisagenten'];
							var tab_id = $('#preisagent').data().tab;

							if($('#preisagent.aktiv').length) {

								var preis_span = $('#preistab_inhalt' + tab_id + ' tr:not(.haendler_ausblenden) span.price:first');
								var preis, haendler;

								if(preis_span.length) {
									preis = parseInt($('#preistab_inhalt' + tab_id + ' tr:not(.haendler_ausblenden) span.price:first').text().replace(/,/, '').replace(/\-\-/, '00'), 10);
									haendler = $('#preistab_inhalt' + tab_id + ' #content_table tr:not(.haendler_ausblenden) td:nth-child(2) a:first').text();
								} else {
									preis = '--';
									haendler = '--';
								}

								preisagenten[get_region() + '_' + artikel + '_' + tab_id] = {
									'titel': $('h1 span:first').text(),
									'preis': preis,
									'haendler': haendler,
									'uhrzeit': Date.now()
								};
								chrome.storage.sync.set({'preisagenten': preisagenten});
							} else {
								delete preisagenten[preisagent_index = get_region() + '_' + artikel + '_' + tab_id];
								chrome.storage.sync.set({'preisagenten': preisagenten});
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
					success: function(data, textStatus, jqXHR) {

						important = $('#gh_important', data);
						if(important.length) {
							$('#preistab_inhalt' + i).append(important);
							return;
						}

						/* [name="filterbox"] enthaelt script tag mit javascript call der uncaught reference error verursacht
						 * $('[name="filterbox"]', data).find('script').remove() funktioniert nicht
						 */
						$('#gh_afilterbox, #content_table, #gh_content_wrapper > h3, #gh_content_wrapper > div.blaettern', data).
								appendTo('#preistab_inhalt' + i);

						chrome.runtime.sendMessage({'typ': 'haendler_ausblenden'});

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
								tooltip_anhaengen(value, {richtung:'e'}, function(value) {
									return 'Versandkosten';
								});
							});
						} else if(tabs[i].lagerstand_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table div.av_l').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'e'}, function(value) {
									return 'lagernd';
								});
							});
							$('#preistab_inhalt' + i + ' #content_table div.av_k').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'e'}, function(value) {
									return 'bis 4 Werktage';
								});
							});
							$('#preistab_inhalt' + i + ' #content_table div.av_e').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'e'}, function(value) {
									return '4+ Werktage';
								});
							});
						}


						if(tabs[i].preisfeld_ausmisten && tabs[i].beschreibungstext_kuerzen) {
							var preis_von = [];
							setInterval(function() {
								$('#preistab_inhalt' + i + ' #content_table tr').find('td:first small:first').each(function(index, value) {
									var alter;
									if($('span', value).length) {
										alter = errechne_alter($('span', value).attr('title'));
										$('span', value).html(alter);
									} else if($(value).attr('title')) {
										alter = errechne_alter($(value).attr('title'));
										$(value).html(alter);
									}
								});
								haendler_einblenden();
							}, 60*1000);
						}

						if(tabs[i].beschreibungstext_kuerzen)
							$('#preistab_inhalt' + i + ' .ty2').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'s'}, function(value) {
									beschreibungstext = value.html();
									var beschreibung_haendler = beschreibungstext.split("<p>")[0];
									beschreibung_haendler = beschreibung_haendler.replace(/\<br\>|\<wbr\>/g, ' ');
									beschreibung_haendler = beschreibung_haendler.substring(0,250);

									if(tabs[i].preis_vom_zeitdifferenz) {
										var datum = value.find('p b').text();
										var alter = errechne_alter(datum);

										var small = $(document.createElement('small'));
										small.html(alter);
										small.attr('title', datum);

										preis_von.push(small[0].outerHTML);

										return beschreibung_haendler;
									} else {
										return beschreibung_haendler + '<br>' + small[0].outerHTML;
									}
								});
							});

						if(tabs[i].preisfeld_ausmisten) {
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(1)').each(function(index, value) {
								tooltip_anhaengen(value, {richtung:'w'}, function(value) {

									if(value.attr('colspan') == 5)
										return;

									var preis = value.find('span.price').clone();
									if(!tabs[i].kreditkartenlogos_ausblenden)
										var kkimg = value.find('p').last().clone();

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
						}

						if(tabs[i].bewertungsinfo_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(3)').each(function(index, value) {

								tooltip_anhaengen(value, {richtung:'e'}, function(value) {

									if(value.attr('colspan') == 5)
										return;

									var a = value.find('a').first().clone();
									if(/hat keine g.ltigen bewertungen/i.test(value.text())) {
										a.html('keine Bewertungen');
									} else {
										var bewertungen = value.find('small a').text().replace(/.*?(\d+)\s*Bewertung(en)?/i, '$1');
										var note = value.find('small:first').text().replace(/Note.*?([\d,]+).*/i, '$1');
										note = parseFloat(note.replace(/,/, '.')).toFixed(2).replace(/\./, ',');
										a.append('<br>' + note + '/' + bewertungen);
									}
									return a[0].outerHTML;
								});
							});
						}

						if(tabs[i].haendlerlink_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(2)').each(function(index, value) {

								var processTooltip = function(div) {

									if($('.haendler_ausblenden', div).length)
										return div;

									var a = $(document.createElement('a'));

									a.attr({
										'href': '#',
										'onClick': 'return false;'
									}).click(function() {
										$('#powerTip .haendler_ausblenden').show();
									}).html('Ausblenden');

									$('.gh_hl1', div).append(' ', a);

									var div_haendler_ausblenden = $(document.createElement('div'));
									var img_temp = $(document.createElement('img'));

									img_temp.attr('src', 'chrome-extension://daefgmcpnmbecchplnffpgpjbcoppcne/images/entfernen.png')
										.addClass('haendler_ausblenden_icon')
										.attr('title', 'temp');

									var img_perm = img_temp.clone().attr('title', 'perm');

									div_haendler_ausblenden.addClass('haendler_ausblenden')
											.append('<br>Händler ausblenden:<br>',
													img_temp, ' temporär (4h)<br>',
													img_perm, ' permanent');

									$('.haendler_ausblenden_icon', div_haendler_ausblenden).click(function(e) {
										var haendlername = $('#powerTip a:first').text();

										chrome.storage.sync.get('haendler_ausblenden', function(syncStorage) {
											var haendler_ausblenden = syncStorage['haendler_ausblenden'];
											if($(e.target).attr('title') == 'temp')
												haendler_ausblenden[haendlername] = Date.now();
											else
												haendler_ausblenden[haendlername] = true;

											chrome.storage.sync.set({'haendler_ausblenden': haendler_ausblenden}, function() {
												chrome.runtime.sendMessage({'typ': 'haendler_ausblenden'});
											});
										});
									});

									div.append(div_haendler_ausblenden);
									return div;
								};

								var alte_flag = $(value).find('img.hlflg');

								if(alte_flag.length) {
									var div_haendler_ausblenden = $(document.createElement('div'));
									div_haendler_ausblenden.html('Händler aus Region ausblenden');

									var img_region = $(document.createElement('img'));
									img_region.attr('src', $(value).find('img.hlflg').attr('src'));

									var div_flag = $(document.createElement('div'));
									div_flag.addClass('powerTip flag_links');
									div_flag.data('powertipjq', div_haendler_ausblenden);
									div_flag.append(img_region);

									alte_flag.remove();
								}

								tooltip_anhaengen(value, {richtung:'s', processTooltip: processTooltip}, function(value) {

									var haendlerlink_neu = $(document.createElement('div'));
									haendlerlink_neu.addClass('haendlerlink');

									if(!tabs[i].info_agb_link_ausblenden)
										haendlerlink_neu.prepend(value.find('.gh_hl1'));

									var link = value.find('a:first').clone().empty();
									var haendlerlogo = value.find('a:first img');

									if(haendlerlogo.length) {
										var img_haendlerlogo = $(document.createElement('img'));
										img_haendlerlogo.attr('src', haendlerlogo.attr('src'));

										var haendlername = value.find('a small');
										link.append(img_haendlerlogo, '<br>', haendlername);
									} else {
										link.html(value.find('a:first'));
										link.prepend('<br>');
									}
									haendlerlink_neu.prepend(link);

									return haendlerlink_neu;
								});
								$(value).prepend(div_flag);
							});
						}

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