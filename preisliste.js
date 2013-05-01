$(function() {
	chrome.storage.sync.get(null, function(syncStorage) {

		var allgemein = syncStorage['allgemein'];
		var artikel = $(location).attr('pathname').replace(/.*a(\d+)\.html.*/i, '$1');

		if($('#img_btns').length && allgemein.bilder_gallerie) {
			$.ajax({
				dataType: 'html',
				data: {morepix: artikel},
				url: window.location.origin,
				success: function(data) {
					var gallery = $(document.createElement('div'));
					gallery.attr('id', 'ghgallery');
					$('div.morepix', data).each(function(index, value) {
						var a = $(document.createElement('a'));
						a.addClass('fancybox');
						a.attr('href', $(value).find('img').attr('src'));
						a.attr('data-fancybox-group', 'gallery');

						if(/bepixelung/.test($(value).find('img').closest('a').attr('href')))
							a.attr('title', 'powered by bepixelung.org');
						else
							a.attr('title', $(value).find('sub').html());

						var img = $(document.createElement('img'));
						img.attr('src', $(value).find('img').attr('src'));
						img.attr('style', 'max-height: 150px;display:none;');
						a.append(img);
						gallery.append(a);
					});
					$('#gh_proddesc_right').hide();
					$('#gh_proddesc_right').before(gallery);
					$('#ghgallery img').first().show();
					$('.fancybox').fancybox({
						helpers : {
							thumbs: {
								width  : 50,
								height : 50
							}
						}
				});
				}
			});
		}
	});
});