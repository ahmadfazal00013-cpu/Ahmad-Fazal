
import React, { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  condition: string;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await response.json();
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          condition: getWeatherCondition(data.current_weather.weathercode)
        });
      } catch (e) {
        console.error("Weather fetch error", e);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => console.warn("Geolocation access denied")
    );
  }, []);

  const getWeatherCondition = (code: number) => {
    if (code === 0) return 'Clear';
    if (code < 3) return 'Partly Cloudy';
    if (code < 50) return 'Foggy';
    if (code < 70) return 'Raining';
    return 'Stormy';
  };

  if (!weather) return null;

  return (
    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/5">
      <i className={`fa-solid ${weather.condition === 'Clear' ? 'fa-sun text-yellow-400' : 'fa-cloud text-blue-300'} text-xs`}></i>
      <span className="text-[10px] font-black text-white/80">{weather.temp}°C • {weather.condition}</span>
    </div>
  );
};

export default WeatherWidget;
