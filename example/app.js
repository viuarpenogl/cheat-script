const path = require('path');

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
