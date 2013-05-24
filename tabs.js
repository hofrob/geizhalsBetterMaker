$(function() {

	if(!/a\d+\.html/i.test(window.location.pathname))
		return;

	if(window.location.search || window.location.hash) {

		var a = $(document.createElement('a'))
				.addClass('ntd')
				.attr('href', window.location.pathname)
				.html('BetterMaker Tabs'),
			span = $(document.createElement('span'))
				.addClass('monav')
				.css('font-weight', 'bold')
				.append(a);

		$('#monav span:first').after(span);
		return;
	}

	setInterval(function() {
		$('.ghbm_zeit').each(function(index, value) {
			$(value).html(errechne_alter($(value).attr('title')));
		});
	}, 60*1000);

	chrome.storage.sync.get(null, function(syncStorage) {
		var tabs = syncStorage['tabs'],
			standard_tab = syncStorage['standard_tab'],
			artikel = window.location.pathname.replace(/^.*a(\d+)\.html.*$/i, '$1');

		if(!tabs)
			return;

		$('#gh_afilterbox, #content_table, [name="filterbox"], #gh_content_wrapper > div.blaettern').wrapAll('<div id="allepreise" />');
		$('#allepreise').wrapAll('<div id="preistabs" />');
		$('#preistabs').prepend('<ul><li><a href="#allepreise">Alle Preise</a></li></ul>');

		for(var i = 0; i < tabs.length; i++) {
			$('#preistabs ul').append('<li><a href="#preistab_inhalt' + i + '">' + tabs[i].tabname + '&nbsp;</a></li>');
			$('#preistabs').append('<div id="preistab_inhalt' + i + '" />');
		}

		$('#preistabs').tabs({
			activate: function() {

				var i = $('#preistabs').tabs("option", "active") - 1;

				$('#preisagent').remove();
				if(i < 0)
					return;

				chrome.storage.sync.get('preisagenten', function(syncStorage) {

					var preisagenten = syncStorage['preisagenten'],
						div = $(document.createElement('div'))
								.attr('id', 'preisagent')
								.data({tab: i});

					if(preisagenten[get_region() + '_' + artikel + '_' + i])
						div.addClass('aktiv');

					$('#preistabs ul li:nth-child(' + eval(i+2) + ') a').append(div);

					$('#preisagent').click(function() {
						$('#preisagent').toggleClass('aktiv');
						chrome.storage.sync.get('preisagenten', function(syncStorage) {

							var preisagenten = syncStorage['preisagenten'],
								tab_id = $('#preisagent').data().tab;

							if($('#preisagent.aktiv').length) {

								var preis_span = $('#preistab_inhalt' + tab_id + ' tr:not(.haendler_ausblenden) span.price:first'),
									preis,
									haendler;

								if(preis_span.length) {
									preis = parseInt($('#preistab_inhalt' + tab_id + ' tr:not(.haendler_ausblenden) span.price:first')
											.text().replace(/,/, '').replace(/\-\-/, '00'), 10);
									haendler = $('#preistab_inhalt' + tab_id + ' #content_table tr:not(.haendler_ausblenden) td:nth-child(2) a:first').text();
								} else {
									preis = '--';
									haendler = '--';
								}

								preisagenten[get_region() + '_' + artikel + '_' + tab_id] = {
									titel: $('h1 span:first').text(),
									preis: preis,
									haendler: haendler,
									uhrzeit: Date.now()
								};
								chrome.storage.sync.set({preisagenten: preisagenten});
							} else {
								delete preisagenten[preisagent_index = get_region() + '_' + artikel + '_' + tab_id];
								chrome.storage.sync.set({preisagenten: preisagenten});
							}
						});
					});
				});

				if($('#preistab_inhalt' + i + ' #content_table').length > 0)
					return;

				var getvars = getvars_fuer_tab(tabs[i]);

				$.ajax({
					data: getvars,
					dataType: 'html',
					success: function(data) {

						var important = $('#gh_important', data);
						if(important.length) {
							$('#preistab_inhalt' + i).append(important);
							return;
						}

						/* [name="filterbox"] enthaelt script tag mit javascript call der uncaught reference error verursacht
						 * $('[name="filterbox"]', data).find('script').remove() funktioniert nicht
						 */
						$('#gh_afilterbox, #content_table, #gh_content_wrapper > h3', data)
								.appendTo('#preistab_inhalt' + i);

						if($('span.blaettern:first').length) {
							var letzte_seite = $('span.blaettern:first a:eq(-2)').text(),
								button = $(document.createElement('button'))
									.html('Seite 2/' + letzte_seite + ' laden')
									.attr({
										id: 'endloser_geizhals',
										'data-naechste-seite': '2'
									})
									.click(function(e) {
										$('#endloser_geizhals').hide();
										getvars.pg = parseInt($(e.target).closest('button').attr('data-naechste-seite'), 10);
										$.ajax({
											data: getvars,
											dataType: 'html',
											success: function(data) {
												var neue_zeilen = $('#preistab_inhalt' + i + ' #content_table tr:last').index();
												$('#preistab_inhalt' + i + ' #content_table tbody').append($('#content_table tbody', data).html());
												content_table_bearbeiten(tabs[i], $('#preistab_inhalt' + i + ' #content_table tr:gt(' + neue_zeilen + ')'));
												zeilen_einausblenden();

												if(getvars.pg < parseInt(letzte_seite,10))
													$('#endloser_geizhals')
														.attr('data-naechste-seite', (getvars.pg+1).toString())
														.html('Seite ' + (getvars.pg+1).toString() + '/' + letzte_seite + ' laden')
														.show();
												else
													$('#endloser_geizhals').remove();
											}
										});
									})
									.button();

							$('#preistab_inhalt' + i + ' #content_table').after('<br>', button);
						}

						content_table_bearbeiten(tabs[i], $('#preistab_inhalt' + i + ' #content_table tr'));

						zeilen_einausblenden();

						if(tabs[i].filterbox_ausblenden)
							$('#preistab_inhalt' + i + ' #gh_afilterbox').hide();
					}
				});

			}
		});
		if(typeof tab_aktivieren == 'function')
			$('#preistabs').tabs('option', 'active', tab_aktivieren() + 1);
		else if(typeof standard_tab != 'undefined')
			$('#preistabs').tabs('option', 'active', standard_tab + 1);
	});
});