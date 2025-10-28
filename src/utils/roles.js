// src/utils/roles.js
export const isAdmin = (user) => user?.role === 'admin';
export const isKoordynator = (user) => user?.role === 'koordynator';
export const isBok = (user) => user?.role === 'bok';
export const isMkg = (user) => user?.role === 'mkg';
export const isZarzad = (user) => user?.role === 'zarzad';
export const isTsr = (user) => user?.role === 'tsr';
export const isUser = (user) => user?.role === 'user';
export const isManager = (user) => user?.role === 'manager';
export const isViewer = (user) => user?.role === 'viewer';
export const isReadOnly = (user) =>
    ['tsr', 'manager', 'zarzad'].includes(user?.role);
export const isAdminManager = (user) =>
    ['admin', 'manager', 'zarzad', 'bok', 'mkg'].includes(user?.role);
export const isAdminZarzad = (user) =>
    ['admin', 'zarzad', 'mkg'].includes(user?.role);
