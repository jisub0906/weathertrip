import { MongoClient, ObjectId } from 'mongodb';

// MongoDB 연결 문자열과 데이터베이스 이름
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'weather-trip';

if (!uri) {
  console.error('MongoDB URI가 설정되어 있지 않습니다.');
}

let client;
let clientPromise;
let isConnected = false;

// 개발 환경 핫 리로딩 대응
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    global._mongoClientPromise = client.connect()
      .then(client => {
        isConnected = true;
        return client;
      })
      .catch(err => {
        console.error('MongoDB 연결 실패(개발 환경):', err);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  clientPromise = client.connect()
    .then(client => {
      isConnected = true;
      return client;
    })
    .catch(err => {
      console.error('MongoDB 연결 실패(프로덕션 환경):', err);
      throw err;
    });
}

// 데이터베이스 연결
export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(dbName);
  return { client, db };
}

// 데이터베이스 가져오기
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}

// 컬렉션 가져오기 (없으면 생성)
export async function getCollection(collectionName) {
  const db = await getDatabase();
  const collection = db.collection(collectionName);

  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    await db.createCollection(collectionName, { validator: {} });
  }
  return collection;
}

// ObjectId 변환
export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.error('ObjectId 변환 오류:', error);
    return null;
  }
}

// 연결 상태 체크
export async function checkConnection() {
  try {
    if (isConnected) return true;
    const client = await clientPromise;
    const ping = await client.db(dbName).command({ ping: 1 });
    if (ping && ping.ok === 1) {
      isConnected = true;
      return true;
    }
    return false;
  } catch (error) {
    console.error('MongoDB 연결 확인 실패:', error);
    isConnected = false;
    try {
      await reconnect();
      return await checkConnection();
    } catch (reconnectError) {
      console.error('MongoDB 재연결 실패:', reconnectError);
      return false;
    }
  }
}

// 재연결 함수
export async function reconnect() {
  try {
    if (client && client.topology && client.topology.isConnected()) {
      await client.close();
    }
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    clientPromise = client.connect();
    await clientPromise;
    isConnected = true;
    return true;
  } catch (error) {
    console.error('MongoDB 재연결 오류:', error);
    isConnected = false;
    throw error;
  }
}

// 초기 연결 확인
checkConnection().catch(err => {
  console.error('초기 MongoDB 연결 체크 실패:', err);
});

// 내보내기
export { ObjectId };
export default clientPromise;