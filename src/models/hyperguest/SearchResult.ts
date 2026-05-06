/**
 * Modèles pour les résultats de recherche HyperGuest
 */

import { formatPrice, getBoardTypeLabel } from './utils';

// ==========================================================================
// INTERFACES
// ==========================================================================

export interface SearchPriceDetails {
  amount: number;
  currency: string;
  taxes: any[];
  totalWithIncludedTaxes: number;
  displayTaxes: any[];
  formatted: string;
}

export interface SearchCardDisplay {
  id: string;
  name: string;
  rating: number;
  location: string | null;
  address: string | null;
  coordinates: {
    latitude?: number;
    longitude?: number;
    googleMapsUrl?: string | null;
  } | null;
  propertyType?: string;
  roomsAvailable: number;
  price: {
    amount: number;
    currency: string;
    formatted: string;
    details: SearchPriceDetails;
  };
  pricePerNight: {
    amount: number;
    currency: string;
    formatted: string;
  } | null;
  nights: number | null;
  remarks: string[];
  roomInfo: {
    name: string;
    availableRooms: number;
    beds: string;
  } | null;
  ratePlanInfo: {
    name: string;
    board: string;
    hasFreeCancellation: boolean;
    cancellationPolicy: string | null;
    isPromo: boolean;
    isPrivate: boolean;
  } | null;
  propertyId: string;
}

// ==========================================================================
// SEARCH RESULT
// ==========================================================================

export class SearchResult {
  raw: any;
  properties: SearchProperty[];
  count: number;
  timestamp: Date;

  constructor(rawData: any) {
    this.raw = rawData;
    this.properties = (rawData.results || []).map((property: any) => 
      new SearchProperty(property)
    );
    this.count = this.properties.length;
    this.timestamp = new Date();
  }

  getPropertyById(propertyId: string): SearchProperty | undefined {
    return this.properties.find(p => p.id === propertyId);
  }

  filterByMaxPrice(maxPrice: number, currency = 'EUR'): SearchProperty[] {
    return this.properties.filter(p => {
      const cheapestRoom = p.getCheapestRoom();
      if (!cheapestRoom) return false;
      
      const cheapestRate = cheapestRoom.getCheapestRatePlan();
      if (!cheapestRate) return false;
      
      const price = cheapestRate.getPrice('sell');
      return price.currency === currency && price.amount <= maxPrice;
    });
  }

  sortByPrice(order: 'asc' | 'desc' = 'asc'): SearchProperty[] {
    return [...this.properties].sort((a, b) => {
      const priceA = a.getCheapestRoom()?.getCheapestRatePlan()?.getPrice('sell').amount || Infinity;
      const priceB = b.getCheapestRoom()?.getCheapestRatePlan()?.getPrice('sell').amount || Infinity;
      
      return order === 'asc' ? priceA - priceB : priceB - priceA;
    });
  }

  sortByRating(order: 'asc' | 'desc' = 'desc'): SearchProperty[] {
    return [...this.properties].sort((a, b) => {
      return order === 'desc' ? b.rating - a.rating : a.rating - b.rating;
    });
  }
}

// ==========================================================================
// SEARCH PROPERTY
// ==========================================================================

export class SearchProperty {
  raw: any;
  id: string;
  info: {
    name: string;
    starRating: number;
    city: { name?: string; id?: string };
    country: { name?: string; code?: string };
    region: { name?: string; code?: string };
    address: string | null;
    postalCode: string | null;
    coordinates: {
      latitude?: number;
      longitude?: number;
      googleMapsUrl?: string | null;
    };
    propertyType?: string;
    propertyTypeName?: string;
    raw: any;
  } | null;
  remarks: string[];
  rooms: SearchRoom[];
  hasRooms: boolean;
  roomCount: number;

  constructor(rawData: any) {
    this.raw = rawData;
    this.id = rawData.propertyId;
    this.info = this._parsePropertyInfo(rawData.propertyInfo);
    this.remarks = rawData.remarks || [];
    this.rooms = (rawData.rooms || []).map((room: any) => 
      new SearchRoom(room, this.id)
    );
    this.hasRooms = this.rooms.length > 0;
    this.roomCount = this.rooms.length;
  }

  private _parsePropertyInfo(info: any) {
    if (!info) return null;
    
    return {
      name: info.name || 'Sans nom',
      starRating: info.starRating || 0,
      city: {
        name: info.cityName || info.city?.name,
        id: info.cityId || info.city?.id,
      },
      country: {
        name: info.countryName || info.country?.name,
        code: info.countryCode || info.country?.code,
      },
      region: {
        name: info.regionName || info.region?.name,
        code: info.regionCode || info.region?.code,
      },
      address: info.address || info.street || info.streetAddress || null,
      postalCode: info.postalCode || info.postcode || info.zipCode || null,
      coordinates: {
        latitude: info.latitude || info.coordinates?.latitude,
        longitude: info.longitude || info.coordinates?.longitude,
        googleMapsUrl: (info.latitude || info.coordinates?.latitude) && (info.longitude || info.coordinates?.longitude) ? 
          `https://www.google.com/maps?q=${info.latitude || info.coordinates?.latitude},${info.longitude || info.coordinates?.longitude}` : null,
      },
      propertyType: info.propertyType,
      propertyTypeName: info.propertyTypeName,
      raw: info,
    };
  }

  get name(): string {
    return this.info?.name || 'Sans nom';
  }

  get rating(): number {
    return this.info?.starRating || 0;
  }

  getCheapestRoom(): SearchRoom | null {
    if (this.rooms.length === 0) return null;
    
    return this.rooms.reduce((cheapest, room) => {
      const cheapestPrice = cheapest?.getCheapestRatePlan()?.getPrice('sell').amount || Infinity;
      const roomPrice = room.getCheapestRatePlan()?.getPrice('sell').amount || Infinity;
      
      return roomPrice < cheapestPrice ? room : cheapest;
    });
  }

  getRoomsWithBestPrice(): { room: SearchRoom; bestRatePlan: SearchRatePlan | null }[] {
    return this.rooms.map(room => ({
      room,
      bestRatePlan: room.getCheapestRatePlan(),
    })).filter(item => item.bestRatePlan !== null);
  }

  toCardDisplay(nights: number | null = null): SearchCardDisplay | null {
    const cheapestRoom = this.getCheapestRoom();
    const bestRate = cheapestRoom?.getCheapestRatePlan();
    
    if (!bestRate || !bestRate.getPrice('sell') || bestRate.getPrice('sell').amount === 0) {
      return null;
    }
    
    const totalPrice = bestRate.getPrice('sell');
    const currency = totalPrice.currency || 'ILS';
    
    const priceDetails: SearchPriceDetails = {
      amount: totalPrice.amount || 0,
      currency: currency,
      taxes: totalPrice.taxes || [],
      totalWithIncludedTaxes: totalPrice.totalWithIncludedTaxes || totalPrice.amount || 0,
      displayTaxes: totalPrice.displayTaxes || [],
      formatted: formatPrice(totalPrice.amount || 0, currency),
    };
    
    let pricePerNight: { amount: number; currency: string; formatted: string } | null = null;
    if (nights && nights > 0) {
      pricePerNight = {
        amount: priceDetails.amount / nights,
        currency: currency,
        formatted: formatPrice(priceDetails.amount / nights, currency),
      };
    } else if (bestRate.nightlyBreakdown && bestRate.nightlyBreakdown.length > 0) {
      const nightlyPrices = bestRate.nightlyBreakdown
        .map((night: any) => {
          const sellPrice = night.prices?.sell;
          if (!sellPrice) return 0;
          return sellPrice.price || 0;
        })
        .filter((price: number) => price > 0);
      
      if (nightlyPrices.length > 0) {
        const avgPrice = nightlyPrices.reduce((sum: number, price: number) => sum + price, 0) / nightlyPrices.length;
        pricePerNight = {
          amount: avgPrice,
          currency: currency,
          formatted: formatPrice(avgPrice, currency),
        };
      }
    }
    
    let address: string | null = null;
    if (this.info) {
      const parts: string[] = [];
      
      if (this.info.raw) {
        const raw = this.info.raw;
        if (raw.address) {
          if (typeof raw.address === 'string') {
            parts.push(raw.address);
          } else if (raw.address.street || raw.address.address) {
            parts.push(raw.address.street || raw.address.address);
          }
        } else if (raw.street || raw.streetAddress) {
          parts.push(raw.street || raw.streetAddress);
        }
        
        if (raw.postalCode || raw.postcode || raw.zipCode) {
          parts.push(raw.postalCode || raw.postcode || raw.zipCode);
        }
      }
      
      if (this.info.address && !parts.includes(this.info.address)) {
        parts.push(this.info.address);
      }
      
      const cityName = this.info.city?.name || this.info.raw?.cityName;
      if (cityName) parts.push(cityName);
      
      const regionName = this.info.region?.name || this.info.raw?.regionName;
      if (regionName) parts.push(regionName);
      
      if (this.info.postalCode && !parts.includes(this.info.postalCode)) {
        parts.push(this.info.postalCode);
      }
      
      const countryName = this.info.country?.name || this.info.raw?.countryName;
      if (countryName) {
        parts.push(countryName);
      } else {
        const countryCode = this.info.country?.code || this.info.raw?.countryCode;
        if (countryCode) parts.push(countryCode);
      }
      
      if (parts.length > 0) {
        address = parts.join(', ');
      }
    }
    
    const cheapestRoomInfo = cheapestRoom ? {
      name: cheapestRoom.name,
      availableRooms: cheapestRoom.availableRooms,
      beds: cheapestRoom.getBedsDisplay(),
    } : null;
    
    const ratePlanInfo = bestRate ? {
      name: bestRate.name,
      board: bestRate.boardLabel || bestRate.board,
      hasFreeCancellation: bestRate.hasFreeCancellation(),
      cancellationPolicy: bestRate.getMostRestrictivePolicy()?.description || null,
      isPromo: bestRate.isPromo,
      isPrivate: bestRate.isPrivate,
    } : null;
    
    return {
      id: this.id,
      name: this.name,
      rating: this.rating,
      location: address || `${this.info?.city?.name || ''}, ${this.info?.country?.code || ''}`,
      address: address,
      coordinates: this.info?.coordinates || null,
      propertyType: this.info?.propertyTypeName,
      roomsAvailable: this.roomCount,
      price: {
        amount: priceDetails.amount,
        currency: currency,
        formatted: priceDetails.formatted,
        details: priceDetails,
      },
      pricePerNight: pricePerNight,
      nights: nights,
      remarks: this.remarks,
      roomInfo: cheapestRoomInfo,
      ratePlanInfo: ratePlanInfo,
      propertyId: this.id,
    };
  }
}

// ==========================================================================
// SEARCH ROOM
// ==========================================================================

export class SearchRoom {
  raw: any;
  propertyId: string;
  id: string;
  code: string;
  name: string;
  availableRooms: number;
  searchedPax: { adults: number; children: number[] };
  settings: any;
  ratePlans: SearchRatePlan[];
  hasAvailability: boolean;
  ratePlanCount: number;

  constructor(rawData: any, propertyId: string) {
    this.raw = rawData;
    this.propertyId = propertyId;
    this.id = rawData.roomId;
    this.code = rawData.roomTypeCode;
    this.name = rawData.roomName || 'Sans nom';
    this.availableRooms = rawData.numberOfAvailableRooms || 0;
    this.searchedPax = {
      adults: rawData.searchedPax?.adults || 0,
      children: rawData.searchedPax?.children || [],
    };
    this.settings = rawData.settings || {};
    this.ratePlans = (rawData.ratePlans || []).map((rp: any) => 
      new SearchRatePlan(rp, this.id, this.propertyId)
    );
    this.hasAvailability = this.availableRooms > 0;
    this.ratePlanCount = this.ratePlans.length;
  }

  getCheapestRatePlan(): SearchRatePlan | null {
    if (this.ratePlans.length === 0) return null;
    
    return this.ratePlans.reduce((cheapest, rp) => {
      const cheapestPrice = cheapest?.getPrice('sell').amount || Infinity;
      const rpPrice = rp.getPrice('sell').amount || Infinity;
      
      return rpPrice < cheapestPrice ? rp : cheapest;
    });
  }

  getRatePlanByCode(rateCode: string): SearchRatePlan | undefined {
    return this.ratePlans.find(rp => rp.code === rateCode);
  }

  getRatePlansByPaymentType(charge: string): SearchRatePlan[] {
    return this.ratePlans.filter(rp => rp.payment.charge === charge);
  }

  getBedsDisplay(): string {
    const configs = this.settings.beddingConfigurations || [];
    return configs.map((bed: any) => 
      `${bed.quantity} ${bed.type}${bed.quantity > 1 ? 's' : ''}`
    ).join(', ');
  }

  toDisplay() {
    const cheapest = this.getCheapestRatePlan();
    
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      available: this.availableRooms,
      pax: {
        adults: this.searchedPax.adults,
        children: this.searchedPax.children.length,
      },
      beds: this.getBedsDisplay(),
      capacity: {
        adults: this.settings.maxAdultsNumber,
        children: this.settings.maxChildrenNumber,
        max: this.settings.maxOccupancy,
      },
      size: this.settings.roomSize ? `${this.settings.roomSize} m²` : null,
      bedrooms: this.settings.numberOfBedrooms,
      ratePlansCount: this.ratePlanCount,
      cheapestPrice: cheapest ? {
        amount: cheapest.getPrice('sell').amount,
        currency: cheapest.getPrice('sell').currency,
        formatted: formatPrice(cheapest.getPrice('sell').amount, cheapest.getPrice('sell').currency),
      } : null,
    };
  }
}

// ==========================================================================
// SEARCH RATE PLAN
// ==========================================================================

export interface CancellationPolicy {
  daysBefore: number;
  penaltyType: string;
  amount: number;
  timeSetting?: any;
  deadlineHour?: number;
  effectiveDeadline: {
    daysBefore: number;
    hour?: number;
    timeFromCheckIn?: number;
    timeFromCheckInType?: string;
  };
  description: string;
}

export class SearchRatePlan {
  raw: any;
  roomId: string;
  propertyId: string;
  id: string;
  code: string;
  name: string;
  board: string;
  remarks: string[];
  isImmediate: boolean;
  info: {
    virtual: boolean;
    contracts: any[];
    originalRatePlanCode: string;
    isPromotion: boolean;
    isPackageRate: boolean;
    isPrivate: boolean;
  };
  cancellationPolicies: CancellationPolicy[];
  payment: {
    charge?: string;
    chargeType?: string;
    chargeAmount?: number;
  };
  prices: {
    net: any;
    sell: any;
    commission: any;
    bar: any;
    fees: any[];
  } | null;
  nightlyBreakdown: any[];
  boardLabel: string;
  isCustomerPays: boolean;
  isAgentPays: boolean;
  isPromo: boolean;
  isPrivate: boolean;

  constructor(rawData: any, roomId: string, propertyId: string) {
    this.raw = rawData;
    this.roomId = roomId;
    this.propertyId = propertyId;
    
    this.id = rawData.ratePlanId;
    this.code = rawData.ratePlanCode;
    this.name = rawData.ratePlanName || 'Sans nom';
    this.board = rawData.board;
    this.remarks = rawData.remarks || [];
    this.isImmediate = rawData.isImmediate !== false;
    
    this.info = {
      virtual: rawData.ratePlanInfo?.virtual || false,
      contracts: rawData.ratePlanInfo?.contracts || [],
      originalRatePlanCode: rawData.ratePlanInfo?.originalRatePlanCode || '',
      isPromotion: rawData.ratePlanInfo?.isPromotion || false,
      isPackageRate: rawData.ratePlanInfo?.isPackageRate || false,
      isPrivate: rawData.ratePlanInfo?.isPrivate || false,
    };
    
    this.cancellationPolicies = this._parseCancellationPolicies(rawData.cancellationPolicies || []);
    
    this.payment = {
      charge: rawData.payment?.charge,
      chargeType: rawData.payment?.chargeType,
      chargeAmount: rawData.payment?.chargeAmount,
    };
    
    this.prices = this._parsePrices(rawData.prices);
    this.nightlyBreakdown = rawData.nightlyBreakdown || [];
    
    this.boardLabel = getBoardTypeLabel(this.board);
    this.isCustomerPays = this.payment.charge === 'customer';
    this.isAgentPays = this.payment.charge === 'agent';
    this.isPromo = this.info.isPromotion;
    this.isPrivate = this.info.isPrivate;
  }

  private _parseCancellationPolicies(policies: any[]): CancellationPolicy[] {
    return policies.map(policy => ({
      daysBefore: policy.daysBefore,
      penaltyType: policy.penaltyType,
      amount: policy.amount,
      timeSetting: policy.timeSetting,
      deadlineHour: policy.cancellationDeadlineHour,
      effectiveDeadline: {
        daysBefore: policy.daysBefore,
        hour: policy.cancellationDeadlineHour,
        timeFromCheckIn: policy.timeSetting?.timeFromCheckIn,
        timeFromCheckInType: policy.timeSetting?.timeFromCheckInType,
      },
      description: this._formatCancellationPolicy(policy),
    }));
  }

  private _formatCancellationPolicy(policy: any): string {
    const { penaltyType, amount, daysBefore } = policy;
    
    let penalty: string;
    if (penaltyType === 'nights') {
      penalty = `${amount} nuit${amount > 1 ? 's' : ''}`;
    } else if (penaltyType === 'percent') {
      penalty = `${amount}% du total`;
    } else {
      penalty = `${amount} ${policy.currency || ''}`;
    }
    
    return `Annulation ${daysBefore} jour${daysBefore > 1 ? 's' : ''} avant l'arrivée : pénalité de ${penalty}`;
  }

  private _parsePrices(prices: any) {
    if (!prices) return null;
    
    return {
      net: this._parsePrice(prices.net),
      sell: this._parsePrice(prices.sell),
      commission: this._parsePrice(prices.commission),
      bar: this._parsePrice(prices.bar),
      fees: prices.fees || [],
    };
  }

  private _parsePrice(priceObj: any) {
    if (!priceObj) return null;
    
    const amount = priceObj.price || 0;
    const currency = priceObj.currency || 'ILS';
    
    const taxes = (priceObj.taxes || []).map((tax: any) => ({
      ...tax,
      amount: tax.amount || 0,
      currency: tax.currency || currency,
    }));
    
    return {
      amount: amount,
      currency: currency,
      taxes: taxes,
      totalWithIncludedTaxes: this._calculateTotalWithTaxes({ ...priceObj, price: amount, taxes: taxes }),
      displayTaxes: this._getDisplayTaxes(taxes),
      formatted: formatPrice(amount, currency),
    };
  }

  private _calculateTotalWithTaxes(priceObj: any): number {
    const base = priceObj.price;
    const includedTaxes = (priceObj.taxes || [])
      .filter((tax: any) => tax.relation === 'included')
      .reduce((sum: number, tax: any) => sum + (tax.amount || 0), 0);
    
    return base + includedTaxes;
  }

  private _getDisplayTaxes(taxes: any[]): any[] {
    return taxes.filter(tax => tax.relation === 'display');
  }

  getPrice(type: 'net' | 'sell' | 'commission' | 'bar' = 'sell') {
    const price = this.prices?.[type] || { amount: 0, currency: 'ILS' };
    return price;
  }

  getAveragePricePerNight(): number {
    const nightlyPrices = this.nightlyBreakdown.map((night: any) => {
      const sellPrice = night.prices?.sell;
      if (!sellPrice) return 0;
      return sellPrice.price || 0;
    }).filter((price: number) => price > 0);
    
    if (nightlyPrices.length === 0) return 0;
    
    const total = nightlyPrices.reduce((sum: number, price: number) => sum + price, 0);
    return total / nightlyPrices.length;
  }

  hasFreeCancellation(): boolean {
    if (this.cancellationPolicies.length === 0) return true;
    return this.cancellationPolicies.some(policy => 
      policy.amount === 0 || policy.penaltyType === 'none'
    );
  }

  getMostRestrictivePolicy(): CancellationPolicy | null {
    if (this.cancellationPolicies.length === 0) return null;
    return [...this.cancellationPolicies].sort((a, b) => a.daysBefore - b.daysBefore)[0];
  }

  toDisplay() {
    const sellPrice = this.getPrice('sell');
    const netPrice = this.getPrice('net');
    
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      board: this.boardLabel,
      isImmediate: this.isImmediate,
      isPromo: this.isPromo,
      isPrivate: this.isPrivate,
      payment: {
        who: this.isCustomerPays ? 'Client' : 'Agence',
        type: this.payment.chargeType,
      },
      prices: {
        sell: {
          amount: sellPrice.amount,
          currency: sellPrice.currency,
          formatted: sellPrice.formatted,
        },
        net: {
          amount: netPrice.amount,
          currency: netPrice.currency,
          formatted: netPrice.formatted,
        },
        commission: this.getPrice('commission').amount,
      },
      taxes: {
        included: sellPrice.taxes.filter((t: any) => t.relation === 'included'),
        display: sellPrice.displayTaxes,
      },
      cancellation: {
        hasFreeCancellation: this.hasFreeCancellation(),
        policies: this.cancellationPolicies.map(p => p.description),
        mostRestrictive: this.getMostRestrictivePolicy(),
      },
      remarks: this.remarks,
    };
  }

  toBookingRequest() {
    return {
      roomCode: this.raw.roomTypeCode,
      roomId: this.roomId,
      rateCode: this.code,
      ratePlanId: this.id,
      expectedPrice: {
        amount: this.payment.chargeAmount,
        currency: this.getPrice('sell').currency,
      },
    };
  }
}
