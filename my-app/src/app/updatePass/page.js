"use client"
import React, { useState } from 'react';
import Image from 'next/image';


export default function UpdatePassword() {
  
  const path ="ec2-54-237-246-157.compute-1.amazonaws.com";

  const [formData, setFormData] = useState({
    email: '',
    oldPassword: '',
    newPassword: ''
  });


  // Function to update state on input change
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const response = await fetch('http://${path}:8080/api/users/updatePassword', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.email,
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            })
        });

        try {
          const data = await response.json();
          if (response.ok) {
              alert(data.message); // Shows the message from the server's JSON response
              // Handle successful login here
          } else {
              alert(data.message); // Show error message from the server's JSON response
          }
      } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
              // Handle non-JSON response here
              if (response.ok) {
                  alert("Password Updated");
                  // Handle successful login
              } else {
                  // Handle other server-side validations
                  console.error('Non-JSON error:', jsonError);
                  console.log(jsonError)
              }
          } else {
              throw jsonError; // Rethrow other errors
          }
      }
  } catch (error) {
      console.error('Error:', error);
      alert(`Error updating password: ${error.message}`);
      console.log(error)

  }
};

  return (
    <div className="account-creation-container">
      <h1>Update Password</h1>
      <form className="account-creation-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-field">
          <label>Old Password</label>
          <input
            type="password"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-field">
          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit" className="submit-button">Update Password</button>
      </form>
    </div>
  );

}
