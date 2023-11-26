"use client"
import React, { useState } from 'react';
import axios from 'axios';

export default function UserPage() {
    const [listName, setListName] = useState('');
    const [error, setError] = useState('');

    
    const handleCreateList = async () => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            alert('You must be logged in to create a list');
            return;
        }

        try {
            await axios.post(
                'http://localhost:8080/api/user_lists',
                { name: listName, ID: [], isPublic: false },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('List created successfully');
            setListName('');
        } catch (error) {
            console.error('Error creating list:', error);
            setError('Error creating list');
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
        </div>
    );
}
