function restore_options() {
	$('[name=usertabs]').empty();
	$('#tab_entfernen').prop('disabled', true);
	chrome.storage.sync.get(null, function(syncStorage) {
		var tabs = syncStorage['tabs'];

		if(tabs.length >= 6)
			$('form > fieldset').prop('disabled', true).css('color', '#707070');
		else
			$('form > fieldset').prop('disabled', false).css('color', '#E0E2E4');

		reset_form();

		$(tabs).each(function(index, value) {
			$('[name=usertabs]').append('<option value="' + index + '">' + value.tabname + '</option>');
		});
	});
}

function reset_form() {
	$('[name=bezugsart]').prop('checked', false);
	$('[name=versandland]').prop('checked', false);
	$('#abholadresse').val('');
	$('#tabname').val('');
	$('[name=versandland]').parent().prop('disabled', true).css('color', '#707070');
	$('[name=abholadresse]').parent().prop('disabled', true).css('color', '#707070');
	$('[name=verfuegbarkeit]').prop('checked', false);
	$('#beliebig').prop('checked', true);
}

$(function() {
	restore_options();

	$('[name=bezugsart]').click(function(e) {
		if(e.target.id == 'abholung') {
			$('[name=abholadresse]').parent().prop('disabled', false).css('color', '#E0E2E4');
			$('[name=versandland]').parent().prop('disabled', true).css('color', '#707070');
		} else {
			$('[name=abholadresse]').parent().prop('disabled', true).css('color', '#707070');
			$('[name=versandland]').parent().prop('disabled', false).css('color', '#E0E2E4');
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

		newtab.verfuegbarkeit = $('[name=verfuegbarkeit]:checked').val();

		if(/\w+/i.test($('#tabname').val()))
			newtab.tabname = $('#tabname').val();
		else
			newtab.tabname = newtab.bezugsart + ': ' + newtab.loc + '; Verf: ' + newtab.verfuegbarkeit[0].toUpperCase();

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
			$('#tab_entfernen').prop('disabled', false);
		else
			$('#tab_entfernen').prop('disabled', true);
	});
});