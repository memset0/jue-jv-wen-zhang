const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const YAML = require('yaml');

const config = YAML.parse(fs.readFileSync(path.join(__dirname, './config.yml')).toString());

user = 779721760;
key = md5('memset0 is so cute!' + user + config.salt);

console.log(user, key);