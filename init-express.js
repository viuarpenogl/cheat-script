// const f = require('__scripts');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');

function install() {
  return exec(`
npm init -y;
rm .gitignore;
npx create-gitignore Node;
npm install --save express morgan hbs;
npm install --save sequelize pg pg-hstore;
npm install --save bcrypt connect-redis redis express-session;
npm install --save-dev sequelize-cli nodemon;
`
  );
}

function add_dev_start_scripts() {
  const package = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  package.scripts['start'] = 'node app.js';
  package.scripts['dev'] = 'nodemon app.js';
  fs.writeFileSync('package.json', JSON.stringify(package, null, 2));
}

function init_folder_structure() {
  return exec(`
mkdir -p public/{js,css} src/{db,controllers,routes,views/partials};
touch app.js public/js/main.js src/views/{main.hbs,layout.hbs} src/routes/index.js;
  `)
}

function init_sequelizerc() {
  let sequelizerc_text=`const path = require('path');

module.exports = {
  'config': path.resolve('src', 'db', 'config', 'database.json'),
  'models-path': path.resolve('src', 'db', 'models'),
  'seeders-path': path.resolve('src', 'db', 'seeders'),
  'migrations-path': path.resolve('src', 'db', 'migrations')
};`
  fs.writeFileSync('.sequelizerc', sequelizerc_text);
}

function init_dbconfig(name, pass, dbname) {
  const configPath = path.join(process.env.PWD, 'src', 'db', 'config', 'database.json');
     
  function writeConfig(path, target, ending) {
    fs.appendFileSync(
      path, 
    `
  "${target}": {
    "username": "${name}",
    "password": "${pass}",
    "database": "${dbname}",
    "host": "127.0.0.1",
    "dialect": "postgres",
    "seederStorage": "sequelize",
    "seederStorageTableName": "SequelizeData"
  }${ending}`);
  }
     
  fs.writeFileSync(configPath, '{');
  writeConfig(configPath, 'development', ',');
  writeConfig(configPath, 'test', ',');
  writeConfig(configPath, 'production', '\n}\n');
}

function init_hbs() {
  const layout_hbs_text=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-F3w7mX95PdgyTmZZMECAngseQB83DfGTowi0iMjiWaeVhAn4FJkqJByhZMI3AhiU" crossorigin="anonymous">
  <script defer src="/js/main.js"></script>
  <title>Document</title>
</head>
<body>
  {{{body}}}
</body>
</html>`;
  fs.writeFileSync('./src/views/layout.hbs', layout_hbs_text);
  fs.writeFileSync('./src/views/main.hbs', '<h1>Всё работает</h1>');
}

function init_app_file () {
  const app_text = `const path = require('path');

const express = require('express');
const logger = require('morgan');
const hbs = require('hbs');

const routes = require(path.join(process.env.PWD, 'src', 'routes')); // для автоматического подключения роутов

////{ Всё для сессий:
const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);

const redisClient = redis.createClient();

const sessionConfig = {
  store: new RedisStore({ host: 'localhost', port: 6379, client: redisClient }), // хранилище сессий
  key: 'sid', // ключ куки (название куки)
  secret: 'mysecret', // для шифрования id сессии
  resave: false, // сессия будет сохраняться заново только при изменениях
  saveUninitialized: false, // сохранение (или не сохранение) не инициализированной сессии
  // невозможно изменить куку с фронта
  cookie: {
    expires: 24 * 60 * 60e3,
    httpOnly: true,
    // secure: true,
    // sameSite: 'none',
  },
}
////} Всё для сессий:


const PORT = 3000;

const app = express();
hbs.registerPartials(path.join(process.env.PWD, 'src', 'views', 'partials'));

app.set('view engine', 'hbs');
app.set('views', path.join(process.env.PWD, 'src', 'views'));

app.use(express.static(path.join(process.env.PWD, 'public')));

app.use(logger('dev'));

app.use(express.json()); // <- 'application/json'
app.use(express.urlencoded({ extended: true })); // <- 'application/x-www-form-urlencoded'

// Для того, чтобы выводить в hbs'ки данные о пользователе
app.use((req, res, next) => {
  //res.locals.userId = req.session?.userId;
  next();
});

////{ Подключение роутов
app.use('/', routes.main);
// app.use('/example', routes.example);
////} Подключение роутов

app.listen(PORT, () => {
 console.log('Dobro on port: ', PORT)
});
`;

  fs.writeFileSync('./app.js', app_text);
}

function init_index_route() {
  const data = `const fs = require('fs');
const path = require('path');

let routes = {};

fs.readdirSync(__dirname).forEach((routeFileName) => {
  const routeName = routeFileName.slice(0, routeFileName.indexOf('.'));
  routes[routeName] = require(path.join(__dirname, routeFileName));
});

module.exports = routes;
`; 
  fs.writeFileSync('./src/routes/index.js', data);
}

function init_main_router() {
  const data = `const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('main');
})

module.exports = router;
`;
  fs.writeFileSync('./src/routes/main.router.js', data);
}


install()
  .then(() => {
    add_dev_start_scripts();
    console.log('\n>>>>>>>>>>>> npm project created!');
    return init_folder_structure();
  })
  .then(() => {
    console.log('\n>>>>>>>>>>>> folder structure created!');
    init_sequelizerc();
    console.log("\n>>>>>>>>>>>> .sequelizerc file created!");
    return exec('npx sequelize init --force;');
  })
  .then(() => {
    const [_1, _2, name, pass, dbname] = process.argv;
    init_dbconfig(name, pass, dbname)
    console.log('\n>>>>>>>>>>>> database.json updated!')
    init_hbs();
    console.log("\n>>>>>>>>>>>> handlebars initialized!");
    init_app_file();
    console.log("\n>>>>>>>>>>>> app.js initialized!");
    init_index_route();
    console.log("\n>>>>>>>>>>>> index router initialized!");
    init_main_router();
    console.log("\n>>>>>>>>>>>> main.router initialized!\n");
  })
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    process.exit();
  });