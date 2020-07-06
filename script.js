function throwError(message) {
	console.error('[error]', message);
}

function saveKey() {
	localStorage.setItem('mem.jjwz.user', $('#user').val());
	localStorage.setItem('mem.jjwz.key', $('#key').val());
}

function loadKey() {
	$('#user').val(localStorage.getItem('mem.jjwz.user'));
	$('#key').val(localStorage.getItem('mem.jjwz.key'));
}

function connectData(data) {
	return JSON.stringify({
		etaoinwu_ak_ioi: true,
		user: $('#user').val(),
		key: $('#key').val(),
		data: data,
	});
}

function renderArticle(article) {
	$('#article').text(article.map(o => o.text).join(''));
}

function renderHistory(history) {
	console.log('history', history);
}

loadKey();
let ws = new WebSocket("ws://localhost:4514");
let is_login = false;

$('#login').click(function () {
	saveKey();
	ws.send(connectData({
		type: 'login'
	}));
})

$('#send').click(function () {
	if (!is_login) return throwError('你是谁啊？');
	if (!$('#text').val()) return throwError('你想说啥？');
	if ($('#text').val().length > 5) return throwError('你话怎么这么长？');
	ws.send(connectData({
		type: 'push_article',
		text: $('#text').val(),
	}));
	$('#text').val('');
});

$('#undo').click(function () {
	if (!is_login) return throwError('你是谁啊？');
	ws.send(connectData({
		type: 'pop_article',
	}));
});

$('#end').click(function () {
	if (!is_login) return throwError('你是谁啊？');
	ws.send(connectData({
		type: 'end_article',
	}));
});

ws.addEventListener('message', function (event) {
	let data = JSON.parse(event.data);
	console.log('ws[message]', data);
	if (data.type == 'error') {
		throwError(data.message);
	} else if (data.type == 'login') {
		is_login = true;
	} else if (data.type == 'update_article') {
		renderArticle(data.article);
	} else if (data.type == 'update_history') {
		renderHistory(data.history);
	}
});

ws.onopen = function () {
	$('#login').click();
}