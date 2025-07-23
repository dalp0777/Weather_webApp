// Weather API configuration
const weatherApi = {
    key: '4eb3703790b356562054106543b748b2',
    baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
    forecastUrl: 'https://api.openweathermap.org/data/2.5/forecast'
};

let currentUnit = 'metric'; // Default unit is 'metric' (Celsius)

// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('weather-body').innerHTML = `
      <div class="loading-message">Enter a city name to see the weather!</div>
    `;
    document.getElementById('forecast-body').innerHTML = `
      <div class="loading-message">5-day forecast will appear here after you search.</div>
    `;
    document.getElementById('input-box').focus();

    let searchInputBox = document.getElementById('input-box');
    if (searchInputBox) {
        searchInputBox.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                getWeatherReport(searchInputBox.value);
            }
        });
    }
});

// Show loading indicator
function showLoading(targetId) {
    const target = document.getElementById(targetId);
    target.innerHTML = `<div class="loading-message">Loading...</div>`;
    target.style.display = 'block';
}

// Fetch weather report from API
function getWeatherReport(city) {
    showLoading('weather-body'); // Show loading before fetch
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
            autoResetUI(5000); // auto reset UI after 5 seconds on error
        });
}

// Show weather report on the page
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
        weather_body.innerHTML =
            `
    <div class="location-deatils">
        <div class="city" id="city">${weather.name}, ${weather.sys.country}</div>
        <div class="date" id="date"> ${dateManage(todayDate)}</div>
    </div>
    <div class="weather-status">
        <div class="temp" id="temp">${Math.round(weather.main.temp)}&deg;C </div>
        <div class="weather" id="weather"> ${weather.weather[0].main} <img src="${iconUrl}" alt="weather icon">  </div>
        <div class="min-max" id="min-max">${Math.floor(weather.main.temp_min)}&deg;C (min) / ${Math.ceil(weather.main.temp_max)}&deg;C (max) </div>
        <div id="updated_on">Updated as of ${getTime(todayDate)}</div>
    </div>
    <hr>
    <div class="day-details">
        <div class="basic">Feels like ${weather.main.feels_like}&deg;C | Humidity ${weather.main.humidity}%  <br> Pressure ${weather.main.pressure} mb | Wind ${weather.wind.speed} KMPH</div>
    </div>
    `;
        changeBg(weather.weather[0].main);
        getWeatherForecast(weather.name);

        // Optional: auto reset UI after 30 seconds of showing info
        setTimeout(() => {
            autoResetUI();
        }, 30000);
    }

    // Get the current time for last update
    function getTime(todayDate) {
        let hour = addZero(todayDate.getHours());
        let minute = addZero(todayDate.getMinutes());
        return `${hour}:${minute}`;
    }

    // Format date to a user-friendly format
    function dateManage(dateArg) {
        let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        let year = dateArg.getFullYear();
        let month = months[dateArg.getMonth()];
        let date = dateArg.getDate();
        let day = days[dateArg.getDay()];
        return `${date} ${month} (${day}) , ${year}`;
    }

    // Change background based on weather status
    function changeBg(status) {
        if (status === 'Clouds') {
            document.body.style.backgroundImage = 'url(img/clouds.jpg)';
        } else if (status === 'Rain') {
            document.body.style.backgroundImage = 'url(img/rainy.jpg)';
        } else if (status === 'Clear') {
            document.body.style.backgroundImage = 'url(img/clear.jpg)';
        }
        else if (status === 'Snow') {
            document.body.style.backgroundImage = 'url(img/snow.jpg)';
        }
        else if (status === 'Sunny') {
            document.body.style.backgroundImage = 'url(img/sunny.jpg)';
        } else if (status === 'Thunderstorm') {
            document.body.style.backgroundImage = 'url(img/thunderstrom.jpg)';
        } else if (status === 'Drizzle') {
            document.body.style.backgroundImage = 'url(img/drizzle.jpg)';
        } else if (status === 'Mist' || status === 'Haze' || status === 'Fog') {
            document.body.style.backgroundImage = 'url(img/mist.jpg)';
        }
        else {
            document.body.style.backgroundImage = 'url(img/bg.jpg)';
        }
    }

    // Reset search input
    function reset() {
        let input = document.getElementById('input-box');
        input.value = "";
    }

    // Add leading zero for single-digit hour or minute
    function addZero(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    // Toggle between Celsius and Fahrenheit
    function toggleUnit() {
        currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
        getWeatherReport(document.getElementById('input-box').value);
    }

    // Fetch weather forecast for the next 5 days
    function getWeatherForecast(city) {
        showLoading('forecast-body'); // Show loading before fetch
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
                autoResetUI(5000); // reset after error in forecast fetch
            });
    }

    // Display 5-day weather forecast as cards
    function showWeatherForecast(forecast) {
        let forecast_body = document.getElementById('forecast-body');
        let forecastList = forecast.list;
        if (!forecastList || forecastList.length === 0) {
            forecast_body.innerHTML = "<div class='loading-message'>No forecast data available.</div>";
            swal("No Forecast Data", "No forecast data available for this city.", "info");
            return;
        }
        forecast_body.innerHTML = "<h3>5-Day Forecast</h3><div class='forecast-list'></div>";

        let days = {};
        forecastList.forEach(item => {
            let date = item.dt_txt.split(' ')[0];
            if (!days[date]) {
                days[date] = [];
            }
            days[date].push(item);
        });

        let html = "";
        Object.keys(days).slice(0, 5).forEach(date => {
            let dayData = days[date][0];
            let iconCode = dayData.weather[0].icon;
            let iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            html += `
            <div class="forecast-card">
                <div class="date">${dateManage(new Date(date))}</div>
                <img src="${iconUrl}" alt="weather icon">
                <div class="temp">${Math.round(dayData.main.temp)}&deg;C</div>
                <div class="weather">${dayData.weather[0].main}</div>
            </div>
        `;
        });

        forecast_body.querySelector('.forecast-list').innerHTML = html;
        forecast_body.style.display = 'block';
    }
}

// --- New helper function for auto-reset ---
function autoResetUI(delay = 5000) { // default 5 seconds
    setTimeout(() => {
        document.getElementById('weather-body').innerHTML = `<div class="loading-message">Enter a city name to see the weather!</div>`;
        document.getElementById('forecast-body').innerHTML = `<div class="loading-message">5-day forecast will appear here after you search.</div>`;
        reset();
    }, delay);
}

// Reset search input
function reset() {
    let input = document.getElementById('input-box');
    if (input) input.value = "";
}
