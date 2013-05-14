
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

function tooltip_anhaengen(value, richtung, aufraeumen) {
	value = $(value);

	var div = $(document.createElement('div'));
	div.html('<b>Originaltext</b>:<br><br>' + value.html());

	value.html(aufraeumen(value));

	var width;
	if(Math.floor(value.width()) < 80)
		width = 80;
	else
		width = Math.floor(value.width());

	div.css({
		'max-width': width + 'px',
		'overflow': 'hidden'
	});
	value.data('powertipjq', div);
	value.addClass('powerTip_' + richtung);
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
	var alter = Math.floor((datum_bis.getTime() - datum_von.getTime())/(1000*60));

	if(alter <= 0)
		return '< 1min';
	else if(alter < 60)
		return alter + 'min';
	else
		return Math.floor(alter/60) + 'h' + alter % 60;
}