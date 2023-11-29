"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [error, setError] = useState('');


  const [isUserDeactivated, setIsUserDeactivated] = useState(false);


  useEffect(() => {
    fetchNonAdminUsers();
  }, []);

  const fetchNonAdminUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/users/nonAdminUsers');
      setUsers(response.data);
    } catch (error) {
      setError('Failed to fetch non-admin users. ' + error.message);
      console.error('Error fetching non-admin users:', error);
    }
  };
  

  const handleUserSelect = (e) => {
    setSelectedUserEmail(e.target.value);
  };

  const grantAdminPrivileges = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('Authentication required to perform this action.');
      return;
    }

    try {
      const response = await axios.put(
        'http://localhost:8080/api/users/grantAdmin',
        { userEmail: selectedUserEmail },
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );
      
      // If the request is successful, update the UI accordingly
      if (response.status === 200) {
        setUsers(users.filter((email) => email !== selectedUserEmail));
        setSelectedUserEmail('');
        alert(response.data.message); // or use a more sophisticated method to show the success message
      }
    } catch (error) {
      setError('Error granting admin privileges: ' + error.message);
      console.error('Error granting admin privileges:', error);
    }
  };
  
  const toggleUserActivation = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('Authentication required to perform this action.');
      return;
    }

    try {
      const endpoint = isUserDeactivated
        ? 'http://localhost:8080/api/users/reactivateUser'
        : 'http://localhost:8080/api/users/deactivateUser';

      const response = await axios.put(
        endpoint,
        { userEmail: selectedUserEmail },
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );

      if (response.status === 200) {
        alert(response.data.message);
        setIsUserDeactivated(!isUserDeactivated); // Toggle the activation state
      }
    } catch (error) {
      setError(`Error toggling user activation: ${error.message}`);
      console.error('Error toggling user activation:', error);
    }
  };



  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
  
      {/* Existing UI elements for granting admin privileges */}
      <div>
           <h2>User Management</h2>
        <select
          value={selectedUserEmail}
          onChange={handleUserSelect}
          className="border border-gray-300 rounded p-2 mb-4"
        >
          <option value="">Select a user</option>
          {users.map((userEmail) => (
            <option key={userEmail} value={userEmail}>
              {userEmail}
            </option>
          ))}
        </select>
        <button
          onClick={grantAdminPrivileges}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
          disabled={!selectedUserEmail}
        >
          Grant Admin Privileges
        </button>
        <button
          onClick={toggleUserActivation}
          className={`${
            isUserDeactivated ? 'bg-green-500' : 'bg-red-500'
          } text-white px-4 py-2 rounded hover:bg-blue-600`}
          disabled={!selectedUserEmail}
        >
          {isUserDeactivated ? 'Reactivate User' : 'Deactivate User'}
        </button>
      </div>
  

    </div>
  );
}

export default AdminPage;