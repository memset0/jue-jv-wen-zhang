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
	if (article.length) {
		$('#edit_history').html('');
		article.reverse().forEach(data => $('#edit_history').append(
			'<tr>' +
			'<td>' +
			'<h4 class="ui image header">' +
			'<img src="http://q1.qlogo.cn/g?b=qq&nk=' + data.user + '&s=40" class="ui mini rounded image" />' +
			'<div class="content">' + data.user + '</div>' +
			'</div>' +
			'</td>' +
			'<td><span style="height: 100%; vertical-align: middle; margin-left: .5em">' + data.text + '</span></td>' +
			'</tr>'
		));
	}
}

function renderHistory(history) {
	console.log('history', history);
}

loadKey();
let ws = new WebSocket('WebSocketUrl');
let is_login = false;

$('#login').click(function () {
	saveKey();
	ws.send(connectData({
		type: 'login'
	}));
})

$('#send').click(function () {
	if (!is_login) return throwError('你是谁啊？');
	let text = $('#text').val().replace(/{|}|\s/g, '');
	if (!text) return throwError('你想说啥？');
	if (text.length > 5) return throwError('你话怎么这么长？');
	ws.send(connectData({
		type: 'push_article',
		text: text,
	}));
	$('#text').val('');
});

$('#text').bind('keypress', function (e) {
	e = e || window.event;
	if (e.keyCode == 13) {
		setTimeout(() => $('#send').click(), 10);
	}
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