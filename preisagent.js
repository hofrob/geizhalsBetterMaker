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
	chrome.storage.sync.get(null, function(syncStorage) {

		var preisagenten = syncStorage['preisagenten'];
		var tabs = syncStorage['tabs'];

		if(!$.isEmptyObject(preisagenten)) {
			for(i in preisagenten) {
				(function(i) {
					var tab_id = i.replace(/^.*_(\d+)$/, '$1');
					var data = getvars_fuer_tab(tabs[tab_id]);

					var region = i.replace(/^(\w{2})_.*$/, '$1');
					var artikel = i.replace(/^.*_(\d+)_.*$/, '$1');
					var url = 'http://geizhals.' + region + '/' + artikel;

					$.ajax({
						url: url,
						data: data,
						dataType: 'html',
						success: function(data) {
							var preis = parseInt($('#content_table span.price:first', data).html().replace(/,/, '').replace(/\-\-/, '00'), 10);
							if(preis != preisagenten[i].preis) {

								var haendler = $('#content_table tr.t1:first td:nth-child(2) b', data).text();
								chrome.storage.sync.get('preisagenten', function(syncStorage) {
									var preisagenten = syncStorage['preisagenten'];
									preisagenten[i].preis = preis;
									preisagenten[i].haendler = haendler;
									chrome.storage.sync.set({'preisagenten': preisagenten});
								});

								var differenz = Math.abs((preisagenten[i].preis - preis))/100;

								if(preis < preisagenten[i].preis)
									aenderung = ' gesunken';
								else
									aenderung = ' gestiegen';

								notify({
									'typ': 'notification',
									'icon': 'preisagent_32.png',
									'titel': 'Preisagent für "' + preisagenten[i].titel + '"',
									'text': 'Preis ist im Tab "' + preisagenten[i].tabname + '" um € ' + differenz + aenderung + '. \n\
										Vorher: € ' + preisagenten[i].preis/100 + ' (' + preisagenten[i].haendler + ') \n\
										Nachher: € ' + preis/100 + ' (' + haendler + ')',
									'link': url,
									'tab_id': tab_id
								});
							}
						}
					});
				})(i);
			}
		}
	});
}

chrome.alarms.onAlarm.addListener(function(alarm) {
	if(alarm.name == 'preisagent_check') {
		check_preisagenten();
	}
});

chrome.runtime.onMessage.addListener(function(request, sender) {
	if(request.typ == 'notification') {
		notify(request);
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