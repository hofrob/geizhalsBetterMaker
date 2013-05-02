$(function () {

	if(!/a\d+\.html/i.test(window.location.pathname))
		return;

	chrome.storage.sync.get(null, function(syncStorage) {
		var tabs = syncStorage['tabs'];

		if(!tabs)
			return;

		$('#gh_afilterbox, #content_table, [name="filterbox"], #gh_content_wrapper > div.blaettern').wrapAll('<div id="allepreise" />');
		$('#allepreise').wrapAll('<div id="pricetabs" />');
		$('#pricetabs').prepend('<ul id="pricetabs_title"><li><a href="#allepreise">Alle Preise</a></li></ul>');

		for(var i = 0; i < tabs.length; i++) {
			$('#pricetabs_title').append('<li id="pricetab' + i + '"><a href="#pricetab_content' + i + '">' + tabs[i].tabname + '</a></li>');
			$('#pricetabs').append('<div id="pricetab_content' + i + '" />');
			if(tabs[i].als_standard)
				var standard_tab_index = i + 1;
		}

		$('#pricetabs').tabs({
			activate: function(event, ui) {

				var i = $('#pricetabs').tabs("option", "active") - 1;

				if($('#pricetab_content' + i + ' #content_table').length > 0 || i < 0)
					return;

				var data = {
					t: tabs[i].bezugsart[0]
				};

				if(tabs[i].bezugsart == 'versand') {
					data.vl = tabs[i].loc;
					data.va = 'b';
				} else {
					data.plz = tabs[i].loc;
				}

				if(tabs[i].verfuegbarkeit == 'beliebig') {
					data.v = 'e';
				} else {
					data.v = tabs[i].verfuegbarkeit[0];
				}

				$.ajax({
					data: data,
					dataType: 'html',
					success: function(data, textStatus, jqXHR) {
						/* [name="filterbox"] enthaelt script tag mit javascript call der uncaught reference error verursacht
						 * $('[name="filterbox"]', data).find('script').remove() funktioniert nicht
						 */
						$('#gh_afilterbox, #content_table, #gh_content_wrapper > h3, #gh_content_wrapper > div.blaettern', data).
								appendTo('#pricetab_content' + i);

						if(tabs[i].filterbox_ausblenden)
							$('#pricetab_content' + i + ' #gh_afilterbox').hide();

						if(tabs[i].vkinfo_ausblenden) {
							$('#pricetab_content' + i + ' div.vk_inl').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									return 'Versandkosten';
								});
							});
						}

						if(tabs[i].beschreibungstext_kuerzen)
							$('#pricetab_content' + i + ' .ty2').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									beschreibungstext = value.html();
									var beschreibung_haendler = beschreibungstext.split("<p>")[0];
									beschreibung_haendler = beschreibung_haendler.replace(/\<br\>|\<wbr\>/g, ' ');
									return beschreibung_haendler + '<br>' + value.find('p b')[0].innerHTML;
								});
							});

						if(tabs[i].info_agb_link_ausblenden)
							$('#pricetab_content' + i + ' div.gh_hl1').remove();

						if(tabs[i].preisfeld_ausmisten)
							$('#pricetab_content' + i + ' #content_table tr').find('td:first').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									value.attr('title', value.text());

									if(value.attr('colspan') == 5)
										return;

									var preis = value.find('span.price').clone();
									var kkimg = value.find('p').last().clone();
									value.empty();
									if(kkimg.length == 0 || /MwSt/.test(kkimg[0].innerText))
										return preis[0].outerHTML;
									else
										return preis[0].outerHTML + ' ' + kkimg[0].outerHTML;
								});
							});

						if(tabs[i].bewertungsinfo_kuerzen)
							$('#pricetab_content' + i + ' #content_table tr td:nth-child(3)').each(function(index, value) {

								if(/hat keine g.ltigen bewertungen/i.test(value.innerText)) {
									$(value).find('a').first().prepend('0/0 ');
								} else {
									note = '<br>' + value.innerText.replace(/\s*Note\:\s*|\s*Bewertung(en)?/g, '').replace(/\n/, '/');
									$(value).find('a').first().append(note);
								}

								kurze_bewertung = $(value).find('a').first().clone();
								$(value).empty();
								$(value).append(kurze_bewertung);
							});

						if(tabs[i].lagerstand_kuerzen) {
							$('#pricetab_content' + i + ' #content_table .av_inl').css('height', 'auto');
							$('#pricetab_content' + i + ' #content_table div.av_l').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									return 'lagernd';
								});
							});
							$('#pricetab_content' + i + ' #content_table div.av_k').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									return 'kurzfristig lieferbar';
								});
							});
						}

						if(tabs[i].haendlerlink_kuerzen)
							$('#pricetab_content' + i + ' #content_table tr td:nth-child(2)').each(function(index, value) {
								tooltip_anhaengen(value, function(value) {
									value.attr('title', value.text());
									var flagge = value.find('img:first').clone();
									var haendlerlink = value.find('a').clone();
									value.empty();
									return flagge[0].outerHTML + ' ' + haendlerlink[0].outerHTML;
								});
							});

						$('#pricetab_content' + i + ' #content_table th:nth-child(2)').css('width', '160px');
						$('#pricetab_content' + i).tooltip({
								track: true,
								items: '.tooltip',
								content: function() {
									return $(this).find('div.original_content').html();
								}
						});
					}
				});

			}
		});
		if(standard_tab_index)
			$('#pricetabs').tabs('option', 'active', standard_tab_index);
	});
});