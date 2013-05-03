$(function() {

	if(!/a\d+\.html/i.test(window.location.pathname))
		return;

	chrome.storage.sync.get(null, function(syncStorage) {

		var allgemein = syncStorage['allgemein'];
		var artikel = $(location).attr('pathname').replace(/.*a(\d+)\.html.*/i, '$1');

		if(allgemein.immer_tabs_laden && (window.location.search || window.location.hash)) {
			window.location = window.location.pathname;
			return;
		}

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

						var bilder_anzahl = $('div.morepix', data).length;

						for(var i = 0; i < bilder_anzahl; i++) {
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
						$('#ghgallery img').first().show().css('padding', '0px 5px');

						var bildtitel = '';
						if($('#ghgallery a').first().attr('title'))
							bildtitel = ' - <b>' + $('#ghgallery a').first().attr('title') + '</b>';

						var p = $(document.createElement('p'));
						p.html(' Bild 1/' + bilder_anzahl + bildtitel);
						p.css({
							'text-align': 'center',
							'margin': '0px',
							'height': 'auto'
						});

						$('#ghgallery a').first().after(p);
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

				var img = $(document.createElement('img'));
				img.attr('src', $('#img_wrapper').find('img').attr('src'));
				img.css({
					'max-height': '150px',
					'padding': '5px'
				});

				var a = $(document.createElement('a'));
				a.addClass('fancybox');
				a.attr('href', $('#img_wrapper').find('img').attr('src'));
				a.attr('data-fancybox-group', 'gallery');
				a.append(img);

				var gallery = $(document.createElement('div'));
				gallery.attr('id', 'ghgallery');
				gallery.css('float', 'left');
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
			} else if($('#gh_proddesc_right div.nopic').length) {

				var div_bepixelung = $(document.createElement('div'));
				div_bepixelung.html('Hast du ein Bild? ');
				div_bepixelung.append($('#gh_proddesc_right div.nopic a').first());

				var div_googleimage = $(document.createElement('div'));
				div_googleimage.html('Oder suche nach einem Bild auf ');
				var a = $(document.createElement('a'));
				a.attr({
					href: 'https://www.google.com/search?tbm=isch&tbs=itp:photo&q=' + encodeURIComponent($('h1 span').html()),
					target: '_blank'
				});
				a.html('Google!');
				div_googleimage.append(a);

				$('#gh_proddesc_right div.nopic').empty();
				$('#gh_proddesc_right div.nopic').append(div_bepixelung, div_googleimage);

			}
		}

		if(allgemein.zusatzinfos_ausblenden) {
			var diverse_infos = $(document.createElement('div'));
			diverse_infos.hide();
			diverse_infos.attr('id', 'diverse_infos');
			diverse_infos.css('float', 'left');
			diverse_infos.css('width', '500px');
			diverse_infos.append($('#gh_proddesc p'));
			diverse_infos.append($('#gh_prod_misc_controls'));
			diverse_infos.append($('#gh_artstuff'));
			diverse_infos.css('max-height', '150px');
			diverse_infos.css('overflow', 'auto');
			diverse_infos.css('width', '600px');
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
		}

		if(allgemein.produktbeschreibung_verschoenern) {
			$('#gh_proddesc').css('max-width', '500px').parent().css('max-width', '500px');
			tooltip_anhaengen('#gh_proddesc', function(value) {
				value = value.first();
				value.html(value.text().replace(/•[^•]*?(k\.A\.|N\/A|keine\s*Angabe)[^•]*/g, ''));
				return '<ul><li>' + value.html().replace(/•/g, '</li><li>') + '</li></ul>';
			});

			$('#gh_proddesc ul').css('margin', '0px');
			$('#gh_proddesc ul').css('padding-left', '30px');

			$(document).tooltip({
					track: true,
					items: '.tooltip',
					content: function() {
						return $(this).find('div.original_content').html();
					}
			});

			if($(window).width() - $('#diverse_infos').position().left - $('#diverse_infos').width() > 200) {
				$('#gh_proddesc').css({
					'max-width': '700px',
					'width': '690px'
				}).parent().css('max-width', '700px');
				$('#gh_proddesc').css('-webkit-column-count', '2');
			}
		}
	});
});