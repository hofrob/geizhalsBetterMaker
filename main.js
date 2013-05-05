var dev = false;

chrome.storage.sync.get('dev', function(syncStorage) {
	if(syncStorage.dev)
		dev = syncStorage.dev;
});

function tooltip_anhaengen(value, aufraeumen) {
	value = $(value);

	var div = $(document.createElement('div'));
	div.css('display', 'none');
	div.addClass('original_content');
	div.html('<b>Originaltext</b>:<br>' + $(value).html());

	$(value).html(aufraeumen(value));

	$(value).append(div);
	$(value).addClass('tooltip');
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