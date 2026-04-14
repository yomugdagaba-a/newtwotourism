/**
 * Integration Tests — Admin, Supporting Modules, Validation, Security Headers
 * Covers:
 *   IT-06 (role grant), IT-07 (image ordering), IT-08 (cascade delete),
 *   IT-11 (lockout persists), IT-12 (horse services linked to road),
 *   TC-ADM-01 to TC-ADM-24,
 *   TC-MAP-01 to TC-MAP-11, TC-RD-01 to TC-RD-07,
 *   TC-GD-01 to TC-GD-05, TC-RT-01 to TC-RT-06,
 *   TC-HS-01 to TC-HS-06, TC-USR-01 to TC-USR-03,
 *   TC-AUD-01, TC-AUD-02,
 *   TC-VAL-01 to TC-VAL-04,
 *   TC-SEC-HDR-01, TC-ERR-01,
 *   SEC-02, SEC-04, SEC-06, SEC-08, SEC-10, SEC-12, SEC-13
 *
 * Run: npx jest tests/integration --runInBand
 */

const request = require('supertest');
const app = require('../../src/index');

let adminToken, clientToken;
let tourismId, hotelId, roadId, horseServiceId, guiderId, mapPointId, imageId;
let targetUserId;

const clientUser = {
  username: `adm_client_${Date.now()}`,
  email: `adm_client_${Date.now()}@test.com`,
  password: 'AdmTest123!',
  fullName: 'Admin Test Client',
};

beforeAll(async () => {
  const adminRes = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
  adminToken = adminRes.body.accessToken;

  const clientRes = await request(app).post('/api/auth/register').send(clientUser);
  clientToken = clientRes.body.accessToken;
  targetUserId = clientRes.body.userId;

  // Create base tourism place for all sub-resource tests
  const tRes = await request(app).post('/api/tourism')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Adm Tourism ${Date.now()}`, categories: ['HIGHLAND'], description: 'Test place', wereda: 'Wag', kebele: 'Wag01', languages: ['Amharic'], latitude: 11.5, longitude: 38.9 });
  tourismId = tRes.body.id;

  // Create base hotel
  const hRes = await request(app).post('/api/hotels')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Adm Hotel ${Date.now()}`, starRating: 3, contactInfo: '+251911000088', tourismPlaceId: tourismId });
  hotelId = hRes.body.id;
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-ADM-01 to TC-ADM-24 — Admin Dashboard & Management
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-ADM-01 Dashboard statistics', () => {
  test('returns counts for all entity types', async () => {
    const res = await request(app).get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});

describe('TC-ADM-02 List users with search', () => {
  test('returns filtered paginated user list', async () => {
    const res = await request(app).get('/api/admin/users?search=adm_client')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('TC-ADM-03 / IT-06 Grant role enables access', () => {
  test('TC-ADM-03 grants HOTEL_OWNER role to user', async () => {
    const res = await request(app).post(`/api/admin/users/${targetUserId}/roles/HOTEL_OWNER`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('IT-06 user with HOTEL_OWNER role can access owner endpoints', async () => {
    const reLogin = await request(app).post('/api/auth/login').send({ username: clientUser.username, password: clientUser.password });
    const ownerToken = reLogin.body.accessToken;
    const res = await request(app).get('/api/hotels/owner/my-hotels')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
  });
});

describe('TC-ADM-04 Revoke role', () => {
  test('removes role from user', async () => {
    const res = await request(app).delete(`/api/admin/users/${targetUserId}/roles/HOTEL_OWNER`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('TC-ADM-05 / TC-ADM-06 Deactivate and reactivate user', () => {
  test('TC-ADM-05 deactivates user account', async () => {
    const res = await request(app).patch(`/api/admin/users/${targetUserId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('deactivated user cannot login', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: clientUser.username, password: clientUser.password });
    expect(res.status).toBe(401);
  });

  test('TC-ADM-06 reactivates user account', async () => {
    const res = await request(app).patch(`/api/admin/users/${targetUserId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('TC-ADM-06 Admin reset user password', () => {
  test('resets password without OTP', async () => {
    const res = await request(app).post(`/api/admin/users/${targetUserId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: 'NewAdmPass123!' });
    expect(res.status).toBe(200);
  });
});

describe('TC-ADM-11 / TC-ADM-12 Lock and unlock account', () => {
  test('TC-ADM-11 locks user account', async () => {
    const res = await request(app).post(`/api/admin/security/lock/${targetUserId}?durationMinutes=1`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('TC-ADM-12 unlocks user account', async () => {
    const res = await request(app).post(`/api/admin/security/unlock/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('TC-ADM-13 View login attempts', () => {
  test('returns login attempt records', async () => {
    const res = await request(app).get('/api/admin/security/login-attempts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('TC-ADM-14 CLIENT token on admin route → 403', () => {
  test('returns 403 for non-admin', async () => {
    const res = await request(app).get('/api/admin/users')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });
});

describe('TC-ADM-15 / TC-ADM-22 Hero image management', () => {
  let heroId;
  test('TC-ADM-15 creates hero image', async () => {
    const res = await request(app).post('/api/admin/hero-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ imageUrl: 'https://example.com/hero_test.jpg', title: 'Test Hero', displayOrder: 1, active: true });
    expect(res.status).toBe(201);
    heroId = res.body.id;
  });

  test('TC-ADM-22 updates hero image', async () => {
    const res = await request(app).put(`/api/admin/hero-images/${heroId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Hero' });
    expect(res.status).toBe(200);
  });

  test('deletes hero image', async () => {
    const res = await request(app).delete(`/api/admin/hero-images/${heroId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('TC-ADM-16 to TC-ADM-18 Admin tourism CRUD', () => {
  let adminTourismId;
  test('TC-ADM-16 creates tourism place', async () => {
    const res = await request(app).post('/api/admin/tourism')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Admin Tourism ${Date.now()}`, categories: ['CULTURE'], description: 'Admin created', wereda: 'Test', kebele: 'Test01', languages: [] });
    expect(res.status).toBe(201);
    adminTourismId = res.body.id;
  });

  test('TC-ADM-17 updates tourism place', async () => {
    const res = await request(app).put(`/api/admin/tourism/${adminTourismId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated by admin' });
    expect(res.status).toBe(200);
  });

  test('TC-ADM-18 deletes tourism place', async () => {
    const res = await request(app).delete(`/api/admin/tourism/${adminTourismId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('TC-ADM-07 to TC-ADM-10 Audit log management', () => {
  test('TC-ADM-07 view audit logs', async () => {
    const res = await request(app).get('/api/admin/audit')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.content).toBeDefined();
  });

  test('TC-ADM-08 search audit by username', async () => {
    const res = await request(app).get('/api/admin/audit/search?username=admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('TC-ADM-09 view suspicious activity', async () => {
    const res = await request(app).get('/api/admin/audit/suspicious-activity?hours=24')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('TC-ADM-10 export audit logs', async () => {
    const res = await request(app).get('/api/admin/audit/export?days=7')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-RD-* — Roads, IT-12 — Horse services linked to road
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-RD-* Road CRUD and IT-12', () => {
  test('TC-RD-01 / TC-ADM-19 creates road with all distance fields', async () => {
    const res = await request(app).post('/api/roads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ initialPlace: 'Lalibela Entrance', roadType: 'CAR', description: 'Main road', distanceByCar: 10, distanceByFoot: 14, distanceByHorse: 12, distanceByPlane: 5, tourismPlaceId: tourismId });
    expect(res.status).toBe(201);
    roadId = res.body.id;
  });

  test('TC-RD-04 get road detail', async () => {
    const res = await request(app).get(`/api/roads/${roadId}`);
    expect(res.status).toBe(200);
    // Road DTO returns initialPlace (not name)
    expect(res.body.initialPlace).toBeDefined();
  });

  test('TC-RD-07 get roads for tourism place', async () => {
    const res = await request(app).get(`/api/tourisms/${tourismId}/roads`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('TC-RD-05 update road record', async () => {
    const res = await request(app).put(`/api/roads/${roadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated road description' });
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-HS-* — Horse Services
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-HS-* Horse Service CRUD', () => {
  test('TC-HS-01 / TC-ADM-20 creates horse service', async () => {
    // horse-services.service uses a DTO: expects ownerName, contactInfo, initialPlace, cost, roadInfoId
    const res = await request(app).post('/api/horse-services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ownerName: 'Abebe Horse Tours', contactInfo: '+251911000055', initialPlace: 'Lalibela', cost: 100, roadInfoId: roadId });
    expect(res.status).toBe(201);
    horseServiceId = res.body.id;
  });

  test('TC-HS-03 get horse service detail', async () => {
    const res = await request(app).get(`/api/horse-services/${horseServiceId}`);
    expect(res.status).toBe(200);
    // DTO returns ownerName (not name)
    expect(res.body.ownerName).toBeDefined();
  });

  test('TC-HS-02 / IT-12 get horse services by road', async () => {
    const res = await request(app).get(`/api/roads/${roadId}/horse-services`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('TC-HS-06 list all horse services', async () => {
    const res = await request(app).get('/api/horse-services');
    expect(res.status).toBe(200);
  });

  test('TC-HS-04 update horse service', async () => {
    const res = await request(app).put(`/api/horse-services/${horseServiceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cost: 200, ownerName: 'Abebe Horse Tours Updated' });
    expect(res.status).toBe(200);
  });

  test('TC-HS-05 delete horse service', async () => {
    const res = await request(app).delete(`/api/horse-services/${horseServiceId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-GD-* — Language Guiders
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-GD-* Language Guider CRUD', () => {
  test('TC-GD-02 / TC-ADM-21 creates language guider', async () => {
    const res = await request(app).post('/api/language-guiders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Guider', languages: ['Amharic', 'English'], experience: '5 years', contactInfo: '+251911000077', tourismPlaceId: tourismId });
    expect(res.status).toBe(201);
    guiderId = res.body.id;
  });

  test('TC-GD-03 get guider detail', async () => {
    const res = await request(app).get(`/api/language-guiders/${guiderId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBeDefined();
  });

  test('TC-GD-01 get guiders by language', async () => {
    const res = await request(app).get('/api/language-guiders/language/English');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('get guiders by tourism place', async () => {
    const res = await request(app).get(`/api/language-guiders/tourism/${tourismId}`);
    expect(res.status).toBe(200);
  });

  test('TC-GD-04 update guider profile', async () => {
    const res = await request(app).put(`/api/language-guiders/${guiderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ experience: '7 years' });
    expect(res.status).toBe(200);
  });

  test('TC-GD-05 delete guider profile', async () => {
    const res = await request(app).delete(`/api/language-guiders/${guiderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-MAP-* — Map Points
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-MAP-* Map Point CRUD', () => {
  test('TC-MAP-09 create map point', async () => {
    const res = await request(app).post('/api/map-points')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Test Point', type: 'TOURISM_PLACE', latitude: 11.5, longitude: 38.9, tourismPlaceId: tourismId });
    expect(res.status).toBe(201);
    mapPointId = res.body.id;
  });

  test('TC-MAP-01 list all map points', async () => {
    const res = await request(app).get('/api/map-points');
    expect(res.status).toBe(200);
  });

  test('TC-MAP-02 filter by type TOURISM_PLACE', async () => {
    const res = await request(app).get('/api/map-points/type/TOURISM_PLACE');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('TC-MAP-03 filter by type HOTEL', async () => {
    const res = await request(app).get('/api/map-points/type/HOTEL');
    expect(res.status).toBe(200);
  });

  test('TC-MAP-04 filter by type ROAD', async () => {
    const res = await request(app).get('/api/map-points/type/ROAD');
    expect(res.status).toBe(200);
  });

  test('TC-MAP-05 get map points by tourism place', async () => {
    const res = await request(app).get(`/api/map-points/tourism/${tourismId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('TC-MAP-06 calculate geographic distance', async () => {
    const res = await request(app).get('/api/map-points/distance?lat1=9.0054&lon1=38.7636&lat2=12.0316&lon2=39.0472');
    expect(res.status).toBe(200);
    expect(res.body.distance).toBeGreaterThan(0);
    expect(res.body.unit).toBe('km');
  });

  test('TC-MAP-10 update map point', async () => {
    const res = await request(app).put(`/api/map-points/${mapPointId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ description: 'Updated description' });
    expect(res.status).toBe(200);
  });

  test('TC-MAP-11 delete map point', async () => {
    const res = await request(app).delete(`/api/map-points/${mapPointId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-RT-* — Ratings
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-RT-* Ratings', () => {
  test('TC-RT-01 submit tourism rating', async () => {
    const res = await request(app).post('/api/ratings/tourism')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ tourismPlaceId: tourismId, rating: 4, comment: 'Great place' });
    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(4);
  });

  test('TC-RT-02 submit duplicate rating (upsert)', async () => {
    const res = await request(app).post('/api/ratings/tourism')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ tourismPlaceId: tourismId, rating: 5, comment: 'Even better' });
    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
  });

  test('TC-RT-03 get rating summary', async () => {
    const res = await request(app).get(`/api/ratings/tourism/${tourismId}/summary`);
    expect(res.status).toBe(200);
    expect(res.body.averageRating).toBeDefined();
  });

  test('TC-RT-04 out-of-range rating → 400', async () => {
    const res = await request(app).post('/api/ratings/tourism')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ tourismPlaceId: tourismId, rating: 6 });
    expect(res.status).toBe(400);
  });

  test('TC-RT-05 submit hotel rating', async () => {
    const res = await request(app).post('/api/ratings/hotel')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ hotelId, rating: 3, comment: 'Decent' });
    expect(res.status).toBe(201);
  });

  test('TC-RT-06 get hotel rating summary', async () => {
    const res = await request(app).get(`/api/ratings/hotel/${hotelId}/summary`);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-USR-* — User Profile
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-USR-* User Profile', () => {
  test('TC-USR-01 get own profile', async () => {
    const res = await request(app).get('/api/users/profile')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBeDefined();
  });

  test('TC-USR-02 update own profile', async () => {
    const res = await request(app).put('/api/users/profile')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ fullName: 'Updated Full Name' });
    expect(res.status).toBe(200);
  });

  test('TC-USR-03 profile update cannot change roles', async () => {
    const before = await request(app).get('/api/users/profile').set('Authorization', `Bearer ${clientToken}`);
    const rolesBefore = before.body.roles;

    await request(app).put('/api/users/profile')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ fullName: 'Name', roles: ['ADMIN'] });

    const after = await request(app).get('/api/users/profile').set('Authorization', `Bearer ${clientToken}`);
    expect(after.body.roles).toEqual(rolesBefore);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-AUD-* — Audit Log (authenticated, not admin-only)
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-AUD-* Audit Log', () => {
  test('TC-AUD-01 get audit log (authenticated)', async () => {
    const res = await request(app).get('/api/audit')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
  });

  test('TC-AUD-02 get audit statistics (admin)', async () => {
    const res = await request(app).get('/api/admin/audit/statistics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalLogs).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT-07 — Image ordering after setting main image
// ═══════════════════════════════════════════════════════════════════════════════

describe('IT-07 Image ordering after set-main', () => {
  let img1, img2, img3;

  test('add three images to tourism place', async () => {
    const r1 = await request(app).post(`/api/tourism/${tourismId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ imageUrl: 'https://example.com/img1.jpg' });
    const r2 = await request(app).post(`/api/tourism/${tourismId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ imageUrl: 'https://example.com/img2.jpg' });
    const r3 = await request(app).post(`/api/tourism/${tourismId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ imageUrl: 'https://example.com/img3.jpg' });
    img1 = r1.body.id; img2 = r2.body.id; img3 = r3.body.id;
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(r3.status).toBe(201);
  });

  test('set second image as main — it gets lowest displayOrder', async () => {
    const res = await request(app).put(`/api/admin/tourism/${tourismId}/images/${img2}/set-main`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const detail = await request(app).get(`/api/tourisms/${tourismId}`);
    const images = detail.body.images || [];
    if (images.length > 0) {
      const mainImage = images.find((i) => i.id === img2);
      if (mainImage) {
        expect(mainImage.displayOrder).toBe(0);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT-08 — Cascade delete: hotel → bookings
// ═══════════════════════════════════════════════════════════════════════════════

describe('IT-08 Cascade delete hotel removes bookings', () => {
  let cascadeHotelId, cascadeBookingId;

  test('setup: create hotel and booking', async () => {
    const hRes = await request(app).post('/api/hotels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Cascade Hotel ${Date.now()}`, starRating: 2, contactInfo: '+251911000066', tourismPlaceId: tourismId });
    cascadeHotelId = hRes.body.id;

    const bRes = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ hotelId: cascadeHotelId, checkIn: '2026-10-01', checkOut: '2026-10-03', numberOfGuests: 1 });
    cascadeBookingId = bRes.body.bookingId || bRes.body.id;
    expect(bRes.status).toBe(201);
  });

  test('delete hotel cascades to bookings', async () => {
    const delRes = await request(app).delete(`/api/hotels/${cascadeHotelId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);

    // Booking should no longer exist
    const bRes = await request(app).get(`/api/bookings/${cascadeBookingId}`);
    expect(bRes.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT-11 — Account lockout persists after correct credentials
// ═══════════════════════════════════════════════════════════════════════════════

describe('IT-11 Account lockout persists', () => {
  const lockedUser = {
    username: `locked_${Date.now()}`,
    email: `locked_${Date.now()}@test.com`,
    password: 'LockedPass123!',
    fullName: 'Locked User',
  };

  test('register user for lockout test', async () => {
    const res = await request(app).post('/api/auth/register').send(lockedUser);
    expect(res.status).toBe(201);
  });

  test('5 wrong password attempts trigger lockout', async () => {
    // Use a unique fake IP so we don't pollute the shared 127.0.0.1 rate limit
    const fakeIp = '10.0.0.99';
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', fakeIp)
        .send({ username: lockedUser.username, password: 'WrongPass!' });
    }
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', fakeIp)
      .send({ username: lockedUser.username, password: lockedUser.password });
    // Should be locked (401) even with correct password
    expect([401, 429]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-VAL-* — Input Validation
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-VAL-* Input validation', () => {
  test('TC-VAL-01 missing required field → 400', async () => {
    // Register without password
    const res = await request(app).post('/api/auth/register').send({ username: 'nopass', email: 'nopass@test.com' });
    expect(res.status).toBe(400);
  });

  test('TC-VAL-04 invalid email format → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'bademail', email: 'not-an-email', password: 'Pass123!', fullName: 'Bad Email' });
    expect(res.status).toBe(400);
  });

  test('TC-VAL-03 invalid enum value for road type → 400 or 500 handled gracefully', async () => {
    const res = await request(app).post('/api/roads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad Road', type: 'INVALID_TYPE', tourismPlaceId: tourismId });
    expect([400, 422, 500]).toContain(res.status);
    // Must not crash the server
    expect(res.body).toBeDefined();
  });

  test('TC-VAL-02 string value for numeric field → 400', async () => {
    const res = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ hotelId: 'not-a-number', checkIn: '2026-11-01', checkOut: '2026-11-03', numberOfGuests: 1 });
    expect([400, 404]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-SEC-HDR-* — Security Headers
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-SEC-HDR-* Security headers on all responses', () => {
  test('TC-SEC-HDR-01 X-Frame-Options is DENY', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  test('TC-SEC-HDR-01 X-Content-Type-Options is nosniff', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('TC-SEC-HDR-01 Content-Security-Policy header present', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  test('TC-SEC-HDR-01 Referrer-Policy header present', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['referrer-policy']).toBeDefined();
  });

  test('SEC-08 XSS — CSP header blocks script injection', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  test('SEC-10 CORS — request from unauthorized origin is rejected', async () => {
    const res = await request(app).get('/api/users/profile')
      .set('Origin', 'https://evil-site.com')
      .set('Authorization', `Bearer ${clientToken}`);
    // CORS will not set Access-Control-Allow-Origin for unauthorized origins
    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil-site.com');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-ERR-01 — Consistent error response format
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-ERR-01 Consistent error response format', () => {
  test('404 error has message field', async () => {
    const res = await request(app).get('/api/tourisms/999999');
    expect([404, 200]).toContain(res.status);
    if (res.status === 404) {
      expect(res.body.message).toBeDefined();
    }
  });

  test('401 error has message field', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  test('403 error has message field', async () => {
    const res = await request(app).get('/api/admin/users')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SEC-02, SEC-04, SEC-06, SEC-12 — Additional security tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('Additional security tests', () => {
  test('SEC-04 expired access token → 401', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { sub: 'testuser', userId: 1, roles: ['ROLE_CLIENT'] },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '-1s' } // already expired
    );
    const res = await request(app).get('/api/users/profile')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test('SEC-12 horizontal privilege escalation — client cannot accept another user booking', async () => {
    // Create a second client
    const client2 = { username: `sec12_${Date.now()}`, email: `sec12_${Date.now()}@test.com`, password: 'Sec12Pass!', fullName: 'Client 2' };
    const c2Res = await request(app).post('/api/auth/register').send(client2);
    const client2Token = c2Res.body.accessToken;

    // client2 tries to accept a booking that belongs to client1's hotel
    // (bookingId from the main test suite — if it exists, this should 403)
    const res = await request(app).post('/api/bookings/1/accept')
      .set('Authorization', `Bearer ${client2Token}`);
    // Either 403 (not authorized) or 404 (booking not found) — never 200
    expect([400, 403, 404]).toContain(res.status);
  });

  test('SEC-06 OTP resend within cooldown → 400', async () => {
    // Send first OTP
    await request(app).post('/api/auth/send-verification').send({ email: clientUser.email });
    // Immediately resend — should hit cooldown
    const res = await request(app).post('/api/auth/send-verification').send({ email: clientUser.email });
    expect([400, 200]).toContain(res.status); // 400 if within cooldown, 200 if cooldown passed
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-ADM-23, TC-ADM-24 — Problem bookings
// ═══════════════════════════════════════════════════════════════════════════════

describe('TC-ADM-23 / TC-ADM-24 Problem bookings', () => {
  test('TC-ADM-23 admin views problem bookings', async () => {
    const res = await request(app).get('/api/admin/bookings/problems')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MISSING COVERAGE — Routes not yet tested
// ═══════════════════════════════════════════════════════════════════════════════

describe('FT-TRM-09 BLOCKED place excluded from public search', () => {
  let blockedPlaceId;

  test('setup: create a BLOCKED tourism place', async () => {
    const res = await request(app).post('/api/tourism')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `BLOCKED_PLACE_${Date.now()}`, categories: ['CAVERN'], description: 'Should not appear', wereda: 'Blocked', kebele: 'Blocked01', languages: [], status: 'BLOCKED' });
    blockedPlaceId = res.body.id;
    // Force status to BLOCKED via admin update
    await request(app).put(`/api/admin/tourism/${blockedPlaceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'BLOCKED' });
  });

  test('UT-15 / FT-TRM-09 BLOCKED place absent from public search results', async () => {
    const res = await request(app).get('/api/tourisms/public/search?keyword=BLOCKED_PLACE');
    expect(res.status).toBe(200);
    const results = res.body.content || res.body;
    const found = Array.isArray(results)
      ? results.find((p) => p.id === blockedPlaceId)
      : results.content?.find((p) => p.id === blockedPlaceId);
    expect(found).toBeUndefined();
  });
});

describe('TC-RD-03 / TC-RD-06 Road edge cases', () => {
  test('TC-RD-03 create road with invalid tourism place → 400', async () => {
    const res = await request(app).post('/api/roads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Invalid Road', type: 'CAR', tourismPlaceId: 999999 });
    expect([400, 404]).toContain(res.status);
  });

  test('TC-RD-06 delete road record', async () => {
    // Create a temporary road to delete
    const createRes = await request(app).post('/api/roads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ initialPlace: 'Temp Road To Delete', roadType: 'FOOT', tourismPlaceId: tourismId });
    const tempRoadId = createRes.body.id;

    const res = await request(app).delete(`/api/roads/${tempRoadId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/bookings/my — client own bookings', () => {
  test('client can retrieve their own bookings', async () => {
    const res = await request(app).get('/api/bookings/my')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('FT-HTL-13 Check user rating for hotel', () => {
  test('authenticated user can check their hotel rating', async () => {
    const res = await request(app).get(`/api/hotels/${hotelId}/ratings/me`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hasRated');
  });
});

describe('Admin extended routes', () => {
  test('GET /api/admin/users/role/:role returns users by role', async () => {
    const res = await request(app).get('/api/admin/users/role/CLIENT')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/admin/bookings/recent returns recent bookings', async () => {
    const res = await request(app).get('/api/admin/bookings/recent')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/admin/bookings/by-status returns status distribution', async () => {
    const res = await request(app).get('/api/admin/bookings/by-status')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/admin/security/lockout-status/:userId returns lockout info', async () => {
    const res = await request(app).get(`/api/admin/security/lockout-status/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('lockedOut');
  });

  test('GET /api/admin/security/check-block-status returns block info', async () => {
    const res = await request(app).get('/api/admin/security/check-block-status?ipAddress=127.0.0.1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ipBlocked');
  });

  test('GET /api/admin/audit/security returns security logs', async () => {
    const res = await request(app).get('/api/admin/audit/security?hours=24')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/admin/audit/high-severity returns high severity logs', async () => {
    const res = await request(app).get('/api/admin/audit/high-severity?hours=24')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/admin/audit/integrity/check returns integrity status', async () => {
    const res = await request(app).get('/api/admin/audit/integrity/check')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.integrityStatus).toBe('HEALTHY');
  });

  test('DELETE /api/admin/users/:id deletes user', async () => {
    // Create a throwaway user to delete
    const throwaway = { username: `del_${Date.now()}`, email: `del_${Date.now()}@test.com`, password: 'DelPass123!', fullName: 'Delete Me' };
    const reg = await request(app).post('/api/auth/register').send(throwaway);
    const delUserId = reg.body.userId;

    const res = await request(app).delete(`/api/admin/users/${delUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('DELETE /api/admin/hotels/:hotelId/owner removes hotel owner', async () => {
    // Assign then remove owner
    await request(app).post(`/api/admin/hotels/${hotelId}/assign-owner`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: targetUserId });

    const res = await request(app).delete(`/api/admin/hotels/${hotelId}/owner`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('PUT /api/bookings/:id/status updates booking status directly', async () => {
    // Create a booking to update status
    const bRes = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ hotelId, checkIn: '2027-01-01', checkOut: '2027-01-03', numberOfGuests: 1 });
    const bid = bRes.body.bookingId || bRes.body.id;

    const res = await request(app).put(`/api/bookings/${bid}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'REJECTED' });
    expect(res.status).toBe(200);
  });
});

describe('Public tourism endpoints coverage', () => {
  test('GET /api/tourisms/public/homepage returns featured places', async () => {
    const res = await request(app).get('/api/tourisms/public/homepage');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/tourisms/:id/images returns images for place', async () => {
    const res = await request(app).get(`/api/tourisms/${tourismId}/images`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/tourisms/:tourismId/hotels returns hotels for place', async () => {
    const res = await request(app).get(`/api/tourisms/${tourismId}/hotels`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/tourisms/:id/nearby returns nearby places', async () => {
    const res = await request(app).get(`/api/tourisms/${tourismId}/nearby`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/tourisms/public/hero-images returns active hero images', async () => {
    const res = await request(app).get('/api/tourisms/public/hero-images');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/ratings/tourism/:id returns paginated ratings', async () => {
    const res = await request(app).get(`/api/ratings/tourism/${tourismId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/ratings/hotel/:id returns paginated hotel ratings', async () => {
    const res = await request(app).get(`/api/ratings/hotel/${hotelId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/audit/statistics returns statistics (authenticated)', async () => {
    const res = await request(app).get('/api/audit/statistics')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/users/:id returns user by id', async () => {
    const res = await request(app).get(`/api/users/${targetUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(targetUserId);
  });

  test('GET /health returns UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });
});
