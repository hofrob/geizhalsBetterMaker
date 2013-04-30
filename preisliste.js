$(function() {
	chrome.storage.sync.get(null, function(syncStorage) {

		var allgemein = syncStorage['allgemein'];
		console.log($('#img_btns').find('a').attr('href'));
		if($('#img_btns').length && allgemein.bilder_gallerie) {
			$.ajax({
				dataType: 'html',
				url: $('#img_btns').find('a').attr('href'),
				success: function(data) {
						console.log(data);
				}
			});
		}
	});
});