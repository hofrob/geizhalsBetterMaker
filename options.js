function restore_options() {
	$('[name=usertabs]').empty();
	chrome.storage.sync.get(null, function(syncStorage) {
		var tabs = syncStorage['tabs'];

		if(tabs.length >= 6)
			$('#tab_hinzufuegen').attr('disabled', true);
		else
			$('#tab_hinzufuegen').attr('disabled', false);

		$(tabs).each(function(index, value) {
			$('[name=usertabs]').append('<option value="' + index + '">' + value.bezugsart + ': ' + value.loc + '</option>');
		});
	});
}

function reset_form() {
	$('[name=bezugsart]').prop('checked', false);
	$('[name=versandland]').prop('checked', false);
	$('#abholadresse').val('');
	$('[name=versandland]').parent().hide();
	$('[name=abholadresse]').parent().hide();
}

$(function() {
	restore_options();
	
	$('[name=bezugsart]').click(function(e) {
		if(e.target.id == 'abholung') {
			$('[name=abholadresse]').parent().show();
			$('[name=versandland]').parent().hide();
		} else {
			$('[name=abholadresse]').parent().hide();
			$('[name=versandland]').parent().show();
		}
	});
	
	$('#tab_hinzufuegen').click(function() {
	
		var newtab;
		if($('[name=bezugsart]:checked').val() == 'abholung') {
			newtab = {
				bezugsart: 'abholung',
				loc: $('#abholadresse').val()
			};
		} else {
			newtab = {
				bezugsart: 'versand',
				loc: $('[name=versandland]:checked').val()
			};
		}
		chrome.storage.sync.get(null, function(syncStorage) {
			var tabs = syncStorage['tabs'];
			if(tabs.length >= 6)
				return;
			tabs.push(newtab);
			chrome.storage.sync.set({'tabs': tabs});
			restore_options();
			reset_form();
		});
	});
	
	$('#tab_entfernen').click(function() {
		var tabs_loeschen = $('[name=usertabs]').val();
		if(!tabs_loeschen)
			return;

		chrome.storage.sync.get(null, function(syncStorage) {
			var tabs = syncStorage['tabs'];
			for(var i = 0; i < tabs_loeschen.length; i++) {
				delete tabs[tabs_loeschen[i]];
			}
			chrome.storage.sync.set({'tabs': tabs});
			restore_options();
		});
	});
	
	$('[name=usertabs]').mouseup(function() {
		if($('[name=usertabs]').val())
			$('#tab_entfernen').attr('disabled', false);
		else
			$('#tab_entfernen').attr('disabled', true);
	});
});