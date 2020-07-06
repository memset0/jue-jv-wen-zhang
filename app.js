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

let clients = [];

function updateAllArticle() { clients.forEach(ws => ws.send(JSON.stringify({ type: 'update_article', article: api.getArticle() }))); }
function updateAllHistory() { clients.forEach(ws => ws.send(JSON.stringify({ type: 'update_article', article: api.getArticle() }))); }

app.ws('/', function (ws, req) {
	clients.push(ws);
	ws.on('message', function (event) {
		try {
			event = JSON.parse(event);
			let data = event.data;
			let user = { name: event.user, permission: api.checkPermission(event) };
			console.log(user, data);
			({
				push_article: function (ws, user, data) {
					api.pushArticle(user, data);
					updateAllArticle();
				},
				pop_article: function (ws, user) {
					api.popArticle(user);
					updateAllArticle();
				},
				end_article: function (ws, user) {
					api.endArticle(user);
					updateAllArticle(), updateAllHistory();
				},
				login: function (ws, user) {
					if (user && user.permission && user.permission.allowEdit) {
						ws.send(JSON.stringify({ type: 'login' }));
						updateAllArticle(), updateAllHistory();
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
	ws.onclose = function () {
		clients = clients.filter(client => client !== ws);
	};
});

app.listen(process.env.PORT || 4514);
