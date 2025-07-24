// 🌤️ Weather API configuration
const weatherApi = {
    key: '4eb3703790b356562054106543b748b2',
    baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
    forecastUrl: 'https://api.openweathermap.org/data/2.5/forecast'
};

// 🌡️ Default unit: Celsius
let currentUnit = 'metric';

// 🧠 Variables to remember last fetched location
let lastCity = null;
let lastCoords = null;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('weather-body').innerHTML = `
      <div class="loading-message">Enter a city name to see the weather!</div>
    `;
    document.getElementById('forecast-body').innerHTML = `
      <div class="loading-message">5-day forecast will appear here after you search.</div>
    `;
    document.getElementById('input-box').focus();

    let searchInputBox = document.getElementById('input-box');
    if (searchInputBox) {
        searchInputBox.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                getWeatherReport(searchInputBox.value);
            }
        });
    }

    detectLocation(); // Try to auto-detect location on load
});

// 🔄 Show and hide loading spinners
function showLoadingSpinner(id) {
    const loader = document.getElementById(id);
    if (loader) loader.style.display = 'flex';
}

function hideLoadingSpinner(id) {
    const loader = document.getElementById(id);
    if (loader) loader.style.display = 'none';
}

// 🌀 Show fallback loading message
function showLoading(targetId) {
    const target = document.getElementById(targetId);
    target.innerHTML = `<div class="loading-message">Loading...</div>`;
    target.style.display = 'block';
}

// 📍 Auto-detect location
function detectLocation() {
    if (navigator.geolocation) {
        showLoading('weather-body');
        showLoadingSpinner('loader');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherByCoords(lat, lon);
            },
            (error) => {
                console.warn('Geolocation error:', error.message);
                document.getElementById('weather-body').innerHTML = `
                    <div class="loading-message">Enter a city name to see the weather!</div>
                `;
                hideLoadingSpinner('loader');
            }
        );
    } else {
        console.warn('Geolocation not supported');
    }
}

// 🌐 Fetch weather using coordinates
function getWeatherByCoords(lat, lon) {
    lastCoords = { lat, lon };
    lastCity = null;

    showLoading('weather-body');
    showLoadingSpinner('loader');

    fetch(`${weatherApi.baseUrl}?lat=${lat}&lon=${lon}&appid=${weatherApi.key}&units=${currentUnit}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch weather for your location.');
            return response.json();
        })
        .then(showWeatherReport)
        .catch(err => {
            swal("Location Error", err.message, "error");
            autoResetUI(5000);
        })
        .finally(() => {
            hideLoadingSpinner('loader');
            reset();
        });
}

// 🏙️ Fetch weather by city name
function getWeatherReport(city) {
    lastCity = city;
    lastCoords = null;

    showLoading('weather-body');
    showLoadingSpinner('loader');

    fetch(`${weatherApi.baseUrl}?q=${city}&appid=${weatherApi.key}&units=${currentUnit}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    let errorMessage = '';
                    if (err.cod === '404') {
                        errorMessage = 'City not found. Please try again with a different city.';
                    } else if (err.cod === '400') {
                        errorMessage = 'Invalid input. Please enter a city name.';
                    } else {
                        errorMessage = 'An error occurred while fetching the weather data. Please try again later.';
                    }
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })
        .then(showWeatherReport)
        .catch((err) => {
            swal("Error", err.message, "error");
            autoResetUI(5000);
        })
        .finally(() => {
            hideLoadingSpinner('loader');
            reset();
        });
}

// 📊 Display current weather
function showWeatherReport(weather) {
    let city_code = weather.cod;
    if (city_code === 400 || city_code === "400") {
        swal("Empty Input", "Please enter any city", "error");
        autoResetUI(5000);
    } else if (city_code === 404 || city_code === "404") {
        swal("Bad Input", "Entered city didn't match", "warning");
        autoResetUI(5000);
    } else {
        let weather_body = document.getElementById('weather-body');
        weather_body.style.display = 'block';
        let todayDate = new Date();
        let iconCode = weather.weather[0].icon;
        let iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const tempUnit = currentUnit === 'metric' ? 'C' : 'F';
        const windUnit = currentUnit === 'metric' ? 'KMPH' : 'MPH';

        weather_body.innerHTML = `
            <div class="location-deatils">
                <div class="city" id="city">${weather.name}, ${weather.sys.country}</div>
                <div class="date" id="date">${dateManage(todayDate)}</div>
            </div>
            <div class="weather-status">
                <div class="temp" id="temp">${Math.round(weather.main.temp)}&deg;${tempUnit}</div>
                <div class="weather" id="weather">${weather.weather[0].main} <img src="${iconUrl}" alt="weather icon"></div>
                <div class="min-max" id="min-max">${Math.floor(weather.main.temp_min)}&deg;${tempUnit} (min) / ${Math.ceil(weather.main.temp_max)}&deg;${tempUnit} (max)</div>
                <div id="updated_on">Updated as of ${getTime(todayDate)}</div>
            </div>
            <hr>
            <div class="day-details">
                <div class="basic">Feels like ${weather.main.feels_like}&deg;${tempUnit} | Humidity ${weather.main.humidity}%<br>
                Pressure ${weather.main.pressure} mb | Wind ${weather.wind.speed} ${windUnit}</div>
            </div>
        `;
        changeBg(weather.weather[0].main);
        if (weather.name) getWeatherForecast(weather.name);
    }
}

// 📅 Get readable date
function dateManage(dateArg) {
    let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${dateArg.getDate()} ${months[dateArg.getMonth()]} (${days[dateArg.getDay()]}) , ${dateArg.getFullYear()}`;
}

// ⏰ Get time
function getTime(todayDate) {
    let hour = addZero(todayDate.getHours());
    let minute = addZero(todayDate.getMinutes());
    return `${hour}:${minute}`;
}

// 🎨 Update background based on weather
function changeBg(status) {
    const bgMap = {
        'Clouds': 'clouds.jpg',
        'Rain': 'rainy.jpg',
        'Clear': 'clear.jpg',
        'Snow': 'snow.jpg',
        'Sunny': 'sunny.jpg',
        'Thunderstorm': 'thunderstrom.jpg',
        'Drizzle': 'drizzle.jpg',
        'Mist': 'mist.jpg',
        'Haze': 'mist.jpg',
        'Fog': 'mist.jpg'
    };
    let image = bgMap[status] || 'bg.jpg';
    document.body.style.backgroundImage = `url(img/${image})`;
}

// 🌤️ Fetch 5-day forecast
function getWeatherForecast(city) {
    showLoading('forecast-body');
    showLoadingSpinner('forecast-loader');

    fetch(`${weatherApi.forecastUrl}?q=${city}&appid=${weatherApi.key}&units=${currentUnit}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || err.cod || "Unable to fetch forecast data.");
                });
            }
            return response.json();
        })
        .then(showWeatherForecast)
        .catch((err) => {
            swal("Network Error", err.message, "error");
            autoResetUI(5000);
        });
}

// 📈 Display forecast cards
function showWeatherForecast(forecast) {
    let forecast_body = document.getElementById('forecast-body');
    let forecastList = forecast.list;
    if (!forecastList || forecastList.length === 0) {
        forecast_body.innerHTML = "<div class='loading-message'>No forecast data available.</div>";
        swal("No Forecast Data", "No forecast data available for this city.", "info");
        hideLoadingSpinner('forecast-loader');
        return;
    }

    forecast_body.innerHTML = "<h3>5-Day Forecast</h3><div class='forecast-list'></div>";
    let days = {};

    forecastList.forEach(item => {
        let date = item.dt_txt.split(' ')[0];
        if (!days[date]) days[date] = [];
      days[date].push(item);
    });

    const tempUnit = currentUnit === 'metric' ? 'C' : 'F';

    let html = "";
    Object.keys(days).slice(0, 5).forEach(date => {
        let dayData = days[date][0];
        let iconCode = dayData.weather[0].icon;
        let iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        html += `
            <div class="forecast-card">
                <div class="date">${dateManage(new Date(date))}</div>
                <img src="${iconUrl}" alt="weather icon">
                <div class="temp">${Math.round(dayData.main.temp)}&deg;${tempUnit}</div>
                <div class="weather">${dayData.weather[0].main}</div>
            </div>
        `;
    });

    forecast_body.querySelector('.forecast-list').innerHTML = html;
    forecast_body.style.display = 'block';
    hideLoadingSpinner('forecast-loader');
}

// 🧹 Auto reset UI
function autoResetUI(delay = 5000) {
    setTimeout(() => {
        document.getElementById('weather-body').innerHTML = `<div class="loading-message">Enter a city name to see the weather!</div>`;
        document.getElementById('forecast-body').innerHTML = `<div class="loading-message">5-day forecast will appear here after you search.</div>`;
    }, delay);
}

// ✏️ Reset search input
function reset() {
    let input = document.getElementById('input-box');
    if (input) input.value = "";
}

// 🔢 Format time
function addZero(i) {
    return (i < 10 ? "0" : "") + i;
}

// 🔁 Toggle temperature unit and refetch
function toggleUnit() {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';

    // Update button text
    const unitToggleBtn = document.getElementById('unit-toggle-btn');
    unitToggleBtn.textContent = currentUnit === 'metric' ? 'Switch to °F' : 'Switch to °C';

    // Refetch using last known method
    if (lastCity) {
        getWeatherReport(lastCity);
    } else if (lastCoords) {
        getWeatherByCoords(lastCoords.lat, lastCoords.lon);
    } else {
        swal("Error", "No previous weather data to refetch. Please search or allow location.", "warning");
    }
}

