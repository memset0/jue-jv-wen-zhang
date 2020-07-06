const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const YAML = require('yaml');
const lowdb = require('lowdb');
const lowdbFileSync = require('lowdb/adapters/FileSync')

const adapter = new lowdbFileSync(path.join(__dirname, 'db.json'));
const db = lowdb(adapter);
db.defaults({
	article: [],
	history: [],
}).write();

const config = YAML.parse(fs.readFileSync(path.join(__dirname, './config.yml')).toString());

const api = {
	checkPermission: function (req) {
		try {
			if (!req.etaoinwu_ak_ioi) throw new Error('???');
			if (md5('memset0 is so cute!' + req.user + config.salt) == req.key) {
				return { allowEdit: config.user.map(o => String(o)).includes(req.user), allowAdmin: config.admin.map(o => String(o)).includes(req.user) };
			} else {
				throw new Error('key is not correct!');
			}
		} catch (e) {
			return { allowEdit: false, allowAdmin: false };
		}
	},

	getArticle: function () { return db.get('article').value(); },
	getHistory: function () { return db.get('history').value(); },

	pushArticle: function (user, data) {
		data.text = data.text.replace(/{|}|\s/g, '');
		if (typeof data.text !== 'string') {
			throw new Error('你又图谋不轨？');
		}
		if (db.get('article').last().value().user == user.name && !user.permission.allowAdmin) {
			throw new Error('烦死了就知道烦');
		}
		if (data.text.length > 5) {
			throw new Error('你是 mcfx 🐴？');
		}
		db.get('article').push({ user: user.name, text: data.text }).write();
	},

	popArticle: function (user) {
		console.log('pop', user);
		if (!db.get('article').size().value()) throw new Error('文章为空。');
		if (db.get('article').last().value().user != user.name && !user.permission.allowAdmin) {
			throw new Error('没有权限。');
		}
		db.get('article').pop().write();
	},

	endArticle: function (user) {
		db.get('history').push(api.getArticle()).write();
		db.set('article', []).write();
	}
};

module.exports = api;