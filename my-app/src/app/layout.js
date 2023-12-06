"use client"
import React, { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const path ="ec2-54-91-245-249.compute-1.amazonaws.com";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-5 rounded w-full max-w-xl h-full max-h-[40vh] overflow-auto">
        <div className="flex flex-col justify-between h-full">
          <div>
            <h2 className="text-lg font-bold mb-4 text-center">{title}</h2>
            {children}
          </div>
          <button onClick={onClose} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded self-center">
            Close
          </button>
        </div>
      </div>
    </div>
  );
  
};

const POLICIES_API_URL = `http://${path}:8080/api/policies`;

// RootLayout component
export default function RootLayout({ children }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [policies, setPolicies] = useState({}); // Store policy contents
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    fetch(POLICIES_API_URL)
      .then(response => response.json())
      .then(data => setPolicies(data))
      .catch(error => console.error('Error fetching policies:', error));
  }, []);


  const openModal = (policyType) => {
    // Convert the title to a format that matches the backend's expected parameter
    const policyKey = policyType.replace(/\s+/g, '');
    
    fetch(`http://${path}:8080/api/policies/${policyKey}`)
      .then(response => response.json())
      .then(data => {
        setModalTitle(policyType);
        setModalContent(data.content);
        setModalOpen(true);
      })
      .catch(error => {
        console.error('Error fetching policy:', error);
        setModalContent('Error loading policy content');
        setModalOpen(true);
      });
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <footer className="flex justify-center items-center space-x-4 bg-gray-800 p-4">
        <a onClick={() => openModal('PrivacyPolicy')} className="link-style text-white font-bold hover:underline">Security and Privacy Policy</a> 
        <a onClick={() => openModal('DMCA')} className="link-style text-white font-bold hover:underline">DMCA Notice</a> 
        <a onClick={() => openModal('Takedown')} className="link-style text-white font-bold hover:underline">Takedown Policy</a> 
        <a onClick={() => openModal('AcceptableUse')} className="link-style text-white font-bold hover:underline">Acceptable Use Policy</a>
        </footer>
        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
          <p>{modalContent}.</p>
        </Modal>
      </body>
    </html>
  );
}
