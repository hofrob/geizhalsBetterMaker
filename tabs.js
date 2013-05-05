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
		var allgemein = syncStorage['allgemein'];

		if(!tabs)
			return;

		$('#gh_afilterbox, #content_table, [name="filterbox"], #gh_content_wrapper > div.blaettern').wrapAll('<div id="allepreise" />');
		$('#allepreise').wrapAll('<div id="preistabs" />');
		$('#preistabs').prepend('<ul><li><a href="#allepreise">Alle Preise</a></li></ul>');

		for(var i = 0; i < tabs.length; i++) {
			$('#preistabs ul').append('<li><a href="#preistab_inhalt' + i + '">' + tabs[i].tabname + ' </a></li>');
			$('#preistabs').append('<div id="preistab_inhalt' + i + '" />');
		}

		$('#preistabs').tabs({
			activate: function(event, ui) {

				var i = $('#preistabs').tabs("option", "active") - 1;

				if(syncStorage['dev'] && i >= 0) {
					var img = $(document.createElement('img'));
					img.attr('src', '//geizhals.at/b/cog2.png');
					img.css({
						'vertical-align': 'middle',
						'cursor': 'pointer'
					});
					$('#preistabs ul li:nth-child(' + eval(i+2) + ') a').append(img);
					$('#preistabs ul li:nth-child(' + eval(i+2) + ') img').click(function() {

						var tab = $(this).parent().attr('href').replace(/#preistab_inhalt(\d+)$/, '$1');
						var div = $(document.createElement('div'));
						div.attr('id', '#tabsettings');

						var input = $(document.createElement('input'));
						input.attr({
							type: 'hidden',
							name: 'url',
							id: 'preisagent_url',
							value: window.location.origin + window.location.pathname + '?' + $.param(getvars_fuer_tab(tabs[i]))
						});
						div.append(input);

						var bestpreis = parseFloat($('#preistab_inhalt' + tab + ' #content_table span.price').first().html().replace(/,/, '.'));

						var input = $(document.createElement('input'));
						input.attr({
							type: 'text',
							name: 'preisagent_limit',
							id: 'preisagent_limit',
							value: bestpreis
						});
						div.append(input);

						var input = $(document.createElement('input'));
						input.attr({
							type: 'hidden',
							name: 'preisagent_tab',
							id: 'preisagent_tab',
							value: tab
						});
						div.append(input);

						$('body').append(div);
						div.dialog({
							autoOpen: false,
							height: 150,
							width: 300,
							modal: true,
							buttons: {
								Ok: function() {
									var preisagent = {
										url: $('#preisagent_url').val(),
										limit: $('#preisagent_limit').val(),
										tab: $('#preisagent_tab').val(),
										name: '€ ' + $('#preisagent_limit').val() + ' "' + $('h1 span:first').text() + '"',
										aktiv: true
									};

									chrome.storage.sync.get('preisagenten', function(syncStorage) {
										var preisagenten = syncStorage['preisagenten'];

										for(var i = 0; i < preisagenten.length; i++) {
											if(preisagenten[i].tab == preisagent.tab && preisagenten[i].url == preisagent.url) {
												delete preisagenten[i];
												break;
											}
										}

										preisagenten.push(preisagent);
										chrome.storage.sync.set({'preisagenten': preisagenten});
									});

									$(this).dialog('close');
									div.dialog('destroy');
									div.remove();
								},
								Abbrechen: function() {
									$(this).dialog('close');
									div.dialog('destroy');
									div.remove();
								}
							}
						});
						div.dialog('open');
					});
				}
				$('#preistabs ul li:gt(' + eval(i+1) + '),#preistabs ul li:lt(' + eval(i+1) + ')').find('img').remove();

				if($('#preistab_inhalt' + i + ' #content_table').length > 0 || i < 0)
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

						if(tabs[i].beschreibungstext_kuerzen)
							$('#preistab_inhalt' + i + ' .ty2').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									beschreibungstext = value.html();
									var beschreibung_haendler = beschreibungstext.split("<p>")[0];
									beschreibung_haendler = beschreibung_haendler.replace(/\<br\>|\<wbr\>/g, ' ');
									return beschreibung_haendler + '<br>' + value.find('p b')[0].innerHTML;
								});
							});

						if(tabs[i].info_agb_link_ausblenden)
							$('#preistab_inhalt' + i + ' div.gh_hl1').remove();

						if(tabs[i].preisfeld_ausmisten) {
							$('#preistab_inhalt' + i + ' #content_table tr').find('td:first').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									value.attr('title', value.text());

									if(value.attr('colspan') == 5)
										return;

									var preis = value.find('span.price').clone();
									if(!tabs[i].kreditkartenlogos_ausblenden)
										var kkimg = value.find('p').last().clone();

									value.empty();
									if(typeof kkimg === 'undefined' || kkimg.length == 0 || /MwSt/.test(kkimg[0].innerText))
										return preis[0].outerHTML;
									else
										return preis[0].outerHTML + ' ' + kkimg[0].outerHTML;
								});
							});
							$('#preistab_inhalt' + i + ' #content_table tr th:first').css('width', '100px');
						}

						if(tabs[i].bewertungsinfo_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(3)').each(function(index, value) {

								tooltip_anhaengen(value, function(value) {
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
							$('#preistab_inhalt' + i + ' #content_table tr th:nth-child(3)').css('width', '120px');
						}

						if(tabs[i].lagerstand_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table .av_inl').css('height', 'auto');
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
							$('#preistab_inhalt' + i + ' #content_table tr.t1:first td:nth-child(4)').css('width', '90px');
						}

						if(tabs[i].haendlerlink_kuerzen) {
							$('#preistab_inhalt' + i + ' #content_table tr td:nth-child(2)').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
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

						$('#preistab_inhalt' + i + ' #content_table th:nth-child(2)').css('width', '160px');
						$('#preistab_inhalt' + i + ' #content_table tr.t1:first td:nth-child(2)').css('width', '160px');
						$('#preistab_inhalt' + i + ' #content_table tr.t1:first td:nth-child(1)').css('width', '70px');
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
		if(allgemein.standard_tab)
			$('#preistabs').tabs('option', 'active', allgemein.standard_tab + 1);
	});
});