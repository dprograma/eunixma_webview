export type BridgeMessage = {
  type: IncomingMessageType;
  payload?: Record<string, unknown>;
  requestId?: string;
};

export type IncomingMessageType =
  | 'REQUEST_BIOMETRIC'
  | 'REQUEST_CAMERA'
  | 'REQUEST_FILE_PICK'
  | 'GET_PUSH_TOKEN'
  | 'SET_BIOMETRIC_LOCK'
  | 'NAVIGATE'
  | 'LOG';

export type OutgoingMessageType =
  | 'BIOMETRIC_RESULT'
  | 'CAMERA_RESULT'
  | 'FILE_PICK_RESULT'
  | 'PUSH_TOKEN'
  | 'PUSH_NOTIFICATION'
  | 'CONNECTIVITY_CHANGE'
  | 'ERROR';
