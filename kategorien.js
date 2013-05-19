
$(function() {
	chrome.storage.sync.get(null, function(syncStorage) {

		var tabs = syncStorage['tabs'],
			allgemein = syncStorage['allgemein'],
			favoriten = syncStorage['favoriten'],
			preisagenten = syncStorage['preisagenten'];

		if(/^(\/?|\/\w{2}\/?)$/.test(window.location.pathname)) {

			var div = $(document.createElement('div')).addClass('ghinfobox'),
				divh = $(document.createElement('div')).addClass('ghinfoboxh'),
				img = $(document.createElement('img'))
					.attr('src', 'chrome-extension://daefgmcpnmbecchplnffpgpjbcoppcne/img/preisagent_16.png')
					.css('vertical-align', 'middle');

			divh.append(img, ' Preisagenten');
			div.append(divh);

			if($.isEmptyObject(preisagenten)) {
				var p = $(document.createElement('p')),
					a = $(document.createElement('a'))
						.html('benachrichtigt')
								.attr('href', '#')
								.click(function() {
									chrome.runtime.sendMessage({
										typ: 'notification',
										icon: 'preisagent_32.png',
										titel: 'Preisagent Beispiel',
										text: 'TV 55" 4711 im Tab "Versand" ist billiger geworden: € 555,55 statt € 565,--',
										link: window.location.origin + window.location.pathname + '?cat=tvlcd'
									});
								}),
					img = $(document.createElement('img'))
						.attr('src', 'chrome-extension://daefgmcpnmbecchplnffpgpjbcoppcne/img/preisagent_on.png')
						.css('vertical-align', 'middle');


				p.append('Füge <strong>Tabs</strong> ', img, ' zu den Preisagenten hinzu und du wirst über Preisänderungen ', a, '.');
				div.append(p);

			} else {
				for(var i in preisagenten) {
					(function(i) {
						var p,
							region = i.substring(0,2),
							artikel = i.replace(/^.*_(\d+)_.*$/, '$1'),
							tab_id = i.replace(/^.*_(\d+)$/, '$1'),
							preis;

						if(typeof preisagenten[i].preis == 'number')
							preis = preisagenten[i].preis/100;
						else
							preis = '--';

						var selber_artikel = $('[data-artikel=' + region + '_' + artikel + ']', div);

						if(selber_artikel.length) {
							p = selber_artikel.closest('p');
						} else {
							var a = $(document.createElement('a')),
								img = $(document.createElement('img'));

							img.attr('src', '../b/' + region + '.png')
									.css('vertical-align', 'middle');
							a.html(preisagenten[i].titel)
									.attr({
										href: window.location.origin + '/' + region + '/' + artikel,
										'data-artikel': region + '_' + artikel
									});

							p = $(document.createElement('p'));
							p.append(img, ' ', a);
						}

						p.append('<br>vor ' + errechne_alter(new Date(preisagenten[i].uhrzeit)) + ' <strong>€ ' + preis +
								'</strong> (' + preisagenten[i].haendler + ') in <strong>' + tabs[tab_id].tabname + '</strong>');
						div.append(p);

					})(i);
				}
			}

			$('#gh_blah').prepend(div);

			var div = $(document.createElement('div')).addClass('ghinfobox'),
				divh = $(document.createElement('div')).addClass('ghinfoboxh');

			var img = $(document.createElement('img'))
					.attr('src', 'chrome-extension://daefgmcpnmbecchplnffpgpjbcoppcne/img/stern_hell.png')
					.css('vertical-align', 'middle');

			divh.append(img, ' Favoriten');
			div.append(divh);

			if($.isEmptyObject(favoriten)) {
				var p = $(document.createElement('p'))
						.append('Füge <strong>Artikel</strong> zu den Favoriten hinzu um sie hier direkt auswählen zu können.');
				div.append(p);

			} else {
				for(var i in favoriten) {

					var a = $(document.createElement('a'))
							.html(favoriten[i].titel)
							.attr('href', './' + i);

					div.append(a, '<br>');
				}
			}

			$('#gh_blah').prepend(div);
		}

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
					url: 'chrome-extension://daefgmcpnmbecchplnffpgpjbcoppcne/kategorien.json',
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