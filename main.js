function tooltip_anhaengen(value, aufraeumen) {
	value = $(value);

	var div = $(document.createElement('div'));
	div.css('display', 'none');
	div.addClass('original_content');
	div.html('<b>Originaltext</b>:<br>' + $(value).html());

	$(value).html(aufraeumen(value));

	$(value).append(div);
	$(value).addClass('tooltip');
}