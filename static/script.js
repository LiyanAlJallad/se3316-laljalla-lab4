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

async function displayListDetails() {
    const listSelect = document.getElementById('listsDropdown');
    const listName = listSelect.value;
  
    if (!listName) {
      displayError('Please select a list to display its details.');
      return;
    }
  
    try {
      // Fetch the detailed information of superheroes in the selected list
      const response = await fetch(`/api/superhero_lists/${encodeURIComponent(listName)}/info`);
      if (!response.ok) {
        throw new Error("There was a problem with the fetch operation.");
      }
      const superheroes = await response.json();
      superheroes.sort((a, b) => a.name.localeCompare(b.name)); // Add this line to sort the data

  
      // Clear previous results
      const resultsDiv = document.getElementById('results');
      resultsDiv.innerHTML = '';
  
      // Display each superhero's details and powers
      superheroes.forEach(superhero => {
        const card = document.createElement('div');
        card.className = 'superhero-card';
  
        const name = document.createElement('h3');
        name.innerText = superhero.name;
  
        const info = document.createElement('p');
        info.innerText = `Race: ${superhero.Race || 'N/A'}\nPublisher: ${superhero.Publisher || 'N/A'}`;
  
        const powersList = document.createElement('ul');
        Object.entries(superhero.powers).forEach(([power, value]) => {
          if (value === "True") {
            const powerItem = document.createElement('li');
            powerItem.innerText = power;
            powersList.appendChild(powerItem);
          }
        });
  
        card.appendChild(name);
        card.appendChild(info);
        card.appendChild(powersList);
  
        resultsDiv.appendChild(card);
      });
    } catch (error) {
      console.error("Error during fetching list details:", error);
      displayError(error.message);
    }
}

async function populateSuperheroNamesDropdown() {
    const superheroNamesDropdown = document.getElementById('superheroNamesDropdown');
    const response = await fetch('/api/superhero_info/allNames');
    const superheroNames = await response.json();

    // Clear existing options
    superheroNamesDropdown.innerHTML = '<option value="">Select a superhero</option>';
    
    // Populate dropdown with superhero names
    superheroNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.innerText = name;
        superheroNamesDropdown.appendChild(option);
    });
}

async function populateSuperheroNamesDropdown() {
    const superheroNamesSelect = document.getElementById('superheroNamesSelect');
    try {
        const response = await fetch('/api/superhero_info/allNames');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const superheroNames = await response.json();

        // Clear existing options
        superheroNamesSelect.innerHTML = '';

        // Populate select with superhero names
        superheroNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name; // Display text for the option
            superheroNamesSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to populate superhero names:', error);
        // Handle the error accordingly in your UI
    }
}

async function addSuperheroesToList() {
    // Get the selected superhero names
    const superheroNamesSelect = document.getElementById('superheroNamesSelect');
    const selectedOptions = superheroNamesSelect.selectedOptions;
    const selectedNames = Array.from(selectedOptions).map(option => option.value);

    // Get the selected list name
    const listsDropdown = document.getElementById('listsDropdown');
    const listName = listsDropdown.value;

    if (!listName) {
        displayError('Please select a list.');
        return;
    }

    try {
        // Get IDs for the selected superhero names
        const idsResponse = await fetch('/api/superhero_info/getIDs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ names: selectedNames })
        });

        if (!idsResponse.ok) {
            throw new Error("Error fetching superhero IDs");
        }

        const ids = await idsResponse.json();

        // Update the selected list with the new IDs
        const listResponse = await fetch(`/api/superhero_lists/${encodeURIComponent(listName)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ID: ids })
        });

        if (!listResponse.ok) {
            const errorText = await listResponse.text();
            throw new Error(errorText || "There was a problem updating the list.");
        }

        displaySuccess(`Superheroes added to "${listName}" successfully!`);
        // Update the UI accordingly

    } catch (error) {
        console.error("Error during adding superheroes to list:", error);
        displayError(error.message);
    }
}

function displaySuccess(message) {
    const resultsDiv = document.getElementById('results');
    // Clear previous content
    resultsDiv.innerHTML = '';
    
    // Create a div to show the success message
    const successDiv = document.createElement('div');
    successDiv.className = "success";
    successDiv.innerText = message;
    
    // Append the success div to resultsDiv
    resultsDiv.appendChild(successDiv);

    // Optionally, you can make the success message disappear after a few seconds
    setTimeout(() => {
        successDiv.remove();
    }, 5000); // Removes the success message after 5 seconds
}

async function deleteList() {
    const listSelect = document.getElementById('listsDropdown');
    const listName = listSelect.value;

    if (!listName) {
        displayError('Please select a list to delete.');
        return;
    }

    try {
        const response = await fetch(`/api/superhero_lists/${encodeURIComponent(listName)}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error("There was a problem deleting the list.");
        }

        // Remove the deleted list from the dropdown
        listSelect.remove(listSelect.selectedIndex);

        displaySuccess(`List "${listName}" deleted successfully!`);
    } catch (error) {
        console.error("Error during deleting the list:", error);
        displayError(error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    populatePowerDropdown();
    populateListsDropdown();
    populateSuperheroNamesDropdown(); // Call this function to populate the dropdown
});
