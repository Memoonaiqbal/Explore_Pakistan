document.addEventListener("DOMContentLoaded", function () {
    var pakistanBounds = [
        [23.6345, 60.8722], 
        [37.0841, 77.8375]
    ];

    var map = L.map("map", {
        center: [30.3753, 69.3451],
        zoom: 6,
        maxBounds: pakistanBounds,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        minZoom: 5,
        maxZoom: 18
    }).addTo(map);

    // API Keys (Replace with your own)
    const OPENWEATHERMAP_API_KEY = "";
    const GOOGLE_SEARCH_API_KEY = "";  
    const GOOGLE_CX = ""; 

    // Function to fetch city coordinates from the search box
    function getCityCoordinates(city) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city},Pakistan`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    let lat = data[0].lat;
                    let lng = data[0].lon;

                    // Update map to searched location
                    map.setView([lat, lng], 10);
                    L.marker([lat, lng]).addTo(map).bindPopup(city).openPopup();

                    // Fetch city info
                    getCityInfo(city);
                } else {
                    document.getElementById("location-title").textContent = "City Not Found";
                    document.getElementById("description").textContent = "Please try another location.";
                }
            })
            .catch(() => {
                document.getElementById("location-title").textContent = "Error";
                document.getElementById("description").textContent = "Failed to fetch location data.";
            });
    }

    // Function to fetch city info (Search & Click)
    function getCityInfo(city) {
        document.getElementById("location-title").textContent = city;
        fetchWeather(city);
        fetchWikimediaImage(city);
        fetchCityHistory(city);
        fetchGoogleSearchResults(city);
    }

    // Fetch Weather Data
    function fetchWeather(city) {
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},PK&appid=${OPENWEATHERMAP_API_KEY}&units=metric`)
            .then(response => response.json())
            .then(data => {
                document.getElementById("weather-info").innerHTML = 
                    `🌡 Temperature: ${data.main.temp}°C<br>💧 Humidity: ${data.main.humidity}%<br>🌤 Condition: ${data.weather[0].description}`;
            })
            .catch(() => {
                document.getElementById("weather-info").innerHTML = "Weather data not available.";
            });
    }

    // Fetch City Image from Wikipedia
    function fetchWikimediaImage(city) {
        fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${city}&prop=pageimages&format=json&pithumbsize=500&origin=*`)
            .then(response => response.json())
            .then(data => {
                let pages = data.query.pages;
                let page = Object.keys(pages)[0];
                let imageUrl = pages[page].thumbnail ? pages[page].thumbnail.source : null;

                if (imageUrl) {
                    document.getElementById("image-container").innerHTML =
                        `<img src="${imageUrl}" style="width:100%; height:auto; border-radius:10px;">`;
                } else {
                    document.getElementById("image-container").innerHTML = `<p>No image found.</p>`;
                }
            })
            .catch(() => {
                document.getElementById("image-container").innerHTML = `<p>No image found.</p>`;
            });
    }

    // Fetch Historical Details from Wikipedia
    function fetchCityHistory(city) {
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${city}`)
            .then(response => response.json())
            .then(data => {
                if (data.extract) {
                    document.getElementById("description").innerHTML = `
                        ${data.extract} <br>
                        <a href="${data.content_urls.desktop.page}" target="_blank">Read more on Wikipedia</a>
                    `;
                } else {
                    document.getElementById("description").innerHTML = "No historical details found.";
                }
            })
            .catch(() => {
                document.getElementById("description").innerHTML = "Error fetching historical details.";
            });
    }

    // Fetch Additional Details using Google Search API
    function fetchGoogleSearchResults(city) {
        fetch(`https://www.googleapis.com/customsearch/v1?q=${city}+Pakistan&key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_CX}`)
            .then(response => response.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    let firstResult = data.items[0];
                    let title = firstResult.title;
                    let snippet = firstResult.snippet;
                    let link = firstResult.link;

                    document.getElementById("description").innerHTML += `
                        <br><br>
                        <strong>More Info:</strong> ${title}<br>
                        ${snippet}<br>
                        <a href="${link}" target="_blank">Read more</a>
                    `;
                }
            })
            .catch(() => {
                console.error("Google Search API Error: No additional details found.");
            });
    }

    // Event Listener: Search Box (Press Enter)
    document.getElementById("search").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            getCityCoordinates(this.value.trim());
        }
    });

    // Event Listener: Click on Map
    map.on("click", function (e) {
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;
        L.marker([lat, lng]).addTo(map).bindPopup("Fetching details...").openPopup();
        
        // Fetch city name from coordinates
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(response => response.json())
            .then(data => {
                let city = data.address.city || data.address.town || data.address.village || data.address.county || "Unknown Location";
                getCityInfo(city);
            })
            .catch(() => {
                document.getElementById("location-title").textContent = "Error fetching location";
                document.getElementById("description").textContent = "Please try again.";
            });
    });

});
