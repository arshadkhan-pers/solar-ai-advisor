// js/locationUtils.js

const LocationHandler = {
    data: {},
    stateNames: {
        "UP": "Uttar Pradesh", "MH": "Maharashtra", "DL": "Delhi", "GJ": "Gujarat",
        "RJ": "Rajasthan", "MP": "Madhya Pradesh", "KA": "Karnataka", "TN": "Tamil Nadu",
        "WB": "West Bengal", "TS": "Telangana", "AP": "Andhra Pradesh", "KL": "Kerala",
        "PB": "Punjab", "HR": "Haryana", "BR": "Bihar", "JH": "Jharkhand",
        "UK": "Uttarakhand", "HP": "Himachal Pradesh", "OR": "Odisha", "AS": "Assam",
        "CH": "Chandigarh", "GA": "Goa"
    },

    async init(stateId, cityId, onStateChangeCallback = null, preSelectedState = null) {
        // 1. Fetch data
        try {
            const response = await fetch('../data/cities.json');
            this.data = await response.json();
        } catch (e) {
            console.error("Could not load cities.json", e);
            return;
        }

        const stateSelect = document.getElementById(stateId);
        const citySelect = document.getElementById(cityId);

        // 2. Populate States
        stateSelect.innerHTML = '<option value="">Select State</option>';
        Object.keys(this.data).sort().forEach(code => {
            const opt = document.createElement("option");
            opt.value = code;
            opt.textContent = this.stateNames[code] || code;
            stateSelect.appendChild(opt);
        });

        // Set pre-selection if provided
        if (preSelectedState) {
            stateSelect.value = preSelectedState;
            this.updateCities(stateSelect.value, cityId);
        }

        // 3. Add Listeners
        stateSelect.addEventListener("change", (e) => {
            this.updateCities(e.target.value, cityId);
            // Trigger custom callback if provided (e.g., to recalculate subsidies)
            if (onStateChangeCallback) onStateChangeCallback(e.target.value);
        });
    },

    updateCities(stateCode, cityId) {
        const citySelect = document.getElementById(cityId);
        citySelect.innerHTML = '<option value="">Select City</option>';
        
        if (stateCode && this.data[stateCode]) {
            [...this.data[stateCode]].sort().forEach(city => {
                const opt = document.createElement("option");
                opt.value = city;
                opt.textContent = city;
                citySelect.appendChild(opt);
            });
        }
    }
};
