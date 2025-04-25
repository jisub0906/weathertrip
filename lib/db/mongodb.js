import { MongoClient, ObjectId } from 'mongodb';

// MongoDB 연결 문자열과 데이터베이스 이름 (환경 변수에서 가져옴)
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'weather-trip';

// MongoDB 연결 문자열이 없는 경우 오류 처리
if (!uri) {
  console.error('경고: MongoDB URI가 설정되어 있지 않습니다. 환경 변수를 확인하세요.');
}

let client;
let clientPromise;
let isConnected = false;

// 개발 환경에서 핫 리로딩 시 연결 유지
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 15000,
      retryWrites: true,
      retryReads: true
    });
    
    global._mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB 연결 성공 (개발 환경)');
        isConnected = true;
        return client;
      })
      .catch(err => {
        console.error('MongoDB 연결 오류 (개발 환경):', err);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    minPoolSize: 5,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 15000,
    retryWrites: true,
    retryReads: true
  });
  
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB 연결 성공 (프로덕션 환경)');
      isConnected = true;
      return client;
    })
    .catch(err => {
      console.error('MongoDB 연결 오류 (프로덕션 환경):', err);
      throw err;
    });
}

// 연결 상태 확인 함수
async function checkConnection() {
  try {
    if (isConnected) {
      return true;
    }
    
    const client = await clientPromise;
    const ping = await client.db(dbName).command({ ping: 1 });
    
    if (ping && ping.ok === 1) {
      console.log('MongoDB 연결 상태 확인 성공');
      isConnected = true;
      return true;
    } else {
      console.warn('MongoDB 연결 상태가 정상이 아닙니다:', ping);
      return false;
    }
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
async function reconnect() {
  try {
    if (client && client.topology && client.topology.isConnected()) {
      await client.close();
    }
    
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 15000,
      retryWrites: true,
      retryReads: true
    });
    
    clientPromise = client.connect();
    await clientPromise;
    console.log('MongoDB 재연결 성공');
    isConnected = true;
    return true;
  } catch (error) {
    console.error('MongoDB 재연결 오류:', error);
    isConnected = false;
    throw error;
  }
}

// 데이터베이스 연결 함수
export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    return { client, db };
  } catch (error) {
    console.error('MongoDB 연결 오류:', error);
    throw error;
  }
}

// 초기 연결 확인
checkConnection().catch(err => {
  console.error('초기 MongoDB 연결 체크 실패:', err);
});

export { ObjectId };

// 데이터베이스 객체 가져오기
export async function getDatabase() {
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    console.error('MongoDB 연결 오류:', error);
    throw error;
  }
}

// 컬렉션 가져오기
export async function getCollection(collectionName) {
  try {
    const db = await getDatabase();
    const collection = db.collection(collectionName);
    
    // 컬렉션 존재 여부 확인
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      console.log(`컬렉션 ${collectionName}이 존재하지 않습니다. 새로 생성합니다.`);
      await db.createCollection(collectionName, {
        validator: {} // 스키마 검증 비활성화
      });
    }
    
    return collection;
  } catch (error) {
    console.error(`컬렉션 ${collectionName} 접근 오류:`, error);
    throw new Error(`컬렉션 접근 실패: ${error.message}`);
  }
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

// MongoDB 연결 상태 체크 함수
export { checkConnection, reconnect };

export default clientPromise;