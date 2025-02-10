import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const res = await axios.post('/users/login', formData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      if (err.response) {
        setError(err.response.status === 401 ? 'Wrong username or password. Please try again.' : 'An error occurred. Please try again later.');
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Login to Your Account</h2>

        {error && (
          <div className="mb-4 p-3 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={submitHandler}>
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input
              name="email"
              onChange={handleChange}
              value={formData.email}
              type="email"
              id="email"
              className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input
              name="password"
              onChange={handleChange}
              value={formData.password}
              type="password"
              id="password"
              className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-semibold rounded-lg focus:ring-2 focus:outline-none ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button className="w-full py-3 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
          <FcGoogle className="text-2xl mr-2" /> Login with Google
        </button>

        <p className="text-center text-gray-600 mt-4">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
