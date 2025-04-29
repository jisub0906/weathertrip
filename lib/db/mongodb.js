import { MongoClient, ObjectId } from 'mongodb';

// MongoDB 연결 문자열과 데이터베이스 이름 (환경 변수에서 로드)
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'weather-trip';

// MongoDB 클라이언트 및 연결 상태 변수
let client;
let clientPromise;
let isConnected = false;

/**
 * [목적] 개발 환경에서 핫 리로딩 시 클라이언트 재사용, 프로덕션에서는 새로 생성
 * [의도] 메모리 누수 및 중복 연결 방지
 */
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    global._mongoClientPromise = client.connect()
      .then(client => {
        isConnected = true;
        return client;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  clientPromise = client.connect()
    .then(client => {
      isConnected = true;
      return client;
    });
}

/**
 * [목적] 데이터베이스와 연결 후 클라이언트/DB 객체 반환
 * @returns { client, db }
 */
export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(dbName);
  return { client, db };
}

/**
 * [목적] 데이터베이스 객체 반환
 * @returns db 인스턴스
 */
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}

/**
 * [목적] 컬렉션 객체 반환 (없으면 생성)
 * @param collectionName - 컬렉션 이름
 * @returns 컬렉션 인스턴스
 */
export async function getCollection(collectionName) {
  const db = await getDatabase();
  const collection = db.collection(collectionName);
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    await db.createCollection(collectionName, { validator: {} });
  }
  return collection;
}

/**
 * [목적] 문자열을 ObjectId로 변환
 * @param id - 문자열 ID
 * @returns ObjectId 또는 null
 */
export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (error) {
    return null;
  }
}

/**
 * [목적] MongoDB 연결 상태를 확인 (ping)
 * @returns 연결 성공 여부 (boolean)
 */
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
    isConnected = false;
    try {
      await reconnect();
      return await checkConnection();
    } catch (reconnectError) {
      return false;
    }
  }
}

/**
 * [목적] MongoDB 클라이언트 재연결
 * @returns 재연결 성공 여부 (boolean)
 */
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
    isConnected = false;
    throw error;
  }
}

// 초기 연결 확인 (앱 시작 시 1회)
checkConnection();

// 내보내기
export { ObjectId };
export default clientPromise;