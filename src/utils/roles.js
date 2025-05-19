// src/utils/roles.js
export const isAdmin = (user) => user?.role === 'admin';
export const isKoordynator = (user) => user?.role === 'koordynator';
export const isBok = (user) => user?.role === 'bok';
export const isZarzad = (user) => user?.role === 'zarzad';
export const isTsr = (user) => user?.role === 'tsr';
export const isUser = (user) => user?.role === 'user';
export const isManager = (user) => user?.role === 'manager';

