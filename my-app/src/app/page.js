"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function HomePage() {
    const [search, setSearch] = useState({
        name: '',
        Publisher: '',
        Race: '',
        Power: ''
    });
    const [searchResults, setSearchResults] = useState([]);
    const [selectedHeroIndex, setSelectedHeroIndex] = useState(-1);
    const [heroDetails, setHeroDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [publicLists, setPublicLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [expandedListName, setExpandedListName] = useState(null);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearch((prevSearch) => ({
            ...prevSearch,
            [name]: value
        }));
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/api/superhero_info/search', {
                params: { ...search }
            });
            setSearchResults(response.data);
            setSelectedHeroIndex(-1);
            setHeroDetails(null);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    const handleSelectHero = (index) => {
        setSelectedHeroIndex(index);
    };

    const handleShowDetails = async () => {
        if (selectedHeroIndex >= 0) {
            const heroName = searchResults[selectedHeroIndex].name;
            try {
                const response = await axios.get(`http://localhost:8080/api/superhero_info/details/${heroName}`);
                setHeroDetails(response.data);
            } catch (error) {
                console.error('Error fetching hero details:', error);
            }
        }
    };
    useEffect(() => {
        fetchPublicLists();
    }, []);

    const fetchPublicLists = async () => {
        try {
            
            const response = await axios.get('http://localhost:8080/api/user_lists');
            const publicListsData = response.data
                .filter(list => list.isPublic) // Filter for public lists
                .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)) // Sort by lastModified date
                .slice(0, 10); // Limit to 10 lists
    
            setPublicLists(publicListsData);
        } catch (error) {
            console.error('Error fetching public lists:', error);
        }
        };


    const handleSelectList = async (listName) => {
        if (expandedListName === listName) {
            setSelectedList(null);
            setExpandedListName(null);
            return;
        }

        // Fetch and display the list details
        try {
            const response = await axios.get(`http://localhost:8080/api/user_lists/${listName}/details`);
            setSelectedList(response.data);
            setExpandedListName(listName);
        } catch (error) {
            console.error('Error fetching list details:', error);
        }
    };


    return (
        <main className="home-container">
            <h1>Welcome to Superhero Portal</h1>
            <div className="search-container">
                <input 
                    type="text"
                    name="name"
                    value={search.name}
                    onChange={handleInputChange}
                    placeholder="Hero Name"
                    className="form-field"
                />
                <input 
                    type="text"
                    name="Publisher"
                    value={search.Publisher}
                    onChange={handleInputChange}
                    placeholder="Publisher"
                    className="form-field"
                />
                <input 
                    type="text"
                    name="Race"
                    value={search.Race}
                    onChange={handleInputChange}
                    placeholder="Race"
                    className="form-field"
                />
                <input 
                    type="text"
                    name="Power"
                    value={search.Power}
                    onChange={handleInputChange}
                    placeholder="Power"
                    className="form-field"
                />
                <button onClick={handleSearch} className="submit-button">Search</button>
                <button 
                    onClick={handleShowDetails} 
                    className={`show-details-button ${selectedHeroIndex === -1 ? 'disabled' : ''}`} // Adjusted
                    disabled={selectedHeroIndex === -1}
                >
                    Show Details
                </button>
            </div>
            <div className="results-details-container"> {/* Added container for results and details */}
                <div className="search-results-frame"> {/* Frame for search results */}
               {loading ? <p>Loading...</p> : (
                <ul>
                    {searchResults.map((hero, index) => (
                        <li 
                            key={index} 
                            onClick={() => handleSelectHero(index)}
                            className={`result-item ${index === selectedHeroIndex ? 'selected' : ''}`} // Adjusted

                            // style={{ 
                            //     backgroundColor: index === selectedHeroIndex ? 'lightblue' : 'transparent',
                            //     cursor: 'pointer'
                            // }}
                        >
                            {hero.name} - {hero.Publisher}
                            <a 
                                href={`https://duckduckgo.com/?q=${encodeURIComponent(hero.name + ' ' + hero.Publisher+ ' ')}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="search-button"
                            >
                                
                                Search on DDG
                            </a>
                        </li>
                    ))}
                </ul>
            )}
            </div>

            {heroDetails && (
                <div className="hero-details-panel">
                    <h2>Details of {heroDetails.details.name}</h2>
                    <div>
                        <h3>General Information:</h3>
                        <ul>
                            {Object.entries(heroDetails.details).map(([key, value]) => (
                                <li key={key}>{key}: {value}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3>Powers:</h3>
                        <ul>
                            {Object.entries(heroDetails.powers).map(([power, hasPower]) => (
                                hasPower === "True" && <li key={power}>{power}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            </div>
            <div className="public-lists-container">
            <h2>Public Lists</h2>
            {publicLists.map((list, index) => (
    <div key={index} className="public-list-item">
        <div onClick={() => handleSelectList(list.name)} className="list-header">
            <span className={`arrow-icon ${expandedListName === list.name ? 'expanded' : ''}`}>&gt;</span>
            <div className="list-info">
                <h3>{list.name}</h3>
                <p>Creator: {list.creatorNickname}</p>
                <p>Number of Heroes: {list.numberOfHeroes}</p>
                <p>Average Rating: {list.averageRating.toFixed(1)}</p>
            </div>
        </div>
                    {expandedListName === list.name && selectedList && (
                        <div className="list-details">
                            <ul>
                                {selectedList.details.map((hero, idx) => (
                                    <li key={idx}>
                                        <h4>{hero.name}</h4>
                                        <p>Powers: {Object.keys(hero.powers).join(', ')}</p>
                                        {/* Additional hero details can be listed here */}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>


    </main>
    );
}

