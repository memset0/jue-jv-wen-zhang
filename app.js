const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const express = require('express');
const expressWs = require('express-ws');

const api = require('./api.js');
let app = express();
expressWs(app);

const config = YAML.parse(fs.readFileSync(path.join(__dirname, './config.yml')).toString());
app.get('/', function (req, res) { res.send(fs.readFileSync(path.join(__dirname, './index.html')).toString()); });
app.get('/script.js', function (req, res) { res.send(fs.readFileSync(path.join(__dirname, './script.js')).toString().replace('WebSocketUrl', config.ws)); });

app.ws('/', function (ws, req) {
	ws.on('message', function (event) {
		try {
			event = JSON.parse(event);
			let data = event.data;
			let user = { name: event.user, permission: api.checkPermission(event) };
			// console.log('ws message', user, data);
			({
				push_article: function (ws, user, data) {
					api.pushArticle(user, data);
					ws.send(JSON.stringify({ type: 'update_article', article: api.getArticle() }));
				},
				pop_article: function (ws, user) {
					api.popArticle(user);
					ws.send(JSON.stringify({ type: 'update_article', article: api.getArticle() }));
				},
				end_article: function (ws, user) {
					api.endArticle(user);
					ws.send(JSON.stringify({ type: 'update_article', article: api.getArticle() }));
					ws.send(JSON.stringify({ type: 'update_history', history: api.getHistory() }));
				},
				login: function (ws, user) {
					console.log(user);
					if (user && user.permission && user.permission.allowEdit) {
						ws.send(JSON.stringify({ type: 'login' }));
						ws.send(JSON.stringify({ type: 'update_article', article: api.getArticle() }));
						ws.send(JSON.stringify({ type: 'update_history', history: api.getHistory() }));
					} else {
						ws.send(JSON.stringify({ type: 'error', message: '密码错误' }));
					}
				}
			}[data.type])(ws, user, data);
		} catch (e) {
			console.log('error', e);
			ws.send(JSON.stringify({ type: 'error', message: e }));
		}
	});
});

app.listen(process.env.PORT || 4514);
