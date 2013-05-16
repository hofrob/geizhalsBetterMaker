function restore_options() {
	$('#error').html('');
	$('#usertabs').empty();
	$('#preisagenten').empty();
	$('#preisagent_entfernen').prop('disabled', true);
	chrome.storage.sync.get(null, function(syncStorage) {
		if(!syncStorage['dev'])
			$('#preisagenten').closest('form').hide();
		console.log(syncStorage);
		var tabs = syncStorage['tabs'];
		var allgemein = syncStorage['allgemein'];
		var standard_tab = syncStorage['standard_tab'];

		if(tabs && tabs.length >= 6)
			$('#usertabs').closest('form').prop('disabled', true).css('color', '#707070');
		else
			$('#usertabs').closest('form').prop('disabled', false).css('color', '#E0E2E4');

		reset_form();

		$(tabs).each(function(index, value) {

			var text;
			if(standard_tab == index)
				text = '<option value="' + index + '">' + value.tabname + ' (Standard)</option>';
			else
				text = '<option value="' + index + '">' + value.tabname + '</option>';

			$('#usertabs').append(text);
		});

		cb = Object.keys(allgemein);
		for(var i=0; i < cb.length; i++)
			$('#' + cb[i]).prop('checked', allgemein[cb[i]]);

	});
	chrome.storage.local.get(null, function(syncStorage) {
		console.log(syncStorage);
	});
}

function reset_form() {
	$('#usertabs').mouseup();
	$('#tab_settings').hide();
	$('[name=bezugsart]').prop('checked', false);
	$('#bezugsart_keine').prop('checked', true);
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
		if(e.target.id == 'bezugsart_abholung') {
			$('[name=abholadresse]').parent().prop('disabled', false).css('color', '#E0E2E4');
			$('[name=versandland]').parent().prop('disabled', true).css('color', '#707070');
		} else if(e.target.id == 'bezugsart_versand') {
			$('[name=abholadresse]').parent().prop('disabled', true).css('color', '#707070');
			$('[name=versandland]').parent().prop('disabled', false).css('color', '#E0E2E4');
		}
	});

	$('#speichern').click(function() {

		chrome.storage.sync.remove('allgemein');

		var allgemein = {},
			cb = $('#allgemein > [type=checkbox]');

		for(var i=0; i < cb.length; i++) {
			allgemein[$(cb[i]).context.id] = $(cb[i]).prop('checked');
		}
		chrome.storage.sync.set({'allgemein': allgemein});
	});

	$('#tab_neu').click(function() {
		$('#usertabs').val('');
		reset_form();
		$('#tab_bearbeiten_id').remove();
		$('#tab_settings').show();
	});

	$('#tab_abbrechen').click(function() {
		$('#tab_settings').hide();
		restore_options();
	});

	$('#tab_speichern').click(function() {

		if(!check_required())
			return;

		var tab_bearbeiten = $('#tab_bearbeiten_id').val();

		var newtab;

		if($('[name=bezugsart]:checked').val() == 'abholung') {
			newtab = {
				bezugsart: 'abholung',
				loc: $('#abholadresse').val()
			};
		} else if($('[name=bezugsart]:checked').val() == 'versand') {
			newtab = {
				bezugsart: 'versand',
				loc: $('[name=versandland]:checked').val()
			};
		} else {
			newtab = {
				bezugsart: 'keine'
			};
		}

		newtab.verfuegbarkeit = $('[name=verfuegbarkeit]:checked').val();

		verschoenern = $('#verschoenern > [type=checkbox]');

		for(var i = 0; i < verschoenern.length; i++)
			newtab[$(verschoenern[i]).context.id] = $(verschoenern[i]).prop('checked');

		if(/\w+/i.test($('#tabname').val()))
			newtab.tabname = $('#tabname').val();
		else if(newtab.bezugsart == 'keine')
			newtab.tabname = 'keine Bezugsart; Verf: ' + newtab.verfuegbarkeit[0].toUpperCase();
		else
			newtab.tabname = newtab.bezugsart + ': ' + newtab.loc + '; Verf: ' + newtab.verfuegbarkeit[0].toUpperCase();

		chrome.storage.sync.get('tabs', function(syncStorage) {
			var tabs = syncStorage['tabs'];
			if(!tabs)
				tabs = [];

			if(typeof tab_bearbeiten == 'undefined') {
				if(tabs.length >= 6)
					return;
				tabs.push(newtab);
			} else {
				tabs[tab_bearbeiten] = newtab;
			}
			chrome.storage.sync.set({'tabs': tabs});
			restore_options();
		});
	});

	$('#tab_entfernen').click(function() {
		var tabs_entfernen = $('#usertabs').val();
		if(!tabs_entfernen) {
			$('#error').html('Bitte mindestens ein Tab aus der Liste wählen.');
			return;
		}

		chrome.storage.sync.get(null, function(syncStorage) {
			var tabs = syncStorage['tabs'];
			var standard_tab = syncStorage['standard_tab'];

			for(var i = 0; i < tabs_entfernen.length; i++) {
				delete tabs[tabs_entfernen[i]];
				if(tabs_entfernen[i] == standard_tab)
					chrome.storage.sync.remove('standard_tab');
			}

			chrome.storage.sync.set({'tabs': tabs});
			restore_options();
		});
	});

	$('#preisagent_entfernen').click(function() {
		var preisagent_entfernen = $('#preisagenten').val();
		if(!preisagent_entfernen) {
			$('#error').html('Bitte mindestens einen Preisagent aus der Liste wählen.');
			return;
		}

		chrome.storage.sync.get('preisagenten', function(syncStorage) {
			var preisagenten = syncStorage['preisagenten'];
			for(var i = 0; i < preisagent_entfernen.length; i++)
				delete preisagenten[preisagent_entfernen[i]];

			chrome.storage.sync.set({'preisagenten': preisagenten});
			restore_options();
		});
	});

	$('#als_standard').click(function() {
		var tab_als_standard = $('#usertabs').val();

		if(tab_als_standard.length != 1) {
			$('#error').html('Bitte ein Tab aus der Liste wählen.');
			return;
		}

		standard_tab = parseInt(tab_als_standard[0], 10);

		chrome.storage.sync.set({'standard_tab': standard_tab});
		restore_options();
	});

	$('#tab_bearbeiten').click(function () {

		if($('#usertabs').val().length != 1) {
			$('#error').html('Bitte ein Tab aus der Liste wählen.');
			return;
		}

		var tab_bearbeiten = $('#usertabs').val()[0];

		chrome.storage.sync.get('tabs', function(syncStorage) {
			var tab = syncStorage['tabs'][tab_bearbeiten];
			$('#tab_bearbeiten_id').remove();
			input = $(document.createElement('input'));
			input.attr({
				type: 'hidden',
				id: 'tab_bearbeiten_id',
				value: tab_bearbeiten
			});
			$('#usertabs').closest('fieldset').append(input);

			$.each(tab, function(index, value) {
				if(index == 'tabname')
					$('#' + index).val(value);
				else if(index == 'loc' && tab.bezugsart == 'abholung')
					$('#abholadresse').val(value);
				else if(index == 'loc' && tab.bezugsart == 'versand')
					$('#versand_' + value).prop('checked', true).click();
				else if(index == 'verfuegbarkeit')
					$('#' + value).prop('checked', true).click();
				else if(typeof value == 'boolean')
					$('#' + index).prop('checked', value);
				else
					$('#' + index + '_' + value).prop('checked', true).click();

			});
			$('#tab_settings').show();
		});
	});

	$('#usertabs').mouseup(function() {
		var usertabs = $('#usertabs').val();
		$('#tab_settings').hide();

		if(usertabs && $('#usertabs').val().length == 1) {
			$('#tab_entfernen').prop('disabled', false);
			$('#tab_bearbeiten').prop('disabled', false);
			$('#als_standard').prop('disabled', false);
		} else if (usertabs && $('#usertabs').val().length > 1){
			$('#tab_entfernen').prop('disabled', false);
			$('#tab_bearbeiten').prop('disabled', true);
			$('#als_standard').prop('disabled', true);
		} else {
			$('#tab_entfernen').prop('disabled', true);
			$('#tab_bearbeiten').prop('disabled', true);
			$('#als_standard').prop('disabled', true);
		}
	});

	$('#preisagenten').mouseup(function() {
		if($('#preisagenten').val()) {
			$('#preisagent_entfernen').prop('disabled', false);
		} else {
			$('#preisagent_entfernen').prop('disabled', true);
		}
	});
});