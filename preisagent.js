
function check_preisagenten() {
	chrome.storage.sync.get(null, function(syncStorage) {
		var preisagenten = syncStorage['preisagenten'];
		var tabs = syncStorage['tabs'];

		if(typeof preisagenten == 'undefined') {
			preisagenten = [];
			chrome.storage.sync.set({'preisagenten': preisagenten});
		} else if(preisagenten.length) {
			$(preisagenten).each(function(index, value) {
				if(value.aktiv)
					$.ajax({
						url: value.url,
						success: function(data) {
							var preis = parseFloat($('#content_table span.price', data).first().html().replace(/,/, '.'));
							if(preis < value.limit) {
								preisagenten[index].aktiv = false;
								chrome.storage.sync.set({'preisagenten': preisagenten});
								var notification = webkitNotifications.createNotification(
									'48.png',
									'Preisagent ' + tabs[value.tab].tabname,
									'Preis von ' + $('h1 span:first', data).text() + ' hat Limit unterschritten.\n\
									aktueller Bestpreis: € ' + preis + ' (Limit: € ' + value.limit + ')\n\
									Preisagent wird deaktiviert.'
								);
								notification.show();
							}
						}
					});
			});
		}
	});
}

check_preisagenten();
var timer = setInterval(check_preisagenten, 10*60*1000);

//notification.show();