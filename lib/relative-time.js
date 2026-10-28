/** "Дөнгөж сая", "5 минутын өмнө", "2 цагийн өмнө", "Өчигдөр", "3 өдрийн өмнө". */
export function relativeTime(timestamp, language = "mn", now = new Date()) {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(timestamp).getTime()) / 60_000));
  if (minutes < 1) return language === "en" ? "Just now" : "Дөнгөж сая";
  if (minutes < 60) {
    if (language === "en") return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    return `${minutes} минутын өмнө`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (language === "en") return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    return `${hours} цагийн өмнө`;
  }
  const days = Math.floor(hours / 24);
  if (language === "en") return days === 1 ? "Yesterday" : `${days} days ago`;
  return days === 1 ? "Өчигдөр" : `${days} өдрийн өмнө`;
}

export function relativeTimeMn(timestamp, now = new Date()) {
  return relativeTime(timestamp, "mn", now);
}
