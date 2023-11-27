

"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserPage() {
    const [listName, setListName] = useState('');
    const [lists, setLists] = useState([]); // State to store user's lists
    const [superheroes, setSuperheroes] = useState([]);
    const [selectedList, setSelectedList] = useState('');
    const [selectedHeroes, setSelectedHeroes] = useState([]);
    const [error, setError] = useState('');
    const [isPublic, setIsPublic] = useState(false); // New state for tracking public status

    


    useEffect(() => {
        fetchUserLists(); // Fetch lists when component mounts
        fetchSuperheroes();
    }, []);

    const fetchUserLists = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await axios.get('http://localhost:8080/api/user_lists/mylists', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLists(response.data);
            } catch (error) {
                setError('Failed to fetch lists. ' + (error.response?.data?.message || error.message));
            }
        }
    };
    
    const fetchSuperheroes = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/superhero_info/allNames');
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
                'http://localhost:8080/api/user_lists',
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
            const idsResponse = await axios.post('http://localhost:8080/api/superhero_info/getIDs', {
                names: selectedHeroes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            // Update the list with new superhero IDs and isPublic status
            await axios.put('http://localhost:8080/api/user_lists/updateList', {
                listName: selectedList,
                newIDs: idsResponse.data,
                isPublic: isPublic // Include the isPublic state
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            // Clear selections and refresh the lists
            setSelectedHeroes([]);
            fetchUserLists();
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

            await axios.put('http://localhost:8080/api/user_lists/updatePublicStatus', {
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


    return (
        <div>
            <h1>User Page</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
    
            <h2>Create a New List</h2>
            <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="List Name"
            />
            <button onClick={handleCreateList}>Create List</button>
    
            <h2>Your Lists</h2>
            <ul>
                {lists.map((list, index) => (
                    <li key={index}>{list.name}</li>
                ))}
            </ul>
    
            <h2>Add Superheroes to a List</h2>
            <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
                <option value="">Select List</option>
                {lists.map((list) => (
                    <option key={list.name} value={list.name}>{list.name}</option>
                ))}
            </select>
    
            {selectedList && (
                <button onClick={handlePublicStatusToggle}>
                    Toggle Public Status
                </button>
            )}
    
            <select multiple value={selectedHeroes} onChange={(e) => setSelectedHeroes([...e.target.selectedOptions].map(option => option.value))}>
                {superheroes.map((hero) => (
                    <option key={hero} value={hero}>{hero}</option>
                ))}
            </select>
            <button onClick={handleAddHeroesToList}>Add to List</button>
        </div>
    );
    }









