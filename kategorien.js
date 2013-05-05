
$(function() {
	chrome.storage.sync.get(null, function(syncStorage) {
		allgemein = syncStorage['allgemein'];
		if(allgemein.kategorie_suchfeld)
			$.ajax({
				url: 'chrome-extension://daefgmcpnmbecchplnffpgpjbcoppcne/kategorien.json',
				dataType: 'json',
				success: function(data) {
					input = $(document.createElement('input'));
					input.attr({
						'type': 'text',
						'id': 'kat_suche'
					});
					div = $(document.createElement('div'));
					div.append(input);
					$('#gh_leftnav').prepend(div);
					$('#kat_suche').autocomplete({
						source: data,
						select: function(event, ui) {
							if(/^\d+_\d+_.+$/.test(ui.item.value)) {
								var kat = ui.item.value.replace(/^\d+_\d+_(.+)$/, '$1');
								window.location = './?cat=' + kat;
							} else if(/^\d+_\d+$/.test(ui.item.value)) {
								var kat = ui.item.value.replace(/^\d+_(\d+)$/, '$1');
								window.location = './?o=' + kat;
							} else if(/^\d+$/.test(ui.item.value)) {
								window.location = './?m=' + ui.item.value;
							}
							ui.item.value = ui.item.label;
						}
					});
				}
			});
	});
});