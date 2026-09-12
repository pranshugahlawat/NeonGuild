import { formatDistanceToNowStrict } from "date-fns";

export function relTime(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}