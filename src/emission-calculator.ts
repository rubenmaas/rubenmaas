interface Aircraft {
  type: string;
  baseEmissionRate: number;  // kg CO2 per nautical mile
  maxPassengers: number;
  maxCargoWeight: number;    // in kg
  fuelEfficiencyFactor: number;  // modern aircraft efficiency multiplier
}

interface FlightDetails {
  distanceNM: number;        // distance in nautical miles
  passengers: number;
  cargoWeight: number;       // in kg
  aircraft: Aircraft;
}

class EmissionCalculator {
  private readonly aircraftDatabase: Map<string, Aircraft> = new Map([
    ['A320neo', {
      type: 'A320neo',
      baseEmissionRate: 11.5,      // kg CO2 per nautical mile
      maxPassengers: 180,
      maxCargoWeight: 16600,
      fuelEfficiencyFactor: 0.85   // 15% more efficient than base model
    }],
    ['B787-9', {
      type: 'B787-9',
      baseEmissionRate: 25.7,
      maxPassengers: 290,
      maxCargoWeight: 27000,
      fuelEfficiencyFactor: 0.80
    }]
  ]);

  calculateEmissions(flight: FlightDetails): {
    totalEmissions: number;
    perPassengerEmissions: number;
    emissionMetrics: EmissionMetrics;
  } {
    const loadFactor = this.calculateLoadFactor(flight);
    const distanceFactor = this.getDistanceFactor(flight.distanceNM);
    const baseEmissions = flight.distanceNM * flight.aircraft.baseEmissionRate;

    const totalEmissions = baseEmissions *
      flight.aircraft.fuelEfficiencyFactor *
      loadFactor *
      distanceFactor;

    return {
      totalEmissions,  // in kg CO2
      perPassengerEmissions: totalEmissions / flight.passengers,
      emissionMetrics: {
        loadFactor,
        distanceFactor,
        efficiencyScore: this.calculateEfficiencyScore(totalEmissions, flight)
      }
    };
  }

  private calculateLoadFactor(flight: FlightDetails): number {
    const passengerWeight = flight.passengers * 100;  // Average 100kg per passenger including luggage
    const totalWeight = passengerWeight + flight.cargoWeight;
    const maxWeight = (flight.aircraft.maxPassengers * 100) + flight.aircraft.maxCargoWeight;
    
    return 0.8 + (0.2 * (totalWeight / maxWeight));  // Base load factor of 0.8
  }

  private getDistanceFactor(distance: number): number {
    // Shorter flights are less efficient per mile due to takeoff/landing
    if (distance < 500) return 1.2;
    if (distance < 1000) return 1.1;
    if (distance > 5000) return 0.9;
    return 1.0;
  }

  private calculateEfficiencyScore(emissions: number, flight: FlightDetails): number {
    const perPassengerPerMile = emissions / (flight.passengers * flight.distanceNM);
    // Lower score is better
    return perPassengerPerMile * flight.aircraft.fuelEfficiencyFactor;
  }

  suggestOptimizations(flight: FlightDetails): string[] {
    const suggestions: string[] = [];
    const loadFactor = this.calculateLoadFactor(flight);

    if (loadFactor < 0.85) {
      suggestions.push('Consider consolidating flights to improve passenger load factor');
    }

    if (flight.distanceNM < 500) {
      suggestions.push('Short-haul flight: Consider alternative transport methods for better efficiency');
    }

    // Check if a more efficient aircraft is available for this route
    const moreEfficientAircraft = Array.from(this.aircraftDatabase.values())
      .find(a => 
        a.fuelEfficiencyFactor < flight.aircraft.fuelEfficiencyFactor &&
        a.maxPassengers >= flight.passengers
      );

    if (moreEfficientAircraft) {
      suggestions.push(`Consider using ${moreEfficientAircraft.type} for better fuel efficiency`);
    }

    return suggestions;
  }
}

interface EmissionMetrics {
  loadFactor: number;
  distanceFactor: number;
  efficiencyScore: number;
}

// Usage example
const calculator = new EmissionCalculator();
const flight: FlightDetails = {
  distanceNM: 1500,
  passengers: 150,
  cargoWeight: 5000,
  aircraft: calculator.aircraftDatabase.get('A320neo')!
};

const emissions = calculator.calculateEmissions(flight);
const optimizations = calculator.suggestOptimizations(flight); 