require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); // corsモジュールのインポート
const threadRoutes = require('./routes/thread');
const responseRoutes = require('./routes/response');

const app = express();
const PORT = 3000;

// const value =process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
// console.log(value);

// mongoose.connect('mongodb://localhost:27017/stabo', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch((error) => {
//   console.error('Error connecting to MongoDB:', error.message);
// });

// MongoDBの接続設定を変更
const mongodbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: false,
  sslCA: [fs.readFileSync('rds-combined-ca-bundle.pem')],
};

mongoose.connect('mongodb://aythbit:E:aT%Dzu-#VG5A@docdb-2025-02-13-12-00-39.cluster-cv6gs2soqnbq.ap-northeast-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false', mongodbOptions)
.then(() => {
  console.log('Connected to Amazon DocumentDB');
})
.catch((error) => {
  console.error('Error connecting to Amazon DocumentDB:', error.message);
});

// CORSの設定
app.use(cors());

app.use(bodyParser.json());
app.use('/api/threads', threadRoutes);
app.use('/api/responses', responseRoutes);

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, '..')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// ルートURLにアクセスした際にindex.htmlを送信
app.get('/map-app', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});