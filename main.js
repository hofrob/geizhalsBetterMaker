function datum_string(date) {
	return ('0'+date.getDate()).slice(-2) + '.' +
			('0'+(parseInt(date.getMonth(), 10)+1)).slice(-2) + '.' +
			date.getFullYear() + ' ' +
			('0'+date.getHours()).slice(-2) + ':' +
			('0'+date.getMinutes()).slice(-2) + ':' +
			('0'+date.getSeconds()).slice(-2);
}

function get_region(src) {

	var aktive_flagge;

	if(arguments.length == 1)
		aktive_flagge = src;
	else if($('#gh_flags_search').children('img').length == 1)
		aktive_flagge = $('#gh_flags_search').children('img').attr('src');
	else
		return 'eu';

	if(/austria\.gif/.test(aktive_flagge) || /at\.png$/.test(aktive_flagge))
		return 'at';

	else if(/germany\.gif/.test(aktive_flagge) || /de\.png$/.test(aktive_flagge))
		return 'de';

	else if(/UK\.gif/.test(aktive_flagge) || /uk\.png$/.test(aktive_flagge))
		return 'uk';

	else if(/pol\.gif/.test(aktive_flagge) || /pl\.png$/.test(aktive_flagge))
		return 'pl';

	// Fallback: EU
	return 'eu';
}

function tooltip_anhaengen(value, settings, aufraeumen) {
	value = $(value);

	var div = $(document.createElement('div'))
			.html('<b>Originaltext</b>:<br><br>' + value.html());

	value.html(aufraeumen(value));

	var width;
	if(Math.floor(value.width()) < 80)
		width = 80;
	else
		width = Math.floor(value.width());

	div.css({
		'max-width': width + 'px',
		overflow: 'hidden'
	});
	value.data('powertipjq', function() {
		if(typeof settings.processTooltip == 'function')
			return settings.processTooltip(div);
		else
			return div;
	});
	value.addClass('powerTip_' + settings.richtung);
}

function getvars_fuer_tab(tab) {
	var data = {
		t: tab.bezugsart[0]
	};

	if(tab.bezugsart == 'versand') {
		data.vl = tab.loc;
		data.va = 'b';
	} else if(tab.bezugsart == 'abholung') {
		data.plz = tab.loc;
	}

	if(tab.verfuegbarkeit == 'beliebig') {
		data.v = 'e';
	} else {
		data.v = tab.verfuegbarkeit[0];
	}

	return data;
}

function errechne_alter(datum_string) {

	var datum_von;

	if(datum_string instanceof Date) {
		datum_von = datum_string;
	} else {
		var werte = datum_string.
				replace(/.*(\d{2})\.(\d{2})\.(\d{4}).*(\d{2}).(\d{2}).(\d{2}).*$/,
					'$1 $2 $3 $4 $5 $6').split(' ');

		datum_von = new Date(werte[2], werte[1]-1, werte[0], werte[3], werte[4], werte[5]);
	}

	var datum_bis = new Date();
	var alter = Math.floor(Math.abs(datum_bis.getTime() - datum_von.getTime())/(1000*60));

	if(alter <= 0)
		return '< 1min';
	else if(alter < 60)
		return alter + 'min';
	else
		return Math.floor(alter/60) + 'h' + alter % 60;
}

function zeilen_einausblenden() {

	chrome.storage.sync.get('haendler', function(syncStorage) {

		var haendler = syncStorage['haendler'];

		$('#preistabs tr.t1, #preistabs tr.t2').each(function(index, value) {

			var haendlername = $('td:nth-child(2) a:first', value).text(),
				region = get_region($('td:nth-child(2) img:first', value).attr('src')),
				h = $.grep(haendler, function(e) {
						return e.name == haendlername && e.typ < 3;
					}),
				r = $.grep(haendler, function(e) {
						return e.name == region && e.typ == 3;
					}),
				ausblendtext = ['ausgeblendet:'];

			if(h.length == 0 && r.length == 0) {
				if($(value).hasClass('haendler_ausblenden'))
					$(value).removeClass('haendler_ausblenden').next().remove();
				else if($(value).hasClass('haendler_hervorheben'))
					$(value).removeClass('haendler_hervorheben');
				return;
			}

			if(h.length && h[0].typ == 1) {

				if($(value).hasClass('haendler_ausblenden'))
					$(value).removeClass('haendler_ausblenden').next().remove();

				$(value).addClass('haendler_hervorheben');
				return;
			}

			if(h.length) {
				ausblendtext.push(h[0].name);
				if(h[0].temp) {
					var bis = new Date(h[0].zeit + 4*60*60*1000),
						span = $(document.createElement('span'))
								.attr('title', datum_string(bis))
								.addClass('ghbm_zeit')
								.html(errechne_alter(bis));

					ausblendtext.push('(noch ' + span[0].outerHTML + ')');
				} else {
					ausblendtext.push('(seit ' + datum_string(new Date(h[0].zeit)).slice(0,10) + ')');
				}
			}

			if(get_region() == 'eu' && r.length) {
				if(h.length == 0)
					ausblendtext.push(haendlername);

				ausblendtext.push('Region ' + r[0].name.toUpperCase());

				if(r[0].temp) {
					var bis = new Date(r[0].zeit + 4*60*60*1000),
						span = $(document.createElement('span'))
								.attr('title', datum_string(bis))
								.addClass('ghbm_zeit')
								.html(errechne_alter(bis));

					ausblendtext.push('(noch ' + span[0].outerHTML + ')');
				} else {
					ausblendtext.push('(seit ' + datum_string(new Date(r[0].zeit)).slice(0,10) + ')');
				}
			}

			if(h.length || get_region() == 'eu' && r.length) {
				var small = $(document.createElement('small')).append(ausblendtext.join(' ')),
					td = $(document.createElement('td'))
						.attr('colspan', '5')
						.append(small),
					tr = $(document.createElement('tr'))
						.append(td)
						.css('border', '1px solid black');

				if($(value).hasClass('haendler_ausblenden'))
					$(value).next().html(td);
				else
					$(value).addClass('haendler_ausblenden').after(tr);
			}
		});
	});
}

function content_table_bearbeiten(tab_settings, content_table_rows) {

	if(tab_settings.spaltenueberschriften_ausblenden)
		$('tr.tr1').remove();

	if(tab_settings.vkinfo_ausblenden && tab_settings.lagerstand_kuerzen) {
		$('td:nth-child(4)', content_table_rows).each(function(i, value) {

			if($(value).attr('colspan') == 5)
				return;

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
	} else if(tab_settings.vkinfo_ausblenden) {
		$('div.vk_inl', content_table_rows).each(function(i, value) {
			tooltip_anhaengen(value, {richtung:'e'}, function() {
				return 'Versandkosten';
			});
		});
	} else if(tab_settings.lagerstand_kuerzen) {
		$('div.av_l', content_table_rows).each(function(i, value) {
			tooltip_anhaengen(value, {richtung:'e'}, function() {
				return 'lagernd';
			});
		});
		$('div.av_k', content_table_rows).each(function(i, value) {
			tooltip_anhaengen(value, {richtung:'e'}, function() {
				return 'bis 4 Werktage';
			});
		});
		$('div.av_e', content_table_rows).each(function(i, value) {
			tooltip_anhaengen(value, {richtung:'e'}, function() {
				return '4+ Werktage';
			});
		});
	}


	if(tab_settings.preisfeld_ausmisten && tab_settings.beschreibungstext_kuerzen)
		var preis_von = [];

	if(tab_settings.beschreibungstext_kuerzen)
		$('.ty2', content_table_rows).each(function(i, value) {
			tooltip_anhaengen(value, {richtung:'s'}, function(value) {

				var beschreibung_haendler = value.html().split("<p>")[0]
						.replace(/\<br\>|\<wbr\>/g, ' ')
						.substring(0,250);

				if(tab_settings.preis_vom_zeitdifferenz) {
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

	if(tab_settings.preisfeld_ausmisten)
		$('td:nth-child(1)', content_table_rows).each(function(i, value) {

			if($(value).attr('colspan') == 5)
				return;

			tooltip_anhaengen(value, {richtung:'w'}, function(value) {

				var preis = value.find('span.price').clone(),
					kkimg;

				if(!tab_settings.kreditkartenlogos_ausblenden)
					kkimg = value.find('p').last().clone();

				value.empty();

				var stand = '';
				if(tab_settings.preis_vom_zeitdifferenz)
					stand = preis_von.shift();

				if(typeof kkimg === 'undefined' || kkimg.length == 0 || /MwSt/.test(kkimg[0].innerText))
					return preis[0].outerHTML + '<br>' + stand;
				else
					return preis[0].outerHTML + '<br>' + stand + ' ' + kkimg[0].outerHTML;
			});
		});

	if(tab_settings.bewertungsinfo_kuerzen)
		$('td:nth-child(3)', content_table_rows).each(function(i, value) {

			if($(value).attr('colspan') == 5)
				return;

			tooltip_anhaengen(value, {richtung:'e'}, function(value) {

				var div_helper = $(document.createElement('div'));

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

	if(tab_settings.haendlerlink_kuerzen) {
		$('td:nth-child(2)', content_table_rows).each(function(i, value) {

			if($(value).attr('colspan') == 5)
				return;

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

						var haendler = syncStorage['haendler'],
							art = $(e.target).attr('data-ausblendart').split('_'),
							temp = art[0] == 't',
							typ = parseInt(art[1], 10),
							name = art[1] == 3 ? get_region($('img:first', value).attr('src')) : haendlername,
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

				if(!tab_settings.info_agb_link_ausblenden)
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
}