// lib/middlewares/errorHandler.js

import { checkConnection, reconnect } from '../db/mongodb';

/**
 * API 응답용 에러 핸들러 미들웨어
 * @param handler - 원본 API 핸들러 함수
 * @returns 에러 처리 래핑된 핸들러
 */
export const withErrorHandler = (handler) => {
  return async (req, res) => {
    try {
      // MongoDB 연결 상태 확인 및 필요시 재연결
      const isConnected = await checkConnection();
      if (!isConnected) {
        try {
          await reconnect();
        } catch (reconnectError) {
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
      console.error('API 에러:', error);
      // 몽고DB 연결 오류 처리
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
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  };
};

/**
 * 유효성 검사 실패 응답 생성 함수
 * @param res - 응답 객체
 * @param message - 에러 메시지
 * @param fields - 유효성 실패 필드 정보
 * @returns 400 응답
 */
export function validationError(res, message, fields) {
  return res.status(400).json({
    message: message || '입력값 검증에 실패했습니다.',
    error: 'validation_error',
    status: 400,
    fields: fields || {}
  });
}

/**
 * 중복 데이터 오류 응답 생성 함수
 * @param res - 응답 객체
 * @param message - 에러 메시지
 * @param field - 중복 필드명
 * @returns 409 응답
 */
export function duplicateError(res, message, field) {
  return res.status(409).json({
    message: message || '중복된 데이터가 존재합니다.',
    error: 'duplicate_error',
    status: 409,
    field
  });
}

/**
 * 인증 오류 응답 생성 함수
 * @param res - 응답 객체
 * @param message - 에러 메시지
 * @returns 401 응답
 */
export function authError(res, message) {
  return res.status(401).json({
    message: message || '인증에 실패했습니다.',
    error: 'authentication_error',
    status: 401
  });
}

/**
 * 권한 오류 응답 생성 함수
 * @param res - 응답 객체
 * @param message - 에러 메시지
 * @returns 403 응답
 */
export function forbiddenError(res, message) {
  return res.status(403).json({
    message: message || '접근 권한이 없습니다.',
    error: 'forbidden_error',
    status: 403
  });
}

/**
 * 리소스 없음 오류 응답 생성 함수
 * @param res - 응답 객체
 * @param message - 에러 메시지
 * @param resource - 리소스 정보
 * @returns 404 응답
 */
export function notFoundError(res, message, resource) {
  return res.status(404).json({
    message: message || '요청한 리소스를 찾을 수 없습니다.',
    error: 'not_found_error',
    status: 404,
    resource
  });
}