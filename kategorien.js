
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
						'id': 'kat_suche',
						'placeholder': 'Kategorien durchsuchen'
					});
					div = $(document.createElement('div'));
					div.append(input);
					$('#gh_leftnav').prepend(div);
					$('#kat_suche').autocomplete({
						source: data,
						minLength: 2,
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
					}).data("ui-autocomplete")._renderItem = function(ul, item) {

						if(/^\d+$/.test(item.value)) {
							return $(document.createElement('li')).append($(document.createElement('a')).append(item.label)).appendTo(ul);
						} else if(/^\d+_\d+$/.test(item.value)) {
							var ebene1_id = item.value.replace(/^(\d+).*$/, '$1');
							var ebene1 = $.grep(data, function(value) {
								return value.value == ebene1_id;
							});
							return $(document.createElement('li')).append($(document.createElement('a')).append(ebene1[0].label + ' &gt; ' + item.label)).appendTo(ul);
						} else {
							var ebene1_id = item.value.replace(/^(\d+).*$/, '$1');
							var ebene1 = $.grep(data, function(value) {
								return value.value == ebene1_id;
							});

							var ebene2_id = item.value.replace(/^(\d+_\d+).*$/, '$1');
							var ebene2 = $.grep(data, function(value) {
								return value.value == ebene2_id;
							});

							return $(document.createElement('li')).append($(document.createElement('a')).append(ebene1[0].label + ' &gt; ' + ebene2[0].label + ' &gt; ' + item.label)).appendTo(ul);
						}
					};
					$('.ui-autocomplete').css({
						'max-height': '600px',
						'overflow-y': 'auto',
						'overflow-x': 'hidden'
					});
				}
			});
	});
});