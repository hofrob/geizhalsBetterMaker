
$(function() {
	chrome.storage.sync.get(null, function(syncStorage) {

		var allgemein = syncStorage['allgemein'];

		if(/cat=/.test(window.location.search)) {
			if(allgemein.kategoriesuchbox_ausblenden)
				$('#gh_filterbox div').first().hide();

			if(allgemein.kategoriefilter_ausblenden)
				$('#xf_div tr:not(:has(.xf_sel, .xf_msel))').hide();

			var div = $(document.createElement('div'))
					.css('float', 'left');

			var button = $(document.createElement('button'))
					.html('Suchbox Ein/Ausblenden')
					.attr('id', 'suchbox_toggle');

			div.append(button);

			var button = $(document.createElement('button'))
					.html('Filter Ein/Ausblenden')
					.attr('id', 'filter_toggle');

			div.append(button);

			$('#gh_content_table_container').prepend(div);

			$('#suchbox_toggle').click(function() {
				$('#gh_filterbox div').first().toggle();
			});

			$('#filter_toggle').click(function() {
				$('#xf_div tr:not(:has(.xf_sel, .xf_msel))').toggle();
			});
		}

		if(allgemein.kategorie_suchfeld) {
			var input = $(document.createElement('input'))
					.attr({
						type: 'text',
						id: 'kat_suche',
						placeholder: 'Kategorien durchsuchen',
						tabindex: '2'
					});

			var div = $(document.createElement('div'))
					.append(input);

			$('#gh_leftnav').prepend(div);

			$('#kat_suche').focus(function() {
				$.ajax({
					url: chrome.extension.getURL('kategorien.json'),
					dataType: 'json',
					success: function(data) {
						$('#kat_suche').autocomplete({
							source: data,
							minLength: 2,
							select: function(event, ui) {
								var kat;

								if(/^\d+_\d+_.+$/.test(ui.item.value)) {
									kat = ui.item.value.replace(/^\d+_\d+_(.+)$/, '$1');
									window.location = './?cat=' + kat;
								} else if(/^\d+_\d+$/.test(ui.item.value)) {
									kat = ui.item.value.replace(/^\d+_(\d+)$/, '$1');
									window.location = './?o=' + kat;
								} else if(/^\d+$/.test(ui.item.value)) {
									window.location = './?m=' + ui.item.value;
								}
								ui.item.value = ui.item.label;
							}
						}).data("ui-autocomplete")._renderItem = function(ul, item) {

							var ebene1_id,
								ebene1,
								ebene2_id,
								ebene2;

							if(/^\d+$/.test(item.value)) {

								return $(document.createElement('li'))
										.append($(document.createElement('a'))
										.append(item.label)).appendTo(ul);

							} else if(/^\d+_\d+$/.test(item.value)) {

								ebene1_id = item.value.replace(/^(\d+).*$/, '$1');
								ebene1 = $.grep(data, function(value) {
									return value.value == ebene1_id;
								});
								return $(document.createElement('li'))
										.append($(document.createElement('a'))
										.append(ebene1[0].label +
											' &gt; ' + item.label)).appendTo(ul);

							} else {

								ebene1_id = item.value.replace(/^(\d+).*$/, '$1');
								ebene1 = $.grep(data, function(value) {
									return value.value == ebene1_id;
								});

								ebene2_id = item.value.replace(/^(\d+_\d+).*$/, '$1');
								ebene2 = $.grep(data, function(value) {
									return value.value == ebene2_id;
								});

								return $(document.createElement('li'))
										.append($(document.createElement('a'))
										.append(ebene1[0].label +
											' &gt; ' + ebene2[0].label +
											' &gt; ' + item.label)).appendTo(ul);
							}
						};
					}
				});
			});
		}
	});
});