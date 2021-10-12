#!/bin/bash

init_npm () {
  npm init -y;
  npx create-gitignore Node;
  npm install --save express morgan hbs;
  npm install --save sequelize pg pg-hstore;
  npm install --save bcrypt connect-redis redis express-session;
  npm install --save-dev sequelize-cli nodemon;

  echo "\n>>>>>>>>>>>> npm project initialized created!\n";
}

init_folder_structure () {
  mkdir -p public/{js,css} src/{db,controllers,routes,views/partials};
  touch app.js public/js/main.js src/views/{main.hbs,layout.hbs} src/routes/index.js;

  echo "\n>>>>>>>>>>>> folder structure created!\n";
}

init_sequelizerc () {
  sequelizerc_text="const path = require('path');

module.exports = {
  'config': path.resolve('src', 'db', 'config', 'database.json'),
  'models-path': path.resolve('src', 'db', 'models'),
  'seeders-path': path.resolve('src', 'db', 'seeders'),
  'migrations-path': path.resolve('src', 'db', 'migrations')
};"
  echo "$sequelizerc_text" > .sequelizerc;

  echo "\n>>>>>>>>>>>> .sequelizerc file created!\n";
}

init_sequelize () {
  npx sequelize init --force;

  local user_name="$1";
  local user_pass="$2";
  local db_name="$3";
  local path="$4";

  local keys=(username password database host dialect seederStorage seederStorageTableName);
  local values=($user_name $user_pass $db_name "127.0.0.1" postgres sequelize SequelizeData);

  write_target_in_config () {
    echo "\t\"$1\": {" >> $path;
    for i in {0..5}
    do
      echo "\t\t\"${keys[$i]}\": \"${values[$i]}\"," >> $path;
    done
    echo "\t\t\"${keys[6]}\": \"${values[6]}\"" >> $path;
    echo "\t$2" >> $path;
  }

  echo "{" > $path;
  write_target_in_config development "},";
  write_target_in_config test "},";
  write_target_in_config production "}";
  echo "}" >> $path;

  echo "\n>>>>>>>>>>>> sequelize initialized!\n";
}

init_hbs () {
  local layout_hbs_text='<!DOCTYPE html>
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
</html>';
  echo "$layout_hbs_text" > src/views/layout.hbs;

  echo '<h1>Всё работает</h1>' > src/views/main.hbs;



  echo "\n>>>>>>>>>>>> handlebars initialized!\n";
}

init_eslint () {
  npm install --save-dev eslint;
  npx eslint --init;
  echo "\n>>>>>>>>>>>> eslint initialized!\n";
}

init_app_file () {
  echo "const path = require('path');

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
" > ./app.js;

echo "\n>>>>>>>>>>>> app.js initialized!\n";
}

init_index_route() {
  echo "const fs = require('fs');
const path = require('path');

let routes = {};

fs.readdirSync(__dirname).forEach((routeFileName) => {
  const routeName = routeFileName.slice(0, routeFileName.indexOf('.'));
  routes[routeName] = require(path.join(__dirname, routeFileName));
});

module.exports = routes;
" > ./src/routes/index.js;

echo "\n>>>>>>>>>>>> index router initialized!\n";
}

init_main_router() {
  echo "const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('main');
})

module.exports = router;
" > ./src/routes/main.router.js;

echo "\n>>>>>>>>>>>> main.router initialized!\n";
}




init_npm;
init_folder_structure;
init_sequelizerc;
init_sequelize $1 $2 $3 ./src/db/config/database.json;
init_hbs;
# init_eslint;
init_app_file;
init_index_route;
init_main_router;

echo "\n>>>>>>>>>>>> Скрипты в package.json НЕ СОЗДАЮТСЯ АВТОМАТИЧЕСКИ\n"


