
function get_region() {

	if($('#gh_flags_search').children('img').length == 1) {

		var aktive_flagge = $('#gh_flags_search').children('img').attr('src');

		if(/austria\.gif/.test(aktive_flagge))
			return 'at';

		else if(/germany\.gif/.test(aktive_flagge))
			return 'de';

		else if(/UK\.gif/.test(aktive_flagge))
			return 'uk';

		else if(/pol\.gif/.test(aktive_flagge))
			return 'pl';
	}

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

function haendler_ausblenden() {

	chrome.storage.sync.get('haendler_ausblenden', function(syncStorage) {
		var haendler_ausblenden = syncStorage['haendler_ausblenden'];

		for(var haendlername in haendler_ausblenden) {
			(function(haendlername) {

				$('#preistabs tr.t1, #preistabs tr.t2').each(function(index, value) {
					if($('td:nth-child(2) a:first', value).text() == haendlername && !$(value).hasClass('haendler_ausblenden')) {
						$(value).addClass('haendler_ausblenden');

						var a = $(document.createElement('a'))
								.html('einblenden')
								.attr({
									href: '#',
									onClick: 'return false;',
									title: haendlername
								})
								.click(function(e) {
									chrome.storage.sync.get('haendler_ausblenden', function(syncStorage) {

										var haendler_ausblenden = syncStorage['haendler_ausblenden'];
										delete haendler_ausblenden[$(e.target).attr('title')];

										chrome.storage.sync.set({haendler_ausblenden: haendler_ausblenden}, function() {
											chrome.runtime.sendMessage({typ: 'haendler_einblenden'});
										});
									});
								});

						var small = $(document.createElement('small'));

						var ausblendart;
						if(typeof haendler_ausblenden[haendlername] == 'number') {

							var bis = new Date(haendler_ausblenden[haendlername] + 4*60*60*1000);
							var bis_string = ('0'+bis.getDate()).slice(-2) + '.' +
									('0'+(parseInt(bis.getMonth(), 10)+1)).slice(-2) + '.' +
									bis.getFullYear() + ' ' +
									('0'+bis.getHours()).slice(-2) + ':' +
									('0'+bis.getMinutes()).slice(-2) + ':' +
									('0'+bis.getSeconds()).slice(-2);

							ausblendart = '(noch <span title="' + bis_string + '">' + errechne_alter(new Date(bis)) + '</span>)';
						} else {
							ausblendart = '(permanent)';
						}

								small.append('ausgeblendet: ' + haendlername + ' ' + ausblendart + ' ', a);
						var td = $(document.createElement('td'))
								.attr('colspan', '5')
								.append(small),
							tr = $(document.createElement('tr'))
								.html(td)
								.css('border', '1px solid black');

						$(value).after(tr);
					}
				});
			})(haendlername);
		}
	});
}

function haendler_einblenden() {
	chrome.storage.sync.get('haendler_ausblenden', function(syncStorage) {
		var haendler_ausblenden = syncStorage['haendler_ausblenden'];

		for(var i = 0; i < 6; i++) {
			$('#preistab_inhalt' + i + ' tr.t1, #preistab_inhalt' + i + ' tr.t2').each(function(index, value) {
				if(typeof haendler_ausblenden[$('td:nth-child(2) a:first', value).text()] == 'undefined'
						&& $(value).hasClass('haendler_ausblenden')) {

					$(value).removeClass('haendler_ausblenden').next().remove();
				}

			});
		}
	});
}