import { isTsr } from "./roles";

export const canEditVisit = (visit, user) => {
  const createdAt = new Date(visit.created_at);
  const now = new Date();
  const diffInSeconds = (now - createdAt) / 1000;
  const isAfter24h = diffInSeconds > 86400;

  return !isTsr(user) || (isTsr(user) && !isAfter24h);
};
