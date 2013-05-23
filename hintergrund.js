function notify(request) {
	var notification = webkitNotifications.createNotification(
		'img/' + request.icon,
		request.titel,
		request.text
	);
	notification.onclick = function() {
		chrome.tabs.create({
			url: request.link
		}, function(tab) {
			chrome.tabs.executeScript(tab.id, {
				code: 'function tab_aktivieren() { return ' + request.tab_id + ' }'
			});
			chrome.windows.update(tab.windowId, {focused: true});
		});
		this.close();
	};
	notification.show();
}

function init_settings() {
	chrome.storage.sync.get(null, function(syncStorage) {
		var preisagenten = syncStorage['preisagenten'],
			favoriten = syncStorage['favoriten'],
			haendler = syncStorage['haendler'],
			haendler_ausblenden = syncStorage['haendler_ausblenden'];

		if(typeof preisagenten != 'object') {
			preisagenten = {};
			chrome.storage.sync.set({preisagenten: preisagenten});
		}

		if(typeof favoriten != 'object') {
			favoriten = {};
			chrome.storage.sync.set({favoriten: favoriten});
		}

		if(!$.isArray(haendler)) {
			haendler = [];
			chrome.storage.sync.set({haendler: haendler});
		}

		if(typeof haendler_ausblenden == 'object') {
			for(var haendlername in haendler_ausblenden) {
				if(typeof haendler_ausblenden[haendlername] == 'number') {
					haendler.push({
						name: haendlername,
						temp: true,
						typ: 2,
						zeit: haendler_ausblenden[haendlername]
					});
				} else {
					haendler.push({
						name: haendlername,
						temp: false,
						typ: 2,
						zeit: Date.now()
					});
				}
			}

			chrome.storage.sync.set({haendler: haendler});
			chrome.storage.sync.remove('haendler_ausblenden');
		}
	});
}

function open_options() {
	chrome.tabs.create({url: chrome.extension.getURL('options.html')});
}

function check_preisagenten() {
	chrome.storage.sync.get(null, function(syncStorage) {

		var preisagenten = syncStorage['preisagenten'],
			tabs = syncStorage['tabs'],
			haendler = syncStorage['haendler'];

		if(!$.isEmptyObject(preisagenten)) {
			for(var i in preisagenten) {
				(function(i) {
					setTimeout(function() {

						var tab_id = i.replace(/^.*_(\d+)$/, '$1'),
							data = getvars_fuer_tab(tabs[tab_id]),
							region = i.replace(/^(\w{2})_.*$/, '$1'),
							artikel = i.replace(/^.*_(\d+)_.*$/, '$1'),
							url = 'http://geizhals.' + region + '/' + artikel;

						$.ajax({
							url: url,
							data: data,
							dataType: 'html',
							cache: false,
							dataFilter: function(data) {
								return data.replace(/<img\b[^>]*>/ig, '');
							},
							success: function(data) {

								var zeilen = $('#content_table tr.t1, #content_table tr.t2', data),
									bestpreis;

								for(var j = 0; j < zeilen.length; j++) {
									var ignore = 0 < $.grep(haendler, function(e) {
										return $('td:nth-child(2) a:first', zeilen[j]).text() == e.name && e.typ > 1;
									}).length;
									if(ignore)
										continue;
									bestpreis = zeilen[j];
									break;
								}

								var preis_span = $('span.price', bestpreis),
									preis,
									haendlername;

								if(preis_span.length) {
									preis = parseInt(preis_span.text().replace(/,/, '').replace(/\-\-/, '00'), 10);
									haendlername = $('td:nth-child(2) a:first', bestpreis).text();
								} else {
									preis = '--';
									haendlername = '--';
								}

								chrome.storage.sync.get('preisagenten', function(syncStorage) {
									var preisagenten = syncStorage['preisagenten'];
									preisagenten[i].preis = preis;
									preisagenten[i].haendler = haendlername;
									preisagenten[i].uhrzeit = Date.now();
									chrome.storage.sync.set({preisagenten: preisagenten});
								});

								if(preis != preisagenten[i].preis) {

									var text;

									if(typeof preis != 'number') {
										text = 'Kein Preis mehr gefunden im Tab "' + tabs[tab_id].tabname + '".\n\
											Vorher: € ' + preisagenten[i].preis/100 + ' (' + preisagenten[i].haendler + ')';
									} else if(typeof preisagenten[i].preis != 'number') {
										text = 'Preis gefunden im Tab "' + tabs[tab_id].tabname + '": € ' + preis/100 + ' (' + haendlername + ')';
									} else {
										var differenz = Math.abs((preisagenten[i].preis - preis))/100,
											aenderung;

										if(preis < preisagenten[i].preis)
											aenderung = ' gesunken';
										else
											aenderung = ' gestiegen';

										text = 'Preis ist im Tab "' + tabs[tab_id].tabname + '" um € ' + differenz + aenderung +
												'. Vorher: € ' + preisagenten[i].preis/100 + ' (' + preisagenten[i].haendler +
												') Nachher: € ' + preis/100 + ' (' + haendlername + ')';
									}

									notify({
										typ: 'notification',
										icon: 'preisagent_32.png',
										titel: 'Preisagent für "' + preisagenten[i].titel + '"',
										text: text,
										link: url,
										tab_id: tab_id
									});
								}
							}
						});
					}, Math.floor(Math.random()*60*1000));
				}(i));
			}
		}
	});
}

function zeilen_check() {
	chrome.storage.sync.get('haendler', function(syncStorage) {
		var haendler = syncStorage['haendler'];

		for(var i = 0; i < haendler.length; i++) {
			if(haendler[i].temp && Date.now()-4*60*60*1000 > haendler[i].zeit)
				delete haendler[i];
		}

		chrome.storage.sync.set({haendler: haendler}, function() {
			chrome.runtime.sendMessage({typ: 'zeilen_einausblenden'});
		});
	});
}

chrome.alarms.onAlarm.addListener(function(alarm) {
	if(alarm.name == 'preisagent_check') {
		check_preisagenten();
	} else if(alarm.name == 'zeilen_check') {
		zeilen_check();
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
	} else if(request.typ == 'zeilen_einausblenden') {
		chrome.tabs.query({url: '*://*.geizhals.at/*'}, function(tabs) {
			for(var i = 0; i < tabs.length; i++) {
				chrome.tabs.executeScript(tabs[i].id, {
					code: 'zeilen_einausblenden();'
				});
			}
		});
		chrome.tabs.query({url: '*://*.geizhals.eu/*'}, function(tabs) {
			for(var i = 0; i < tabs.length; i++) {
				chrome.tabs.executeScript(tabs[i].id, {
					code: 'zeilen_einausblenden();'
				});
			}
		});
		chrome.tabs.query({url: '*://*.geizhals.de/*'}, function(tabs) {
			for(var i = 0; i < tabs.length; i++) {
				chrome.tabs.executeScript(tabs[i].id, {
					code: 'zeilen_einausblenden();'
				});
			}
		});
	}
});

chrome.alarms.create('preisagent_check', {
	delayInMinutes: 2,
	periodInMinutes: 10
});

chrome.alarms.create('zeilen_check', {
	periodInMinutes: 5
});

chrome.runtime.onInstalled.addListener(function() {
	init_settings();
	open_options();
});
