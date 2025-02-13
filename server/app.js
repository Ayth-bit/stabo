require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); // corsモジュールのインポート
const threadRoutes = require('./routes/thread');
const responseRoutes = require('./routes/response');
const fs = require('fs');

// MongoDB接続オプションを定義
const certFilePath = '/home/ec2-user/rds-ca.pem';
const mongodbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: false,
  sslCA: [fs.readFileSync(certFilePath)]
};
const app = express();
const PORT = 3000;

// MongoDBの接続設定を変更
const username = encodeURIComponent(process.env.DOCDB_USERNAME);
const password = encodeURIComponent(process.env.DOCDB_PASSWORD);
const clusterEndpoint = process.env.DOCDB_ENDPOINT;
const database = process.env.DOCDB_DATABASE;

const connectionString = `mongodb://${username}:${password}@${clusterEndpoint}:27017/${database}?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;

mongoose.connect(connectionString, mongodbOptions)
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