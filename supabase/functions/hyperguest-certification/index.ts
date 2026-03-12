// HyperGuest Certification Edge Function
// Dedicated to running the 12 certification test scenarios
// Uses HYPERGUEST_CERT_TOKEN (not prod token)
// Property ID 19912 hardcoded

const ALLOWED_ORIGINS = ['https://staymakom.com','https://www.staymakom.com','https://stay-makom-experiences.lovable.app','http://localhost:5173','http://localhost:8080'];
function getCorsHeadersFn(req: Request) { const o = req.headers.get('Origin')||''; return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o)?o:ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }; }

const SEARCH_DOMAIN = 'https://search-api.hyperguest.io/2.0/';
const BOOKING_DOMAIN = 'https://book-api.hyperguest.com/2.0/'; // .com as per official email
const PROPERTY_ID = 19912;

function getCertHeaders(): Record<string, string> {
  const token = Deno.env.get('HYPERGUEST_CERT_TOKEN') || Deno.env.get('HYPERGUEST_BEARER_TOKEN');
  if (!token) throw new Error('HYPERGUEST_CERT_TOKEN or HYPERGUEST_BEARER_TOKEN not configured');
  return {
    'Authorization': `Bearer ${token}`,
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  };
}

interface LogEntry {
  step: string;
  timestamp: string;
  request: { method: string; url: string; body?: unknown };
  response: { status: number; body: unknown };
  duration_ms: number;
}

interface TestResult {
  name: string;
  logs: LogEntry[];
  success: boolean;
  error?: string;
}

async function loggedFetch(step: string, url: string, options: RequestInit = {}): Promise<{ data: unknown; log: LogEntry }> {
  const start = Date.now();
  const response = await fetch(url, options);
  const duration = Date.now() - start;
  const responseText = await response.text();

  let responseBody: unknown;
  try { responseBody = JSON.parse(responseText); } catch { responseBody = responseText; }

  const log: LogEntry = {
    step,
    timestamp: new Date().toISOString(),
    request: {
      method: options.method || 'GET',
      url,
      body: options.body ? JSON.parse(options.body as string) : undefined,
    },
    response: { status: response.status, body: responseBody },
    duration_ms: duration,
  };

  return { data: responseBody, log };
}

// SEARCH
async function certSearch(params: {
  checkIn: string; nights: number; guests: string;
  customerNationality?: string; currency?: string;
}): Promise<{ data: any; log: LogEntry }> {
  const qp = new URLSearchParams({
    checkIn: params.checkIn,
    nights: params.nights.toString(),
    guests: params.guests,
    hotelIds: PROPERTY_ID.toString(),
  });
  if (params.customerNationality) qp.append('customerNationality', params.customerNationality);
  if (params.currency) qp.append('currency', params.currency);

  return loggedFetch('SEARCH', `${SEARCH_DOMAIN}?${qp.toString()}`, {
    method: 'GET',
    headers: getCertHeaders(),
  });
}

// PRE-BOOK
async function certPreBook(body: unknown): Promise<{ data: any; log: LogEntry }> {
  return loggedFetch('PRE-BOOK', `${BOOKING_DOMAIN}booking/pre-book`, {
    method: 'POST',
    headers: getCertHeaders(),
    body: JSON.stringify(body),
  });
}

// BOOK
async function certBook(body: unknown): Promise<{ data: any; log: LogEntry }> {
  return loggedFetch('BOOK', `${BOOKING_DOMAIN}booking/create`, {
    method: 'POST',
    headers: getCertHeaders(),
    body: JSON.stringify(body),
  });
}

// CANCEL
async function certCancel(bookingId: number, reason: string, simulation = false): Promise<{ data: any; log: LogEntry }> {
  return loggedFetch(simulation ? 'CANCEL-SIMULATE' : 'CANCEL', `${BOOKING_DOMAIN}booking/cancel`, {
    method: 'POST',
    headers: getCertHeaders(),
    body: JSON.stringify({ bookingId, reason, simulation }),
  });
}

// Helpers
function pickRoom(searchData: any, roomIndex = 0) {
  const property = searchData.results?.[0];
  if (!property) throw new Error('No property in search results');
  const room = property.rooms?.[roomIndex];
  if (!room) throw new Error(`No room at index ${roomIndex}`);
  const ratePlan = room.ratePlans?.[0];
  if (!ratePlan) throw new Error('No rate plan');
  return { property, room, ratePlan };
}

function pickDifferentRoom(searchData: any) {
  const property = searchData.results?.[0];
  if (!property || property.rooms.length < 2) {
    throw new Error('Need at least 2 different room types for Test 6');
  }
  return {
    room1: { room: property.rooms[0], ratePlan: property.rooms[0].ratePlans[0] },
    room2: { room: property.rooms[1], ratePlan: property.rooms[1].ratePlans[0] },
  };
}

function getDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function buildBookingBody(opts: {
  checkIn: string; checkOut: string;
  rooms: Array<{
    roomId?: number; ratePlanId?: number;
    expectedPrice: { amount: number; currency: string };
    guests: Array<{ first: string; last: string; birthDate: string; title: string; isLead?: boolean; contact?: any }>;
    specialRequests?: string[];
  }>;
  nationality?: string; currency?: string; reference?: string;
}) {
  const leadGuest = opts.rooms[0].guests.find(g => g.isLead) || opts.rooms[0].guests[0];
  return {
    dates: { from: opts.checkIn, to: opts.checkOut },
    propertyId: PROPERTY_ID,
    leadGuest: {
      birthDate: leadGuest.birthDate,
      title: leadGuest.title,
      name: { first: leadGuest.first, last: leadGuest.last },
      contact: leadGuest.contact || {
        address: "123 Test Street", city: "Tel Aviv", country: opts.nationality || "IL",
        email: "certification@staymakom.com", phone: "+972501234567", state: "N/A", zip: "6100000",
      },
    },
    reference: { agency: opts.reference || `CERT-${Date.now()}` },
    paymentDetails: {
      type: "credit_card",
      details: {
        number: "4111111111111111", cvv: "123",
        expiry: { month: "12", year: "2028" },
        name: { first: "Test", last: "Certification" },
      },
      charge: false,
    },
    rooms: opts.rooms.map(r => ({
      roomId: r.roomId, ratePlanId: r.ratePlanId,
      expectedPrice: r.expectedPrice,
      guests: r.guests.map(g => ({ birthDate: g.birthDate, title: g.title, name: { first: g.first, last: g.last } })),
      specialRequests: r.specialRequests || [],
    })),
    isTest: true,
    groupBooking: false,
  };
}

// ========================================
// 12 TEST SCENARIOS
// ========================================

async function runTest1(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(14);
    const search = await certSearch({ checkIn, nights: 2, guests: '1' });
    logs.push(search.log);
    const { room, ratePlan } = pickRoom(search.data);

    const preBookBody = {
      search: { dates: { from: checkIn, to: getDate(16) }, propertyId: PROPERTY_ID, nationality: "IL", pax: [{ adults: 1, children: [] }] },
      rooms: [{ roomId: room.roomId, ratePlanId: ratePlan.ratePlanId, expectedPrice: { amount: ratePlan.payment.chargeAmount.price, currency: ratePlan.payment.chargeAmount.currency } }],
    };
    const prebook = await certPreBook(preBookBody);
    logs.push(prebook.log);

    return { name: "Test 1: Pre-book 1 room 1 adult", logs, success: prebook.log.response.status === 200 };
  } catch (e) { return { name: "Test 1: Pre-book 1 room 1 adult", logs, success: false, error: e.message }; }
}

async function runTest2(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(15);
    const checkOut = getDate(17);
    const search = await certSearch({ checkIn, nights: 2, guests: '1' });
    logs.push(search.log);
    const { room, ratePlan } = pickRoom(search.data);

    const bookBody = buildBookingBody({
      checkIn, checkOut,
      rooms: [{ roomId: room.roomId, ratePlanId: ratePlan.ratePlanId, expectedPrice: { amount: ratePlan.payment.chargeAmount.price, currency: ratePlan.payment.chargeAmount.currency }, guests: [{ first: "Test", last: "Adult", birthDate: "1990-01-01", title: "MR", isLead: true }] }],
      reference: "CERT-TEST2",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    return { name: "Test 2: Book 1 room 1 adult", logs, success: book.log.response.status === 200 };
  } catch (e) { return { name: "Test 2: Book 1 room 1 adult", logs, success: false, error: e.message }; }
}

async function runTest3(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(16);
    const checkOut = getDate(18);
    const search = await certSearch({ checkIn, nights: 2, guests: '2-8,1' });
    logs.push(search.log);
    const { room, ratePlan } = pickRoom(search.data);

    const bookBody = buildBookingBody({
      checkIn, checkOut,
      rooms: [{
        roomId: room.roomId, ratePlanId: ratePlan.ratePlanId,
        expectedPrice: { amount: ratePlan.payment.chargeAmount.price, currency: ratePlan.payment.chargeAmount.currency },
        guests: [
          { first: "Test", last: "AdultOne", birthDate: "1990-01-01", title: "MR", isLead: true },
          { first: "Test", last: "AdultTwo", birthDate: "1991-02-02", title: "MS" },
          { first: "Test", last: "Child", birthDate: "2017-06-15", title: "C" },
          { first: "Test", last: "Infant", birthDate: "2024-03-20", title: "C" },
        ],
      }],
      reference: "CERT-TEST3",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    return { name: "Test 3: 1 room, 2 adults + 1 child + 1 infant", logs, success: book.log.response.status === 200 };
  } catch (e) { return { name: "Test 3: 1 room, 2 adults + 1 child + 1 infant", logs, success: false, error: e.message }; }
}

async function runTest4(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(17);
    const checkOut = getDate(19);
    const search = await certSearch({ checkIn, nights: 2, guests: '2.1' });
    logs.push(search.log);
    const property = search.data.results?.[0];
    const room1 = property.rooms?.[0];
    const room2 = property.rooms?.[1] || property.rooms?.[0];

    const bookBody = buildBookingBody({
      checkIn, checkOut,
      rooms: [
        { roomId: room1.roomId, ratePlanId: room1.ratePlans[0].ratePlanId, expectedPrice: { amount: room1.ratePlans[0].payment.chargeAmount.price, currency: room1.ratePlans[0].payment.chargeAmount.currency }, guests: [{ first: "Test", last: "Room1A", birthDate: "1990-01-01", title: "MR", isLead: true }, { first: "Test", last: "Room1B", birthDate: "1991-02-02", title: "MS" }] },
        { roomId: room2.roomId, ratePlanId: room2.ratePlans[0].ratePlanId, expectedPrice: { amount: room2.ratePlans[0].payment.chargeAmount.price, currency: room2.ratePlans[0].payment.chargeAmount.currency }, guests: [{ first: "Test", last: "Room2A", birthDate: "1988-05-05", title: "MR" }] },
      ],
      reference: "CERT-TEST4",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    return { name: "Test 4: 2 rooms (2 adults + 1 adult)", logs, success: book.log.response.status === 200 };
  } catch (e) { return { name: "Test 4: 2 rooms (2 adults + 1 adult)", logs, success: false, error: e.message }; }
}

async function runTest5(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(18);
    const checkOut = getDate(20);
    const search = await certSearch({ checkIn, nights: 2, guests: '1-8.2-1' });
    logs.push(search.log);
    const property = search.data.results?.[0];
    if (!property) throw new Error('No property in search results');

    // Multi-room search: rooms array has one entry per searchedPax group per room type
    // We need to match rooms to the correct pax group
    // Room 1: pax group with 1 adult + 1 child (age 8)
    // Room 2: pax group with 2 adults + 1 infant (age 1)
    const room1 = property.rooms?.find((r: any) => 
      r.searchedPax?.adults === 1 && r.searchedPax?.children?.length > 0
    ) || property.rooms?.[0];
    const room2 = property.rooms?.find((r: any) => 
      r.searchedPax?.adults === 2
    ) || property.rooms?.[1] || property.rooms?.[0];

    if (!room1 || !room2) throw new Error(`Could not find matching rooms. Total rooms: ${property.rooms?.length}`);

    // Compute infant birthDate to match age 1 at checkin
    const infantBirthYear = new Date(checkIn).getFullYear() - 1;
    const infantBirthDate = `${infantBirthYear}-06-15`;

    const bookBody = buildBookingBody({
      checkIn, checkOut,
      rooms: [
        { 
          roomId: room1.roomId, ratePlanId: room1.ratePlans[0].ratePlanId, 
          expectedPrice: { amount: room1.ratePlans[0].payment.chargeAmount.price, currency: room1.ratePlans[0].payment.chargeAmount.currency }, 
          guests: [
            { first: "Test", last: "R1Adult", birthDate: "1990-01-01", title: "MR", isLead: true }, 
            { first: "Test", last: "R1Child", birthDate: "2017-06-15", title: "C" },
          ] 
        },
        { 
          roomId: room2.roomId, ratePlanId: room2.ratePlans[0].ratePlanId, 
          expectedPrice: { amount: room2.ratePlans[0].payment.chargeAmount.price, currency: room2.ratePlans[0].payment.chargeAmount.currency }, 
          guests: [
            { first: "Test", last: "R2AdultA", birthDate: "1988-05-05", title: "MR" }, 
            { first: "Test", last: "R2AdultB", birthDate: "1989-06-06", title: "MS" }, 
            { first: "Test", last: "R2Infant", birthDate: infantBirthDate, title: "C" },
          ] 
        },
      ],
      reference: "CERT-TEST5",
    });

    // Add pre-book step first
    const preBookBody = {
      search: { 
        dates: { from: checkIn, to: checkOut }, 
        propertyId: PROPERTY_ID, 
        nationality: "IL", 
        pax: [
          { adults: 1, children: [8] },
          { adults: 2, children: [1] },
        ] 
      },
      rooms: [
        { roomId: room1.roomId, ratePlanId: room1.ratePlans[0].ratePlanId, expectedPrice: { amount: room1.ratePlans[0].payment.chargeAmount.price, currency: room1.ratePlans[0].payment.chargeAmount.currency } },
        { roomId: room2.roomId, ratePlanId: room2.ratePlans[0].ratePlanId, expectedPrice: { amount: room2.ratePlans[0].payment.chargeAmount.price, currency: room2.ratePlans[0].payment.chargeAmount.currency } },
      ],
    };
    const prebook = await certPreBook(preBookBody);
    logs.push(prebook.log);

    if (prebook.log.response.status !== 200) {
      return { name: "Test 5: 2 rooms (1a+1c / 2a+1i)", logs, success: false, error: `Pre-book failed with status ${prebook.log.response.status}` };
    }

    const book = await certBook(bookBody);
    logs.push(book.log);

    return { name: "Test 5: 2 rooms (1a+1c / 2a+1i)", logs, success: book.log.response.status === 200 };
  } catch (e) { return { name: "Test 5: 2 rooms (1a+1c / 2a+1i)", logs, success: false, error: e.message }; }
}

async function runTest6(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(19);
    const checkOut = getDate(21);
    const search = await certSearch({ checkIn, nights: 2, guests: '2.2' });
    logs.push(search.log);
    const { room1, room2 } = pickDifferentRoom(search.data);

    const bookBody = buildBookingBody({
      checkIn, checkOut,
      rooms: [
        { roomId: room1.room.roomId, ratePlanId: room1.ratePlan.ratePlanId, expectedPrice: { amount: room1.ratePlan.payment.chargeAmount.price, currency: room1.ratePlan.payment.chargeAmount.currency }, guests: [{ first: "Test", last: "Type1A", birthDate: "1990-01-01", title: "MR", isLead: true }, { first: "Test", last: "Type1B", birthDate: "1991-02-02", title: "MS" }] },
        { roomId: room2.room.roomId, ratePlanId: room2.ratePlan.ratePlanId, expectedPrice: { amount: room2.ratePlan.payment.chargeAmount.price, currency: room2.ratePlan.payment.chargeAmount.currency }, guests: [{ first: "Test", last: "Type2A", birthDate: "1988-05-05", title: "MR" }, { first: "Test", last: "Type2B", birthDate: "1989-06-06", title: "MS" }] },
      ],
      reference: "CERT-TEST6",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    return { name: "Test 6: 2 rooms different types/rates", logs, success: book.log.response.status === 200 };
  } catch (e) { return { name: "Test 6: 2 rooms different types/rates", logs, success: false, error: e.message }; }
}

async function runTest7(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const today = getDate(0);
    const tomorrow = getDate(1);
    const search = await certSearch({ checkIn: today, nights: 1, guests: '2' });
    logs.push(search.log);
    const { room, ratePlan } = pickRoom(search.data);

    const bookBody = buildBookingBody({
      checkIn: today, checkOut: tomorrow,
      rooms: [{ roomId: room.roomId, ratePlanId: ratePlan.ratePlanId, expectedPrice: { amount: ratePlan.payment.chargeAmount.price, currency: ratePlan.payment.chargeAmount.currency }, guests: [{ first: "Test", last: "SameDay1", birthDate: "1990-01-01", title: "MR", isLead: true }, { first: "Test", last: "SameDay2", birthDate: "1991-02-02", title: "MS" }] }],
      reference: "CERT-TEST7",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    return { name: "Test 7: Same-day booking", logs, success: book.log.response.status === 200 };
  } catch (e) { return { name: "Test 7: Same-day booking", logs, success: false, error: e.message }; }
}

async function runTest8(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(20);
    const checkOut = getDate(22);
    const search = await certSearch({ checkIn, nights: 2, guests: '2', currency: 'EUR' });
    logs.push(search.log);
    const { room, ratePlan } = pickRoom(search.data);

    const bookBody = buildBookingBody({
      checkIn, checkOut, currency: "EUR",
      rooms: [{ roomId: room.roomId, ratePlanId: ratePlan.ratePlanId, expectedPrice: { amount: ratePlan.payment.chargeAmount.price, currency: ratePlan.payment.chargeAmount.currency }, guests: [{ first: "Test", last: "Currency1", birthDate: "1990-01-01", title: "MR", isLead: true }, { first: "Test", last: "Currency2", birthDate: "1991-02-02", title: "MS" }] }],
      reference: "CERT-TEST8",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    return { name: "Test 8: Currency conversion (EUR)", logs, success: book.log.response.status === 200 };
  } catch (e) { return { name: "Test 8: Currency conversion (EUR)", logs, success: false, error: e.message }; }
}

async function runTest9(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(21);
    const checkOut = getDate(23);
    const search = await certSearch({ checkIn, nights: 2, guests: '2', customerNationality: 'FR' });
    logs.push(search.log);
    const { room, ratePlan } = pickRoom(search.data);

    const bookBody = buildBookingBody({
      checkIn, checkOut, nationality: "FR",
      rooms: [{ roomId: room.roomId, ratePlanId: ratePlan.ratePlanId, expectedPrice: { amount: ratePlan.payment.chargeAmount.price, currency: ratePlan.payment.chargeAmount.currency }, guests: [{ first: "Test", last: "FrenchA", birthDate: "1990-01-01", title: "MR", isLead: true, contact: { address: "10 Rue de Rivoli", city: "Paris", country: "FR", email: "cert@staymakom.com", phone: "+33612345678", state: "N/A", zip: "75001" } }, { first: "Test", last: "FrenchB", birthDate: "1991-02-02", title: "MS" }] }],
      reference: "CERT-TEST9",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    return { name: "Test 9: Nationality FR", logs, success: book.log.response.status === 200 };
  } catch (e) { return { name: "Test 9: Nationality FR", logs, success: false, error: e.message }; }
}

async function runTest10(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(30);
    const checkOut = getDate(32);
    const search = await certSearch({ checkIn, nights: 2, guests: '2' });
    logs.push(search.log);

    const property = search.data.results?.[0];
    let selectedRoom: any = null;
    let selectedRatePlan: any = null;
    for (const room of property.rooms || []) {
      for (const rp of room.ratePlans || []) {
        if (rp.cancellationPolicies && rp.cancellationPolicies.length > 0) {
          selectedRoom = room; selectedRatePlan = rp; break;
        }
      }
      if (selectedRoom) break;
    }
    if (!selectedRoom) { selectedRoom = property.rooms[0]; selectedRatePlan = selectedRoom.ratePlans[0]; }

    const bookBody = buildBookingBody({
      checkIn, checkOut,
      rooms: [{ roomId: selectedRoom.roomId, ratePlanId: selectedRatePlan.ratePlanId, expectedPrice: { amount: selectedRatePlan.payment.chargeAmount.price, currency: selectedRatePlan.payment.chargeAmount.currency }, guests: [{ first: "Test", last: "Refundable1", birthDate: "1990-01-01", title: "MR", isLead: true }, { first: "Test", last: "Refundable2", birthDate: "1991-02-02", title: "MS" }] }],
      reference: "CERT-TEST10",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    const bookingId = book.data?.content?.bookingId || book.data?.bookingId;
    if (!bookingId) throw new Error('No bookingId in booking response');

    const simCancel = await certCancel(bookingId, "Certification test - refundable cancellation", true);
    logs.push(simCancel.log);
    const cancel = await certCancel(bookingId, "Certification test - refundable cancellation", false);
    logs.push(cancel.log);

    return { name: "Test 10: Refundable cancel", logs, success: cancel.log.response.status === 200 };
  } catch (e) { return { name: "Test 10: Refundable cancel", logs, success: false, error: e.message }; }
}

async function runTest11(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(2);
    const checkOut = getDate(3);
    const search = await certSearch({ checkIn, nights: 1, guests: '2' });
    logs.push(search.log);
    const { room, ratePlan } = pickRoom(search.data);

    const bookBody = buildBookingBody({
      checkIn, checkOut,
      rooms: [{ roomId: room.roomId, ratePlanId: ratePlan.ratePlanId, expectedPrice: { amount: ratePlan.payment.chargeAmount.price, currency: ratePlan.payment.chargeAmount.currency }, guests: [{ first: "Test", last: "NonRef1", birthDate: "1990-01-01", title: "MR", isLead: true }, { first: "Test", last: "NonRef2", birthDate: "1991-02-02", title: "MS" }] }],
      reference: "CERT-TEST11",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    const bookingId = book.data?.content?.bookingId || book.data?.bookingId;
    if (!bookingId) throw new Error('No bookingId');

    const simCancel = await certCancel(bookingId, "Certification test - non-refundable attempt", true);
    logs.push(simCancel.log);

    return { name: "Test 11: Non-refundable cancel attempt", logs, success: simCancel.log.response.status === 200 };
  } catch (e) { return { name: "Test 11: Non-refundable cancel attempt", logs, success: false, error: e.message }; }
}

async function runTest12(): Promise<TestResult> {
  const logs: LogEntry[] = [];
  try {
    const checkIn = getDate(22);
    const checkOut = getDate(24);
    const search = await certSearch({ checkIn, nights: 2, guests: '2' });
    logs.push(search.log);

    const property = search.data.results?.[0];
    let selectedRoom: any = null;
    let selectedRatePlan: any = null;
    for (const room of property.rooms || []) {
      for (const rp of room.ratePlans || []) {
        if (rp.ratePlanInfo?.isPackageRate) { selectedRoom = room; selectedRatePlan = rp; break; }
      }
      if (selectedRoom) break;
    }
    if (!selectedRoom) { selectedRoom = property.rooms[0]; selectedRatePlan = selectedRoom.ratePlans[0]; }

    const bookBody = buildBookingBody({
      checkIn, checkOut,
      rooms: [{ roomId: selectedRoom.roomId, ratePlanId: selectedRatePlan.ratePlanId, expectedPrice: { amount: selectedRatePlan.payment.chargeAmount.price, currency: selectedRatePlan.payment.chargeAmount.currency }, guests: [{ first: "Test", last: "Package1", birthDate: "1990-01-01", title: "MR", isLead: true }, { first: "Test", last: "Package2", birthDate: "1991-02-02", title: "MS" }] }],
      reference: "CERT-TEST12",
    });
    const book = await certBook(bookBody);
    logs.push(book.log);

    return {
      name: `Test 12: Package rate (${selectedRatePlan.ratePlanInfo?.isPackageRate ? 'FOUND' : 'NOT FOUND - used default'})`,
      logs, success: book.log.response.status === 200,
    };
  } catch (e) { return { name: "Test 12: Package rate", logs, success: false, error: e.message }; }
}

// MAIN HANDLER
const ALL_TESTS = [runTest1, runTest2, runTest3, runTest4, runTest5, runTest6, runTest7, runTest8, runTest9, runTest10, runTest11, runTest12];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeadersFn(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const testNumber = url.searchParams.get('test');

    let results: TestResult[];

    if (testNumber === 'all') {
      results = [];
      for (const testFn of ALL_TESTS) {
        const result = await testFn();
        results.push(result);
      }
    } else if (testNumber && parseInt(testNumber) >= 1 && parseInt(testNumber) <= 12) {
      const idx = parseInt(testNumber) - 1;
      results = [await ALL_TESTS[idx]()];
    } else {
      return new Response(JSON.stringify({
        error: 'Specify ?test=1 through ?test=12 or ?test=all',
        available: Array.from({ length: 12 }, (_, i) => `test=${i + 1}`),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const summary = {
      timestamp: new Date().toISOString(),
      propertyId: PROPERTY_ID,
      totalTests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
