import { io } from 'socket.io-client';

let socketInstance = null;

export const initializeSocket = (projectId) => {
  const token = localStorage.getItem('token');

  socketInstance = io(import.meta.env.VITE_API_URL, {
    auth: {
      token
    },
    query: {
      projectId
    }
  });

  return socketInstance;
}

export const receiveMessage = (eventName, cb) => {
  socketInstance.on(eventName, cb);
}

export const sendMessage = (eventName, data) => {
  socketInstance.emit(eventName, data);
}