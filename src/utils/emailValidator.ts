export function isRealEmail(email?: string): boolean {
  if (!email || typeof email !== "string") return false;

  const value = email.trim().toLowerCase();

  // Basic RFC-style email regex
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!emailRegex.test(value)) return false;

  // Block disposable / fake domains
  const blockedDomains: string[] = [
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "yopmail.com",
    "trashmail.com",
    "fakeinbox.com",
  ];

  const [username, domain] = value.split("@");

  if (blockedDomains.includes(domain)) return false;

  // Block suspicious usernames
  const blockedUserPatterns: RegExp[] = [
    /^test/i,
    /^demo/i,
    /^fake/i,
    /^abc+/i,
    /^123+/,
    /noreply/i,
  ];

  if (blockedUserPatterns.some((pattern) => pattern.test(username))) {
    return false;
  }

  return true;
}
