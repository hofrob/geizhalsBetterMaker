function restore_options() {
	$('#error').html('');
	$('[name=usertabs]').empty();
	$('#tab_entfernen').prop('disabled', true);
	$('#als_standard').prop('disabled', true);
	chrome.storage.sync.get(null, function(syncStorage) {

		var tabs = syncStorage['tabs'];

		if(tabs && tabs.length >= 6)
			$('form > fieldset').prop('disabled', true).css('color', '#707070');
		else
			$('form > fieldset').prop('disabled', false).css('color', '#E0E2E4');

		reset_form();

		$(tabs).each(function(index, value) {

			if(value.als_standard)
				text = '<option value="' + index + '">' + value.tabname + ' (Standard)</option>';
			else
				text = '<option value="' + index + '">' + value.tabname + '</option>';

			$('[name=usertabs]').append(text);
		});

		var allgemein = syncStorage['allgemein'];
		cb = Object.keys(allgemein);
		for(var i=0; i < cb.length; i++) {
			$('#' + cb[i]).prop('checked', allgemein[cb[i]]);
		}
	});
}

function reset_form() {
	$('[name=bezugsart]').prop('checked', false);
	$('[name=versandland]').prop('checked', false);
	$('#abholadresse').val('');
	$('#tabname').val('');
	$('[name=versandland]').parent().prop('disabled', true).css('color', '#707070');
	$('#verschoenern [type=checkbox]').prop('checked', true);
	$('[name=abholadresse]').parent().prop('disabled', true).css('color', '#707070');
	$('[name=verfuegbarkeit]').prop('checked', false);
	$('#beliebig').prop('checked', true);
}

function check_required() {

	var error = '';
	var bezugsart = $('[name=bezugsart]:checked').val();

	if(bezugsart == 'abholung' && !/\w/.test($('#abholadresse').val())) {
		error = error.concat('Abholung/Adresse ');
	} else if(bezugsart == 'versand' && !$('[name=versandland]:checked').val()) {
		error = error.concat('Versand/Land ');
	} else if(!bezugsart) {
		error = error.concat('Bezugsart + Adresse/Land ');
	}

	if(!$('[name=verfuegbarkeit]:checked').val())
		error = error.concat('Verfügbarkeit');

	if(error) {
		$('#error').html('Pflichtfelder: ' + error);
		return false;
	} else {
		return true;
	}
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

	$('#speichern').click(function() {
		var allgemein = {},
			cb = $('#allgemein > [type=checkbox]');

		for(var i=0; i < cb.length; i++) {
			allgemein[$(cb[i]).context.id] = $(cb).prop('checked');
		}
		chrome.storage.sync.set({'allgemein': allgemein});
	});

	$('#tab_hinzufuegen').click(function() {

		if(!check_required())
			return;

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

		verschoenern = $('#verschoenern > [type=checkbox]');
		for(var i = 0; i < verschoenern.length; i++) {
			newtab[$(verschoenern[i]).context.id] = $(verschoenern[i]).prop('checked');
		}

		if(/\w+/i.test($('#tabname').val()))
			newtab.tabname = $('#tabname').val();
		else
			newtab.tabname = newtab.bezugsart + ': ' + newtab.loc + '; Verf: ' + newtab.verfuegbarkeit[0].toUpperCase();

		chrome.storage.sync.get(null, function(syncStorage) {
			var tabs = syncStorage['tabs'];
			if(!tabs)
				tabs = [];

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
		if(!tabs_loeschen) {
			$('#error').html('Bitte mindestens ein Tab aus der Liste wählen.');
			return;
		}

		chrome.storage.sync.get(null, function(syncStorage) {
			var tabs = syncStorage['tabs'];
			for(var i = 0; i < tabs_loeschen.length; i++) {
				delete tabs[tabs_loeschen[i]];
			}
			chrome.storage.sync.set({'tabs': tabs});
			restore_options();
		});
	});

	$('#als_standard').click(function() {
		var tab_als_standard = $('[name=usertabs]').val();

		if(tab_als_standard.length != 1) {
			$('#error').html('Bitte ein Tab aus der Liste wählen.');
			return;
		}

		chrome.storage.sync.get(null, function(syncStorage) {
			var tabs = syncStorage['tabs'];

			for(var i = 0; i < tabs.length; i++) {
				if(i == tab_als_standard[0]) {
					tabs[i].als_standard = true;
				} else {
					tabs[i].als_standard = false;
				}
			}

			chrome.storage.sync.set({'tabs': tabs});
			restore_options();
		});
	});

	$('[name=usertabs]').mouseup(function() {
		if($('[name=usertabs]').val()) {
			$('#tab_entfernen').prop('disabled', false);
			$('#als_standard').prop('disabled', false);
		} else {
			$('#tab_entfernen').prop('disabled', true);
			$('#als_standard').prop('disabled', true);
		}
	});
});