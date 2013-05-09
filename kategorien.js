
$(function() {
	chrome.storage.sync.get(null, function(syncStorage) {
		var tabs = syncStorage['tabs'];
		var allgemein = syncStorage['allgemein'];
		var favoriten = syncStorage['favoriten'];
		var preisagenten = syncStorage['preisagenten'];

		if(/^(\/?|\/\w{2}\/?)$/.test(window.location.pathname)) {

			var div = $(document.createElement('div'));
			var divh = $(document.createElement('div'));

			div.addClass('ghinfobox');
			divh.addClass('ghinfoboxh');

			var img = $(document.createElement('img'));
			img.attr('src', 'chrome-extension://daefgmcpnmbecchplnffpgpjbcoppcne/images/preisagent_16.png');
			img.css('vertical-align', 'middle');
			divh.append(img);
			divh.append(' Preisagenten');
			div.append(divh);

			if ($.isEmptyObject(preisagenten)) {
				var p = $(document.createElement('p'));
				var b = $(document.createElement('b'));
				var a = $(document.createElement('a'));
				var img = $(document.createElement('img'));

				img.attr('src', 'chrome-extension://daefgmcpnmbecchplnffpgpjbcoppcne/images/preisagent_on.png');
				img.css('vertical-align', 'middle');
				b.html('Tabs ');
				a.html('benachrichtigt');
				a.attr('href', '#');
				a.click(function() {
					chrome.runtime.sendMessage({
						'typ': 'notification',
						'icon': 'preisagent_32.png',
						'titel': 'Preisagent Beispiel',
						'text': 'TV 55" 4711 im Tab "Versand" ist billiger geworden: € 555,55 statt € 565,--',
						'link': window.location.origin + window.location.pathname + '?cat=tvlcd'
					});
				});
				p.append('Füge ', b, img, ' zu den Preisagenten hinzu und du wirst über Preisänderungen ', a, '.');
				div.append(p);

			} else {
				for (var i in preisagenten) {
					var p = $(document.createElement('p'));
					var a = $(document.createElement('a'));
					var img = $(document.createElement('img'));
					var region = i.substring(0,2);
					var artikel = i.replace(/^.*_(\d+)_.*$/, '$1');
					var tab_id = i.replace(/^.*_(\d+)$/, '$1');

					img.attr('src', '../b/' + region + '.png');
					img.css('vertical-align', 'middle');
					a.html(preisagenten[i].titel);
					a.attr('href', window.location.origin + '/' + region + '/' + artikel);
					p.append(img, ' ', a, '<br>letzter Bestpreis € ' + preisagenten[i].preis/100 +
						' (' + preisagenten[i].haendler + ') in Tab "' + tabs[tab_id].tabname + '"');
					div.append(p);
				}
			}

			$('#gh_blah').prepend(div);

			var div = $(document.createElement('div'));
			var divh = $(document.createElement('div'));

			div.addClass('ghinfobox');
			divh.addClass('ghinfoboxh');

			var img = $(document.createElement('img'));
			img.attr('src', 'chrome-extension://daefgmcpnmbecchplnffpgpjbcoppcne/images/stern_hell.png');
			img.css('vertical-align', 'middle');
			divh.append(img);
			divh.append(' Favoriten');
			div.append(divh);

			if($.isEmptyObject(favoriten)) {
				var p = $(document.createElement('p'));
				var b = $(document.createElement('b'));
				b.html('Artikel');
				p.append('Füge ', b, ' zu den Favoriten hinzu um sie hier direkt auswählen zu können.');
				div.append(p);

			} else {
				for(var i in favoriten) {
					var a = $(document.createElement('a'));
					a.html(favoriten[i].titel);
					a.attr('href', './' + i);
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

			var div = $(document.createElement('div'));
			div.css('float', 'left');

			var button = $(document.createElement('button'));
			button.html('Suchbox Ein/Ausblenden');
			button.attr('id', 'suchbox_toggle');
			div.append(button);

			var button = $(document.createElement('button'));
			button.html('Filter Ein/Ausblenden');
			button.attr('id', 'filter_toggle');
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
			var input = $(document.createElement('input'));
			input.attr({
				'type': 'text',
				'id': 'kat_suche',
				'placeholder': 'Kategorien durchsuchen',
				'tabindex': '2'
			});

			var div = $(document.createElement('div'));
			div.append(input);
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
								return $(document.createElement('li')).append($(document.createElement('a')).append(ebene1[0].label +
										' &gt; ' + item.label)).appendTo(ul);
							} else {
								var ebene1_id = item.value.replace(/^(\d+).*$/, '$1');
								var ebene1 = $.grep(data, function(value) {
									return value.value == ebene1_id;
								});

								var ebene2_id = item.value.replace(/^(\d+_\d+).*$/, '$1');
								var ebene2 = $.grep(data, function(value) {
									return value.value == ebene2_id;
								});

								return $(document.createElement('li')).append($(document.createElement('a')).append(ebene1[0].label +
										' &gt; ' + ebene2[0].label +
										' &gt; ' + item.label)).appendTo(ul);
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
		}
	});
});