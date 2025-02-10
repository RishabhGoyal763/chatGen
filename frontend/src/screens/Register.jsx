import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { FcGoogle } from 'react-icons/fc';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function submitHandler(e) {
    e.preventDefault();
    setError(null);

    axios.post('/users/register', { email, password })
      .then((res) => {
        console.log(res.data);
        navigate('/');
      })
      .catch((err) => {
        console.log(err.response.data);
        if (err.response.status === 400) {
          setError('User already exists. Please try another email.');
        } else {
          setError('An error occurred. Please try again later.');
        }
      });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Create Account</h2>

        {error && (
          <div className="mb-4 p-3 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={submitHandler}>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          >
            Sign Up
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button className="w-full py-3 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
          <FcGoogle className="text-2xl mr-2" /> Sign up with Google
        </button>

        <p className="text-center text-gray-600 mt-4">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;