"use client"
import React, { useState } from 'react';
import Image from 'next/image';

//LOGIN PAGE
export default function NewPage() {
  // State to store form data
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Function to update state on input change
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

//   const handleSubmit = async (e) => {
//     e.preventDefault(); // Prevents the default form submission behavior

//     try {
//         const response = await fetch('http://localhost:8080/api/users/login', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 email: formData.email,
//                 password: formData.password
//             })
//         });

//         try {
//             const data = await response.json();
//             if (response.ok) {
//               if (data.isAdmin) {
//                   // Redirect to admin page
//                   window.location.href = 'http://localhost:3000/admin';
//               } else {
//                   // Redirect to user page
//                   window.location.href = 'http://localhost:3000/user';
//               }
//           } else {
//                   alert(data.message); // Show error message from the server's JSON response
//             }
//         } catch (jsonError) {
//             if (jsonError instanceof SyntaxError) {
//                 // Handle non-JSON response here
//                 if (response.ok) {
                  
//                     alert("Login successful");
//                 } else {
//                     // Handle other server-side validations
//                     console.error('Non-JSON error:', jsonError);
//                     console.log(jsonError)
//                 }
//             } else {
//                 throw jsonError; // Rethrow other errors
//             }
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         alert(`Error logging in: ${error.message}`);
//         console.log(error)

//     }
// };

const handleSubmit = async (e) => {
  e.preventDefault(); // Prevents the default form submission behavior

  try {
    const response = await fetch('http://localhost:8080/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      })
    });

    const data = await response.json();
    if (response.ok) {
      // Store the token in local storage or session storage
      localStorage.setItem('userToken', data.token); // assuming the token is returned in data.token

      if (data.isAdmin) {
        // Redirect to admin page
        window.location.href = 'http://localhost:3000/admin';
      } else {
        // Redirect to user page
        window.location.href = 'http://localhost:3000/user';
      }
    } else {
      alert(data.message); // Show error message from the server's JSON response
    }
  } catch (error) {
    console.error('Error:', error);
    alert(`Error logging in: ${error.message}`);
  }
};


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
    console.error('Error creating list:', error.response.data);
    setError(error.response.data.message || 'Error creating list');
  }
};


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-superhero-pattern">
      <div className="bg-white rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Superhero Access</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-superhero-blue focus:border-superhero-blue" 
              placeholder="Your Email"
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-superhero-blue focus:border-superhero-blue" 
              placeholder="Secret Code"
              onChange={handleInputChange}
            />
          </div>
          <div className="flex justify-center">
            <a href="http://localhost:3000/updatePass" className="text-blue-500 font-bold">Update Password</a>
          </div>          
          <button type="submit" className="mt-4 w-full bg-superhero-blue hover:bg-superhero-dark-blue text-white font-bold py-2 rounded-md shadow-lg hover:shadow-superhero-lg transition-all">Log In</button>
        </form>
      </div>
    </main>
  );
}
