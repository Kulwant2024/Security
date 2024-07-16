import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h2 className="home-title">Home Page</h2>
      <div className="button-group">
        <Link to="/signup">
          <button className="home-button">Signup</button>
        </Link>
        <Link to="/login">
          <button className="home-button">Login</button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
