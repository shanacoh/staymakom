/**
 * Classe représentant un Hôtel avec toutes ses données statiques HyperGuest
 */

export interface HotelLocation {
  address: string | null;
  city: {
    id?: string;
    name: string | null;
    hereMapsId?: string;
  };
  countryCode: string | null;
  postcode: string | null;
  region: string | null;
  fullAddress: string | null;
}

export interface HotelCoordinates {
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  osmUrl: string;
}

export interface HotelContact {
  email: string | null;
  phone: string | null;
  website: string | null;
  hasEmail: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
}

export interface HotelImage {
  id?: string;
  uri: string;
  type: string;
  description?: string;
  priority: number;
  size?: { width: number; height: number };
  tags?: string[];
  created?: string;
  updated?: string;
  thumbnail: string;
  medium: string;
  large: string;
}

export interface HotelFacility {
  id: string;
  name: string;
  nameSlug?: string;
  category?: string;
  categorySlug?: string;
  classification?: string;
  type: string;
  popular: boolean;
}

export interface HotelRatePlan {
  id: string;
  pmsCode: string;
  name: string;
  description: string;
  isBar?: boolean;
  isPrivate?: boolean;
  baseRateplanId?: string;
  baseRatePlanPmsCode?: string;
  settings: {
    board?: { code: string };
    charge?: string;
    priceType?: string;
  };
  policies?: any[];
  tags?: string[];
  boardLabel: string;
  isCustomerPays: boolean;
  isAgentPays: boolean;
}

export interface HotelSettings {
  chain?: string;
  checkIn: string;
  checkOut: string;
  cutOff: string;
  currency: string;
  hotelType?: string;
  maxChildAge: number;
  maxInfantAge: number;
  numberOfFloors: number;
  numberOfRooms: number;
  timezone?: string;
  utcOffset?: number;
}

export interface HotelCardDisplay {
  id: string;
  name: string;
  image: string | null;
  images: string[];
  rating: number;
  location: string | null;
  country: string | null;
  address: string | null;
  facilities: string[];
  roomCount: number;
  price: number | null;
}

export class Hotel {
  raw: any;
  id: string;
  name: string;
  isTest: boolean;
  status?: string;
  rating: number;
  group: string;
  location: HotelLocation;
  coordinates: HotelCoordinates | null;
  contact: HotelContact | null;
  logo: string | null;
  images: HotelImage[];
  descriptions: {
    byLanguage: Record<string, Record<string, string>>;
    general: string;
    room: string;
    location: string;
  };
  facilities: {
    all: HotelFacility[];
    hotel: HotelFacility[];
    room: HotelFacility[];
    byCategory: Record<string, HotelFacility[]>;
    popular: HotelFacility[];
    count: number;
    hotelCount: number;
    roomCount: number;
  };
  rooms: Room[];
  ratePlans: HotelRatePlan[];
  policies: {
    all: any[];
    byType: Record<string, any[]>;
    cancellation: any;
    nationality: any;
    general: any[];
    immediateConfirmation: any;
    minStay: any;
    maxStay: any;
    supportedCards: any;
    minCheckInAge: any;
  };
  taxesFees: {
    all: any[];
    taxes: any[];
    fees: any[];
    count: number;
    taxCount: number;
    feeCount: number;
  };
  settings: HotelSettings;
  commission: number | null;
  attributes: any[];
  created?: string;
  updated?: string;

  constructor(rawData: any) {
    this.raw = rawData;
    
    this.id = rawData.id || rawData.hotel_id || rawData.propertyId || rawData.hotelId;
    this.name = rawData.name || 'Sans nom';
    this.isTest = rawData.isTest === 1;
    this.status = rawData.status;
    this.rating = rawData.rating || 0;
    this.group = rawData.group || '';
    
    this.location = this._parseLocation(rawData.location);
    this.coordinates = this._parseCoordinates(rawData.coordinates);
    this.contact = this._parseContact(rawData.contact);
    this.logo = rawData.logo || null;
    this.images = this._parseImages(rawData.images || []);
    this.descriptions = this._parseDescriptions(rawData.descriptions || []);
    this.facilities = this._parseFacilities(rawData.facilities || []);
    this.rooms = this._parseRooms(rawData.rooms || []);
    this.ratePlans = this._parseRatePlans(rawData.ratePlans || []);
    this.policies = this._parsePolicies(rawData.policies || []);
    this.taxesFees = this._parseTaxesFees(rawData.taxesFees || []);
    this.settings = this._parseSettings(rawData.settings || {});
    this.commission = rawData.commission || null;
    this.attributes = rawData.attributes || [];
    this.created = rawData.created;
    this.updated = rawData.updated;
  }

  private _parseLocation(location: any): HotelLocation {
    if (!location) {
      return this._parseLocationFromRaw(this.raw);
    }
    
    return {
      address: location.address || location.street || 'N/A',
      city: {
        id: location.city?.id || location.cityId,
        name: location.city?.name || location.cityName || location.city || 'N/A',
        hereMapsId: location.city?.hereMapsId,
      },
      countryCode: location.countryCode || location.country || 'N/A',
      postcode: location.postcode || location.postalCode || location.zip || 'N/A',
      region: location.region || location.regionName || 'N/A',
      fullAddress: this._buildFullAddress(location),
    };
  }

  private _parseLocationFromRaw(rawData: any): HotelLocation {
    const parts: string[] = [];
    
    if (rawData.address && typeof rawData.address === 'string') {
      parts.push(rawData.address);
    } else if (rawData.address?.street) {
      parts.push(rawData.address.street);
    }
    
    const city = rawData.city || rawData.cityName || rawData.location?.city || rawData.address?.city;
    if (city) {
      if (typeof city === 'string') {
        parts.push(city);
      } else if (city.name) {
        parts.push(city.name);
      }
    }
    
    const postcode = rawData.postcode || rawData.postalCode || rawData.zip || rawData.address?.postalCode;
    if (postcode) parts.push(postcode);
    
    const country = rawData.country || rawData.countryCode || rawData.address?.country;
    if (country) {
      if (typeof country === 'string') {
        parts.push(country);
      } else if (country.code) {
        parts.push(country.code);
      } else if (country.name) {
        parts.push(country.name);
      }
    }
    
    return {
      address: rawData.address?.street || (typeof rawData.address === 'string' ? rawData.address : null),
      city: {
        id: rawData.cityId,
        name: typeof city === 'string' ? city : city?.name || null,
      },
      countryCode: typeof country === 'string' ? country : (country?.code || country?.name || null),
      postcode: postcode || null,
      region: rawData.region || rawData.regionName || null,
      fullAddress: parts.length > 0 ? parts.join(', ') : null,
    };
  }

  private _buildFullAddress(location: any): string | null {
    const parts: string[] = [];
    
    if (location.address || location.street) {
      parts.push(location.address || location.street);
    }
    
    const cityName = location.city?.name || location.cityName || location.city;
    if (cityName && typeof cityName === 'string') parts.push(cityName);
    
    if (location.postcode || location.postalCode || location.zip) {
      parts.push(location.postcode || location.postalCode || location.zip);
    }
    
    if (location.region || location.regionName) {
      parts.push(location.region || location.regionName);
    }
    
    const countryCode = location.countryCode || location.country;
    if (countryCode) {
      if (typeof countryCode === 'string') {
        parts.push(countryCode);
      } else if (countryCode.code) {
        parts.push(countryCode.code);
      } else if (countryCode.name) {
        parts.push(countryCode.name);
      }
    }
    
    return parts.length > 0 ? parts.join(', ') : null;
  }

  private _parseCoordinates(coords: any): HotelCoordinates | null {
    if (!coords) return null;
    
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      googleMapsUrl: `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`,
      osmUrl: `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}`,
    };
  }

  private _parseContact(contact: any): HotelContact | null {
    if (!contact) return null;
    
    return {
      email: contact.email || null,
      phone: contact.phone || null,
      website: contact.website || null,
      hasEmail: !!contact.email,
      hasPhone: !!contact.phone,
      hasWebsite: !!contact.website,
    };
  }

  private _parseImages(images: any[]): HotelImage[] {
    if (!images || images.length === 0) {
      return this._parseImagesFromRaw(this.raw);
    }
    
    const parsed: HotelImage[] = [];
    
    for (const img of images) {
      let uri = img.uri || img.url || img.src || img.image || null;
      
      if (typeof img === 'string') {
        uri = img;
      }
      
      if (!uri) continue;
      
      parsed.push({
        id: img.id,
        uri: uri,
        type: img.type || 'photo',
        description: img.description || img.alt || '',
        priority: img.priority || 50,
        size: img.size,
        tags: img.tags || [],
        created: img.created,
        updated: img.updated,
        thumbnail: this._getThumbnailUrl(uri),
        medium: this._getMediumUrl(uri),
        large: uri,
      });
    }
    
    return parsed.sort((a, b) => (a.priority || 50) - (b.priority || 50));
  }

  private _parseImagesFromRaw(rawData: any): HotelImage[] {
    const images: { uri: string; priority: number; type?: string }[] = [];
    
    if (rawData.images && Array.isArray(rawData.images)) {
      rawData.images.forEach((img: any) => {
        const uri = img.uri || img.url || img.src || (typeof img === 'string' ? img : null);
        if (uri) images.push({ uri, priority: img.priority || 50 });
      });
    }
    
    if (rawData.image && typeof rawData.image === 'string') {
      images.push({ uri: rawData.image, priority: 0 });
    }
    
    if (rawData.photos && Array.isArray(rawData.photos)) {
      rawData.photos.forEach((photo: any) => {
        const uri = photo.uri || photo.url || photo.src || (typeof photo === 'string' ? photo : null);
        if (uri) images.push({ uri, priority: photo.priority || 50 });
      });
    }
    
    if (rawData.photo && rawData.photo.url) {
      images.push({ uri: rawData.photo.url, priority: 0 });
    }
    
    if (rawData.logo) {
      images.push({ uri: rawData.logo, priority: 100, type: 'logo' });
    }
    
    return images.map(img => ({
      uri: img.uri,
      type: img.type || 'photo',
      priority: img.priority || 50,
      thumbnail: this._getThumbnailUrl(img.uri),
      medium: this._getMediumUrl(img.uri),
      large: img.uri,
    })).sort((a, b) => a.priority - b.priority);
  }

  private _getThumbnailUrl(originalUrl: string): string {
    return originalUrl?.replace('_original', '_thumbnail') || originalUrl;
  }

  private _getMediumUrl(originalUrl: string): string {
    return originalUrl?.replace('_original', '_medium') || originalUrl;
  }

  private _parseDescriptions(descriptions: any[]) {
    const parsed: Record<string, Record<string, string>> = {};
    
    for (const desc of descriptions) {
      const lang = desc.language || 'default';
      const type = desc.type || 'general';
      
      if (!parsed[lang]) parsed[lang] = {};
      parsed[lang][type] = desc.description;
    }
    
    const firstLang = Object.keys(parsed)[0];
    const firstGeneral = firstLang ? parsed[firstLang]?.general || '' : '';
    
    return {
      byLanguage: parsed,
      general: parsed.en_US?.general || parsed.default?.general || firstGeneral,
      room: parsed.en_US?.room || parsed.default?.room || '',
      location: parsed.en_US?.location || parsed.default?.location || '',
    };
  }

  private _parseFacilities(facilities: any[]) {
    const hotel = facilities.filter((f: any) => f.type === 'hotel');
    const room = facilities.filter((f: any) => f.type === 'room');
    const byCategory = this._groupBy(facilities, 'category');
    const popular = facilities.filter((f: any) => f.popular === 1);
    
    return {
      all: facilities.map((f: any) => ({
        id: f.id,
        name: f.name,
        nameSlug: f.nameSlug,
        category: f.category,
        categorySlug: f.categorySlug,
        classification: f.classification,
        type: f.type,
        popular: f.popular === 1,
      })),
      hotel,
      room,
      byCategory,
      popular,
      count: facilities.length,
      hotelCount: hotel.length,
      roomCount: room.length,
    };
  }

  private _parseRooms(rooms: any[]): Room[] {
    return rooms.map((room: any) => new Room(room, this.id));
  }

  private _parseRatePlans(ratePlans: any[]): HotelRatePlan[] {
    return ratePlans.map((rp: any) => ({
      id: rp.id,
      pmsCode: rp.pmsCode,
      name: rp.name,
      description: rp.description || '',
      isBar: rp.isBar,
      isPrivate: rp.isPrivate,
      baseRateplanId: rp.baseRateplanId,
      baseRatePlanPmsCode: rp.baseRatePlanPmsCode,
      settings: {
        board: rp.settings?.board,
        charge: rp.settings?.charge,
        priceType: rp.settings?.priceType,
      },
      policies: rp.policies || [],
      tags: rp.tags || [],
      boardLabel: rp.settings?.board?.code || '',
      isCustomerPays: rp.settings?.charge === 'customer',
      isAgentPays: rp.settings?.charge === 'agent',
    }));
  }

  private _parsePolicies(policies: any[]) {
    const byType = this._groupBy(policies, 'type');
    
    return {
      all: policies,
      byType,
      cancellation: byType.cancellation?.[0] || null,
      nationality: byType.nationality?.[0] || null,
      general: byType.general || [],
      immediateConfirmation: byType['immediate-confirmation']?.[0] || null,
      minStay: byType['min-length-of-stay']?.[0] || null,
      maxStay: byType['max-length-of-stay']?.[0] || null,
      supportedCards: byType['supported-cards']?.[0] || null,
      minCheckInAge: byType['min-check-in-age']?.[0] || null,
    };
  }

  private _parseTaxesFees(taxesFees: any[]) {
    const taxes = taxesFees.filter((t: any) => t.category === 'tax');
    const fees = taxesFees.filter((t: any) => t.category === 'fee');
    
    return {
      all: taxesFees.map((t: any) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        charge: {
          type: t.charge?.type,
          value: t.charge?.value,
          rate: t.charge?.rate,
        },
        scope: t.scope,
        frequency: t.frequency,
        dates: t.dates,
        ratePlans: t.ratePlans,
        restriction: t.restriction,
        group: t.group,
      })),
      taxes,
      fees,
      count: taxesFees.length,
      taxCount: taxes.length,
      feeCount: fees.length,
    };
  }

  private _parseSettings(settings: any): HotelSettings {
    return {
      chain: settings.chain,
      checkIn: settings.checkIn || '14:00',
      checkOut: settings.checkOut || '12:00',
      cutOff: settings.cutOff || '00:00',
      currency: settings.currency || 'USD',
      hotelType: settings.hotelType,
      maxChildAge: settings.maxChildAge || 17,
      maxInfantAge: settings.maxInfantAge || 2,
      numberOfFloors: settings.numberOfFloors || 0,
      numberOfRooms: settings.numberOfRooms || 0,
      timezone: settings.timezone,
      utcOffset: settings.utcOffset,
    };
  }

  private _groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  }

  // Public methods
  getMainImage(): HotelImage | null {
    return this.images[0] || null;
  }

  getImagesByType(type: string): HotelImage[] {
    return this.images.filter(img => img.type === type);
  }

  getPhotos(): HotelImage[] {
    return this.getImagesByType('photo');
  }

  getDescription(language = 'en_US', type = 'general'): string {
    return this.descriptions.byLanguage[language]?.[type] || this.descriptions.general;
  }

  hasFacility(facilityName: string): boolean {
    return this.facilities.all.some(f => 
      f.name.toLowerCase().includes(facilityName.toLowerCase())
    );
  }

  getFacilitiesByCategory(category: string): HotelFacility[] {
    return this.facilities.byCategory[category] || [];
  }

  getRoomByCode(roomCode: string): Room | undefined {
    return this.rooms.find(r => r.pmsCode === roomCode);
  }

  getRoomById(roomId: string): Room | undefined {
    return this.rooms.find(r => r.id === roomId);
  }

  getRatePlanByCode(rateCode: string): HotelRatePlan | undefined {
    return this.ratePlans.find(rp => rp.pmsCode === rateCode);
  }

  acceptsNationality(countryCode: string): boolean {
    const nationalityPolicy = this.policies.nationality;
    if (!nationalityPolicy) return true;
    
    const condition = nationalityPolicy.condition;
    if (!condition?.nationalities) return true;
    
    return condition.nationalities.includes(countryCode);
  }

  getCancellationPolicy(): any[] {
    return this.policies.cancellation?.result || [];
  }

  toCardDisplay(): HotelCardDisplay {
    const mainImage = this.getMainImage();
    let imageUri: string | null = null;
    
    if (mainImage) {
      imageUri = mainImage.uri || mainImage.large || null;
    }
    
    if (!imageUri && this.images && this.images.length > 0) {
      const firstImg = this.images[0];
      imageUri = firstImg.uri || firstImg.large || null;
    }
    
    let address = this.location?.fullAddress;
    if (!address && this.location) {
      address = this._buildFullAddress(this.location);
    }
    if (!address) {
      const locationFromRaw = this._parseLocationFromRaw(this.raw);
      address = locationFromRaw.fullAddress;
    }
    
    if (!address) {
      const parts: string[] = [];
      if (this.location?.city?.name) parts.push(this.location.city.name);
      if (this.location?.countryCode) parts.push(this.location.countryCode);
      if (parts.length > 0) address = parts.join(', ');
    }
    
    const hotelId = this.id || this.raw.id || this.raw.hotel_id || this.raw.propertyId || this.raw.hotelId;
    
    return {
      id: hotelId,
      name: this.name,
      image: imageUri,
      images: this.images.map(img => img.uri || img.large).filter(Boolean),
      rating: this.rating,
      location: this.location?.city?.name || this.raw.city || this.raw.cityName,
      country: this.location?.countryCode || this.raw.country || this.raw.countryCode,
      address: address,
      facilities: this.facilities.popular.slice(0, 5).map(f => f.name),
      roomCount: this.rooms.length,
      price: null,
    };
  }

  toDetailDisplay() {
    return {
      ...this.toCardDisplay(),
      description: this.descriptions.general,
      contact: this.contact,
      coordinates: this.coordinates,
      allImages: this.getPhotos(),
      allFacilities: this.facilities.all,
      rooms: this.rooms.map(r => r.toDisplay()),
      policies: {
        checkIn: this.settings.checkIn,
        checkOut: this.settings.checkOut,
        cancellation: this.getCancellationPolicy(),
      },
    };
  }
}

// ==========================================================================
// MODÈLE ROOM (Chambre)
// ==========================================================================

export interface RoomBed {
  type: string;
  size?: number;
  quantity: number;
  display: string;
}

export interface RoomDisplay {
  id: string;
  code: string;
  name: string;
  type?: string;
  image: string | null;
  description: string;
  beds: string;
  capacity: {
    adults: number;
    children: number;
    max: number;
  };
  size: string | null;
  facilities: string[];
}

export class Room {
  raw: any;
  hotelId: string;
  id: string;
  pmsCode: string;
  name: string;
  type?: string;
  status?: string;
  beds: RoomBed[];
  descriptions: {
    byLanguage: Record<string, string>;
    default: string;
  };
  facilities: any[];
  images: any[];
  settings: {
    adultsNumber: number;
    childrenNumber: number;
    infantsNumber: number;
    maxOccupancy: number;
    baseAdults: number;
    baseChildren: number;
    baseInfants: number;
    numberOfBedrooms: number;
    numberOfBeds: number;
    roomSize: number;
  };
  ratePlans: any[];
  tags: string[];

  constructor(rawData: any, hotelId: string) {
    this.raw = rawData;
    this.hotelId = hotelId;
    
    this.id = rawData.id;
    this.pmsCode = rawData.pmsCode;
    this.name = rawData.name || 'Sans nom';
    this.type = rawData.type;
    this.status = rawData.status;
    
    this.beds = this._parseBeds(rawData.beds || []);
    this.descriptions = this._parseDescriptions(rawData.descriptions || []);
    this.facilities = rawData.facilities || [];
    this.images = rawData.images || [];
    
    this.settings = {
      adultsNumber: rawData.settings?.adultsNumber || 0,
      childrenNumber: rawData.settings?.childrenNumber || 0,
      infantsNumber: rawData.settings?.infantsNumber || 0,
      maxOccupancy: rawData.settings?.maxOccupancy || 0,
      baseAdults: rawData.settings?.baseAdults || 0,
      baseChildren: rawData.settings?.baseChildren || 0,
      baseInfants: rawData.settings?.baseInfants || 0,
      numberOfBedrooms: rawData.settings?.numberOfBedrooms || 0,
      numberOfBeds: rawData.settings?.numberOfBeds || 0,
      roomSize: rawData.settings?.roomSize || 0,
    };
    
    this.ratePlans = rawData.ratePlans || [];
    this.tags = rawData.tags || [];
  }

  private _parseBeds(beds: any[]): RoomBed[] {
    return beds.map((bed: any) => ({
      type: bed.type,
      size: bed.size,
      quantity: bed.quantity,
      display: `${bed.quantity} ${bed.type}${bed.quantity > 1 ? 's' : ''}`,
    }));
  }

  private _parseDescriptions(descriptions: any[]) {
    const byLanguage: Record<string, string> = {};
    
    for (const desc of descriptions) {
      const lang = desc.language || 'default';
      byLanguage[lang] = desc.description;
    }
    
    return {
      byLanguage,
      default: byLanguage.en_US || byLanguage.default || Object.values(byLanguage)[0] || '',
    };
  }

  getDescription(language = 'en_US'): string {
    return this.descriptions.byLanguage[language] || this.descriptions.default;
  }

  getMainImage(): any | null {
    return this.images.sort((a: any, b: any) => (a.priority || 50) - (b.priority || 50))[0] || null;
  }

  getBedsDisplay(): string {
    return this.beds.map(b => b.display).join(', ');
  }

  canAccommodate(adults: number, children = 0): boolean {
    const total = adults + children;
    return total <= this.settings.maxOccupancy &&
           adults <= this.settings.adultsNumber &&
           children <= this.settings.childrenNumber;
  }

  toDisplay(): RoomDisplay {
    return {
      id: this.id,
      code: this.pmsCode,
      name: this.name,
      type: this.type,
      image: this.getMainImage()?.uri || null,
      description: this.descriptions.default,
      beds: this.getBedsDisplay(),
      capacity: {
        adults: this.settings.adultsNumber,
        children: this.settings.childrenNumber,
        max: this.settings.maxOccupancy,
      },
      size: this.settings.roomSize ? `${this.settings.roomSize} m²` : null,
      facilities: this.facilities.map((f: any) => f.name || f),
    };
  }
}
