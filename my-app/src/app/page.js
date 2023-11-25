"use client"
// import React, { useState } from 'react';
// import axios from 'axios';
// import Link from 'next/link';

// export default function HomePage() {
//     const [search, setSearch] = useState({
//         name: '',
//         Publisher: '',
//         Race: '',
//         Power: ''
//     });
//     const [searchResults, setSearchResults] = useState([]);
//     const [loading, setLoading] = useState(false);

//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setSearch((prevSearch) => ({
//             ...prevSearch,
//             [name]: value
//         }));
//     };

//     const handleSearch = async () => {
//         setLoading(true);
//         try {
//             const response = await axios.get('http://localhost:8080/api/superhero_info/search', {
//                 params: { ...search }
//             });
//             setSearchResults(response.data);
//         } catch (error) {
//             console.error('Error fetching data:', error);
//             // Handle error appropriately
//         }
//         setLoading(false);
//     };

//     return (
//         <main className="home-container">
//             <h1>Welcome to Superhero Portal</h1>
//             <div className="search-container">
//                 <input 
//                     type="text"
//                     name="name"
//                     value={search.name}
//                     onChange={handleInputChange}
//                     placeholder="Hero Name"
//                     className="form-field"
//                 />
//                 <input 
//                     type="text"
//                     name="Publisher"
//                     value={search.Publisher}
//                     onChange={handleInputChange}
//                     placeholder="Publisher"
//                     className="form-field"
//                 />
//                 <input 
//                     type="text"
//                     name="Race"
//                     value={search.Race}
//                     onChange={handleInputChange}
//                     placeholder="Race"
//                     className="form-field"
//                 />
//                 <input 
//                     type="text"
//                     name="Power"
//                     value={search.Power}
//                     onChange={handleInputChange}
//                     placeholder="Power"
//                     className="form-field"
//                 />
//                 <button onClick={handleSearch} className="submit-button">Search</button>
//             </div>

//             {loading ? (
//                 <p>Loading...</p>
//             ) : (
//                 <ul>
//                     {searchResults.map((hero, index) => (
//                         <li key={index}>
//                             {hero.name} - {hero.Publisher} - 
//                             {/* Add DDG Search Button */}
//                             <a 
//                                 href={`https://duckduckgo.com/?q=${encodeURIComponent(hero.name + ' ' + hero.Publisher+ ' ')}`}
//                                 target="_blank" 
//                                 rel="noopener noreferrer"
//                                 className="search-button"
//                             >
                                
//                                 Search on DDG
//                             </a>
//                         </li>
//                     ))}
//                 </ul>
//             )}
//         </main>
//     );
// }






// import React, { useState } from 'react';
// import axios from 'axios';
// import Link from 'next/link';
// import Modal from './Modal'; // 

// export default function HomePage() {
//     const [search, setSearch] = useState({
//         name: '',
//         Publisher: '',
//         Race: '',
//         Power: ''
//     });
//     const [searchResults, setSearchResults] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [selectedHero, setSelectedHero] = useState(null);

//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setSearch((prevSearch) => ({
//             ...prevSearch,
//             [name]: value
//         }));
//     };

//     const handleSearch = async () => {
//         setLoading(true);
//         try {
//             const response = await axios.get('http://localhost:8080/api/superhero_info/search', {
//                 params: { ...search }
//             });
//             setSearchResults(response.data);
//         } catch (error) {
//             console.error('Error fetching data:', error);
//             // Handle error appropriately
//         }
//         setLoading(false);
//     };

//     const handleHeroClick = (hero) => {
//         setSelectedHero(hero);
//         // Optionally, open a modal or an expandable section
//     };

//     return (
//         <main className="home-container">
//             <h1>Welcome to Superhero Portal</h1>
//             <div className="search-container">
//                 <input 
//                     type="text"
//                     name="name"
//                     value={search.name}
//                     onChange={handleInputChange}
//                     placeholder="Hero Name"
//                     className="form-field"
//                 />
//                 <input 
//                     type="text"
//                     name="Publisher"
//                     value={search.Publisher}
//                     onChange={handleInputChange}
//                     placeholder="Publisher"
//                     className="form-field"
//                 />
//                 <input 
//                     type="text"
//                     name="Race"
//                     value={search.Race}
//                     onChange={handleInputChange}
//                     placeholder="Race"
//                     className="form-field"
//                 />
//                 <input 
//                     type="text"
//                     name="Power"
//                     value={search.Power}
//                     onChange={handleInputChange}
//                     placeholder="Power"
//                     className="form-field"
//                 />
//                 <button onClick={handleSearch} className="submit-button">Search</button>
//             </div>

//             {loading ? (
//                 <p>Loading...</p>
//             ) : (
//                 <ul>
//                     {searchResults.map((hero, index) => (
//                         <li key={index} onClick={() => handleHeroClick(hero)}>
//                             {hero.name} - {hero.Publisher}
//                             <a 
//                                 href={`https://duckduckgo.com/?q=${encodeURIComponent(hero.name + ' ' + hero.Publisher)}`}
//                                 target="_blank" 
//                                 rel="noopener noreferrer"
//                                 className="search-button"
//                             >
//                                 Search on DDG
//                             </a>
//                         </li>
//                     ))}
//                 </ul>
//             )}

//             {selectedHero && (
//                 <Modal hero={selectedHero} onClose={() => setSelectedHero(null)} />
//             )}
//         </main>
//     );
// }




import React, { useState } from 'react';
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
                    className="details-button"
                    disabled={selectedHeroIndex === -1}
                >
                    Show Details
                </button>
            </div>

            {loading ? <p>Loading...</p> : (
                <ul>
                    {searchResults.map((hero, index) => (
                        <li 
                            key={index} 
                            onClick={() => handleSelectHero(index)}
                            style={{ 
                                backgroundColor: index === selectedHeroIndex ? 'lightblue' : 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            {hero.name} - {hero.Publisher}
                            {/* ... DDG link ... */}
                        </li>
                    ))}
                </ul>
            )}

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

        </main>
    );
}
