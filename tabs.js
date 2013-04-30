$(function () {

	if(!/a\d+\.html/i.test(document.URL))
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

				if($('#pricetab_content' + i).find('#content_table').length > 0 || i < 0)
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

						if(tabs[i].vkinfo_ausblenden)
							$('#pricetab_content' + i).find('div.vk_inl').remove();

						if(tabs[i].beschreibungstext_kuerzen)
							$('#pricetab_content' + i).find('.ty2').each(function(index, value) {
								beschreibungstext = $(value).html();
								var beschreibung_haendler = beschreibungstext.split("<p>")[0];
								beschreibung_haendler = beschreibung_haendler.replace(/\<br\>|\<wbr\>/g, ' ');
								$(value).html(beschreibung_haendler + '<br>' + $(value).find('p')[0].innerHTML);
							});

						if(tabs[i].info_agb_link_ausblenden)
							$('#pricetab_content' + i).find('div.gh_hl1').remove();

						if(tabs[i].preisfeld_ausmisten)
							$('#pricetab_content' + i).find('#content_table').find('tr').find('td:first').each(function(index, value) {
								var preis = $(value).find('span.price').clone();
								var kkimg = $(value).find('p').last().clone();
								$(value).empty();
								if(kkimg.length == 0 || /MwSt/.test(kkimg[0].innerText))
									$(value).append(preis);
								else
									$(value).append(preis, kkimg);
							});

						if(tabs[i].bewertungsinfo_kuerzen)
							$('#pricetab_content' + i).find('#content_table').find('tr').find('td:nth-child(3)').each(function(index, value) {
								note = '<br>' + value.innerText.replace(/\s*Note\:\s*|\s*Bewertungen/g, '').replace(/\n/, '/');
								$(value).find('a').first().append(note);
								kurze_bewertung = $(value).find('a').first().clone();
								$(value).empty();
								$(value).append(kurze_bewertung);
							});
					}
				});

			}
		});
		if(standard_tab_index)
			$('#pricetabs').tabs('option', 'active', standard_tab_index);
	});
});