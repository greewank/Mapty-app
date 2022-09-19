"use strict";
class Workout {
    date = new Date();
    id = (Date.now() + "").slice(-10);
    clicks = 0;
    constructor(coords, distance, duration){
        //this.data...
        //this.id...
        this.coords = coords; //Array of coordinates mainly lat and long [lat, lng]
        this.distance = distance; // in kilometres
        this.duration = duration; // in minutes
    }
    _setDescription() {
        // prettier-ignore
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}
class Running extends Workout {
    type = "running";
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        //km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
// const running1 = new Running([71, -4.3], 29, 30, 178);
// const cycling1 = new Cycling([71, -4.3], 34, 100, 143);
// console.log(running1, cycling1);
//////////////////////////////////////
// Implementation of application architecture.
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
class App {
    // Here map and mapEvent are going to be private instance properties; properties that are going to be on all the instances created through this class.
    //   However, private instanct properties hasn't been officially introduced in JS.
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    constructor(){
        // Returns users positions
        this._getPosition();
        // Gets local storage
        this._getLocalStorage();
        // Attach event handlers
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener("change", this._toggleElevationField);
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    }
    //   1st function
    _getPosition() {
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
            alert("The position couldn't be found.");
        });
    }
    //   2nd function
    _loadMap(position) {
        const { latitude  } = position.coords;
        const { longitude  } = position.coords;
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
        const coords = [
            latitude,
            longitude
        ];
        // console.log(this);
        this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
        L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        // This 'on' method is coming from Leaflet library which which is stored in map variable and is used instead of addEventListener here / an event created by leaflet.
        this.#map.on("click", this._showForm.bind(this));
        this.#workouts.forEach((work)=>{
            this._renderWorkoutMarker(work);
        });
    }
    //   3rd function
    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    }
    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(()=>form.style.display = "grid", 1000);
    }
    //   4th function
    _toggleElevationField() {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }
    //   5th function
    _newWorkout(e) {
        // Helper function for checking if number is finite or not
        const validity = (...inputs)=>inputs.every((inp)=>Number.isFinite(inp));
        // Helper function for checking positive or not
        const positive = (...inputs)=>inputs.every((inp)=>inp > 0);
        // Displays the marker after you submit the form in the exact location.
        e.preventDefault();
        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat , lng  } = this.#mapEvent.latlng;
        let workout;
        //If activity running, create running object
        if (type === "running") {
            const cadence = +inputCadence.value;
            // Check if data is valid
            // Usage of guard clause if this condition is true then immediately return the function
            if (!validity(distance, duration, cadence) || !positive(distance, duration, cadence)) return alert("The input isn't a positive number!");
            workout = new Running([
                lat,
                lng
            ], distance, duration, cadence);
        }
        // If activity cycling, create cycling object.
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            if (!validity(distance, duration, elevation) || !positive(distance, duration)) return alert("The input isn't a positive number!");
            workout = new Cycling([
                lat,
                lng
            ], distance, duration, elevation);
        }
        // Push the new workout object to #workout array
        this.#workouts.push(workout);
        console.log(workout);
        //Render workout on map as marker
        this._renderWorkoutMarker(workout);
        //Render workout as list
        this._renderWorkout(workout);
        // Hide forms + Clear the input fields
        this._hideForm();
        // Set localStorage to all the workouts
        this._setLocalStorage();
    // console.log(this.#mapEvent);
    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        })).setPopupContent(`${workout.type === "running" ? "\uD83C\uDFC3\u200D\u2642\uFE0F" : "\uD83D\uDEB4\u200D\u2640\uFE0F"} ${workout.description}`).openPopup();
    }
    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === "running" ? "\uD83C\uDFC3\u200D\u2642\uFE0F" : "\uD83D\uDEB4\u200D\u2640\uFE0F"}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;
        if (workout.type === "running") html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
        </li>     
        `;
        if (workout.type === "cycling") html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
        </li>
        `;
        form.insertAdjacentHTML("afterend", html);
    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest(".workout");
        // Usage of guard clause if this condition is true then immediately return the function
        if (!workoutEl) return;
        const workout = this.#workouts.find((work)=>work.id === workoutEl.dataset.id);
        // The setView method takes the screen to the current marker position.
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        });
    // using the public interface, every object will have this property
    // workout.click();
    // But since the object coming from localStorage will not inherit this which is why it's better not to use it
    }
    _setLocalStorage() {
        // JSON.stringify: Converts objects to strings in javascript
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }
    _getLocalStorage() {
        // JSON.parse() converts string to objects in JS.
        const data = JSON.parse(localStorage.getItem("workouts"));
        console.log(data);
        if (!data) return;
        // If there is some existing data in the localStorage, this.#workouts will be equal to it.
        this.#workouts = data;
        this.#workouts.forEach((work)=>{
            this._renderWorkout(work);
        });
    }
    reset() {
        localStorage.removeItem("workouts");
        // location is a big object that contains many properties and reload is one of them.
        location.reload();
    }
}
const app = new App();

//# sourceMappingURL=index.672d4772.js.map
