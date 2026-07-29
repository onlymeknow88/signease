# Plan: Upgrade Keamanan Autentikasi - SHA-256 ke bcrypt

## Status: Ready for Implementation

## Masalah Keamanan Kritis

**Current Implementation:**
- Password hashing menggunakan SHA-256 (`crypto.createHash("sha256")`)
- Tidak ada salt — password identik = hash identik
- Rentan terhadap rainbow table attacks
- GPU bisa crack billions of hashes per second
- TIDAK SESUAI standar keamanan modern

**Impact:**
- 🔴 **CRITICAL** - User passwords bisa di-crack dengan mudah
- Compliance risk untuk regulasi data privacy
- Reputational damage jika terjadi breach

---

## Solusi: Migrate ke bcrypt

**Why bcrypt?**
- ✅ Purpose-built untuk password hashing
- ✅ Automatic salt generation (per-password unique salt)
- ✅ Configurable work factor (computational cost)
- ✅ Resistant to brute-force attacks
- ✅ Industry standard (OWASP recommended)

**Alternative considered:**
- Argon2 (winner of Password Hashing Competition 2015) — lebih modern tapi bcrypt sudah proven
- scrypt — memory-hard tapi kurang adoption

---

## Implementation Plan

### Phase 1: Install Dependencies (5 min)

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

### Phase 2: Update Registration (15 min)

**File:** `src/app/api/auth/register/route.ts`

**Before (line 30-31):**
```typescript
// Hash password (SHA-256)
const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
```

**After:**
```typescript
import bcrypt from 'bcrypt';

// Hash password with bcrypt (12 rounds = 2^12 = 4096 iterations)
const hashedPassword = await bcrypt.hash(password, 12);
```

**Changes:**
1. Add `import bcrypt from 'bcrypt'` at top
2. Replace SHA-256 hashing with `bcrypt.hash(password, 12)`
3. Cost factor 12 = balance antara security vs performance (~250ms per hash)

### Phase 3: Update Login Authentication (15 min)

**File:** `src/lib/auth.ts`

**Before (lines 32-37):**
```typescript
const hashedPassword = crypto
  .createHash("sha256")
  .update(credentials.password)
  .digest("hex");

if (user.password !== hashedPassword) return null;
```

**After:**
```typescript
import bcrypt from 'bcrypt';

// Verify password with bcrypt
const isValid = await bcrypt.compare(credentials.password, user.password);
if (!isValid) return null;
```

**Changes:**
1. Add `import bcrypt from 'bcrypt'` at top
2. Replace hash comparison dengan `bcrypt.compare()`
3. `bcrypt.compare()` automatically extracts salt dari stored hash

### Phase 4: Password Policy Enforcement (10 min)

**File:** `src/app/api/auth/register/route.ts`

**Add validation before hashing (after line 12):**
```typescript
// Password policy validation
if (password.length < 8) {
  return NextResponse.json(
    { error: "Password harus minimal 8 karakter" }, 
    { status: 400 }
  );
}

// Optional: Enforce complexity (uncomment if needed)
// const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
// if (!passwordRegex.test(password)) {
//   return NextResponse.json(
//     { error: "Password harus mengandung huruf besar, kecil, dan angka" },
//     { status: 400 }
//   );
// }
```

### Phase 5: Remove Hardcoded Secret Fallback (5 min)

**File:** `src/lib/auth.ts`

**Before (line 87):**
```typescript
secret: process.env.NEXTAUTH_SECRET || "SIGN_EASE_FALLBACK_SECRET_FOR_DEV_PURPOSES",
```

**After:**
```typescript
secret: process.env.NEXTAUTH_SECRET,
```

**Ensure `.env` has:**
```bash
# Generate strong secret dengan:
# openssl rand -base64 32
NEXTAUTH_SECRET=<your-generated-secret-here>
```

### Phase 6: Secure Cookie Configuration (10 min)

**File:** `src/lib/auth.ts`

**Add after `session` config (after line 61):**
```typescript
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    }
  }
},
```

### Phase 7: Rate Limiting (Optional - 45 min)

**Install:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Setup Upstash Redis:**
1. Create free account di https://upstash.com
2. Create Redis database
3. Copy `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` ke `.env`

**File:** `src/lib/auth.ts`

**Add at top:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 minutes
  analytics: true,
});
```

**Add in `authorize()` method (after line 23):**
```typescript
// Rate limiting
const identifier = `login:${credentials.email}`;
const { success, reset } = await ratelimit.limit(identifier);

if (!success) {
  const resetDate = new Date(reset);
  throw new Error(
    `Terlalu banyak percobaan login. Coba lagi pada ${resetDate.toLocaleTimeString('id-ID')}`
  );
}
```

---

## Migration Strategy: Existing Users

**Problem:** Existing user passwords di-hash dengan SHA-256, tidak compatible dengan bcrypt

**Solution Options:**

### Option A: Force Password Reset (Recommended)
1. Deploy new code dengan bcrypt
2. Existing users tidak bisa login (password mismatch)
3. User click "Lupa Password"
4. Send reset link → set new password dengan bcrypt
5. Gradual migration tanpa downtime

**Pros:** Simple, secure, no dual-hash logic
**Cons:** User friction (harus reset password)

### Option B: Hybrid Verification with Migration
```typescript
// src/lib/auth.ts authorize() method
if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
  // bcrypt hash (starts with $2b$ or $2a$)
  const isValid = await bcrypt.compare(credentials.password, user.password);
  if (!isValid) return null;
} else {
  // Legacy SHA-256 hash
  const sha256Hash = crypto.createHash("sha256").update(credentials.password).digest("hex");
  if (user.password !== sha256Hash) return null;
  
  // Migrate to bcrypt on successful login
  const bcryptHash = await bcrypt.hash(credentials.password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: bcryptHash }
  });
}
```

**Pros:** Seamless user experience, auto-migration
**Cons:** More complex code, temporary dual-hash support

**Recommendation:** Use **Option B** untuk production app dengan existing users

---

## Testing Checklist

### Unit Tests
- [ ] bcrypt hashing produces different hash untuk same password (salt works)
- [ ] bcrypt.compare() returns true untuk correct password
- [ ] bcrypt.compare() returns false untuk incorrect password
- [ ] Password policy rejects passwords < 8 chars
- [ ] Rate limiter blocks after 5 attempts

### Integration Tests
- [ ] New user registration dengan bcrypt hash
- [ ] Login dengan correct credentials succeeds
- [ ] Login dengan incorrect credentials fails
- [ ] Existing SHA-256 user can login (if using hybrid approach)
- [ ] Existing SHA-256 user auto-migrates to bcrypt after login
- [ ] Session cookies have secure flags in production

### Security Tests
- [ ] Hashed password tidak reversible
- [ ] Same password produces different hashes
- [ ] bcrypt work factor is 12 (verify dengan inspection)
- [ ] Rate limiter active on login endpoint
- [ ] NEXTAUTH_SECRET tidak hardcoded

---

## Rollback Plan

**If issues arise:**
1. Revert commit: `git revert <commit-hash>`
2. Redeploy previous version
3. User passwords intact (SHA-256 masih di database)
4. No data loss

**If hybrid migration in progress:**
1. Some users sudah bcrypt, some masih SHA-256
2. Keep hybrid verification code
3. Continue gradual migration
4. Remove SHA-256 support setelah all users migrated

---

## Timeline & Effort

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Install bcrypt | 5 min | 🔴 Critical |
| 2 | Update registration | 15 min | 🔴 Critical |
| 3 | Update login auth | 15 min | 🔴 Critical |
| 4 | Password policy | 10 min | 🟡 High |
| 5 | Remove hardcoded secret | 5 min | 🟡 High |
| 6 | Secure cookies | 10 min | 🟡 High |
| 7 | Rate limiting | 45 min | 🟢 Medium |
| Testing | All tests | 30 min | 🔴 Critical |

**Total Critical Path:** ~1.5 hours
**Total with Optional:** ~2.5 hours

---

## Environment Variables Required

```bash
# .env (must have)
NEXTAUTH_SECRET=<generate-dengan-openssl-rand-base64-32>

# .env (optional - untuk rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## Performance Impact

**bcrypt vs SHA-256:**
- SHA-256: ~0.001ms per hash
- bcrypt (12 rounds): ~250ms per hash

**Why this is GOOD:**
- 250ms acceptable untuk login/register (user tidak notice)
- Attacker harus spend 250ms per attempt (billions of attempts = years)
- Work factor bisa di-tune: 10 rounds = ~60ms, 12 rounds = ~250ms, 14 rounds = ~1s

**Recommendation:** Start dengan 12 rounds, monitor performance, adjust jika perlu

---

## Security Compliance

**After implementation:**
- ✅ OWASP Password Storage Cheat Sheet compliant
- ✅ NIST SP 800-63B Digital Identity Guidelines compliant
- ✅ GDPR data protection principles
- ✅ Industry best practices

**Audit trail:**
- Document migration date
- Keep bcrypt version locked di package.json
- Security advisory: notify users via email (optional)

---

## References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt npm package](https://www.npmjs.com/package/bcrypt)
- [NextAuth.js Security Best Practices](https://next-auth.js.org/security)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)

---

## Next Steps

1. Review plan dengan team
2. Backup database sebelum deployment
3. Implement Phase 1-6 (critical + high priority)
4. Test di staging environment
5. Deploy ke production (off-peak hours)
6. Monitor error logs 24h post-deployment
7. Implement Phase 7 (rate limiting) jika needed
8. Remove SHA-256 fallback code setelah all users migrated (if hybrid approach)

---

**Plan Status:** ✅ Ready for Implementation
**Risk Level:** 🟡 Medium (with proper testing & rollback plan)
**Business Impact:** 🔴 Critical (prevents security breach)
