import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(timezone);
const KOREA_TIMEZONE = 'Asia/Seoul';
const KST_ISO_PATTERN = 'YYYY-MM-DDTHH:mm:ssZ';
export const formatToKstIsoString = value => dayjs(value).tz(KOREA_TIMEZONE).format(KST_ISO_PATTERN);