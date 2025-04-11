import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'weather-trip';

if (!uri) {
  throw new Error('MongoDB URI가 설정되어 있지 않습니다.');
}

let client;
let clientPromise;

// 개발 환경에서 핫 리로딩 시 연결 유지
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

// 데이터베이스 객체 가져오기
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
} 