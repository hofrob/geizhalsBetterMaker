$(function() {

	$('#fs').attr('tabindex', '1');

	if(!/a\d+\.html/i.test(window.location.pathname))
		return;

	chrome.storage.sync.get(null, function(syncStorage) {

		var allgemein = syncStorage['allgemein'],
			artikel = window.location.pathname.replace(/^.*a(\d+)\.html.*$/i, '$1'),
			favoriten = syncStorage['favoriten'];

		if(allgemein.immer_tabs_laden && (window.location.search || window.location.hash)) {
			window.location = window.location.pathname;
			return;
		}

		var div = $(document.createElement('div'))
				.attr('id', 'favorit');

		if(favoriten[artikel])
			div.addClass('aktiv');

		$('#monav').prepend(div);

		$('#favorit').click(function() {
			$('#favorit').toggleClass('aktiv');
			chrome.storage.sync.get('favoriten', function(syncStorage) {

				var favoriten = syncStorage['favoriten'];

				if($('#favorit.aktiv').length) {
					favoriten[artikel] = {
						titel: $('h1 span:first').text()
					};
					chrome.storage.sync.set({favoriten: favoriten});
				} else {
					delete favoriten[artikel];
					chrome.storage.sync.set({favoriten: favoriten});
				}
			});
		});

		if(allgemein.bilder_gallerie) {

			if($('#img_btns').length || $('#img_wrapper').length) {

				var img = $(document.createElement('img'))
						.attr('src', $('#img_container img,#img_container_noresize img').attr('src')),
					div = $(document.createElement('div'))
						.attr('id', 'artikel_thumb')
						.append(img),
					p = $(document.createElement('p')),
					bildunterschrift = [];

				if($('#mofn').length)
					bildunterschrift.push(' Bild 1/' + $('#mofn').text().replace(/^\d+\s+\/\s+(\d+)$/, '$1'));

				if(/bepixelung/.test($('#img_container').closest('a').attr('href')))
					bildunterschrift.push('<strong>powered by bepixelung.org</strong>');
				else if($('#img_wrapper #p_comment').length && /Research\s*In\s*Motion/i.test($('#img_wrapper #p_comment').text()))
					bildunterschrift.push('<strong>&copy; Research In Motion</strong>');
				else if($('#img_wrapper #p_comment').length)
					bildunterschrift.push('<strong>' + $('#img_wrapper #p_comment').html() + '</strong>');

				p.html(bildunterschrift.join(' - '));

				div.append(p);
				$('#gh_proddesc_left').after(div);
			}

			if($('#img_btns').length) {

				$('#gh_proddesc_right').remove();

				$('#artikel_thumb img').one('click', function() {
					$.ajax({
						dataType: 'html',
						data: {morepix: artikel},
						url: window.location.origin,
						success: function(data) {
							var gallery = $(document.createElement('div'))
									.attr('id', 'ghgallery');

							for(var i = 0; i < $('div.morepix', data).length; i++) {
								var value = $('div.morepix', data)[i],
									a = $(document.createElement('a'))
										.addClass('fancybox')
										.attr('href', $(value).find('img').attr('src'))
										.attr('data-fancybox-group', 'gallery');

								if(/bepixelung/.test($(value).find('img').closest('a').attr('href')))
									a.attr('title', 'powered by bepixelung.org');
								else
									a.attr('title', $(value).find('sub').html());

								var img = $(document.createElement('img'))
										.attr('src', $(value).find('img').attr('src'));
								a.append(img);
								gallery.append(a);
							}

							$('#artikel_thumb').after(gallery);

							$('#ghgallery .fancybox').fancybox({
								helpers : {
									thumbs: {
										width  : 100,
										height : 100
									}
								},
								thumbsLoaded: function() {
									$('#fancybox-thumbs a').each(function(index, value) {
										$(value).attr({
											href: '#',
											onClick: 'return false;'
										}).click(function(e) {
											$.fancybox.jumpto($(e.target).closest('li').index());
										});
									});
								}
							});

							$('#ghgallery img').first().click();
							$('#artikel_thumb img').click(function() {
								$('#ghgallery img').first().click();
							});
						}
					});
				});
			} else if($('#img_wrapper').length) {


				var a = $(document.createElement('a'))
						.addClass('fancybox')
						.attr({
							href: $('#artikel_thumb img').attr('src'),
							'data-fancybox-group': 'gallery',
							title: $('#img_wrapper #p_comment').html()
						});

				$('#artikel_thumb img').wrap(a);
				$('#gh_proddesc_right').remove();

				$('#artikel_thumb .fancybox').fancybox({
					helpers : {
						thumbs: {
							width  : 100,
							height : 100
						}
					}
				});
			} else if($('#gh_proddesc_right div.nopic').length) {

				var div_bepixelung = $(document.createElement('div'))
						.html('Hast du ein Bild? ')
						.append($('#gh_proddesc_right div.nopic a:contains(bepixelung)')),
					a = $(document.createElement('a'))
						.html('Google!')
						.attr({
							href: 'https://www.google.com/search?tbm=isch&tbs=itp:photo&q=' + encodeURIComponent($('h1 span:first').text()),
							target: '_blank'
						}),
					div_googleimage = $(document.createElement('div'))
						.html('Oder suche nach einem Bild auf ')
						.append(a);

				$('#gh_proddesc_right div.nopic')
						.empty()
						.append(div_bepixelung, div_googleimage);

			}
		}

		if(allgemein.zusatzinfos_ausblenden) {
			var diverse_infos = $(document.createElement('div'))
					.hide()
					.attr('id', 'diverse_infos')
					.append($('#gh_proddesc p'), $('#gh_prod_misc_controls'), $('#gh_artstuff'));

			$('#gh_artbox').append(diverse_infos);

			var button = $(document.createElement('button'))
					.attr('type', 'button')
					.html('Zusatzinfos Ein/Ausblenden'),
				toggle_diverse_infos = $(document.createElement('div'))
					.attr('id', 'toggle_diverse_infos')
					.append(button);

			$('#diverse_infos').before(toggle_diverse_infos);

			$('#toggle_diverse_infos button').click(function() {
				$('#diverse_infos').toggle();
			});

			if(!/\w/.test($('#gh_proddesc span').text()))
				$('#gh_proddesc').remove();
		}

		if(allgemein.produktbeschreibung_verschoenern) {
			tooltip_anhaengen('#gh_proddesc', {richtung: 's'}, function(value) {
				value = value.first();
				if(value.html()) {
					value.html(value.text().replace(/•[^•]*?(k\.A\.|N\/A|keine\s*Angabe)[^•]*/g, ''));
					return '<ul><li>' + value.html().replace(/•/g, '</li><li>') + '</li></ul>';
				}
			});

			$(document).tooltip({
					track: true,
					items: '.tooltip',
					content: function() {
						return $(this).find('div.original_content').html();
					}
			});

			if($('#gh_proddesc ul li').length > 5 && $(window).width() - $('#diverse_infos').position().left - $('#diverse_infos').width() > 200) {
				$('#gh_proddesc')
						.css({
							'max-width': '700px',
							width: '690px'
						})
						.parent()
						.css('max-width', '700px');

				$('#gh_proddesc').css('-webkit-column-count', '2');
			}
		}
		if($('#gh_proddesc_left').height() > 165)
			$('#artikel_thumb img')
				.css('max-height', ($('#gh_proddesc_left').height()-15).toString() + 'px');
		else
			$('#artikel_thumb img')
				.css('max-height', '150px');
	});
});