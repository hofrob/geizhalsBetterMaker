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
		var preisagenten = syncStorage['preisagenten'];
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

							preisagenten[get_region() + '_' + artikel + '_' + tab_id] = {
								'titel': $('h1 span:first').text(),
								'preis': parseInt($('#preistab_inhalt' + tab_id + ' span.price:first').text().replace(/,/, '').replace(/\-\-/, '00'), 10),
								'haendler': $('#preistab_inhalt' + tab_id + ' #content_table tr.t1:first td:nth-child(2) a:first').text()
							};
							chrome.storage.sync.set({'preisagenten': preisagenten});
						} else {
							delete preisagenten[preisagent_index = get_region() + '_' + artikel + '_' + tab_id];
							chrome.storage.sync.set({'preisagenten': preisagenten});
						}
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

						if(tabs[i].filterbox_ausblenden)
							$('#preistab_inhalt' + i + ' #gh_afilterbox').hide();

						if(tabs[i].vkinfo_ausblenden) {
							$('#preistab_inhalt' + i + ' div.vk_inl').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									return 'Versandkosten';
								});
							});
						}

						if(tabs[i].preisfeld_ausmisten && tabs[i].beschreibungstext_kuerzen) {
							var preis_von = [];
							setInterval(function() {
								$('#preistab_inhalt' + i + ' #content_table tr').find('td:first small:first').each(function(index, value) {
									var alter = errechne_alter($(value).attr('title'));
									$(value).html(alter);
								});
							}, 60*1000);
						}

						if(tabs[i].beschreibungstext_kuerzen)
							$('#preistab_inhalt' + i + ' .ty2').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
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

						if(tabs[i].info_agb_link_ausblenden)
							$('#preistab_inhalt' + i + ' div.gh_hl1').remove();

						if(tabs[i].preisfeld_ausmisten) {
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(1)').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {

									if(value.attr('colspan') == 5)
										return;

									value.attr('title', value.text());

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

								tooltip_anhaengen(value, function(value) {

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

						if(tabs[i].lagerstand_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table div.av_l').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									return 'lagernd';
								});
							});
							$('#preistab_inhalt' + i + ' #content_table div.av_k').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									return 'bis 4 Werktage';
								});
							});
							$('#preistab_inhalt' + i + ' #content_table div.av_e').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									return '4+ Werktage';
								});
							});
						}

						if(tabs[i].haendlerlink_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(2)').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {

									if(value.attr('colspan') == 5)
										return;

									if(value.find('img:first.hlflg').length)
										var haendlerlink = value.find('img:first.hlflg').clone()[0].outerHTML;
									else
										var haendlerlink = '';

									haendlerlink = haendlerlink.concat(value.find('a').clone()[0].outerHTML);
									if(tabs[i].bezugsart == 'abholung') {
										haendlerlink = haendlerlink.concat('<br>' + value.find('b span').text().replace(/\s/g, '') + ' ');
										value.find('a:last').html('Karte');
										haendlerlink = haendlerlink.concat(value.find('a:last')[0].outerHTML);
									}
									return haendlerlink;
								});
							});
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(2) img+br').remove();
						}

						if(tabs[i].spaltenueberschriften_ausblenden)
							$('#preistab_inhalt' + i + ' #content_table tr:lt(2)').hide();

						$('#preistab_inhalt' + i).tooltip({
								track: true,
								items: '.tooltip',
								content: function() {
									return $(this).find('div.original_content').html();
								}
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