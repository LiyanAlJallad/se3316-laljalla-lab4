"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserPage() {
    
    const path ="ec2-54-237-246-157.compute-1.amazonaws.com";

    const [listName, setListName] = useState('');
    const [lists, setLists] = useState([]); // State to store user's lists
    const [superheroes, setSuperheroes] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [selectedHeroes, setSelectedHeroes] = useState([]);
    const [error, setError] = useState('');
    const [isPublic, setIsPublic] = useState(false); 
    const [expandedListName, setExpandedListName] = useState(null);
    const [updateTrigger, setUpdateTrigger] = useState(0); 
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewDescription, setReviewDescription] = useState('');

    const [existingReview, setExistingReview] = useState({ description: '', rating: 0, comment: '' });
    const [listReviews, setListReviews] = useState([]); // New state for storing reviews of the selected list
    const [infoHeroDetails, setInfoHeroDetails] = useState('');

    const handleSelectList = async (listName) => {
        if (expandedListName === listName) {
            setExpandedListName(null);
            setSelectedList(null);
            setSelectedHeroes([]);
            setListReviews([]);
            return;
        }
        setExpandedListName(listName);
        setSelectedList(listName);

        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to view list details');
            return;
        }
    
        try {
            const response = await axios.get(`http://${path}:8080/api/user_lists/${listName}/authDetails`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedHeroes(response.data.details);
          
            const reviewsResponse = await axios.get(`http://${path}:8080/api/user_lists/${listName}/reviews`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setListReviews(reviewsResponse.data); 
        
        } catch (error) {
            console.error('Error fetching list details:', error);
            setError('Failed to fetch list details. ' + (error.response?.data?.message || error.message));
        }
        const userEmail = localStorage.getItem('userEmail'); // Replace with the actual way of obtaining user's email
        if (userEmail) {
            fetchExistingReview(listName, userEmail);
        }

    
    };

    // Function to fetch existing review for the selected list
    const fetchExistingReview = async (listName, userEmail) => {
        const response = await axios.get(`http://${path}:8080/api/user_lists/${listName}/authDetails`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        const userReview = response.data.reviews?.find(review => review.userEmail === userEmail);
        if (userReview) {
            setExistingReview({ description:userReview.description, rating: userReview.rating, comment: userReview.comment });
            setReviewDescription(userReview.description); 
            setReviewRating(userReview.rating);
            setReviewComment(userReview.comment);
        } else {
            setExistingReview({ description: '', rating: 0, comment: '' });
            setReviewDescription('');
            setReviewRating(0);
            setReviewComment('');
        }
    };


    
    useEffect(() => {
        fetchUserLists(); // Fetch lists when component mounts
        fetchSuperheroes();
    }, [updateTrigger]);

    const fetchUserLists = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await axios.get('http://${path}:8080/api/user_lists/mylists', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Lists fetched:', response.data); // Add this line to log the response
                setLists(response.data);
            } catch (error) {
            
                setError('Failed to fetch lists. ' + (error.response?.data?.message || error.message));
                setSelectedHeroes([]); 
           
            }
        }    
    };
    
    const fetchSuperheroes = async () => {
        try {
            const response = await axios.get('http://${path}:8080/api/superhero_info/allNames');
            setSuperheroes(response.data);
        } catch (error) {
            setError('Failed to fetch superheroes. ' + (error.response?.data?.message || error.message));
        }
    };



    const handleCreateList = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to create a list');
            return;
        }

        try {
            await axios.post(
                'http://${path}:8080/api/user_lists',
                { name: listName, ID: [], isPublic: isPublic }, // Use isPublic state here
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setListName('');
            fetchUserLists(); // Refresh the lists after creating a new one
            setError('');
        } catch (error) {
            setError('Error creating list. ' + error.response?.data?.message || error.message);
        }
    };


    const handleAddHeroesToList = async () => {
        if (!selectedList) {
            setError('Please select a list.');
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to modify a list');
            return;
        }
        try {

            // Convert superhero names to IDs
            const idsResponse = await axios.post('http://${path}:8080/api/superhero_info/getIDs', {
                names: selectedHeroes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });


            const updatedLists = lists.map(list => {
                if (list.name === selectedList) {
                    return { ...list, numberOfHeroes: list.numberOfHeroes + idsResponse.data.length };
                }
                return list;
            });
    
            setLists(updatedLists);  

            // Update the list with new superhero IDs and isPublic status
            await axios.put('http://${path}:8080/api/user_lists/updateList', {
                listName: selectedList,
                newIDs: idsResponse.data,
                isPublic: isPublic 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            
            // Clear selections and refresh the lists
            // fetchUserLists();
            await fetchUserLists(); // Refresh lists after updating
            setUpdateTrigger(prev => prev + 1); // Update the trigger to force re-render
            setSelectedHeroes([]);
            setError('');
            alert('Superheroes and public status updated successfully');
        } catch (error) {
            setError('Failed to add superheroes to list. ' + (error.response?.data?.message || error.message));
        }
    
    };


    const handlePublicStatusToggle = async () => {
        if (!selectedList) {
            setError('Please select a list.');
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to modify a list');
            return;
        }
        try {
            const selectedListData = lists.find(list => list.name === selectedList);
            const newPublicStatus = !selectedListData.isPublic;

            await axios.put('http://${path}:8080/api/user_lists/updatePublicStatus', {
                listName: selectedList,
                isPublic: newPublicStatus
            }, { headers: { Authorization: `Bearer ${token}` } });

            fetchUserLists(); // Refresh the lists
            setError('');
            alert(`List "${selectedList}" is now ${newPublicStatus ? 'public' : 'private'}.`);
        } catch (error) {
            setError('Failed to update list public status. ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteList = async (listName) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to delete a list');
            return;
        }


        const isConfirmed = window.confirm(`Are you sure you want to delete the list "${listName}"?`);
        if (!isConfirmed) {
            return; // If the user does not confirm, exit the function
        }
    
    
    try {
        await axios.delete(`http://${path}:8080/api/user_lists/${listName}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchUserLists(); // Refresh the lists after deletion
        setError('');
        alert(`List "${listName}" deleted successfully`);
    } catch (error) {
        setError('Error deleting list. ' + (error.response?.data?.message || error.message));
    }
    };


    const postReview = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to post a review');
            return;
        }

        const isConfirmed = window.confirm(`Are you sure you want to post this review?`);
        if (!isConfirmed) {
            return; // If the user does not confirm, exit the function
        }
        
        if (!selectedList) {
            setError('Please select a list to review.');
            return;
        }
        try {
            await axios.post(
                `http://${path}:8080/api/user_lists/${selectedList}/reviews`,
                { description: reviewDescription, rating: reviewRating, comment: reviewComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            const updatedListsResponse = await axios.get('http://${path}:8080/api/user_lists/mylists', {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            setLists(updatedListsResponse.data);

            // await fetchUserLists(); // Refresh the lists state with the updated data
            setReviewDescription('');
            setReviewRating(0);
            setReviewComment('');
            setError('');
            alert('Review posted successfully');
        } catch (error) {
            setError('Error posting review. ' + (error.response?.data?.message || error.message));
        }
        };

        const fetchHeroDetails = async (heroName) => {
            try {
                const response = await axios.get(`http://${path}:8080/api/superhero_info/details/${heroName}`);
                setInfoHeroDetails(response.data);
            } catch (error) {
                console.error('Error fetching hero details:', error);
            }
        };
    
    
    
    
 
    return (
        <div key={updateTrigger} className="user-page-container bg-white rounded-lg shadow p-6 max-w-md mx-auto my-8">
            <h1 className="text-center text-2xl font-bold mb-4">User Page</h1>
            {error && <p className="text-red-500 text-center">{error}</p>}
    
            <div className="space-y-4">
                <section>
                    <h2 className="text-lg font-semibold">Create a New List</h2>
                    <input
                        type="text"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        placeholder="List Name"
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full mt-2" onClick={handleCreateList}>Create List</button>
                </section>
    
                <section>
            <h2 className="text-lg font-semibold">Your Lists</h2>
            {lists
            .filter(list => list.name)
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
            .map((list, index) => (
                <div key={index} className="mb-2">
                    <div onClick={() => handleSelectList(list.name)} className="flex justify-between items-center bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200">
                        <div>
                            <h3 className="font-medium">{list.name || 'Unnamed List'}</h3>
                            <p>Creator: {list.creatorNickname}</p>
                            <p>Number of Heroes: {list.numberOfHeroes}</p>
                            
                                {/* {listReviews.length > 0 && ( */}
                                    <div>
                                        <h4>Reviews:</h4>
                                        <ul>
                                            {list.reviews.map((review, idx) => (
                                                <li key={idx}>
                                                    <p>Description: {review.description}</p>
                                                    {review.visible && (
                                                        <>
                                                            <p>Rating: {review.rating}</p>
                                                            <p>Comment: {review.comment}</p>
                                                        </>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                {/*  )} */}
                            
                        </div>
                        <span className={`transform transition-transform ${expandedListName === list.name ? 'rotate-90' : ''}`}>
                            &gt;
                        </span>
                    </div>
                    {expandedListName === list.name && (
                        <div className="mt-2 bg-gray-50 p-2 rounded">
                            <h3>List Details:</h3>
                            <ul>
                                {selectedHeroes.map((hero, idx) => (
                                    <li key={idx}>
                                        {hero.name} - {' '}
                                        <a onClick={() => fetchHeroDetails(hero.name)} style={{ fontWeight: 'bold', cursor: 'pointer', color: 'blue' }}>Info</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        )}
                    </div>
                ))}
            {infoHeroDetails && (
                <div className="hero-details-panel p-4 bg-gray-100 rounded mt-4">
                    <h3 className="text-lg font-semibold">Hero Details</h3>
                    {/* <p>Name: {infoHeroDetails.details.name}</p>  */}
                    <p>General Information: {Object.entries(infoHeroDetails.details).map(([key, value]) => (
                        <li key={key}>{key}: {value}</li>
                    ))}</p>
                    <p>Powers: {Object.entries(infoHeroDetails.powers).map(([power, hasPower]) => (
                        hasPower === "True" && <li key={power}>{power}</li>
                    ))}</p>
                    {/* Add other details you wish to display */}
                </div>
            )}

</section>

    
                <section>
                    <h2 className="text-lg font-semibold">Select A List</h2>
                    <select className="w-full p-2 border border-gray-300 rounded" value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
                        <option value="">Select List</option>
                        {lists.map((list) => (
                            <option key={list.name} value={list.name}>{list.name}</option>
                        ))}
                    </select>
                
                    {selectedList && (
                        <div className="flex gap-2 mt-2">
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex-grow" onClick={handlePublicStatusToggle}>
                                Toggle Public Status
                            </button>
                            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex-grow" onClick={() => handleDeleteList(selectedList)}>
                                Delete List
                            </button>
                            
                        </div>
                    )}
                </section>
    
                <section>
                <h2 className="text-lg font-semibold">Add Superheros</h2>
                    <div className="mt-2">
                        <select multiple className="w-full h-36 p-2 border border-gray-300 rounded" value={selectedHeroes} onChange={(e) => setSelectedHeroes([...e.target.selectedOptions].map(option => option.value))}>
                            {superheroes.map((hero) => (
                                <option key={hero} value={hero}>{hero}</option>
                            ))}
                        </select>
                    </div>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full mt-2" onClick={handleAddHeroesToList}>Add to List</button>
                </section>

                <section>
    <h2 className="text-lg font-semibold">Post a Description or Review for a List</h2>
    <div>
        <select
            className="w-full p-2 border border-gray-300 rounded mb-2"
            value={selectedList}
            onChange={(e) => setSelectedList(e.target.value)}
        >
            <option value="">Select List</option>
            {lists.map((list) => (
                <option key={list.name} value={list.name}>{list.name}</option>
            ))}
        </select>

        <textarea
            placeholder="Description"
            className="w-full p-2 border border-gray-300 rounded mb-2"
            value={reviewDescription}
            onChange={(e) => setReviewDescription(e.target.value)}
        ></textarea>

        <input
            type="number"
            min="1"
            max="5"
            placeholder="Rating (1-5)"
            className="w-full p-2 border border-gray-300 rounded mb-2"
            value={reviewRating}
            onChange={(e) => setReviewRating(e.target.value)}
        />

        <textarea
            placeholder="Comment"
            className="w-full p-2 border border-gray-300 rounded mb-2"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
        ></textarea>

        <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
            onClick={postReview}
        >
            Post Review
        </button>
    </div>
</section>

            </div>
        </div>
    );
}

