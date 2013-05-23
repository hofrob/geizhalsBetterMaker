$(function() {

	if(!/^(\/?|\/\w{2}\/?)$/.test(window.location.pathname))
		return;

	chrome.storage.sync.get(null, function(syncStorage) {

		var tabs = syncStorage['tabs'],
			favoriten = syncStorage['favoriten'],
			preisagenten = syncStorage['preisagenten'],
			img = $(document.createElement('img'))
				.attr('src', chrome.extension.getURL('img/preisagent_16.png'))
				.css('vertical-align', 'middle'),
			divh = $(document.createElement('div')).addClass('ghinfoboxh').append(img, ' Preisagenten'),
			div = $(document.createElement('div')).addClass('ghinfobox').append(divh);

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
					.attr('src', chrome.extension.getURL('img/preisagent_on.png'))
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
				.attr('src', chrome.extension.getURL('img/stern_hell.png'))
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
	});
});