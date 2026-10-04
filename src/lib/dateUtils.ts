import dayjs from "dayjs";

const DISPLAY_DATE = "DD - MM - YYYY";
const DISPLAY_DATE_TIME = "DD - MM - YYYY · h:mm A";

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "";
  return dayjs(date).format(DISPLAY_DATE);
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return "";
  return dayjs(date).format(DISPLAY_DATE_TIME);
}
