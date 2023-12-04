"use client"
import Image from 'next/image';
import React, { useState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';


export default function CreateAccount() {

    const path ="ec2-54-237-246-157.compute-1.amazonaws.com";

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nickname: ''
    });

    // State for verification message
    const [verificationMessage, setVerificationMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://${path}:8080/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                // Set verification message with link
                setVerificationMessage(
                    <div>
                        Account created successfully! Please{' '}
                        <a href="#" onClick={() => handleVerify(data.verificationToken)} style={{ fontWeight: 'bold', color: 'blue', textDecoration: 'underline' }}>verify</a> your account to login.
                    </div>
                );
            } else {
                alert('Failed to create account. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleVerify = async (token) => {
        try {
            const verifyResponse = await fetch(`http://${path}:8080/api/users/verifyEmail?token=${token}`, {
                method: 'GET',
            });
            if (verifyResponse.ok) {
                setVerificationMessage(
                    <div>
                        <span style={{ fontWeight: 'bold', color: 'green' }}>Account successfully verified.</span>
                        {' '}
                        <a href="http://${path}:3000/login" style={{ fontWeight: 'bold', color: 'blue', textDecoration: 'underline' }}>Login</a>.                      
                        <br />
                    </div>
                );
            } else {
                setVerificationMessage('Failed to verify account. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
    

    return (
        <main className="account-creation-container">
            <h1>Create Your Account</h1>
            <form className="account-creation-form" onSubmit={handleSubmit}>
                <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" required onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Create a password" required onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label htmlFor="nickname">Nickname</label>
                    <input type="text" id="nickname" name="nickname" placeholder="Your superhero nickname" onChange={handleChange} />
                </div>
                <button type="submit" className="submit-button">Create Account</button>
            </form>
            {verificationMessage && <div>{verificationMessage}</div>}
        </main>
    );
}


