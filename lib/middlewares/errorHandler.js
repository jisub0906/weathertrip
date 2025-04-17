// lib/middlewares/errorHandler.js

/**
 * API 응답용 에러 핸들러 미들웨어
 * 
 * 이 미들웨어는 API 엔드포인트에서 발생한 예외를 일관된 방식으로 처리합니다.
 * 이 파일을 /lib/middlewares 디렉토리에 저장하고 API 라우트에서 사용합니다.
 */

import { checkConnection, reconnect } from '../db/mongodb';

export const withErrorHandler = (handler) => {
  return async (req, res) => {
    try {
      // MongoDB 연결 상태 확인
      const isConnected = await checkConnection();
      
      if (!isConnected) {
        console.warn('API 요청 처리 전 MongoDB 연결 상태 불량. 재연결 시도...');
        try {
          await reconnect();
        } catch (reconnectError) {
          console.error('MongoDB 재연결 실패:', reconnectError);
          return res.status(503).json({
            message: '데이터베이스 서비스를 현재 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
            error: 'database_unavailable',
            status: 503
          });
        }
      }
      
      // 원래 핸들러 실행
      return await handler(req, res);
    } catch (error) {
      console.error('API 요청 처리 중 오류 발생:', error);
      
      // 몽고DB 관련 오류 처리
      if (error.name === 'MongoNetworkError' || 
          error.name === 'MongoServerSelectionError' ||
          error.message.includes('topology was destroyed')) {
        return res.status(503).json({
          message: '데이터베이스 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          error: 'database_connection_error',
          status: 503
        });
      }
      
      // 몽고DB ID 관련 오류
      if (error.name === 'BSONTypeError' || error.message.includes('ObjectId')) {
        return res.status(400).json({
          message: '잘못된 ID 형식입니다.',
          error: 'invalid_id_format',
          status: 400
        });
      }
      
      // 그 외 일반 오류
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message: error.message || '서버 오류가 발생했습니다.',
        error: error.code || 'server_error',
        status: statusCode,
        // 개발 환경에서만 스택 트레이스 포함
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  };
};

// 유효성 검사 실패 응답 생성 함수
export function validationError(res, message, fields) {
  return res.status(400).json({
    message: message || '입력값 검증에 실패했습니다.',
    error: 'validation_error',
    status: 400,
    fields: fields || {}
  });
}

// 중복 데이터 오류 응답 생성 함수 
export function duplicateError(res, message, field) {
  return res.status(409).json({
    message: message || '중복된 데이터가 존재합니다.',
    error: 'duplicate_error',
    status: 409,
    field
  });
}

// 인증 오류 응답 생성 함수
export function authError(res, message) {
  return res.status(401).json({
    message: message || '인증에 실패했습니다.',
    error: 'authentication_error',
    status: 401
  });
}

// 권한 오류 응답 생성 함수
export function forbiddenError(res, message) {
  return res.status(403).json({
    message: message || '접근 권한이 없습니다.',
    error: 'forbidden_error',
    status: 403
  });
}

// 리소스 없음 오류 응답 생성 함수
export function notFoundError(res, message, resource) {
  return res.status(404).json({
    message: message || '요청한 리소스를 찾을 수 없습니다.',
    error: 'not_found_error',
    status: 404,
    resource
  });
}