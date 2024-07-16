import React, { useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [response, setResponse] = useState('');

  const handleRequest = async (endpoint) => {
    try {
      const token = localStorage.getItem('token');
      console.log(token);
      const res = await axios.get(`/${endpoint}`, {
        headers: {
          Authorization: token
        }
      });
      setResponse(res.data);
    } catch (error) {
      setResponse(error.response.data);
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Dashboard</h2>
      <div className="button-group">
        <button className="dashboard-button" onClick={() => handleRequest('protected')}>Protected</button>
        <button className="dashboard-button" onClick={() => handleRequest('admin')}>Admin</button>
        <button className="dashboard-button" onClick={() => handleRequest('cat')}>Cat</button>
      </div>
      <div className="response-container">
        <h3 className="response-title">Response:</h3>
        {Array.isArray(response) ? (
          response ? (
            <div>
              <p>{response.status}</p>
              <img className="response-image" src={response[0].url} alt="cat" />
            </div>
          ) : (
            <pre>{JSON.stringify(response, null, 2)}</pre>
          )
        ) : (
          <p>{response}</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
