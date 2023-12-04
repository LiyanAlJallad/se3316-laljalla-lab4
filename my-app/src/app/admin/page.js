"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [error, setError] = useState('');

  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState('');
  const [selectedReview, setSelectedReview] = useState('');
  const [reviewVisibility, setReviewVisibility] = useState(true);
  const [isUserDeactivated, setIsUserDeactivated] = useState(false);
  
  const [selectedPolicyType, setSelectedPolicyType] = useState('');
  const [policyContent, setPolicyContent] = useState('');


  useEffect(() => {
    fetchNonAdminUsers();
    fetchLists();

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



  const fetchLists = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/user_lists/revAndID');
      setLists(response.data);
    } catch (error) {
      setError('Failed to fetch lists. ' + error.message);
      console.error('Error fetching lists:', error);
    }
  };
  const handleListSelect = (e) => {
    setSelectedList(e.target.value);
  };


  const toggleReviewVisibility = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('Authentication required to perform this action.');
      return;
    }

    const selectedListName = lists.find(list => list.id === selectedReview)?.listName;

    if (!selectedListName || !selectedReview) {
      setError('Select a list and a review to toggle visibility.');
      return;
    }

    const endpoint = reviewVisibility
      ? `http://localhost:8080/api/user_lists/${selectedListName}/reviews/hide`
      : `http://localhost:8080/api/user_lists/${selectedListName}/reviews/unhide`;

    try {
      const response = await axios.put(
        endpoint,
        { listName: selectedListName, id: selectedReview },
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );

      if (response.status === 200) {
        alert(response.data.message);
        setReviewVisibility(!reviewVisibility); // Toggle the visibility state
      }
    } catch (error) {
      setError(`Error toggling review visibility: ${error.message}`);
      console.error('Error toggling review visibility:', error);
    }
  };

  const handleReviewSelect = (e) => {
    setSelectedReview(e.target.value);
    // Assuming the review is visible by default when selected
    setReviewVisibility(true);
  };

  const handlePolicyTypeSelect = (e) => {
    setSelectedPolicyType(e.target.value);
  };

  const handlePolicyContentChange = (e) => {
    setPolicyContent(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('Authentication required to perform this action.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8080/api/policies',
        { policyType: selectedPolicyType, content: policyContent },
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );

      if (response.status === 201) {
        alert('Policy updated successfully');
        // Optionally reset form fields here
      }
    } catch (error) {
      setError(`Error updating policy: ${error.message}`);
      console.error('Error updating policy:', error);
    }
  };



  return (
    <div className="container mx-auto p-6 mt-10 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Admin Dashboard</h1>
      {error && <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">{error}</div>}

      {/* User Management Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">User Management</h2>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          <select
            value={selectedUserEmail}
            onChange={handleUserSelect}
            className="border border-gray-300 rounded p-2"
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
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
            disabled={!selectedUserEmail}
          >
            Grant Admin Privileges
          </button>
          <button
            onClick={toggleUserActivation}
            className={`${
              isUserDeactivated ? 'bg-green-500 hover:bg-green-700' : 'bg-red-500 hover:bg-red-700'
            } text-white px-4 py-2 rounded transition duration-300`}
            disabled={!selectedUserEmail}
          >
            {isUserDeactivated ? 'Reactivate User' : 'Deactivate User'}
          </button>
        </div>
      </div>

      {/* Review Management Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-700 mb-4">Review Management</h2>
        <div className="flex items-center">
          <select
            value={selectedReview}
            onChange={handleReviewSelect}
            className="border border-gray-300 rounded p-2 mr-2"
          >
            <option value="">Select a review</option>
            {lists.map((item) => (
              <option key={item.id} value={item.id}>
                {item.listName} - {item.id}
              </option>
            ))}
          </select>
          <button
            onClick={toggleReviewVisibility}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
            disabled={!selectedReview}
          >
            Toggle Review Visibility
          </button>
        </div>
      </div>

      {/* Policy Management Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Policy Management</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPolicyType}
              onChange={handlePolicyTypeSelect}
              className="border border-gray-300 rounded p-2"
            >
              <option value="">Select a Policy</option>
              <option value="PrivacyPolicy">Security and Privacy Policy</option>
              <option value="DMCA">DMCA Notice</option>
              <option value="Takedown">Takedown Policy</option>
              <option value="AcceptableUse">Acceptable Use Policy</option>
            </select>
            <textarea
              value={policyContent}
              onChange={handlePolicyContentChange}
              className="border border-gray-300 rounded p-2"
              placeholder="Enter policy content here..."
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
            >
              Update Policy
            </button>
          </div>
        </form>
      </div>
       </div>
  );

}


export default AdminPage;
