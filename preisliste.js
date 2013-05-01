$(function() {
	chrome.storage.sync.get(null, function(syncStorage) {

		var allgemein = syncStorage['allgemein'];
		console.log(allgemein);
		var artikel = $(location).attr('pathname').replace(/.*a(\d+)\.html.*/i, '$1');

		if(allgemein.bilder_gallerie) {
			if($('#img_btns').length) {
				$('#gh_proddesc_right').remove();
				$.ajax({
					dataType: 'html',
					data: {morepix: artikel},
					url: window.location.origin,
					success: function(data) {
						var gallery = $(document.createElement('div'));
						gallery.attr('id', 'ghgallery');
						gallery.css('float', 'left');

						for(var i = 0; i < $('div.morepix', data).length; i++) {
							var value = $('div.morepix', data)[i];
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
							img.css('max-height', '150px');
							img.css('display', 'none');
							a.append(img);
							gallery.append(a);
						}

						$('#gh_proddesc_left').after(gallery);
						$('#ghgallery img').first().show();
						$('.fancybox').fancybox({
							helpers : {
								thumbs: {
									width  : 100,
									height : 100
								}
							}
						});
					}
				});
			} else if($('#img_wrapper').length) {
				var gallery = $(document.createElement('div'));
				gallery.attr('id', 'ghgallery');
				gallery.css('float', 'left');
				var a = $(document.createElement('a'));
				a.addClass('fancybox');
				a.attr('href', $('#img_wrapper').find('img').attr('src'));
				a.attr('data-fancybox-group', 'gallery');
				var img = $(document.createElement('img'));
				img.attr('src', $('#img_wrapper').find('img').attr('src'));
				img.css('max-height', '150px');
				a.append(img);
				gallery.append(a);
				$('#gh_proddesc_left').after(gallery);
				$('#gh_proddesc_right').remove();
				$('.fancybox').fancybox({
					helpers : {
						thumbs: {
							width  : 100,
							height : 100
						}
					}
				});
			}
		}

		var diverse_infos = $(document.createElement('div'));
		diverse_infos.hide();
		diverse_infos.attr('id', 'diverse_infos');
		diverse_infos.css('float', 'left');
		diverse_infos.append($('#gh_proddesc p'));
		diverse_infos.append($('#gh_prod_misc_controls'));
		diverse_infos.append($('#gh_artstuff'));
		$('#gh_artbox').append(diverse_infos);

		var toggle_diverse_infos = $(document.createElement('div'));
		toggle_diverse_infos.attr('id', 'toggle_diverse_infos');

		var button = $(document.createElement('button'));
		button.attr('type', 'button');
		button.html('Zusatzinfos Anzeigen');

		toggle_diverse_infos.append(button);
		$('#diverse_infos').before(toggle_diverse_infos);

		$('#toggle_diverse_infos button').click(function() {
			if($('#diverse_infos').is(':visible')) {
				$('#diverse_infos').hide();
				$('#toggle_diverse_infos button').html('Zusatzinfos Anzeigen');
			} else {
				$('#diverse_infos').show();
				$('#toggle_diverse_infos button').html('Verstecken');
			}
		});

		if($('#gh_proddesc span').is(':empty'))
			$('#gh_proddesc').remove();
	});
});