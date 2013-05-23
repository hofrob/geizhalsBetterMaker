function datum_string(date) {
	return ('0'+date.getDate()).slice(-2) + '.' +
			('0'+(parseInt(date.getMonth(), 10)+1)).slice(-2) + '.' +
			date.getFullYear() + ' ' +
			('0'+date.getHours()).slice(-2) + ':' +
			('0'+date.getMinutes()).slice(-2) + ':' +
			('0'+date.getSeconds()).slice(-2);
}

function get_region(img) {

	var aktive_flagge;

	if(arguments.length == 1 && img.length == 1)
		aktive_flagge = img.attr('src');
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
				region = get_region($('td:nth-child(2) img:first', value)),
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

			if(r.length) {
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

			if(h.length || r.length) {
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