import type { FlightOffer } from '@open-travel-agent/shared-types';

export function generateMockOffers(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  passengers: number = 1,
): FlightOffer[] {
  const carriers = [
    { code: 'AA', name: 'American Airlines' },
    { code: 'UA', name: 'United Airlines' },
    { code: 'DL', name: 'Delta Air Lines' },
    { code: 'WN', name: 'Southwest Airlines' },
    { code: 'AF', name: 'Air France' },
    { code: 'BA', name: 'British Airways' },
  ];

  const offers: FlightOffer[] = [];
  const basePrice = 250 + Math.floor(Math.random() * 300);

  for (let i = 0; i < 8; i++) {
    const carrier = carriers[i % carriers.length];
    const stops = i < 3 ? 0 : i < 6 ? 1 : 2;
    const durationHours = 3 + stops * 2 + Math.floor(Math.random() * 3);
    const priceMultiplier = stops === 0 ? 1.4 : stops === 1 ? 1.0 : 0.85;
    const price = Math.round(basePrice * priceMultiplier * (0.9 + Math.random() * 0.3));

    const departHour = 6 + Math.floor(Math.random() * 14);
    const arriveHour = (departHour + durationHours) % 24;

    const outboundSegments = [];

    if (stops === 0) {
      outboundSegments.push({
        carrier: carrier.code,
        carrierName: carrier.name,
        flightNumber: `${carrier.code}${1000 + i * 100}`,
        departure: {
          airport: origin,
          at: `${departureDate}T${String(departHour).padStart(2, '0')}:00:00`,
        },
        arrival: {
          airport: destination,
          at: `${departureDate}T${String(arriveHour).padStart(2, '0')}:30:00`,
        },
        duration: `PT${durationHours}H30M`,
        cabin: 'ECONOMY' as const,
      });
    } else {
      const layoverAirport = 'ORD';
      const legOneHours = Math.ceil(durationHours / 2);
      const layoverMid = (departHour + legOneHours) % 24;

      outboundSegments.push({
        carrier: carrier.code,
        carrierName: carrier.name,
        flightNumber: `${carrier.code}${1000 + i * 100}`,
        departure: {
          airport: origin,
          at: `${departureDate}T${String(departHour).padStart(2, '0')}:00:00`,
        },
        arrival: {
          airport: layoverAirport,
          at: `${departureDate}T${String(layoverMid).padStart(2, '0')}:15:00`,
        },
        duration: `PT${legOneHours}H15M`,
        cabin: 'ECONOMY' as const,
      });

      outboundSegments.push({
        carrier: carrier.code,
        carrierName: carrier.name,
        flightNumber: `${carrier.code}${1100 + i * 100}`,
        departure: {
          airport: layoverAirport,
          at: `${departureDate}T${String((layoverMid + 1) % 24).padStart(2, '0')}:30:00`,
        },
        arrival: {
          airport: destination,
          at: `${departureDate}T${String(arriveHour).padStart(2, '0')}:30:00`,
        },
        duration: `PT${durationHours - legOneHours}H0M`,
        cabin: 'ECONOMY' as const,
      });

      if (stops === 2) {
        const midAirport = 'ATL';
        const origSecond = outboundSegments[1];
        outboundSegments[1] = {
          ...origSecond,
          arrival: { airport: midAirport, at: origSecond.arrival.at },
        };
        outboundSegments.push({
          carrier: carrier.code,
          carrierName: carrier.name,
          flightNumber: `${carrier.code}${1200 + i * 100}`,
          departure: {
            airport: midAirport,
            at: `${departureDate}T${String((arriveHour - 1 + 24) % 24).padStart(2, '0')}:00:00`,
          },
          arrival: {
            airport: destination,
            at: `${departureDate}T${String(arriveHour).padStart(2, '0')}:30:00`,
          },
          duration: 'PT1H30M',
          cabin: 'ECONOMY' as const,
        });
      }
    }

    const offer: FlightOffer = {
      id: `mock-${i + 1}`,
      provider: 'mock',
      outbound: {
        segments: outboundSegments,
        duration: `PT${durationHours}H30M`,
        stops,
      },
      price: {
        total: price * passengers,
        currency: 'USD',
        base: Math.round(price * 0.85) * passengers,
        taxes: Math.round(price * 0.15) * passengers,
        perPassenger: price,
      },
      seatsRemaining: 2 + Math.floor(Math.random() * 7),
      validatingCarrier: carrier.code,
    };

    if (returnDate) {
      const returnHour = 8 + Math.floor(Math.random() * 12);
      const returnArriveHour = (returnHour + durationHours) % 24;
      offer.inbound = {
        segments: [
          {
            carrier: carrier.code,
            carrierName: carrier.name,
            flightNumber: `${carrier.code}${2000 + i * 100}`,
            departure: {
              airport: destination,
              at: `${returnDate}T${String(returnHour).padStart(2, '0')}:00:00`,
            },
            arrival: {
              airport: origin,
              at: `${returnDate}T${String(returnArriveHour).padStart(2, '0')}:00:00`,
            },
            duration: `PT${durationHours}H0M`,
            cabin: 'ECONOMY' as const,
          },
        ],
        duration: `PT${durationHours}H0M`,
        stops: 0,
      };
    }

    offers.push(offer);
  }

  return offers;
}
