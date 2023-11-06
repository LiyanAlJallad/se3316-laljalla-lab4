async function searchSuperhero() {
    const filterType = document.getElementById('filterType').value;
    let data;

    try {
        if (filterType === 'Power') {
            const selectedPower = document.getElementById('powerDropdown').value;
            // Ensure selectedPower is not empty or invalid
            if (!selectedPower) {
                throw new Error("Please select a power.");
            }
            const response = await fetch(`/api/superhero_powers/byPower?power=${encodeURIComponent(selectedPower)}`);
            if (!response.ok) {
                throw new Error("There was a problem with the fetch operation.");
            }
            data = await response.json();
        } else {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const response = await fetch(`/api/superhero_info/match?field=${encodeURIComponent(filterType)}&pattern=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) {
                throw new Error("There was a problem with the fetch operation.");
            }
            data = await response.json();
        }

        // Assuming displayResults handles empty data and sanitizes inputs
        data.sort((a, b) => a.name.localeCompare(b.name)); // this line to sort the data
        displayResults(data);
    } catch (error) {
        console.error("Error during search:", error);
        displayError(error.message);

    }

}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    data.forEach(superhero => {
        const card = document.createElement('div');
        card.className = 'result-card';

        const name = document.createElement('h3');
        name.innerText = superhero.name;

        const details = document.createElement('p');
        details.innerText = `Race: ${superhero.Race}\nPublisher: ${superhero.Publisher}`;

        card.appendChild(name);
        card.appendChild(details);

        resultsDiv.appendChild(card);
    });
}

function filterTypeChanged() {
    const filterType = document.getElementById('filterType').value;
    const searchInput = document.getElementById('searchInput');
    const powerDropdown = document.getElementById('powerDropdown');

    if (filterType === 'Power') {
        searchInput.style.display = 'none';
        powerDropdown.style.display = 'block';
    } else {
        searchInput.style.display = 'block';
        powerDropdown.style.display = 'none';
    }
}


async function populatePowerDropdown() {
    const powerDropdown = document.getElementById('powerDropdown');
    const response = await fetch('/api/superhero_powers/all');
    const powers = await response.json();

    // Clear existing options
    powerDropdown.innerHTML = '<option value="">Select a power</option>';
    
    // Populate dropdown with powers
    powers.forEach(power => {
        const option = document.createElement('option');
        option.value = power;
        option.innerText = power;
        powerDropdown.appendChild(option);
    });
}

function displayError(message) {
    const resultsDiv = document.getElementById('results');
    const textNode = document.createTextNode(message);
    resultsDiv.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = "error";
    errorDiv.appendChild(textNode);
    resultsDiv.appendChild(errorDiv);
}

async function createNewList() {
    const listNameInput = document.getElementById('listNameInput');
    const listName = listNameInput.value.trim();
    

    if (!listName) {
        displayError('Please enter a list name.');
        return;
    }

    try {
        const response = await fetch('/api/superhero_lists/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([{ name: listName }])
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "There was a problem creating the list.");
        }

        const responseData = await response.json();
        displaySuccess(`List "${listName}" created successfully!`);
        await populateListsDropdown(responseData.newList); // Pass the new list directly
    } 
    catch (error) {
        console.error("Error during creating a new list:", error);
        displayError(error.message);
    }
}


// Function to populate lists dropdown
async function populateListsDropdown() {
    const listsDropdown = document.getElementById('listsDropdown');
    const response = await fetch('/api/superhero_lists/listNames');
    const lists = await response.json();
    
    const existingOptions = listsDropdown.querySelectorAll('option');


    lists.forEach(list => {
        // Check if the option already exists
        const exists = Array.from(existingOptions).some(option => option.value === list);
        
        // If the option does not exist, append it
        if (!exists) {
          const option = document.createElement('option');
          option.value = list;
          option.innerText = list;
          listsDropdown.appendChild(option);
        }
    });
}
