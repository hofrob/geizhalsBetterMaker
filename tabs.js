$(function () {

	if(!/a\d+\.html/i.test(document.URL))
		return;
	
	$('#gh_afilterbox, #content_table, [name="filterbox"], #gh_content_wrapper > div.blaettern').wrapAll('<div id="allepreise" />');
	$('#allepreise').wrapAll('<div id="pricetabs" />');
	$('#pricetabs').prepend('<ul id="pricetabs_title"><li><a href="#allepreise">Alle Preise</a></li></ul>');
	
	// $('#pricetabs_title').append('<li id="pricetab2"><a href="#abholung1070">Abholung 1070</a></li>');

	
	chrome.storage.sync.get(null, function(syncStorage) {
		var tabs = syncStorage['tabs'];
		for(var i = 0; i < tabs.length; i++) {
			// console.log(i);
			// console.log(tabs[i]);
			$('#pricetabs_title').append('<li id="pricetab' + i + '"><a href="#pricetab_content' + i + '">' + tabs[i].bezugsart + ': ' + tabs[i].loc + '</a></li>');
			$('#pricetab' + i).click(function() {

				var i = /\d+$/.exec($(this).context.id)[0];

				var data = {
					t: tabs[i].bezugsart[0]
				};
				
				if(tabs[i].bezugsart[0] == 'v') {
					data.vl = tabs[i].loc;
					data.va = 'b';
				} else {
					data.plz = tabs[i].loc;
				}

				$.ajax({
					'data': data,
					'success': function(data, textStatus, jqXHR) {
						$('#pricetabs').append('<div id="pricetab_content' + i + '" />');
						$('#gh_afilterbox, #content_table, [name="filterbox"], #gh_content_wrapper > h3, #gh_content_wrapper > div.blaettern', data).appendTo('#pricetab_content' + i);
					}
				});
			});
		}
		$('#pricetabs').tabs();
	});	

	// $('#pricetab1').click(function() {
		// $.ajax({
			// 'data': {
				// 't': 'v',
				// 'vl': 'at'
			// },
			// 'success': function(data, textStatus, jqXHR) {
				// $('#pricetabs').append('<div id="versandat" />');
				// $('#gh_afilterbox, #content_table, [name="filterbox"], #gh_content_wrapper > h3, #gh_content_wrapper > div.blaettern', data).appendTo('#versandat');
			// }
		// });
	// });
	
	// $('#pricetab2').click(function() {
		// $.ajax({
			// 'data': {
				// 't': 'a',
				// 'plz': '1070'
			// },
			// 'success': function(data, textStatus, jqXHR) {
				// $('#pricetabs').append('<div id="abholung1070" />');
				// $('#gh_afilterbox, #content_table, [name="filterbox"], #gh_content_wrapper > h3, #gh_content_wrapper > div.blaettern', data).appendTo('#abholung1070');
			// }
		// });
	// });
	// $('#pricetabs').tabs();
})