function notify(request) {
	var notification = webkitNotifications.createNotification(
		'images/' + request.icon,
		request.titel,
		request.text
	);
	notification.onclick = function() {
		chrome.tabs.create({
			'url': request.link
		}, function(tab) {
			chrome.tabs.executeScript(tab.id, {
				code: 'function tab_aktivieren() { return ' + request.tab_id + ' }'
			});
		});
		this.close();
	};
	notification.show();
}

function init_settings() {
	chrome.storage.sync.get(null, function(syncStorage) {
		var preisagenten = syncStorage['preisagenten'];
		var favoriten = syncStorage['favoriten'];

		if(typeof preisagenten != 'object') {
			preisagenten = {};
			chrome.storage.sync.set({'preisagenten': preisagenten});
		}

		if(typeof favoriten != 'object') {
			favoriten = {};
			chrome.storage.sync.set({'favoriten': favoriten});
		}
	});
}

function open_options() {
	chrome.tabs.create({'url': chrome.extension.getURL('options.html')});
}

function check_preisagenten() {
	chrome.storage.sync.get('preisagenten', function(syncStorage) {

		var preisagenten = syncStorage['preisagenten'];

		if(!$.isEmptyObject(preisagenten)) {
			var delay_faktor = 0;
			for(i in preisagenten) {
				chrome.alarms.create('preisagent_check_' + i, {'delayInMinutes': delay_faktor / 30});
				delay_faktor++;
			}
		}
	});
}

chrome.alarms.onAlarm.addListener(function(alarm) {
	if(alarm.name == 'preisagent_check') {
		check_preisagenten();
	} else if(alarm.name.substring(0, 17) == 'preisagent_check_') {

		chrome.storage.sync.get(null, function(syncStorage) {

			var preisagenten = syncStorage['preisagenten'];
			var tabs = syncStorage['tabs'];

			var i = alarm.name.substring(17);
			var tab_id = i.replace(/^.*_(\d+)$/, '$1');
			var data = getvars_fuer_tab(tabs[tab_id]);

			var region = i.replace(/^(\w{2})_.*$/, '$1');
			var artikel = i.replace(/^.*_(\d+)_.*$/, '$1');
			var url = 'http://geizhals.' + region + '/' + artikel;

			$.ajax({
				url: url,
				data: data,
				dataType: 'html',
				cache: false,
				dataFilter: function(data) {
					return data.replace(/<img\b[^>]*>/ig, '');
				},
				success: function(data) {

					var preis_span = $('#content_table span.price:first', data);
					var preis, haendler;

					if(preis_span.length) {
						preis = parseInt($('#content_table span.price:first', data).text().replace(/,/, '').replace(/\-\-/, '00'), 10);
						haendler = $('#content_table tr.t1:first td:nth-child(2) a:first', data).text();
					} else {
						preis = '--';
						haendler = '--';
					}

					chrome.storage.sync.get('preisagenten', function(syncStorage) {
						var preisagenten = syncStorage['preisagenten'];
						preisagenten[i].preis = preis;
						preisagenten[i].haendler = haendler;
						preisagenten[i].uhrzeit = Date.now();
						chrome.storage.sync.set({'preisagenten': preisagenten});
					});

					if(preis != preisagenten[i].preis) {

						var text;
						if(typeof preis != 'number') {
							text = 'Kein Preis mehr gefunden im Tab "' + tabs[tab_id].tabname + '".\n\
								Vorher: € ' + preisagenten[i].preis/100 + ' (' + preisagenten[i].haendler + ')';
						} else if(typeof preisagenten[i].preis != 'number') {
							text = 'Preis gefunden im Tab "' + tabs[tab_id].tabname + '": € ' + preis/100 + ' (' + haendler + ')';
						} else {
							var differenz = Math.abs((preisagenten[i].preis - preis))/100;
							var aenderung;

							if(preis < preisagenten[i].preis)
								aenderung = ' gesunken';
							else
								aenderung = ' gestiegen';

							text = 'Preis ist im Tab "' + tabs[tab_id].tabname + '" um € ' + differenz + aenderung + '. \n\
								Vorher: € ' + preisagenten[i].preis/100 + ' (' + preisagenten[i].haendler + ') \n\
								Nachher: € ' + preis/100 + ' (' + haendler + ')';
						}

						notify({
							'typ': 'notification',
							'icon': 'preisagent_32.png',
							'titel': 'Preisagent für "' + preisagenten[i].titel + '"',
							'text': text,
							'link': url,
							'tab_id': tab_id
						});
					}
				}
			});
		});
	}
});

chrome.runtime.onMessage.addListener(function(request, sender) {

	if(request.typ == 'notification') {
		notify(request);
	} else if(request.typ == 'url_tab_aktivieren') {
		if(request.neues_chrome_tab)
			chrome.tabs.create({
				url: request.link,
				active: false,
				index: sender.tab.index + 1
			}, function(tab) {
				chrome.tabs.executeScript(tab.id, {
					code: 'function tab_aktivieren() { return ' + request.tab_id + ' }'
				});
			});
		else
			chrome.tabs.update({url: request.link}, function(tab) {
				chrome.tabs.executeScript(tab.id, {
					code: 'function tab_aktivieren() { return ' + request.tab_id + ' }'
				});
			});
	}
});

chrome.alarms.create('preisagent_check', {
	'delayInMinutes': 0,
	'periodInMinutes': 20
});

chrome.runtime.onInstalled.addListener(function() {
	init_settings();
	open_options();
});
