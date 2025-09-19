import type {
  WeatherForecast,
  WeatherRecommendationEngine,
  ComfortIndex
} from '../types/weather';

export class WeatherRecommendationEngineImpl implements WeatherRecommendationEngine {

  getClothingRecommendations(forecast: WeatherForecast): string[] {
    const recommendations: string[] = [];
    const { temperatureHigh, precipitationChance, weatherCondition } = forecast;

    // Rain gear
    if (precipitationChance >= 30) {
      recommendations.push('Bring an umbrella or poncho');
    }
    if (precipitationChance >= 60) {
      recommendations.push('Waterproof shoes recommended');
    }

    // Temperature-based clothing
    if (temperatureHigh >= 95) {
      recommendations.push('Light, breathable, light-colored clothing');
      recommendations.push('Wide-brimmed hat for sun protection');
    } else if (temperatureHigh >= 85) {
      recommendations.push('Comfortable, moisture-wicking clothing');
      recommendations.push('Sun hat and sunglasses');
    } else if (temperatureHigh >= 75) {
      recommendations.push('Light layers - it may get warm');
    } else if (temperatureHigh >= 65) {
      recommendations.push('Light jacket or sweater for evening');
    } else {
      recommendations.push('Warm clothing and layers');
    }

    // Specific weather conditions
    if (weatherCondition === 'thunderstorm') {
      recommendations.push('Avoid metal accessories during storms');
    }

    // Always recommend
    if (temperatureHigh >= 75) {
      recommendations.push('Sunscreen (SPF 30 or higher)');
    }

    return recommendations;
  }

  getActivityRecommendations(
    forecast: WeatherForecast,
    availableAttractions: any[]
  ): {
    highly_recommended: any[];
    recommended: any[];
    neutral: any[];
    avoid: any[];
  } {
    const { weatherCondition, temperatureHigh, precipitationChance } = forecast;

    const highly_recommended: any[] = [];
    const recommended: any[] = [];
    const neutral: any[] = [];
    const avoid: any[] = [];

    for (const attraction of availableAttractions) {
      const features = attraction.features || {};

      // For rainy/stormy weather
      if (weatherCondition === 'rain' || weatherCondition === 'thunderstorm' || precipitationChance >= 70) {
        if (features.rainSafe || features.airConditioning || !features.outdoorExperience) {
          if (attraction.type === 'show' || features.airConditioning) {
            highly_recommended.push(attraction);
          } else {
            recommended.push(attraction);
          }
        } else if (features.outdoorExperience) {
          avoid.push(attraction);
        } else {
          neutral.push(attraction);
        }
      }
      // For very hot weather
      else if (temperatureHigh >= 95) {
        if (features.airConditioning || !features.outdoorExperience) {
          highly_recommended.push(attraction);
        } else if (features.getsWet) {
          recommended.push(attraction); // Water attractions are good in hot weather
        } else if (features.outdoorExperience) {
          avoid.push(attraction);
        } else {
          neutral.push(attraction);
        }
      }
      // For moderate hot weather
      else if (temperatureHigh >= 85) {
        if (features.getsWet) {
          highly_recommended.push(attraction);
        } else if (features.airConditioning) {
          recommended.push(attraction);
        } else if (features.outdoorExperience && !features.getsWet) {
          neutral.push(attraction);
        } else {
          recommended.push(attraction);
        }
      }
      // For nice weather
      else if (weatherCondition === 'clear' && temperatureHigh >= 70 && temperatureHigh <= 84) {
        if (features.outdoorExperience) {
          highly_recommended.push(attraction);
        } else {
          recommended.push(attraction);
        }
      }
      // Default case
      else {
        recommended.push(attraction);
      }
    }

    return {
      highly_recommended,
      recommended,
      neutral,
      avoid
    };
  }

  getPackingRecommendations(forecasts: WeatherForecast[]): string[] {
    const recommendations: string[] = [];

    const maxTemp = Math.max(...forecasts.map(f => f.temperatureHigh));
    const minTemp = Math.min(...forecasts.map(f => f.temperatureLow));
    const maxRainChance = Math.max(...forecasts.map(f => f.precipitationChance));
    const hasStorms = forecasts.some(f => f.weatherCondition === 'thunderstorm');

    // Temperature range recommendations
    const tempRange = maxTemp - minTemp;
    if (tempRange > 20) {
      recommendations.push('Pack layers - temperature will vary significantly');
    }

    if (maxTemp >= 95) {
      recommendations.push('Cooling towel or personal fan');
      recommendations.push('Extra water bottles');
      recommendations.push('Electrolyte supplements');
    }

    if (minTemp <= 60) {
      recommendations.push('Warm jacket for cooler moments');
    }

    // Rain recommendations
    if (maxRainChance >= 50) {
      recommendations.push('Waterproof bag for electronics');
      recommendations.push('Extra clothes in case you get wet');
    }

    if (hasStorms) {
      recommendations.push('Portable phone charger (indoor sheltering may be needed)');
    }

    // General recommendations
    recommendations.push('Comfortable walking shoes with good grip');
    recommendations.push('Sunscreen and lip balm with SPF');

    if (maxTemp >= 80) {
      recommendations.push('Reusable water bottle');
    }

    return recommendations;
  }

  getDiningRecommendations(
    forecast: WeatherForecast,
    availableDining: any[]
  ): any[] {
    const { weatherCondition, temperatureHigh, precipitationChance } = forecast;
    const recommended: any[] = [];

    for (const dining of availableDining) {
      const features = dining.features || {};

      // For rainy/stormy weather - prioritize indoor dining
      if (weatherCondition === 'rain' || weatherCondition === 'thunderstorm' || precipitationChance >= 70) {
        if (!features.outdoorSeating || features.coveredSeating) {
          recommended.push({
            ...dining,
            weatherReason: 'Indoor seating recommended for rain protection'
          });
        }
      }
      // For very hot weather - prioritize air-conditioned spaces
      else if (temperatureHigh >= 95) {
        if (features.airConditioning) {
          recommended.push({
            ...dining,
            weatherReason: 'Air conditioning provides relief from heat'
          });
        }
      }
      // For nice weather - outdoor dining is great
      else if (weatherCondition === 'clear' && temperatureHigh >= 70 && temperatureHigh <= 84) {
        if (features.outdoorSeating) {
          recommended.push({
            ...dining,
            weatherReason: 'Perfect weather for outdoor dining'
          });
        }
      }
    }

    return recommended;
  }

  calculateComfortIndex(forecast: WeatherForecast): ComfortIndex {
    const { temperatureHigh, temperatureFeelsLike, humidity } = forecast;

    // Simple heat index calculation (simplified version)
    let heatIndex = temperatureFeelsLike;

    // Adjust for humidity
    if (humidity > 70 && temperatureHigh > 80) {
      heatIndex += 5; // High humidity makes it feel hotter
    }

    let comfortLevel: ComfortIndex['comfortLevel'] = 'comfortable';
    const recommendations: string[] = [];

    if (heatIndex >= 105) {
      comfortLevel = 'dangerous';
      recommendations.push('Limit outdoor exposure');
      recommendations.push('Seek air-conditioned areas frequently');
      recommendations.push('Stay very well hydrated');
      recommendations.push('Consider postponing outdoor activities');
    } else if (heatIndex >= 95) {
      comfortLevel = 'hot';
      recommendations.push('Take frequent breaks in shade or AC');
      recommendations.push('Stay well hydrated');
      recommendations.push('Wear light, breathable clothing');
      recommendations.push('Avoid strenuous outdoor activities during peak heat');
    } else if (heatIndex >= 85) {
      comfortLevel = 'warm';
      recommendations.push('Stay hydrated');
      recommendations.push('Consider sunscreen and hat');
      recommendations.push('Take breaks in shaded areas');
    } else if (heatIndex >= 70) {
      comfortLevel = 'comfortable';
      recommendations.push('Great weather for outdoor activities');
    } else {
      comfortLevel = 'comfortable';
      recommendations.push('May need light layers for warmth');
    }

    if (humidity > 70) {
      recommendations.push('High humidity - expect to feel hotter than actual temperature');
    }

    return {
      temperature: temperatureHigh,
      feelsLike: temperatureFeelsLike,
      humidity,
      heatIndex,
      comfortLevel,
      recommendations
    };
  }

  getWeatherAlerts(forecast: WeatherForecast): Array<{
    type: 'info' | 'warning' | 'severe';
    title: string;
    message: string;
  }> {
    const alerts: Array<{
      type: 'info' | 'warning' | 'severe';
      title: string;
      message: string;
    }> = [];

    // Severe weather alerts
    if (forecast.weatherCondition === 'thunderstorm') {
      alerts.push({
        type: 'severe',
        title: 'Thunderstorm Warning',
        message: 'Outdoor attractions may close. Seek indoor shelter during storms.'
      });
    }

    // Heat alerts
    if (forecast.temperatureFeelsLike >= 105) {
      alerts.push({
        type: 'severe',
        title: 'Extreme Heat Warning',
        message: 'Dangerous heat conditions. Limit outdoor exposure and stay hydrated.'
      });
    } else if (forecast.temperatureFeelsLike >= 95) {
      alerts.push({
        type: 'warning',
        title: 'Heat Advisory',
        message: 'Very hot conditions expected. Take frequent breaks and stay hydrated.'
      });
    }

    // Rain alerts
    if (forecast.precipitationChance >= 80) {
      alerts.push({
        type: 'warning',
        title: 'Heavy Rain Expected',
        message: 'High chance of rain. Bring rain gear and plan indoor activities.'
      });
    } else if (forecast.precipitationChance >= 50) {
      alerts.push({
        type: 'info',
        title: 'Rain Possible',
        message: 'Pack an umbrella or poncho just in case.'
      });
    }

    return alerts;
  }
}

// Export singleton instance
export const weatherRecommendationEngine = new WeatherRecommendationEngineImpl();